import fs from "fs"
import { path } from "app-root-path"

export default async function({ id }) {
    let queue = JSON.parse(fs.readFileSync(path + "/src/queue.json", { encoding: "utf-8" }))
    let newQueue = queue.filter(x => x.id !== id)
    fs.writeFileSync(path + "/src/queue.json", JSON.stringify(newQueue, null, 4), { encoding: "utf-8" })
    fs.unlinkSync(path + `/${id}.xlsx`)
}