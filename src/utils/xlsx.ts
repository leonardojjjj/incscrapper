const XLSX = require("xlsx")
const xlsx = require("json-as-xlsx")

export async function xlsxJson(path:string) {
  let workbook = XLSX.readFile(path)
  let sheetNameList = workbook.SheetNames
  const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNameList[0]])

  return json
}

export async function jsonXlxs(id, json:object[]) {
  let data = [
    {
      sheet: 'Companys',
      columns: [
        { label: "NOME", value: 'name' },
        { label: "TELEFONE", value: 'telefone' },
        { label: "TELEFONE RECENTE", value: 'telefoneRec' },
        { label: "RAZÃO SOCIAL", value: 'rzSocial' },
        { label: "NOME FANTASIA", value: 'nmFantasia' },
        { label: "CNPJ", value: 'cnpj' },
        { label: "EMAIL", value: 'email' },
        { label: "SITUAÇÃO CADASTRAL", value: 'sitCadastral' },
        { label: "ENDEREÇO", value: "address" }    
      ],
      content: json
    }
  ]

  let settings = {
    fileName: id,
    extraLength: 5,
    writeOptions: {}
  }

  return xlsx(data, settings)
}
