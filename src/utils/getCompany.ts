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
			let personRaw:any = await page.$$('div.is-narrow')
			let DATA:any = { name: search }
			let fullAddress = ""
			let affiliedsRaw:any = ""
			for (let i = 0; i < personRaw.length; i++) {
				let info = await page.evaluate(el => el.innerHTML, personRaw[i])
				if (info.includes("</b"))
					affiliedsRaw = info
				let value
				let title = info.split('<p data-v-0adacb42="" class="has-text-weight-bold">').pop().split('</p>')[0]
				if (!info.includes("href")) {
					value = info.split('"">').pop().split('</p>')[0]
				} else {
					value = info.split('">').pop().split('</a>')[0]
				}
				
				if (value.includes("<")) value = "N/A"
				if (title.includes('CNPJ')) DATA['cnpj'] = value
				if (title.includes('Nome Fantasia')) DATA['nmFantasia'] = value
				if (title.includes('Razão Social')) DATA['rzSocial'] = value
				if (title.includes('Situação Cadastral') && !title.includes('Data da')) DATA['sitCadastral'] = value
				if (title.includes('Telefone')) DATA['telefoneRec'] = value
				if (title.includes('E-MAIL')) DATA['email'] = value
				if (title.includes('Logradouro')) fullAddress += `${value} `
				if (title.includes('Número')) fullAddress += `${value} `
				if (title.includes('Complemento')) fullAddress += `${value} `
				if (title.includes('CEP')) fullAddress += `${value} `
				if (title.includes('Bairro')) fullAddress += `${value} `
			}
			DATA['address'] = fullAddress
			totalData.push(DATA)
		}
	}

	if (totalData.length == 0) return null
	
	return totalData
}