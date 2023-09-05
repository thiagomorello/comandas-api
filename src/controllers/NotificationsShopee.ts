import { Request, Response } from 'express'
import { integrations } from '../repositories/integrations'
import { emitToUser } from '../repositories/socket'
export default {
  async handle(request: Request, response: Response) {
    const { status, ordersn } = request.body.data
    const { shop_id } = request.body
    if (status === 'READY_TO_SHIP') {
      const integration = (await integrations).find(
        (integration) => integration.shop_id === Number(shop_id),
      )

      if (!integration || integration.error) {
        return response.json(request.body)
      }

      emitToUser(String(integration.user_id), 'sellOnShopee', {
        id: ordersn,
        integrationId: integration.id,
      })
    }

    if (status === 'PROCESSED') {
      const integration = (await integrations).find(
        (integration) => integration.shop_id === Number(shop_id),
      )

      if (!integration || integration.error) {
        return response.json(request.body)
      }

      emitToUser(String(integration.user_id), 'processedOnShopee', {
        id: ordersn,
        integrationId: integration.id,
      })
    }
    if (status === 'COMPLETED') {
      const integration = (await integrations).find(
        (integration) => integration.shop_id === Number(shop_id),
      )

      if (!integration || integration.error) {
        return response.json(request.body)
      }

      emitToUser(String(integration.user_id), 'completedOnShopee', {
        id: ordersn,
        integrationId: integration.id,
      })
    }
    if (status === 'SHIPPED') {
      const integration = (await integrations).find(
        (integration) => integration.shop_id === Number(shop_id),
      )

      if (!integration || integration.error) {
        return response.json(request.body)
      }

      emitToUser(String(integration.user_id), 'shippedOnShopee', {
        id: ordersn,
        integrationId: integration.id,
      })
    }
    if (status === 'TO_CONFIRM_RECEIVE') {
      const integration = (await integrations).find(
        (integration) => integration.shop_id === Number(shop_id),
      )

      if (!integration || integration.error) {
        return response.json(request.body)
      }

      emitToUser(String(integration.user_id), 'toConfirmOnShopee', {
        id: ordersn,
        integrationId: integration.id,
      })
    }
    response.json(request.body)
  },
}
