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
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../repositories/database");
exports.default = {
    stock(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            const { text } = request.body;
            const stock = Number(text);
            if (stock === undefined || isNaN(stock)) {
                const slackMessage = {
                    blocks: [
                        {
                            type: 'header',
                            text: {
                                type: 'plain_text',
                                text: 'Erro!',
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
                                text: `Você precisa informar um valor de estoque válido. ${text} não é um valor válido.`,
                            },
                            accessory: {
                                type: 'image',
                                image_url: `https://cdn.pixabay.com/photo/2017/02/12/21/29/false-2061131_1280.png`,
                                alt_text: `erro`,
                            },
                        },
                    ],
                };
                return response.json(slackMessage);
            }
            const products = yield database_1.database.products.findMany({
                where: {
                    status: 1,
                    stock: {
                        lte: stock,
                    },
                },
                take: 10,
            });
            if (products.length === 0) {
                const slackMessage = {
                    blocks: [
                        {
                            type: 'header',
                            text: {
                                type: 'plain_text',
                                text: 'Erro!',
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
                                text: `Não existem produtos com o estoque igual ou menor que ${text}.`,
                            },
                            accessory: {
                                type: 'image',
                                image_url: `https://cdn.pixabay.com/photo/2017/02/12/21/29/false-2061131_1280.png`,
                                alt_text: `erro`,
                            },
                        },
                    ],
                };
                return response.json(slackMessage);
            }
            const bodyMessage = yield Promise.all(products.map((product) => {
                return {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: `*${product.sku}* - ${product.name}: ${product.stock}`,
                    },
                    accessory: {
                        type: 'image',
                        image_url: `https://app.wedropbr.com.br/img/400x400/13/${product.img}`,
                        alt_text: `${product.name}`,
                    },
                };
            }));
            const slackMessage = {
                blocks: [
                    {
                        type: 'header',
                        text: {
                            type: 'plain_text',
                            text: 'Erro!',
                            emoji: true,
                        },
                    },
                    {
                        type: 'divider',
                    },
                    ...bodyMessage,
                ],
            };
            response.json(slackMessage);
        });
    },
};
//# sourceMappingURL=Slack.js.map