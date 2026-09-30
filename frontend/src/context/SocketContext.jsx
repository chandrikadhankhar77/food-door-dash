import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { io } from 'socket.io-client';
import { getSocketUrl } from '../utils/formatPrice';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token, isAuthenticated, user } = useAuth();
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
      return undefined;
    }

    const socket = io(getSocketUrl(), {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      if (user?._id) {
        socket.emit('join:user', user._id);
      }
      if (
        (user?.role === 'restaurant_admin' || user?.role === 'admin') &&
        user?.restaurant
      ) {
        socket.emit('join:restaurant', user.restaurant);
      }
    });

    socket.on('disconnect', () => setConnected(false));

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [isAuthenticated, token, user?._id, user?.role, user?.restaurant]);

  const value = useMemo(
    () => ({
      socket: socketRef.current,
      connected,
      joinOrder: (orderId) => socketRef.current?.emit('join:order', orderId),
      leaveOrder: (orderId) => socketRef.current?.emit('leave:order', orderId),
      on: (event, handler) => {
        socketRef.current?.on(event, handler);
        return () => socketRef.current?.off(event, handler);
      },
    }),
    [connected]
  );

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
};
