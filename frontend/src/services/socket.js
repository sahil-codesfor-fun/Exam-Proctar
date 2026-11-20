import { io } from 'socket.io-client';

export const getSocketUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '');
  }
  if (typeof window !== 'undefined') {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocal && (window.location.port === '5173' || window.location.port === '5174')) {
      return `${window.location.protocol}//${window.location.hostname}:5003`;
    }
    return window.location.origin;
  }
  return '';
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
