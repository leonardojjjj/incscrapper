import { Request, Response } from "express"
import { xlsxJson, jsonXlxs, saveFile, getCompany } from "../../utils/index"
import { path } from "app-root-path"
import fs from "fs"

export const config = {
    api: {
        bodyParser: false
    }
}

export default async function handler(req:Request, res:Response): Promise<any> {
    const findedData = []
    
    const filePath:any = await saveFile(req)
    const jsonXslx = await xlsxJson(filePath)
        
    var columnIndex = 0
    var consultStatus = { loaded: 0, finded: 0 }
    
    for (let i = 0; i < jsonXslx.length; i++) {
        var forFind = jsonXslx[i][Object.keys(jsonXslx[i])[columnIndex]]
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
            }
        }
    }

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
