import React, { createContext, useState, useEffect, useCallback } from 'react';
import { loginUser as apiLogin, registerUser as apiRegister, checkAuthStatus as apiCheckStatus } from '../services/api';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [authError, setAuthError] = useState(null);
    const navigate = useNavigate();

    const verifyAuth = useCallback(async () => {
        const token = localStorage.getItem('authToken');
        if (token) {
            try {
                setIsLoading(true);
                const data = await apiCheckStatus();
                if (data.isLoggedIn && data.user) {
                    setUser(data.user);
                    setIsLoggedIn(true);
                } else {
                    localStorage.removeItem('authToken');
                    setUser(null);
                    setIsLoggedIn(false);
                }
            } catch (error) {
                console.warn("Помилка перевірки статусу або токен недійсний:", error.message);
                localStorage.removeItem('authToken');
                setUser(null);
                setIsLoggedIn(false);
            } finally {
                setIsLoading(false);
            }
        } else {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        verifyAuth();
    }, [verifyAuth]);

    const login = async (credentials) => {
        setAuthError(null); // Очищаємо попередні помилки перед новою спробою
        setIsLoading(true);
        try {
            const data = await apiLogin(credentials);
            localStorage.setItem('authToken', data.token);
            setUser(data.user);
            setIsLoggedIn(true);
            setIsLoading(false);
            navigate('/');
            return true;
        } catch (error) {
            console.error('Login failed in AuthContext:', error);
            setAuthError(error.message || "Помилка входу. Перевірте дані.");
            setIsLoading(false);
            return false;
        }
    };

    const register = async (userData) => {
        setAuthError(null); // Очищаємо попередні помилки перед новою спробою
        setIsLoading(true);
        try {
            await apiRegister(userData);
            setIsLoading(false);
            alert('Реєстрація успішна! Тепер ви можете увійти.');
            // Встановлюємо isLoginView=true непрямо, через навігацію і поведінку AuthPage
            navigate('/auth'); 
            return true;
        } catch (error) {
            console.error('Registration failed in AuthContext:', error);
            setAuthError(error.message || "Помилка реєстрації.");
            setIsLoading(false);
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('authToken');
        setUser(null);
        setIsLoggedIn(false);
        setAuthError(null); // Очищаємо будь-які помилки при виході
        navigate('/');
    };

    return (
        <AuthContext.Provider value={{ user, isLoggedIn, isLoadingAuth: isLoading, authError, login, register, logout, setAuthError }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;