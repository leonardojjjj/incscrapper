import fs from "fs"
import { path } from "app-root-path"

export default async function({ id }): Promise<object | null> {
    let queue = JSON.parse(fs.readFileSync(path + "/src/queue.json", { encoding: "utf-8" }))
    let queueData = queue.find(x => x.id == id)
    
    return queueData
}