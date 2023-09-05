import { database } from '../repositories/database'

export default {
  async setTransactionApproved(transaction: any) {
    await database.transactions.update({
      where: {
        id: transaction.id as number,
      },
      data: {
        type: 'C',
      },
    })

    if (!transaction) {
      return { error: 'Transaction not found' }
    }
    return { message: 'Transaction approved' }
  },

  async setWalletPaymentApproved(walletPayment: any) {
    const now = new Date()
    now.setHours(now.getHours() - 3)

    await database.wallet_payments.update({
      where: {
        id: walletPayment.id,
      },
      data: {
        status: 'approved',
        updated_at: now,
      },
    })

    const transaction = await database.transactions.findFirst({
      where: {
        id: walletPayment.transaction_id,
      },
    })

    const transactionApproved = await this.setTransactionApproved(transaction)
    return { ...transactionApproved, message: 'Wallet Payment Approved' }
  },

  async setWalletPaymentFailed(walletPayment: any) {
    await database.wallet_payments.update({
      where: {
        id: walletPayment.id,
      },
      data: {
        status: 'failed',
        updated_at: new Date(),
      },
    })

    const transactionFailed = await this.setTransactionFailed(
      walletPayment.transaction_id,
    )
    return { ...transactionFailed, message: 'Wallet Payment Failed' }
  },

  async setTransactionFailed(transactionId: number) {
    await database.transactions.update({
      where: {
        id: transactionId as number,
      },
      data: {
        type: 'F',
      },
    })
    return { message: 'Transaction failed' }
  },
}
