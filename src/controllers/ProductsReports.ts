import { Request, Response } from 'express'
import { database } from '../repositories/database'
import * as ExcelJS from 'exceljs'
export default {
  async addresses(request: Request, response: Response) {
    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Endereços')

    worksheet.columns = [
      { header: 'SKU', key: 'sku', width: 30 },
      { header: 'Produto', key: 'name', width: 30 },
      { header: 'Endereço', key: 'address', width: 30 },
    ]
    const products = await database.products.findMany()

    products.forEach((product) => {
      worksheet.addRow({
        sku: product.sku,
        name: product.name,
        address: product.address,
      })
    })

    workbook.xlsx.writeFile('./public/enderecos.xlsx').then(() => {
      response.download('./public/enderecos.xlsx')
    })
  },
}
