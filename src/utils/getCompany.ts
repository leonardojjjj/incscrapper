import puppeteer from "puppeteer-extra"
import StealthPlugin from "puppeteer-extra-plugin-stealth"

import IGetDataDTO from "../dtos/ISearchDTO"
import IInfoDataDTO from "../dtos/IInfoDataDTO"

export default async function ({ search, city, uf }:IGetDataDTO) {
  city = city ? city : "JOAO PESSOA"
  uf = uf ? uf : "PB"
  
  var responseData = null
  var p = 1
  var counter = 1
  var query = 'q=' + search.replace(/" "/gi, "%20") + "&uf=" + uf.toUpperCase() + "&municipio=" + city.toUpperCase().replace(/" "/gi, "%20") + '&page=' + counter

  do {
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
          var inner = await page.evaluate(el => el.innerHTML, i)
          if (!/\d/.test(inner))
              names.push(inner.trim())
      }
      
      //SEARCH BY NAME
      var existsOnPage = names.includes(search.toUpperCase())
      var dataLink = null
      if (existsOnPage) {
          for (var url of hrefs) {
              if (url.includes('cnpj') && url.length > 60 && !url.includes('?q=')) {
                  var name = String(url.split("/")[5]).replace(/-/gi, " ").toUpperCase()
                  if (name.includes(search.toUpperCase()))
                      dataLink = url
              }
          }
          
          await page.goto(dataLink)

          //GET INFO DATA AND PARSE
          var personRaw:any = await page.$$('div.is-narrow')
          var DATA: IInfoDataDTO
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
          for (var i = 0; i < affiliedsRaw.length; i++) {
              if (affiliedsRaw[i].includes('</b>'))
                  DATA.quadroSocietario.push(affiliedsRaw[i].replace(/<\/b>/, "").replace(/<\/p>/, "")) 
          }
          
          if (DATA.cnpj)
              responseData = DATA
          browser.close()
      } else { counter++ }
  } while(counter < p)

  return responseData
}