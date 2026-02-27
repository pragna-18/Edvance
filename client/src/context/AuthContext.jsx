import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`);
      setUser(response.data.user);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      
      const { token: newToken, user: userData } = response.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle validation errors
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const errorMessages = error.response.data.errors.map(err => err.msg || err.message).join(', ');
        return {
          success: false,
          error: errorMessages || 'Validation failed'
        };
      }
      
      // Handle single error message
      if (error.response?.data?.error) {
        return {
          success: false,
          error: error.response.data.error
        };
      }
      
      // Handle network errors
      if (error.message === 'Network Error' || error.code === 'ECONNREFUSED') {
        return {
          success: false,
          error: 'Cannot connect to server. Please check if the server is running.'
        };
      }
      
      return {
        success: false,
        error: error.message || 'Login failed. Please try again.'
      };
    }
  };

  const register = async (name, email, password, role = 'teacher') => {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        name,
        email,
        password,
        role
      });
      
      // Auto login after registration
      const loginResponse = await axios.post(`${API_URL}/auth/login`, {
        email,
        password
      });
      
      const { token: newToken, user: userData } = loginResponse.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle validation errors
      if (error.response?.data?.errors && Array.isArray(error.response.data.errors)) {
        const errorMessages = error.response.data.errors.map(err => err.msg || err.message).join(', ');
        return {
          success: false,
          error: errorMessages || 'Validation failed'
        };
      }
      
      // Handle single error message
      if (error.response?.data?.error) {
        return {
          success: false,
          error: error.response.data.error
        };
      }
      
      // Handle network errors
      if (error.message === 'Network Error' || error.code === 'ECONNREFUSED') {
        return {
          success: false,
          error: 'Cannot connect to server. Please check if the server is running.'
        };
      }
      
      return {
        success: false,
        error: error.message || 'Registration failed. Please try again.'
      };
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};




