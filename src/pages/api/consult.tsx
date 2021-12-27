import puppeteer from "puppeteer-extra"
import StealthPlugin from "puppeteer-extra-plugin-stealth"
import { IncomingForm } from "formidable"
import fs from "fs"

export const config = {
    api: {
        bodyParser: false
    }
}

export default async function handler(req, res) {    
    const filePath:any = await bodyFileParser(req)
    const jsonXslx = await xlsToJson(filePath)

    //const consulta = await getData("EJS CONSTRUCOES LTDA", "Joao Pessoa", "PB") 
    
    res.status(201).send({ status: "success", data: jsonXslx })
}

async function xlsToJson(path) {
    let XLSX = require("xlsx")
    let workbook = XLSX.readFile(path)
    let sheetNameList = workbook.SheetNames
    const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNameList[0]])

    return json
}

async function bodyFileParser(req) {
    return new Promise((resolve) => {
        const form = new IncomingForm()
        form.parse(req, async function (err, fields, files) {
            resolve(files.file.filepath)
        })
    })
}

async function getData(search, city, uf) {
    var responseData = null
    var p = 1
    var counter = 1
    do {
        let query = 'q=' + search.replace(/" "/gi, "%20") + "&uf=" + uf.toUpperCase() + "&municipio=" + city.toUpperCase().replace(/" "/gi, "%20") + '&page=' + counter
        
        puppeteer.use(StealthPlugin())
        const browser = await puppeteer.launch({ headless: true })
        const page = await browser.newPage()
        await page.goto('https://casadosdados.com.br/solucao/cnpj?' + query)

        //GET RESULT COUNTER
        var results:any = await page.$$('b')
        results = await page.evaluate(el => el.innerHTML, results[0])
        p = Math.round(parseInt(results) / 20)

        var hrefs = await page.$$eval("a", (list) => list.map((elm:any) => elm.href))

        //GET NAMES ON PAGE
        var namesRaw = await page.$$('strong')
        var names = []
        for (let i of namesRaw) {
            let inner = await page.evaluate(el => el.innerHTML, i)
            if (!/\d/.test(inner))
                names.push(inner.trim())
        }
        
        //SEARCH BY NAME
        var existsOnPage = names.includes(search.toUpperCase())
        var dataLink = null
        if (existsOnPage) {
            for (let url of hrefs) {
                if (url.includes('cnpj') && url.length > 60 && !url.includes('?q=')) {
                    let name = String(url.split("/")[5]).replace(/-/gi, " ").toUpperCase()
                    if (name.includes(search.toUpperCase()))
                        dataLink = url
                }
            }
            
            await page.goto(dataLink)

            //GET INFO DATA
            var personRaw:any = await page.$$('div.is-narrow')
            let DATA = { cnpj: null, razaoSocial: null, nomeFantasia: null, tipo: null, dataAbertura: null, sitCadastral: null, sitCadastralData: null, capitalSocial: null, naturezaJuridica: null, empresaMei: null, logradouro: null, number: null, complemento: null, cep: null, bairro: null, uf: uf, city: city.toUpperCase(), telefone: null, email: null, quadroSocietario: [], atividadePrincipal: null } 
            let affiliedsRaw:any = ""
            for (let i = 0; i < personRaw.length; i++) {
                let info = await page.evaluate(el => el.innerHTML, personRaw[i])
                if (info.includes("</b"))
                    affiliedsRaw = info
                let value
                if (!info.includes("href")) {
                    value = info.split('"">').pop().split('</p>')[0]
                } else {
                    value = info.split('">').pop().split('</a>')[0]
                }

                if (value.includes("<")) value = "N/A"
                if (i == 0) DATA.cnpj = value
                if (i == 1) DATA.razaoSocial = value
                if (i == 2) DATA.nomeFantasia = value
                if (i == 3) DATA.tipo = value
                if (i == 4) DATA.dataAbertura = value
                if (i == 5) DATA.sitCadastral = value
                if (i == 6) DATA.sitCadastralData = value
                if (i == 7) DATA.capitalSocial = value
                if (i == 8) DATA.naturezaJuridica = value
                if (i == 9) DATA.empresaMei = value
                if (i == 10) DATA.logradouro = value
                if (i == 11) DATA.number = value
                if (i == 12) DATA.complemento = value
                if (i == 13) DATA.cep = value
                if (i == 14) DATA.bairro = value
                if (i == 17) DATA.telefone = value
                if (i == 18) DATA.email = value
                if (i == 20) DATA.atividadePrincipal = value
            }

            //GET MANAGERS
            affiliedsRaw = affiliedsRaw.split('<p data-v-0adacb42=""><b data-v-0adacb42="">')
            for (let i = 0; i < affiliedsRaw.length; i++) {
                if (affiliedsRaw[i].includes('</b>'))
                    DATA.quadroSocietario.push(affiliedsRaw[i].replace(/<\/b>/, "").replace(/<\/p>/, "")) 
            }
            
            responseData = DATA
            browser.close()
        } else { counter++ }
    } while(counter < p)

    return responseData
} 