import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
    const [socket, setSocket] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            const newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
                transports: ['websocket', 'polling'],
            });

            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
                newSocket.emit('join-user', user._id);
            });

            newSocket.on('notification', (notification) => {
                setNotifications((prev) => [notification, ...prev]);
            });

            setSocket(newSocket);

            return () => {
                newSocket.disconnect();
            };
        } else {
            if (socket) {
                socket.disconnect();
                setSocket(null);
            }
        }
    }, [user]);

    const joinProject = (projectId) => {
        if (socket) socket.emit('join-project', projectId);
    };

    const leaveProject = (projectId) => {
        if (socket) socket.emit('leave-project', projectId);
    };

    const clearNotifications = () => setNotifications([]);

    return (
        <SocketContext.Provider
            value={{ socket, notifications, joinProject, leaveProject, clearNotifications }}
        >
            {children}
        </SocketContext.Provider>
    );
};
