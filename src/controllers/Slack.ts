import { Request, Response } from 'express'
import { database } from '../repositories/database'

export default {
  async stock(request: Request, response: Response) {
    const { text } = request.body

    const stock = Number(text)

    if (stock === undefined || isNaN(stock)) {
      const slackMessage = {
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: 'Erro!',
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
              text: `Você precisa informar um valor de estoque válido. ${text} não é um valor válido.`,
            },
            accessory: {
              type: 'image',
              image_url: `https://cdn.pixabay.com/photo/2017/02/12/21/29/false-2061131_1280.png`,
              alt_text: `erro`,
            },
          },
        ],
      }
      return response.json(slackMessage)
    }

    const products = await database.products.findMany({
      where: {
        status: 1,
        stock: {
          lte: stock,
        },
      },
      take: 10,
    })

    if (products.length === 0) {
      const slackMessage = {
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: 'Erro!',
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
              text: `Não existem produtos com o estoque igual ou menor que ${text}.`,
            },
            accessory: {
              type: 'image',
              image_url: `https://cdn.pixabay.com/photo/2017/02/12/21/29/false-2061131_1280.png`,
              alt_text: `erro`,
            },
          },
        ],
      }
      return response.json(slackMessage)
    }

    const bodyMessage = await Promise.all(
      products.map((product) => {
        return {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*${product.sku}* - ${product.name}: ${product.stock}`,
          },
          accessory: {
            type: 'image',
            image_url: `https://app.wedropbr.com.br/img/400x400/13/${product.img}`,
            alt_text: `${product.name}`,
          },
        }
      }),
    )

    const slackMessage = {
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: 'Erro!',
            emoji: true,
          },
        },
        {
          type: 'divider',
        },
        ...bodyMessage,
      ],
    }

    response.json(slackMessage)
  },
}
