import { Request, Response } from "express"
import { getCompany } from "../../utils/index"

export const config = {
    api: {
        bodyParser: false
    }
}

export default async function handler(req:Request, res:Response): Promise<Response> {
    return res.status(201).send({ status: "success", data: { ...await getCompany({ search: "LORENA FURTADO ROBERTO BURITY" }) } })   
}