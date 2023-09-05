import { Request, Response } from 'express'
import { database } from '../repositories/database'
import * as ExcelJS from 'exceljs'
export default {
  async separators(request: Request, response: Response) {
    const { month } = request.query

    const initDate = new Date(2023, Number(month) - 1, 1, 0, 0, 0, 0)
    const endDate = new Date(2023, Number(month), 0, 23, 59, 59, 59)

    // create a workbook variable
    const workbook = new ExcelJS.Workbook()
    // create a worksheet variable
    const worksheet = workbook.addWorksheet(`Mês ${initDate.getMonth() + 1}`)

    const dbPickingsBySeparator = await database.picking_separators.groupBy({
      by: ['separator_id'],
      where: {
        init_time: {
          gte: initDate,
          lte: endDate,
        },
      },
      _count: {
        picking_id: true,
      },
    })

    const separators = await database.separators.findMany({
      where: {
        id: {
          in: dbPickingsBySeparator.map((separator) => separator.separator_id),
        },
      },
    })

    const separatorsWithData = await Promise.all(
      separators.map(async (separator) => {
        const separatorData = dbPickingsBySeparator.find(
          (dbSeparator) => dbSeparator.separator_id === separator.id,
        )

        const userWorksheet = await workbook.addWorksheet(separator.name)

        const avgDbResult = await database.picking_separators.findMany({
          where: {
            separator_id: separator.id,
            init_time: {
              gte: initDate,
              lte: endDate,
            },
          },
        })
        // obter diff entre init_time e end_time para cada item de avgDbResult
        const allAvg = await Promise.all(
          avgDbResult.map(async (avg) => {
            const initTime = new Date(avg.init_time)
            const endTime = new Date(avg.end_time)
            const diff = endTime.getTime() - initTime.getTime()
            // motrar diff em minutos

            // obter quantidade de orders para cada picking_id
            const orders = await database.orders.findMany({
              where: {
                picking_id: avg.picking_id,
              },
            })
            const orderProducts = await database.order_products.findMany({
              where: {
                order_id: {
                  in: orders.map((order) => order.id),
                },
              },
            })

            // filter unique products on orderProducts
            const uniqueProducts = orderProducts.filter(
              (orderProduct, index, self) =>
                index ===
                self.findIndex((t) => t.product_id === orderProduct.product_id),
            )

            // multiplicar product_id por quantity e somar todos os resultados
            const productsSum = orderProducts.reduce((acc, curr) => {
              return acc + curr.qtd
            }, 0)

            // contar todas as orders que tem apenas um resultado em OrderProducts
            const ordersWithOneProduct = orders.filter((order) => {
              const orderProduct = orderProducts.filter(
                (orderProduct) => orderProduct.order_id === order.id,
              )
              return orderProduct.length === 1
            })

            // contar todas as orders que tem mais de um resultado em OrderProducts
            const ordersWithMoreThanOneProduct = orders.filter((order) => {
              const orderProduct = orderProducts.filter(
                (orderProduct) => orderProduct.order_id === order.id,
              )
              return orderProduct.length > 1
            })

            userWorksheet.columns = [
              { header: 'Picking ID', key: 'picking_id' },
              { header: 'Inicio', key: 'init' },
              { header: 'Fim', key: 'end' },
              { header: 'Tempo de separação', key: 'diff' },
              { header: 'Pedidos', key: 'orders' },
              {
                header: 'SKUs',
                key: 'totalUniqueProducts',
              },
              { header: 'Quantidade', key: 'totalProducts' },
              { header: 'Pedidos simples', key: 'simpleOrders' },
              { header: 'Pedidos Compostos', key: 'complexOrders' },
            ]

            userWorksheet.addRow({
              picking_id: avg.picking_id,
              init: initTime.toLocaleTimeString('pt-BR'),
              end: endTime.toLocaleTimeString('pt-BR'),
              diff: Math.round(diff / 1000 / 60),
              orders: orders.length || 0,
              totalUniqueProducts: uniqueProducts.length,
              totalProducts: productsSum,
              simpleOrders: ordersWithOneProduct.length,
              complexOrders: ordersWithMoreThanOneProduct.length,
            })

            return {
              picking_id: avg.picking_id,
              diff: Math.round(diff / 1000 / 60),
              orders: orders.length || 0,
              diffByOrders: Math.round(diff / 1000 / 60 / (orders.length || 1)),
              totalUniqueProducts: uniqueProducts.length,
              totalProducts: productsSum,
              simpleOrders: ordersWithOneProduct.length,
              complexOrders: ordersWithMoreThanOneProduct.length,
            }
          }),
        )

        // obter a media em minutos entre todos os resultados de diff
        const avg =
          allAvg.reduce((acc, curr) => {
            return acc + curr.diff
          }, 0) / allAvg.length

        // somar todos os resultados de orders
        const ordersSum = allAvg.reduce((acc, curr) => {
          return acc + curr.orders
        }, 0)

        // somar totalUniqueProducts
        const totalUniqueProducts = allAvg.reduce((acc, curr) => {
          return acc + curr.totalUniqueProducts
        }, 0)

        // somar totalProducts
        const totalProducts = allAvg.reduce((acc, curr) => {
          return acc + curr.totalProducts
        }, 0)

        // somar simpleOrders
        const simpleOrders = allAvg.reduce((acc, curr) => {
          return acc + curr.simpleOrders
        }, 0)

        // somar complexOrders
        const complexOrders = allAvg.reduce((acc, curr) => {
          return acc + curr.complexOrders
        }, 0)

        return {
          code: separator.code,
          name: separator.name,
          pickings: separatorData?._count.picking_id || 0,
          avg: Math.round(avg),
          totalOrders: ordersSum,
          totalUniqueProducts,
          totalProducts,
          simpleOrders,
          complexOrders,
          avgByOrders: Math.round(ordersSum / (avg || 1)),
          allAvg,
        }
      }),
    )

    /* return response.json({
      init: initDateFormatted,
      end: endDateFormatted,
      data: separatorsWithData,
    }) */

    // add column headers
    worksheet.columns = [
      { header: 'Código', key: 'code', width: 20 },
      { header: 'Nome', key: 'name', width: 40 },
      { header: 'Pickings', key: 'pickings', width: 40 },
      { header: 'Média (minutos) por picking', key: 'avg', width: 40 },
      { header: 'Total de pedidos', key: 'totalOrders', width: 40 },
      {
        header: 'Total de produtos únicos',
        key: 'totalUniqueProducts',
        width: 300,
      },
      { header: 'Total de produtos', key: 'totalProducts', width: 40 },
      { header: 'Pedidos simples', key: 'simpleOrders', width: 40 },
      { header: 'Pedidos compostos', key: 'complexOrders', width: 40 },
    ]

    // add rows
    separatorsWithData.forEach((separator) => {
      worksheet.addRow({
        code: separator.code,
        name: separator.name,
        pickings: separator.pickings,
        avg: separator.avg,
        totalOrders: separator.totalOrders,
        totalUniqueProducts: separator.totalUniqueProducts,
        totalProducts: separator.totalProducts,
        simpleOrders: separator.simpleOrders,
        complexOrders: separator.complexOrders,
        avgByOrders: separator.avgByOrders,
      })
    })

    worksheet.columns.forEach((column) => {
      const lengths = column.values.map((v) => v.toString().length)
      const maxLength = Math.max(
        ...lengths.filter((v) => typeof v === 'number'),
      )

      column.width = maxLength > 0 ? maxLength + 2 : 20
    })

    // save workbook to disk
    await workbook.xlsx.writeFile('./public/picking-report.xlsx')
    return response.download('./public/picking-report.xlsx')
  },

  async separatorsByPeriod(request: Request, response: Response) {
    const { startDate, finishDate } = request.query

    const initDate = new Date(String(startDate))
    initDate.setHours(21, 0, 0, 0)
    const endDate = new Date(String(finishDate))
    endDate.setHours(20, 59, 59, 59)
    endDate.setDate(endDate.getDate() + 1)

    // create a workbook variable
    const workbook = new ExcelJS.Workbook()
    // create a worksheet variable
    const worksheet = workbook.addWorksheet(
      `Periodo ${initDate.getDate() + 1}-${
        initDate.getMonth() + 1
      } até ${endDate.getDate()}-${endDate.getMonth() + 1}`,
    )

    const dbPickingsBySeparator = await database.picking_separators.groupBy({
      by: ['separator_id'],
      where: {
        init_time: {
          gte: initDate,
          lte: endDate,
        },
      },
      _count: {
        picking_id: true,
      },
    })

    const separators = await database.separators.findMany({
      where: {
        id: {
          in: dbPickingsBySeparator.map((separator) => separator.separator_id),
        },
      },
    })

    const separatorsWithData = await Promise.all(
      separators.map(async (separator) => {
        const separatorData = dbPickingsBySeparator.find(
          (dbSeparator) => dbSeparator.separator_id === separator.id,
        )

        const userWorksheet = await workbook.addWorksheet(separator.name)

        const avgDbResult = await database.picking_separators.findMany({
          where: {
            separator_id: separator.id,
            init_time: {
              gte: initDate,
              lte: endDate,
            },
          },
        })
        // obter diff entre init_time e end_time para cada item de avgDbResult
        const allAvg = await Promise.all(
          avgDbResult.map(async (avg) => {
            const initTime = new Date(avg.init_time)
            const endTime = new Date(avg.end_time)
            const diff = endTime.getTime() - initTime.getTime()
            // motrar diff em minutos

            // obter quantidade de orders para cada picking_id
            const orders = await database.orders.findMany({
              where: {
                picking_id: avg.picking_id,
              },
            })
            const orderProducts = await database.order_products.findMany({
              where: {
                order_id: {
                  in: orders.map((order) => order.id),
                },
              },
            })

            // filter unique products on orderProducts
            const uniqueProducts = orderProducts.filter(
              (orderProduct, index, self) =>
                index ===
                self.findIndex((t) => t.product_id === orderProduct.product_id),
            )

            // multiplicar product_id por quantity e somar todos os resultados
            const productsSum = orderProducts.reduce((acc, curr) => {
              return acc + curr.qtd
            }, 0)

            // contar todas as orders que tem apenas um resultado em OrderProducts
            const ordersWithOneProduct = orders.filter((order) => {
              const orderProduct = orderProducts.filter(
                (orderProduct) => orderProduct.order_id === order.id,
              )
              return orderProduct.length === 1
            })

            // contar todas as orders que tem mais de um resultado em OrderProducts
            const ordersWithMoreThanOneProduct = orders.filter((order) => {
              const orderProduct = orderProducts.filter(
                (orderProduct) => orderProduct.order_id === order.id,
              )
              return orderProduct.length > 1
            })

            userWorksheet.columns = [
              { header: 'Picking ID', key: 'picking_id' },
              { header: 'Inicio', key: 'init' },
              { header: 'Fim', key: 'end' },
              { header: 'Tempo de separação', key: 'diff' },
              { header: 'Pedidos', key: 'orders' },
              {
                header: 'SKUs',
                key: 'totalUniqueProducts',
              },
              { header: 'Quantidade', key: 'totalProducts' },
              { header: 'Pedidos simples', key: 'simpleOrders' },
              { header: 'Pedidos Compostos', key: 'complexOrders' },
            ]

            userWorksheet.addRow({
              picking_id: avg.picking_id,
              init: initTime.toLocaleTimeString('pt-BR'),
              end: endTime.toLocaleTimeString('pt-BR'),
              diff: Math.round(diff / 1000 / 60),
              orders: orders.length || 0,
              totalUniqueProducts: uniqueProducts.length,
              totalProducts: productsSum,
              simpleOrders: ordersWithOneProduct.length,
              complexOrders: ordersWithMoreThanOneProduct.length,
            })

            return {
              picking_id: avg.picking_id,
              diff: Math.round(diff / 1000 / 60),
              orders: orders.length || 0,
              diffByOrders: Math.round(diff / 1000 / 60 / (orders.length || 1)),
              totalUniqueProducts: uniqueProducts.length,
              totalProducts: productsSum,
              simpleOrders: ordersWithOneProduct.length,
              complexOrders: ordersWithMoreThanOneProduct.length,
            }
          }),
        )

        // obter a media em minutos entre todos os resultados de diff
        const avg =
          allAvg.reduce((acc, curr) => {
            return acc + curr.diff
          }, 0) / allAvg.length

        // somar todos os resultados de orders
        const ordersSum = allAvg.reduce((acc, curr) => {
          return acc + curr.orders
        }, 0)

        // somar totalUniqueProducts
        const totalUniqueProducts = allAvg.reduce((acc, curr) => {
          return acc + curr.totalUniqueProducts
        }, 0)

        // somar totalProducts
        const totalProducts = allAvg.reduce((acc, curr) => {
          return acc + curr.totalProducts
        }, 0)

        // somar simpleOrders
        const simpleOrders = allAvg.reduce((acc, curr) => {
          return acc + curr.simpleOrders
        }, 0)

        // somar complexOrders
        const complexOrders = allAvg.reduce((acc, curr) => {
          return acc + curr.complexOrders
        }, 0)

        return {
          code: separator.code,
          name: separator.name,
          pickings: separatorData?._count.picking_id || 0,
          avg: Math.round(avg),
          totalOrders: ordersSum,
          totalUniqueProducts,
          totalProducts,
          simpleOrders,
          complexOrders,
          avgByOrders: Math.round(ordersSum / (avg || 1)),
          allAvg,
        }
      }),
    )

    /* return response.json({
      init: initDateFormatted,
      end: endDateFormatted,
      data: separatorsWithData,
    }) */

    // add column headers
    worksheet.columns = [
      { header: 'Código', key: 'code', width: 20 },
      { header: 'Nome', key: 'name', width: 40 },
      { header: 'Pickings', key: 'pickings', width: 40 },
      { header: 'Média (minutos) por picking', key: 'avg', width: 40 },
      { header: 'Total de pedidos', key: 'totalOrders', width: 40 },
      {
        header: 'Total de produtos únicos',
        key: 'totalUniqueProducts',
        width: 300,
      },
      { header: 'Total de produtos', key: 'totalProducts', width: 40 },
      { header: 'Pedidos simples', key: 'simpleOrders', width: 40 },
      { header: 'Pedidos compostos', key: 'complexOrders', width: 40 },
    ]

    // add rows
    separatorsWithData.forEach((separator) => {
      worksheet.addRow({
        code: separator.code,
        name: separator.name,
        pickings: separator.pickings,
        avg: separator.avg,
        totalOrders: separator.totalOrders,
        totalUniqueProducts: separator.totalUniqueProducts,
        totalProducts: separator.totalProducts,
        simpleOrders: separator.simpleOrders,
        complexOrders: separator.complexOrders,
        avgByOrders: separator.avgByOrders,
      })
    })

    worksheet.columns.forEach((column) => {
      const lengths = column.values.map((v) => v.toString().length)
      const maxLength = Math.max(
        ...lengths.filter((v) => typeof v === 'number'),
      )

      column.width = maxLength > 0 ? maxLength + 2 : 20
    })

    // save workbook to disk
    await workbook.xlsx.writeFile('./public/picking-report-by-period.xlsx')
    return response.download('./public/picking-report-by-period.xlsx')
  },
}
