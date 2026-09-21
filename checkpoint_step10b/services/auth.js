/**
 * Authentication Service
 * Manages JWT tokens, local storage, and authentication API requests.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';
const API_V1 = import.meta.env.VITE_API_V1_PATH || '/api/v1';
const AUTH_URL = `${BASE_URL}${API_V1}/auth`;
const DEPT_URL = `${BASE_URL}${API_V1}/departments`;

const TOKEN_KEY = 'campus_auth_token';
const USER_KEY = 'campus_auth_user';

// Token Management
export const saveToken = (token) => {
  localStorage.setItem(TOKEN_KEY, token);
};

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

// User Cache Management
export const saveUser = (user) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getUser = () => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const isAuthenticated = () => {
  return !!getToken();
};

export const logout = () => {
  removeToken();
};

// API Calls
export const registerUser = async (userData) => {
  const response = await fetch(`${AUTH_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Registration failed');
  }
  return data;
};

export const loginUser = async (credentials) => {
  const response = await fetch(`${AUTH_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || 'Login failed');
  }

  // Persist token and user in localStorage
  if (data.access_token) {
    saveToken(data.access_token);
    saveUser(data.user);
  }

  return data;
};

export const fetchCurrentUser = async () => {
  const token = getToken();
  if (!token) {
    throw new Error('No authentication token found');
  }

  const response = await fetch(`${AUTH_URL}/me`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json',
    },
  });

  const data = await response.json();
  if (!response.ok) {
    if (response.status === 401) {
      removeToken();
    }
    throw new Error(data.detail || 'Failed to fetch user profile');
  }

  saveUser(data);
  return data;
};

export const fetchDepartments = async () => {
  try {
    const response = await fetch(DEPT_URL, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to load departments (status: ${response.status})`);
    }

    return await response.json();
  } catch (err) {
    console.error('Error fetching departments:', err);
    return [];
  }
};
