import { Request, Response } from 'express'
import { database } from '../repositories/database'
import axios from 'axios'
import { slackApi } from '../repositories/slack'
import { emitToAllUsers } from '../repositories/socket'
export default {
  async updateStock(request: Request, response: Response) {
    const { id } = request.params

    const product = await database.products.findUnique({
      where: {
        id: Number(id),
      },
    })
    if (!product || !product?.sku) {
      return response.status(404).json({ message: 'Product not found' })
    }

    const stockQueueApi = axios.create({
      baseURL: 'https://integrations-queue.wedrop.com.br',
    })

    const resStock = await stockQueueApi.post('/stock', {
      sku: product.sku,
      id: product.id,
    })
    // emitToAllUsers('updateStock', product)
    const slackMessage = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: 'Nova atualização de estoque',
            emoji: true,
          },
        },
        {
          type: 'divider',
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${product.name}*\n\n O estoque foi atualizado para  *${product.stock}* .`,
          },
          accessory: {
            type: 'image',
            image_url: `https://app.wedropbr.com.br/img/400x400/13/${product.img}`,
            alt_text: `${product.name}`,
          },
        },
      ],
    }

    await slackApi.post(
      '/T05A6206U3X/B05B71W2MPX/kKYh9NNoOa2xBnMUr4z1EQKl',
      slackMessage,
    )

    response.json({ message: 'Stock updated', data: resStock.data })
  },

  async updateAllStock(request: Request, response: Response) {
    const products = await database.stock_queue.findMany({
      where: {
        status: 0,
      },
      orderBy: {
        stock: 'asc',
      },
    })

    const stockQueueApi = axios.create({
      baseURL: 'https://integrations-queue.wedrop.com.br',
    })

    for (const product of products) {
      const resStock = await stockQueueApi.post('/stock', { sku: product.sku })
      console.log(resStock.data)

      const deleteStockQueue = await database.stock_queue.delete({
        where: {
          product_id: product.product_id,
        },
      })
      console.log(deleteStockQueue)
    }

    response.json({ message: 'Stock updated' })
  },
}
