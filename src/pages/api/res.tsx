import { Request, Response } from "express"
import { queueStats, queueRemove } from "../../utils"

import fs from "fs"
import { path } from "app-root-path"

export default async function handler(req:Request, res:Response): Promise<any> {
  const ID = req.query.id
  const queueData = await queueStats({ id: ID })

  if (!queueData) {
    res.status(403).send({ status: "failure", message: "ID doesn't exists on queue." })
  } else if (queueData.checked == queueData.loaded) {
    let filepath = path + `/${ID}.xlsx`
    let stat = fs.statSync(filepath)

    res.writeHead(200, {
        'Content-Type': 'application/vnd.ms-excel',
        'Content-Length': stat.size
    })

    let readStream = fs.createReadStream(filepath)
    await new Promise(function (resolve) {
        readStream.pipe(res)
        readStream.on('end', resolve)
    })
    await queueRemove({ id: ID })
  } else {
    res.status(201).send({ status: "success", ...queueData })  
  }
}

export const config = {
  api: {
      bodyParser: false
  }
}