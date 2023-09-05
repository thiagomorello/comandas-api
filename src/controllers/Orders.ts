import { Request, Response } from 'express'
import { database } from '../repositories/database'
interface OrdersFilter {
  userId?: number
  payDate?: Date
  lteDate?: Date
  status?: number
}
export default {}
