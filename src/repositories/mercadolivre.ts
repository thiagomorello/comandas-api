import axios, { AxiosError, AxiosInstance } from 'axios'
import { database } from './database'
import axiosRateLimit from 'axios-rate-limit'
export class MercadoLivre {
  private accessToken: string
  private refreshToken: string
  private integrationId: number
  private client: AxiosInstance

  constructor(
    accessToken: string,
    refreshToken: string,
    integrationId: number,
  ) {
    this.accessToken = accessToken
    this.refreshToken = refreshToken
    this.integrationId = integrationId
    this.client = axiosRateLimit(
      axios.create({
        baseURL: 'https://api.mercadolibre.com',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }),
      { maxRequests: 1, perMilliseconds: 500 },
    )

    this.client.interceptors.response.use(
      (response: any) => response,
      async (error: any) => {
        if (error.response.status === 401 || error.response.status === 403) {
          const newTokenData = await this.refreshAccessToken(this.refreshToken)
          if (!newTokenData.access_token) {
            error = { ...error, doNotRetry: true }
            return Promise.reject(error)
          }
          error.config.headers.Authorization = `Bearer ${newTokenData.access_token}`
          return this.client.request(error.config)
        }
        return Promise.reject(error)
      },
    )
  }

  async getIfSellerIsCrossDocking() {
    const seller = await this.client
      .get('/users/me')
      .then((res) => res.data)
      .catch((error: AxiosError) => {
        console.log('Error getting seller data')
        console.log('Error: ', error.response?.data)
        return { isError: true }
      })

    if (seller.isError) return false

    const shippingPreferentes = await this.client
      .get('/users/' + seller.id + '/shipping_preferences')
      .then((res) => res.data)

    const me2 = shippingPreferentes.logistics.find((logistic: any) => {
      return logistic.mode === 'me2'
    })

    if (!me2) return false

    const crossDocking = me2.types.find((type: any) => {
      return type.type === 'cross_docking'
    })

    return !!crossDocking
  }

  async refreshAccessToken(refreshToken: string) {
    const newTokenData = await this.client
      .post('/oauth/token', {
        grant_type: 'refresh_token',
        client_id: process.env.MERCADOLIVRE_CLIENT_ID,
        client_secret: process.env.MERCADOLIVRE_CLIENT_SECRET,
        refresh_token: refreshToken,
      })
      .then((response: any) => response.data)
      .catch(async (err: AxiosError) => {
        console.log('Error refreshing token')
        console.log('Error: ', err.response?.data)
        const errorResponse: any = err.response?.data
        if (
          errorResponse.error === 'invalid_grant' ||
          errorResponse.error === 'not_found' ||
          errorResponse.error === ''
        ) {
          await database.integrations.update({
            where: {
              id: this.integrationId,
            },
            data: {
              status: 0,
            },
          })
        }
        return { isError: true }
      })

    if (newTokenData.isError) {
      const integration = await database.integrations.findUnique({
        where: {
          id: this.integrationId,
        },
      })
      console.log('Integration: ', integration.params)
    }

    if (!newTokenData.isError) {
      const newParams = await database.integrations.update({
        where: {
          id: this.integrationId,
        },
        data: {
          params: JSON.stringify({
            ...newTokenData,
          }),
        },
      })

      return newTokenData
    }
    return false
  }

  async getOrder(resource: string) {
    const order = await this.client
      .get(resource)
      .then((res) => res.data)
      .catch((err) => {
        return { isError: true, error: err }
      })

    return order
  }
}
