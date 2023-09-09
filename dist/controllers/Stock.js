"use strict";
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
const database_1 = require("../repositories/database");
const axios_1 = __importDefault(require("axios"));
const slack_1 = require("../repositories/slack");
const socket_1 = require("../repositories/socket");
exports.default = {
    updateStock(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = request.params;
            const product = yield database_1.database.products.findUnique({
                where: {
                    id: Number(id),
                },
            });
            if (!product || !(product === null || product === void 0 ? void 0 : product.sku)) {
                return response.status(404).json({ message: 'Product not found' });
            }
            const stockQueueApi = axios_1.default.create({
                baseURL: 'https://integrations-queue.wedrop.com.br',
            });
            const resStock = yield stockQueueApi.post('/stock', {
                sku: product.sku,
                id: product.id,
            });
            (0, socket_1.emitToAllUsers)('updateStock', product);
            const slackMessage = {
                blocks: [
                    {
                        type: 'header',
                        text: {
                            type: 'plain_text',
                            text: 'Nova atualização de estoque',
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
                            text: `*${product.name}*\n\n O estoque foi atualizado para  *${product.stock}* .`,
                        },
                        accessory: {
                            type: 'image',
                            image_url: `https://app.wedropbr.com.br/img/400x400/13/${product.img}`,
                            alt_text: `${product.name}`,
                        },
                    },
                ],
            };
            yield slack_1.slackApi.post('/T05A6206U3X/B05B71W2MPX/kKYh9NNoOa2xBnMUr4z1EQKl', slackMessage);
            response.json({ message: 'Stock updated', data: resStock.data });
        });
    },
    updateAllStock(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            const products = yield database_1.database.stock_queue.findMany({
                where: {
                    status: 0,
                },
                orderBy: {
                    stock: 'asc',
                },
            });
            const stockQueueApi = axios_1.default.create({
                baseURL: 'https://integrations-queue.wedrop.com.br',
            });
            for (const product of products) {
                const resStock = yield stockQueueApi.post('/stock', { sku: product.sku });
                console.log(resStock.data);
                const deleteStockQueue = yield database_1.database.stock_queue.delete({
                    where: {
                        product_id: product.product_id,
                    },
                });
                console.log(deleteStockQueue);
            }
            response.json({ message: 'Stock updated' });
        });
    },
};
//# sourceMappingURL=Stock.js.map