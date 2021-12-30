import puppeteer from "puppeteer-extra"
import StealthPlugin from "puppeteer-extra-plugin-stealth"
import AdBlockerPlugin from "puppeteer-extra-plugin-adblocker"

import ISearchDTO from "../dtos/ISearchDTO"
import IInfoDataDTO from "../dtos/IInfoDataDTO"

export default async function ({ search, city, uf }:ISearchDTO): Promise<IInfoDataDTO[]> {
	search = search.trim().toUpperCase()
	city = city ? city : "JOAO PESSOA"
	uf = uf ? uf : "PB"

	let totalData = []
	let query = 'q=' + search.replace(/" "/gi, "%20") + "&uf=" + uf.toUpperCase() + "&municipio=" + city.toUpperCase().replace(/" "/gi, "%20")
	
	puppeteer.use(StealthPlugin())
	puppeteer.use(AdBlockerPlugin())
	const browser = await puppeteer.launch({ headless: true, defaultViewport: null })
	const page = await browser.newPage()
	await page.goto('https://casadosdados.com.br/solucao/cnpj?' + query)
	
	//GET RESULT COUNTER
	let emptyResults = await page.$eval("div.is-7 p", el => el.innerHTML)
	if (emptyResults.includes('Não foram encontrado resultados para sua pesquisa'))  {
		await browser.close()
		return null
	}

	let hrefs = await page.$$eval("a", (list) => list.map((elm:any) => elm.href))
	let parsedHrefs = []
	for (let href of hrefs) {
		if (href.includes('cnpj') && href.length > 60 && !href.includes('?q=')) {
			parsedHrefs.push(href)
		}
	}

	for (let link of parsedHrefs) {
		let foundedOnPartner = false
		await page.goto(link, { waitUntil: "networkidle2" })
		let pageData = (await page.content()).split('<p data-v-0adacb42=""><b data-v-0adacb42="">')
		for (let i of pageData) {
			i = i.split('</b>')[0].trim()
			if (i.includes(search)) {
				foundedOnPartner = true
			}
		}
		if (foundedOnPartner) {
			//GET INFO DATA AND PARSE
			var personRaw:any = await page.$$('div.is-narrow')
			var DATA:any = { name: search }
			
			var affiliedsRaw:any = ""
			for (let i = 0; i < personRaw.length; i++) {
				var info = await page.evaluate(el => el.innerHTML, personRaw[i])
				if (info.includes("</b"))
					affiliedsRaw = info
				var value
				if (!info.includes("href")) {
					value = info.split('"">').pop().split('</p>')[0]
				} else {
					value = info.split('">').pop().split('</a>')[0]
				}
				//BAIANAGEM MAS DEU CERTO, SLA, DPS TEM QUE REFATORAR ISSO.
				if (value.includes("<")) value = "N/A"
				if (i == 0) DATA['cnpj'] = value
				if (i == 1) DATA['empresa'] = value
				if (i == 5) DATA['sitCadastral'] = value
				if (i == 17) DATA['telefone'] = value
				if (i == 18) DATA['email'] = value
			}
			totalData.push(DATA)
		}
	}

	if (totalData.length == 0) return null
	
	return totalData
}