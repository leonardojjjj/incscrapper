import { Request } from "express"
import { IncomingForm } from "formidable"

export default async function (req:Request) {
  return new Promise((resolve) => {
      const form = new IncomingForm()
      form.parse(req, async function (err, fields, files:any) {
          resolve(files.file.filepath)
      })
  })
}