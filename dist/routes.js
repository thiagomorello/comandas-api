"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.routes = void 0;
const express_1 = require("express");
const TypePayments_1 = __importDefault(require("./controllers/TypePayments"));
const Stock_1 = __importDefault(require("./controllers/Stock"));
const UserProduct_1 = __importDefault(require("./controllers/UserProduct"));
const Slack_1 = __importDefault(require("./controllers/Slack"));
const NotificationsMercadoLivre_1 = __importDefault(require("./controllers/NotificationsMercadoLivre"));
const NotificationsShopee_1 = __importDefault(require("./controllers/NotificationsShopee"));
const routes = (0, express_1.Router)();
exports.routes = routes;
routes.get('/', (request, response) => {
    return response.json({ message: 'Hello! This is WeDrop Core API' });
});
routes.get('/stock/:id', Stock_1.default.updateStock);
routes.get('/stock', Stock_1.default.updateAllStock);
routes.get('/type-payments', TypePayments_1.default.all);
routes.post('/type-payments', TypePayments_1.default.create);
routes.put('/type-payments', TypePayments_1.default.update);
routes.delete('/type-payments', TypePayments_1.default.delete);
routes.get('/users/sinc', UserProduct_1.default.addBling);
routes.post('/slack/stock', Slack_1.default.stock);
routes.post('/notifications/mercadolivre', NotificationsMercadoLivre_1.default.handle);
routes.post('/notifications/shopee', NotificationsShopee_1.default.handle);
routes.get('/test', NotificationsMercadoLivre_1.default.test);
//# sourceMappingURL=routes.js.map