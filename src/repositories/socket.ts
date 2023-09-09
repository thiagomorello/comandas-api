import { Socket, Server } from 'socket.io'

interface ConnectedUser {
  socket: Socket
  username?: string // You can add any other user-specific data here
}

const connectedUsers: { [userId: string]: ConnectedUser } = {}

export function initializeSocket(io: Server) {
  io.on('connection', (socket: Socket) => {
    const userId = Number(socket.handshake.query.userId)
    connectedUsers[userId] = {
      socket,
    }
    socket.on('disconnect', () => {
      delete connectedUsers[userId]
    })
  })
}

export function emitToUser(userId: string, event: string, data: any) {
  const userSocket = connectedUsers[userId]?.socket
  if (userSocket) {
    userSocket.emit(event, data)
  }
}

export function emitToAllUsers(event: string, data: any) {
  Object.values(connectedUsers).forEach((connectedUser) => {
    connectedUser.socket.emit(event, data)
  })
}
