import { Router } from 'express'
const routes = Router()

routes.get('/', (request, response) => {
  return response.json({ message: 'Hello! This is Comandas Core API' })
})
export { routes }
