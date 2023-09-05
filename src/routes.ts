import { Router } from 'express'
import TypePayments from './controllers/TypePayments'
import Stock from './controllers/Stock'
import UserProduct from './controllers/UserProduct'
import Slack from './controllers/Slack'
import NotificationsMercadoLivre from './controllers/NotificationsMercadoLivre'
import NotificationsShopee from './controllers/NotificationsShopee'
import PickingReports from './controllers/PickingReports'
import ProductsReports from './controllers/ProductsReports'

const routes = Router()

routes.get('/', (request, response) => {
  return response.json({ message: 'Hello! This is WeDrop Core API' })
})

routes.get('/stock/:id', Stock.updateStock)
routes.get('/stock', Stock.updateAllStock)
routes.get('/type-payments', TypePayments.all)
routes.post('/type-payments', TypePayments.create)
routes.put('/type-payments', TypePayments.update)
routes.delete('/type-payments', TypePayments.delete)
routes.get('/users/sinc', UserProduct.addBling)
routes.post('/slack/stock', Slack.stock)
routes.post('/notifications/mercadolivre', NotificationsMercadoLivre.handle)
routes.post('/notifications/shopee', NotificationsShopee.handle)
routes.get('/test', NotificationsMercadoLivre.test)

routes.get('/reports/picking', PickingReports.separators)
routes.get('/reports/picking-by-period', PickingReports.separatorsByPeriod)
routes.get('/reports/address', ProductsReports.addresses)
export { routes }
