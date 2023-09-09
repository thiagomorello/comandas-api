import * as dotenv from 'dotenv'
import { Bling } from 'bling-erp-api'
dotenv.config()

export const bling = new Bling(process.env.BLING_API_KEY)
