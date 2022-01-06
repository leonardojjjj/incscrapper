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
    let telefone = json[i][Object.keys(json[i])[1]]
    console.log(json[i])
    queueStats.last = forFind

    let tryFind = await getCompany({ search: forFind })

    if (tryFind) {
      console.log(telefone)
      for (let i = 0; i < tryFind.length; i++)
        tryFind[i]['telefone'] = telefone
      queueStats.finded++
      findedData.push(...tryFind)
    } else {
      notFinded.push({ name: forFind })
    }
    
    queueStats.checked++
    queueData[queueData.findIndex(x => x.id == id)] = queueStats
    fs.writeFileSync(path + "/src/queue.json", JSON.stringify(queueData, null, 4), { encoding: "utf-8" })
  }

  await jsonXlxs(id, findedData)
}