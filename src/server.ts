import * as dotenv from 'dotenv'
import express, { Response, Request, NextFunction } from 'express'
import cors from 'cors'
import 'express-async-errors'
import { routes } from './routes'
import { initializeSocket } from './repositories/socket'
import http from 'http'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true })) // support encoded bodies
app.use(routes)

app.use(
  (err: Error, request: Request, response: Response, next: NextFunction) => {
    if (err instanceof Error) {
      return response.status(400).json({
        error: err.message,
        err,
      })
    }

    return response.status(500).json({
      status: 'error',
      stack: err,
      message: 'Internal Server Error',
    })
  },
)

const server = http.createServer(app)
const io = require('socket.io')(server, {
  cors: {
    origin: '*',
  },
})

initializeSocket(io)

server.listen(process.env.PORT || 8080, () =>
  console.log(`WeDrop Core is running on ${process.env.PORT}!`),
)
