import { Request, Response } from "express"
import { xlsxJson, saveFile, getCompany } from "../../utils/index"

export const config = {
    api: {
        bodyParser: false
    }
}

export default async function handler(req:Request, res:Response): Promise<Response> {
    try {
        const findedData = []
    
        const filePath:any = await saveFile(req)
        const jsonXslx = await xlsxJson(filePath)
        
        var columnIndex = 0
        var consultStatus = { loaded: 0, finded: 0 }
    
        for (let i = 0; i < jsonXslx.length; i++) {
            var forFind = jsonXslx[i][Object.keys(jsonXslx[i])[columnIndex]]
            if (/\d/.test(forFind)) {
                columnIndex++
                i = 0
            } else {
                consultStatus.loaded++
                const tryFind = await getCompany({ search: forFind})
                if (tryFind) {
                    consultStatus.finded++
                    findedData.push(tryFind)
                }
            }
        }
        
        return res.status(201).send({ status: "success", data: { findedData, consultStatus } })
            
    } catch (error) {
        console.log(error)
        return res.status(500).send({ status: "error" })        
    }    
}