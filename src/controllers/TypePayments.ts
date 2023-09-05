import { database } from '../repositories/database'
import { Response, Request } from 'express'

interface TypePaymentProps {
  id?: number
  description: string
  type: 'C' | 'D'
  rateValue: number
  ratePercent: number
}

export default {
  async all(request: Request, response: Response) {
    return response.json(await database.type_payments.findMany())
  },

  async create(request: Request, response: Response) {
    const { description, type, rateValue, ratePercent }: TypePaymentProps =
      request.body
    const typePayment = await database.type_payments.create({
      data: {
        description,
        type,
        rate_value: rateValue,
        rate_percent: ratePercent,
      },
    })
    return response.json(typePayment)
  },

  async update(request: Request, response: Response) {
    const { id, description, type, rateValue, ratePercent }: TypePaymentProps =
      request.body
    const typePayment = await database.type_payments.update({
      where: {
        id: Number(id),
      },
      data: {
        description,
        type,
        rate_value: rateValue,
        rate_percent: ratePercent,
      },
    })
    return response.json(typePayment)
  },

  async delete(request: Request, response: Response) {
    const { id } = request.body
    const typePayment = await database.type_payments.delete({
      where: {
        id: Number(id),
      },
    })
    return response.json(typePayment)
  },
}
