"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitToAllUsers = exports.emitToUser = exports.initializeSocket = void 0;
const connectedUsers = {};
function initializeSocket(io) {
    io.on('connection', (socket) => {
        const userId = Number(socket.handshake.query.userId);
        connectedUsers[userId] = {
            socket,
        };
        socket.on('disconnect', () => {
            delete connectedUsers[userId];
        });
    });
}
exports.initializeSocket = initializeSocket;
function emitToUser(userId, event, data) {
    var _a;
    const userSocket = (_a = connectedUsers[userId]) === null || _a === void 0 ? void 0 : _a.socket;
    if (userSocket) {
        userSocket.emit(event, data);
    }
}
exports.emitToUser = emitToUser;
function emitToAllUsers(event, data) {
    Object.values(connectedUsers).forEach((connectedUser) => {
        connectedUser.socket.emit(event, data);
    });
}
exports.emitToAllUsers = emitToAllUsers;
//# sourceMappingURL=socket.js.map