import IQueueDTO from "../dtos/IQueueDTO"

import { jsonXlxs, getCompany } from "../utils/index"

import fs from "fs"
import { path } from "app-root-path"

export default async function({ id, json }: IQueueDTO): Promise<void> {
  const findedData = []
  const notFinded = []
      
  let queueData = JSON.parse(fs.readFileSync(path + "/src/queue.json", { encoding: "utf-8" }))
  queueData.push({ id, loaded: json.length, finded: 0, checked: 0, last: "" })
  fs.writeFileSync(path + "/src/queue.json", JSON.stringify(queueData, null, 4), { encoding: "utf-8" })
  
  let columnIndex = 0

  for (let i = 0; i < json.length; i++) {
    queueData = JSON.parse(fs.readFileSync(path + "/src/queue.json", { encoding: "utf-8" }))
    let queueStats = queueData.find(x => x.id == id)

    let forFind = json[i][Object.keys(json[i])[columnIndex]]
    queueStats.last = forFind

    if (/\d/.test(forFind)) {
      columnIndex++
      i = 0
    } else {
      const tryFind = await getCompany({ search: forFind })
      if (tryFind) {
          queueStats.finded++
          findedData.push(...tryFind)
      } else {
          notFinded.push({ name: forFind })
      }
    }
    queueStats.checked++
    queueData[queueData.findIndex(x => x.id == id)] = queueStats
    fs.writeFileSync(path + "/src/queue.json", JSON.stringify(queueData, null, 4), { encoding: "utf-8" })
  }

  findedData.push(...notFinded)

  await jsonXlxs(id, findedData)
}