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
    setTransactionApproved(transaction) {
        return __awaiter(this, void 0, void 0, function* () {
            yield database_1.database.transactions.update({
                where: {
                    id: transaction.id,
                },
                data: {
                    type: 'C',
                },
            });
            if (!transaction) {
                return { error: 'Transaction not found' };
            }
            return { message: 'Transaction approved' };
        });
    },
    setWalletPaymentApproved(walletPayment) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            now.setHours(now.getHours() - 3);
            yield database_1.database.wallet_payments.update({
                where: {
                    id: walletPayment.id,
                },
                data: {
                    status: 'approved',
                    updated_at: now,
                },
            });
            const transaction = yield database_1.database.transactions.findFirst({
                where: {
                    id: walletPayment.transaction_id,
                },
            });
            const transactionApproved = yield this.setTransactionApproved(transaction);
            return Object.assign(Object.assign({}, transactionApproved), { message: 'Wallet Payment Approved' });
        });
    },
    setWalletPaymentFailed(walletPayment) {
        return __awaiter(this, void 0, void 0, function* () {
            yield database_1.database.wallet_payments.update({
                where: {
                    id: walletPayment.id,
                },
                data: {
                    status: 'failed',
                    updated_at: new Date(),
                },
            });
            const transactionFailed = yield this.setTransactionFailed(walletPayment.transaction_id);
            return Object.assign(Object.assign({}, transactionFailed), { message: 'Wallet Payment Failed' });
        });
    },
    setTransactionFailed(transactionId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield database_1.database.transactions.update({
                where: {
                    id: transactionId,
                },
                data: {
                    type: 'F',
                },
            });
            return { message: 'Transaction failed' };
        });
    },
};
//# sourceMappingURL=Wallet.js.map