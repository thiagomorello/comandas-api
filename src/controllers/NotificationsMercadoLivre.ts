import { Request, Response } from 'express'
import { MercadoLivre } from '../repositories/mercadolivre'
import { integrations } from '../repositories/integrations'
import { emitToUser } from '../repositories/socket'
import { database } from '../repositories/database'
export default {
  async handle(request: Request, response: Response) {
    const { user_id, topic, resource } = request.body

    const integration = (await integrations).find(
      (integration) => integration.shop_id === Number(user_id),
    )

    if (!integration || integration.error) {
      return response.json(request.body)
    }

    if (topic === 'orders_v2' && integration.params) {
      const orderId = resource.split('/')[2].trim()
      // console.log('orderId: ', orderId)
      const orderExists = await database.orders.findFirst({
        where: {
          channel_order: orderId,
        },
        select: {
          id: true,
        },
      })
      if (!orderExists) {
        const ml = new MercadoLivre(
          integration.params.access_token,
          integration.params.refresh_token,
          integration.id,
        )

        const order = await ml.getOrder(resource)

        /* if (order.isError) {
          return response.json(request.body)
        } else {
          if (order.status === 'paid') {
            emitToUser(String(integration.user_id), 'sellOnMl', {
              ...order,
              integrationId: integration.id,
            })
          }
        } */

        return response.json(request.body)
      }
    }
  },
  async test(request: Request, response: Response) {
    const meliIntegrations = (await integrations).filter(
      (integration) =>
        integration.keyword === 'mercadolivre' && integration.is_cross === 0,
    )
    let updatedIntegrations = 0
    let position = 0

    for (const integration of meliIntegrations) {
      const ml = new MercadoLivre(
        integration.params.access_token,
        integration.params.refresh_token,
        integration.id,
      )

      const isCrossDocking = await ml.getIfSellerIsCrossDocking()

      if (isCrossDocking) {
        await database.integrations.update({
          where: {
            id: integration.id,
          },
          data: {
            is_cross: 1,
          },
        })
        updatedIntegrations++

        console.log('Integration updated: ', integration.id)
      } else {
        await database.integrations.update({
          where: {
            id: integration.id,
          },
          data: {
            is_cross: 2,
          },
        })
      }
      position++
      console.log(
        position + ' de  ' + meliIntegrations.length + ' integrations testadas',
      )
    }
    return response.json({ updatedIntegrations })
  },
}
