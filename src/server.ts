import * as dotenv from 'dotenv'
import express, { Response, Request, NextFunction } from 'express'
import cors from 'cors'
import 'express-async-errors'
import { routes } from './routes'
import { database } from './repositories/database'
import { MercadoPago } from './repositories/mercadopago'
import Wallet from './controllers/Wallet'
import { initializeSocket } from './repositories/socket'
import http from 'http'

const EventEmitter = require('events')
const emitter = new EventEmitter()

emitter.setMaxListeners(Infinity)
dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true })) // support encoded bodies
app.use(routes)

app.use(
  (err: Error, request: Request, response: Response, next: NextFunction) => {
    if (err instanceof Error) {
      return response.status(400).json({
        error: err.message,
        err,
      })
    }

    return response.status(500).json({
      status: 'error',
      stack: err,
      message: 'Internal Server Error',
    })
  },
)

const server = http.createServer(app)
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
  },
})

initializeSocket(io)

server.listen(process.env.PORT || 8080, () =>
  console.log(`WeDrop Core is running on ${process.env.PORT}!`),
)

function setShopIDML() {
  database.integrations
    .findMany({
      where: {
        status: 1,
        keyword: 'mercadolivre',
        shop_id: 0,
      },
    })
    .then(async (integrations) => {
      for (const integration of integrations) {
        try {
          const params = JSON.parse(integration.params)
          if (params.user_id) {
            const inte = await database.integrations.update({
              where: {
                id: integration.id,
              },
              data: {
                shop_id: Number(params.user_id),
              },
            })
            console.log(
              inte.keyword +
                ' - ' +
                inte.name +
                ' atualizado shop_id para ' +
                params.user_id,
            )
          }
        } catch (err) {}
      }
    })

  setInterval(setShopIDML, 3600000)
}

function setShopIDShopee() {
  database.integrations
    .findMany({
      where: {
        status: 1,
        keyword: 'shopee',
        shop_id: 0,
      },
    })
    .then(async (integrations) => {
      for (const integration of integrations) {
        try {
          const params = JSON.parse(integration.params)
          if (params?.shop_id) {
            const inte = await database.integrations.update({
              where: {
                id: integration.id,
              },
              data: {
                shop_id: Number(params.shop_id),
              },
            })
            console.log(
              inte.keyword +
                '-' +
                inte.name +
                ' atualizado shop_id para ' +
                params.user_id,
            )
          }
        } catch (err) {}
      }
    })
  // each hour
  setInterval(setShopIDShopee, 3600000)
}

/* setShopIDML()
setShopIDShopee() */

// Verifica os pagamentos pix
setInterval(async () => {
  const pendentPayments = await database.wallet_payments.findMany({
    where: {
      status: 'pending',
    },
  })

  if (pendentPayments.length > 0) {
    const mp = new MercadoPago()

    pendentPayments.forEach(async (pPayment) => {
      try {
        const payment = await mp.getPayment({ id: pPayment.gateway_payment_id })
        // console.log('Verificando pagamento ' + pPayment.gateway_payment_id)
        if (!payment) {
          return false
        }
        if (payment.status === 'cancelled') {
          await Wallet.setWalletPaymentFailed(pPayment)
          console.log('Pagamento ' + pPayment.gateway_payment_id + ' cancelado')
          return true
        }

        if (
          payment.status === 'approved' &&
          payment.status_detail === 'accredited'
        ) {
          await Wallet.setWalletPaymentApproved(pPayment)
          console.log('Pagamento ' + pPayment.gateway_payment_id + ' aprovado')
          return true
        }
      } catch (error) {
        console.log(error)
        return true
      }
    })
  }
}, 10000)

/* async function addProductsToQueue() {
  const products = await database.products.findMany({
    where: {
      status: 1,
    },
  })

  products.forEach(async (product) => {
    await database.stock_queue.upsert({
      where: {
        product_id: product.id,
      },
      create: {
        product_id: product.id,
        sku: product.sku,
        suplier_id: 13,
        stock: Number(product.stock) || 0,
        status: 0,
        updated_time: new Date(),
      },
      update: {
        stock: Number(product.stock) || 0,
      },
    })
  })
}

addProductsToQueue() */

/* setInterval(async () => {
  const stockQueue = await database.stock_queue.findMany({
    where: {
      status: 0,
    },
    orderBy: {
      stock: 'asc',
    },
    take: 1,
  })

  console.log(stockQueue.length + ' produtos na fila de estoque')

  if (stockQueue.length > 0) {
    stockQueue.forEach(async (stock) => {
      console.log(stock.product_id + ' iniciando')
      const usersSelling = await database.user_product.findMany({
        where: {
          product_id: stock.product_id,
        },
      })
      console.log(
        usersSelling.length +
          ' usuários vendendo o produto ' +
          stock.product_id,
      )
      if (usersSelling.length > 0) {
        usersSelling.forEach(async (user) => {
          const product = await database.products.findUnique({
            where: {
              id: user.product_id,
            },
          })
          console.log(
            product?.sku + ' iniciando para o usuário ' + user.user_id,
          )
          if (!product) {
            return false
          }

          await database.stock_queue.update({
            where: {
              id: stock.id,
            },
            data: {
              status: 1,
            },
          })

          const erp = await database.integrations.findFirst({
            where: {
              id: user.integration_id,
            },
          })

          const params = JSON.parse(erp?.params || '{}')

          if (params.apikey) {
            const bling = new Bling(params.apikey)

            bling.updateStock({
              sku: product?.sku || '',
              stock: Number(stock.stock),
            })

            console.log(
              'Estoque atualizado para ' +
                stock.stock +
                ' do produto ' +
                product?.sku +
                ' do usuário ' +
                user.user_id,
            )
          }
        })
      }
    })
  }
}, 3000) */
