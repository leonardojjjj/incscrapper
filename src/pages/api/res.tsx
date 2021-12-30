import { Request, Response } from "express"

export const config = {
    api: {
        bodyParser: false
    }
}

export default async function handler(req:Request, res:Response): Promise<any> {
  const ID = req.query.id
  
  res.status(201).send({ status: "success", id: ID })  
}
