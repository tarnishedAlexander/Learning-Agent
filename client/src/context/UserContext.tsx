import React, { createContext, useContext, useState, useEffect, useCallback  } from 'react';
import { meAPI } from '../services/authService';
import { useUserStore } from '../store/userStore';

interface User {
    id: string;
    email: string;
    name: string;
    lastname: string;
    roles: string[];
}

interface UserContextType {
    user: User | null;
    fetchUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    const fetchUser = useCallback(async () => {
        try {
            const authData = localStorage.getItem("auth");
            if (!authData) {
                console.log("Sin datos Auth guardados en localstorage");
                setUser(null);
                useUserStore.getState().setUser(null); // Sincronizar con store
                return;
            }
            const parsedData = JSON.parse(authData);
            const token = parsedData.accessToken
            const response = await meAPI(token);
            setUser(response);
            useUserStore.getState().setUser(response); // Sincronizar con store
        } catch (error) {
            console.error('Error fetching user data:', error);
            setUser(null);
            useUserStore.getState().setUser(null); // Sincronizar con store
        }
    },[]);

    useEffect(() => {
        fetchUser();
    }, [fetchUser ]);

    return (
        <UserContext.Provider value={{ user, fetchUser }}>
            {children}
        </UserContext.Provider >
  );
};

export const useUserContext = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser  must be used within a UserProvider');
    }
    return context;
};

export const useUser = () => {
    const { user } = useUserContext();
    return { id: user?.id || null };
};
