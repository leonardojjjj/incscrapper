import { Request, Response } from "express"
import { xlsxJson, jsonXlxs, saveFile, getCompany } from "./index"
import { path } from "app-root-path"
import fs from "fs"

export const config = {
    api: {
        bodyParser: false
    }
}

export default async function handler(req:Request, res:Response): Promise<any> {
    const findedData = []
    const notFinded = []
    
    const filePath:any = await saveFile(req)
    const jsonXslx = await xlsxJson(filePath)
        
    let columnIndex = 0
    let consultStatus = { loaded: 0, finded: 0 }
    
    for (let i = 0; i < jsonXslx.length; i++) {
        let forFind = jsonXslx[i][Object.keys(jsonXslx[i])[columnIndex]]
        console.log(consultStatus, forFind)
        if (/\d/.test(forFind)) {
            columnIndex++
            i = 0
        } else {
            consultStatus.loaded++
            const tryFind = await getCompany({ search: forFind })
            if (tryFind) {
                consultStatus.finded++
                findedData.push(...tryFind)
            } else {
                notFinded.push({ name: forFind })
            }
        }
    }
    findedData.push(...notFinded)

    await jsonXlxs(findedData)  
    let filepath = path + "/Resultados.xlsx"
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
}
