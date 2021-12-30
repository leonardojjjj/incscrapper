import { Request, Response } from "express"
import { xlsxJson, saveFile, queue, randomStr } from "../../utils/index"

export default async function handler(req:Request, res:Response): Promise<Response> {
  const ID = await randomStr(16)
  const filePath:any = await saveFile(req)
  const jsonXslx = await xlsxJson(filePath)

  queue({ id: ID, json: jsonXslx })
        
  return res.status(201).send({ status: "success", id: ID })  
}

export const config = {
  api: {
      bodyParser: false
  }
}
