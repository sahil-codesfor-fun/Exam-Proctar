import { io } from 'socket.io-client';

const getSocketUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, '') || '';
};

const SOCKET_URL = getSocketUrl();

let socket = null;

export const connectSocket = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (!socket) {
    socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      auth: { token: token || '' }
    });
  } else if (token && socket.auth?.token !== token) {
    socket.auth = { token };
  }
  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (socket) { socket.disconnect(); socket = null; }
};