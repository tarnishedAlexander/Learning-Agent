import React, { createContext, useContext, useState, useEffect } from 'react';
import { meAPI } from '../services/authService';

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

    const fetchUser = async () => {
        try {
            const authData = localStorage.getItem("auth");
            if (!authData) {
                console.log("Sin datos Auth guardados en localstorage");
                setUser(null);
                return;
            }
            const parsedData = JSON.parse(authData);
            const token = parsedData.accessToken
            const response = await meAPI(token);
            setUser(response);
        } catch (error) {
            console.error('Error fetching user data:', error);
            setUser(null);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

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
