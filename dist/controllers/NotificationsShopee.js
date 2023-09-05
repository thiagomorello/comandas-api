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
const integrations_1 = require("../repositories/integrations");
const socket_1 = require("../repositories/socket");
exports.default = {
    handle(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            const { status, ordersn } = request.body.data;
            const { shop_id } = request.body;
            if (status === 'READY_TO_SHIP') {
                const integration = (yield integrations_1.integrations).find((integration) => integration.shop_id === Number(shop_id));
                if (!integration || integration.error) {
                    return response.json(request.body);
                }
                (0, socket_1.emitToUser)(String(integration.user_id), 'sellOnShopee', {
                    id: ordersn,
                    integrationId: integration.id,
                });
            }
            if (status === 'PROCESSED') {
                const integration = (yield integrations_1.integrations).find((integration) => integration.shop_id === Number(shop_id));
                if (!integration || integration.error) {
                    return response.json(request.body);
                }
                (0, socket_1.emitToUser)(String(integration.user_id), 'processedOnShopee', {
                    id: ordersn,
                    integrationId: integration.id,
                });
            }
            if (status === 'COMPLETED') {
                const integration = (yield integrations_1.integrations).find((integration) => integration.shop_id === Number(shop_id));
                if (!integration || integration.error) {
                    return response.json(request.body);
                }
                (0, socket_1.emitToUser)(String(integration.user_id), 'completedOnShopee', {
                    id: ordersn,
                    integrationId: integration.id,
                });
            }
            if (status === 'SHIPPED') {
                const integration = (yield integrations_1.integrations).find((integration) => integration.shop_id === Number(shop_id));
                if (!integration || integration.error) {
                    return response.json(request.body);
                }
                (0, socket_1.emitToUser)(String(integration.user_id), 'shippedOnShopee', {
                    id: ordersn,
                    integrationId: integration.id,
                });
            }
            if (status === 'TO_CONFIRM_RECEIVE') {
                const integration = (yield integrations_1.integrations).find((integration) => integration.shop_id === Number(shop_id));
                if (!integration || integration.error) {
                    return response.json(request.body);
                }
                (0, socket_1.emitToUser)(String(integration.user_id), 'toConfirmOnShopee', {
                    id: ordersn,
                    integrationId: integration.id,
                });
            }
            response.json(request.body);
        });
    },
};
//# sourceMappingURL=NotificationsShopee.js.map