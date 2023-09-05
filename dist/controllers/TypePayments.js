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
    all(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            return response.json(yield database_1.database.type_payments.findMany());
        });
    },
    create(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            const { description, type, rateValue, ratePercent } = request.body;
            const typePayment = yield database_1.database.type_payments.create({
                data: {
                    description,
                    type,
                    rate_value: rateValue,
                    rate_percent: ratePercent,
                },
            });
            return response.json(typePayment);
        });
    },
    update(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id, description, type, rateValue, ratePercent } = request.body;
            const typePayment = yield database_1.database.type_payments.update({
                where: {
                    id: Number(id),
                },
                data: {
                    description,
                    type,
                    rate_value: rateValue,
                    rate_percent: ratePercent,
                },
            });
            return response.json(typePayment);
        });
    },
    delete(request, response) {
        return __awaiter(this, void 0, void 0, function* () {
            const { id } = request.body;
            const typePayment = yield database_1.database.type_payments.delete({
                where: {
                    id: Number(id),
                },
            });
            return response.json(typePayment);
        });
    },
};
//# sourceMappingURL=TypePayments.js.map