import { Request, Response } from 'express'
import { database } from '../repositories/database'
import { Bling } from 'bling-erp-api'
export default {
  async addBling(request: Request, response: Response) {
    const { email } = request.query

    if (!email) {
      return response.status(400).json({ message: 'Email is required' })
    }
    const user = await database.users.findUnique({
      where: {
        email: String(email),
      },
    })
    /* const users = await database.users.findMany({
      where: {
        status: 1,
      },
    })
    for (const user of users) { */
    if (!user) {
      return response.status(404).json({ message: 'User not found' })
    }
    const userProducts = await database.user_product.findMany({
      where: {
        user_id: user.id,
      },
    })

    const integrations = await database.integrations.findMany({
      where: {
        status: 1,
        type: 'erp',
        user_id: user.id,
      },
    })

    const products = await database.products.findMany({
      where: {
        status: 1,
      },
    })
    const ups = []
    for (const integration of integrations) {
      const params = JSON.parse(integration.params || '{}')
      if (!params.apikey) {
        database.integrations.update({
          where: {
            id: integration.id,
          },
          data: {
            status: 0,
          },
        })
        return false
      }
      const blingConnection = new Bling(params.apikey)

      const res = await blingConnection
        .products()
        .all()
        .catch((err) => {
          console.log(err)
          return []
        })
      const skus = await Promise.all(res.map((product: any) => product.codigo))
      // filter skus if product exists and add product_id to skus
      await Promise.all(
        skus.map(async (sku: string) => {
          const p = products.find((product) => {
            if (product.sku === sku) {
              return product
            }
            return false
          })
          if (p) {
            const userProduct = userProducts.find((userProduct) => {
              if (userProduct.product_id === p.id) {
                return userProduct
              }
              return false
            })
            if (!userProduct) {
              const up = await database.user_product.create({
                data: {
                  product_id: p.id,
                  user_id: user.id,
                  integration_id: integration.id,
                },
              })
              ups.push(up)
              return up
            }
            return false
          }
          return false
        }),
      )
      console.log('Produtos adicionados para o usuário ' + user.id)
    }
    return response.json({ message: 'ok' })
  },
}
