import axios, { AxiosInstance } from 'axios'
import * as dotenv from 'dotenv'
dotenv.config()
export class MercadoPago {
  private mp: any
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.mercadopago.com',
      headers: {
        Authorization: `Bearer ${process.env.MERCADOPAGO_TOKEN}`,
      },
    })
  }

  async createCustomer(data: any) {
    const response = await this.mp.customers.create(data)
    return response
  }

  async createPixPayment(paymentData: any) {
    paymentData.statement_descriptor = 'WeDrop'
    const pixResponse = await this.client
      .post('/v1/payments', paymentData)
      .then((response: any) => response.data)
    return pixResponse
  }

  async createPayment(paymentData: any) {
    paymentData.statement_descriptor = 'WeDrop'
    const cardResponse = await this.client
      .post('/v1/payments', paymentData)
      .then((response: any) => response.data)
    return cardResponse
  }

  async getPayment({ id }: any) {
    const response = await this.client
      .get(`/v1/payments/${id}`)
      .then((response: any) => response.data)
    return response
  }
}
