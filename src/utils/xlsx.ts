export async function xlsxJson(path:string) {
  let XLSX = require("xlsx")
  let workbook = XLSX.readFile(path)
  let sheetNameList = workbook.SheetNames
  const json = XLSX.utils.sheet_to_json(workbook.Sheets[sheetNameList[0]])

  return json
}