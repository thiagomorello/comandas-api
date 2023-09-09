"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
require("express-async-errors");
const routes_1 = require("./routes");
const database_1 = require("./repositories/database");
const mercadopago_1 = require("./repositories/mercadopago");
const Wallet_1 = __importDefault(require("./controllers/Wallet"));
const socket_1 = require("./repositories/socket");
const http_1 = __importDefault(require("http"));
const EventEmitter = require('events');
const emitter = new EventEmitter();
emitter.setMaxListeners(Infinity);
dotenv.config();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true })); // support encoded bodies
app.use(routes_1.routes);
app.use((err, request, response, next) => {
    if (err instanceof Error) {
        return response.status(400).json({
            error: err.message,
            err,
        });
    }
    return response.status(500).json({
        status: 'error',
        stack: err,
        message: 'Internal Server Error',
    });
});
const server = http_1.default.createServer(app);
const io = require('socket.io')(server, {
    cors: {
        origin: '*',
    },
});
(0, socket_1.initializeSocket)(io);
server.listen(process.env.PORT || 8080, () => console.log(`WeDrop Core is running on ${process.env.PORT}!`));
function setShopIDML() {
    database_1.database.integrations
        .findMany({
        where: {
            status: 1,
            keyword: 'mercadolivre',
            shop_id: 0,
        },
    })
        .then((integrations) => __awaiter(this, void 0, void 0, function* () {
        for (const integration of integrations) {
            try {
                const params = JSON.parse(integration.params);
                if (params.user_id) {
                    const inte = yield database_1.database.integrations.update({
                        where: {
                            id: integration.id,
                        },
                        data: {
                            shop_id: Number(params.user_id),
                        },
                    });
                    console.log(inte.keyword +
                        ' - ' +
                        inte.name +
                        ' atualizado shop_id para ' +
                        params.user_id);
                }
            }
            catch (err) { }
        }
    }));
    setInterval(setShopIDML, 3600000);
}
function setShopIDShopee() {
    database_1.database.integrations
        .findMany({
        where: {
            status: 1,
            keyword: 'shopee',
            shop_id: 0,
        },
    })
        .then((integrations) => __awaiter(this, void 0, void 0, function* () {
        for (const integration of integrations) {
            try {
                const params = JSON.parse(integration.params);
                if (params === null || params === void 0 ? void 0 : params.shop_id) {
                    const inte = yield database_1.database.integrations.update({
                        where: {
                            id: integration.id,
                        },
                        data: {
                            shop_id: Number(params.shop_id),
                        },
                    });
                    console.log(inte.keyword +
                        '-' +
                        inte.name +
                        ' atualizado shop_id para ' +
                        params.user_id);
                }
            }
            catch (err) { }
        }
    }));
    // each hour
    setInterval(setShopIDShopee, 3600000);
}
setShopIDML();
setShopIDShopee();
// Verifica os pagamentos pix
setInterval(() => __awaiter(void 0, void 0, void 0, function* () {
    const pendentPayments = yield database_1.database.wallet_payments.findMany({
        where: {
            status: 'pending',
        },
    });
    if (pendentPayments.length > 0) {
        const mp = new mercadopago_1.MercadoPago();
        pendentPayments.forEach((pPayment) => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const payment = yield mp.getPayment({ id: pPayment.gateway_payment_id });
                // console.log('Verificando pagamento ' + pPayment.gateway_payment_id)
                if (!payment) {
                    return false;
                }
                if (payment.status === 'cancelled') {
                    yield Wallet_1.default.setWalletPaymentFailed(pPayment);
                    console.log('Pagamento ' + pPayment.gateway_payment_id + ' cancelado');
                    return true;
                }
                if (payment.status === 'approved' &&
                    payment.status_detail === 'accredited') {
                    yield Wallet_1.default.setWalletPaymentApproved(pPayment);
                    console.log('Pagamento ' + pPayment.gateway_payment_id + ' aprovado');
                    return true;
                }
            }
            catch (error) {
                console.log(error);
                return true;
            }
        }));
    }
}), 10000);
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
//# sourceMappingURL=server.js.map