import { io } from 'socket.io-client';

let socket = null;

const socketUrl = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/+$/, '')
  : '/';

export const getSocket = () => {
  if (!socket) {
    socket = io(socketUrl, {
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
