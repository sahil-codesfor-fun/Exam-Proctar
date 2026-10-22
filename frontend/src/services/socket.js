import { io } from 'socket.io-client';

const getSocketUrl = () => {
  if (typeof window !== 'undefined' && window.location.hostname && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    if (import.meta.env.PROD && !/^(192\.168|10\.|172\.(1[6-9]|2\d|3[01]))\./.test(window.location.hostname)) {
      return (import.meta.env.VITE_API_BASE_URL || 'https://exam-proctar.onrender.com').replace(/\/api\/?$/, '');
    }
    return `${window.location.protocol}//${window.location.hostname}:5002`;
  }
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/api\/?$/, '');
  }
  if (import.meta.env.PROD) {
    return 'https://exam-proctar.onrender.com';
  }
  return 'http://localhost:5002';
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