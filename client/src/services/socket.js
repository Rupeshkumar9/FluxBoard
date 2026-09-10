import { io } from 'socket.io-client';

let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io('/', {
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });
  }
  return socket;
};

export const joinBoardRoom = (boardId) => {
  const s = getSocket();
  s.emit('join-board', boardId);
};

export const leaveBoardRoom = (boardId) => {
  const s = getSocket();
  s.emit('leave-board', boardId);
};

export const emitBoardUpdate = (boardId, data = {}) => {
  const s = getSocket();
  s.emit('board-update', { boardId, ...data });
};

export const emitTaskUpdate = (boardId, data = {}) => {
  const s = getSocket();
  s.emit('task-update', { boardId, ...data });
};

export const emitColumnUpdate = (boardId, data = {}) => {
  const s = getSocket();
  s.emit('column-update', { boardId, ...data });
};
