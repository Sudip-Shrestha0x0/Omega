import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

interface User {
  id: string;
  email: string;
  username: string;
  role: 'user' | 'admin';
  plan: 'free' | 'pro' | 'unlimited';
  twoFactorEnabled: boolean;
  avatar?: string;
  twoFactorMethod?: 'email' | 'phone';
  twoFactorContact?: string;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: (credential: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    let token = localStorage.getItem('omega_auth_token');
    let sessionExpiry = localStorage.getItem('omega_session_expiry');
    let storage = localStorage;

    if (!token || !sessionExpiry) {
      token = sessionStorage.getItem('omega_auth_token');
      sessionExpiry = sessionStorage.getItem('omega_session_expiry');
      storage = sessionStorage;
    }
    
    if (token && sessionExpiry) {
      const expiryDate = new Date(sessionExpiry);
      if (expiryDate > new Date()) {
        let storedUser = authService.getUserByToken(token);

        // Fallback: If authService reset (in-memory), try to recover user from localStorage
        if (!storedUser) {
          const storedUserId = localStorage.getItem('omega_user_id') || sessionStorage.getItem('omega_user_id');
          const usersJSON = localStorage.getItem('omega_users');
          if (storedUserId && usersJSON) {
            const users: User[] = JSON.parse(usersJSON);
            storedUser = users.find(u => String(u.id) === String(storedUserId)) || null;
          }
        }

        if (storedUser) {
          // Re-fetch the full user object from localStorage to get the latest updates
          const usersJSON = localStorage.getItem('omega_users');
          let currentUser = storedUser;
          if (usersJSON) {
            const users: User[] = JSON.parse(usersJSON);
            // Try to find by ID first, then by Email (case-insensitive) to handle potential ID mismatches or resets
            const freshUser = users.find(u => String(u.id) === String(storedUser.id)) || 
                              users.find(u => u.email.toLowerCase() === storedUser.email.toLowerCase());
            
            if (freshUser) {
              currentUser = freshUser;
            }
          }
          setUser(currentUser);
          console.log('Session restored for user:', storedUser.email);
        } else {
          storage.removeItem('omega_auth_token');
          storage.removeItem('omega_session_expiry');
          storage.removeItem('omega_user_id');
        }
      } else {
        storage.removeItem('omega_auth_token');
        storage.removeItem('omega_session_expiry');
        storage.removeItem('omega_user_id');
      }
    }
    setIsInitialized(true);
  }, []);

  const login = async (email: string, password: string, rememberMe: boolean = false) => {
    let result: { success: boolean; user?: User | null; token?: string | null; error?: string } = { success: false, user: null, token: null, error: '' };
    try {
      result = await authService.login(email, password);
    } catch (e) {
      console.error("AuthService login error:", e);
    }

    // Fallback: If authService fails (e.g. reset on refresh), check local storage credentials
    if (!result.success) {
      const credsJSON = localStorage.getItem('omega_credentials');
      if (credsJSON) {
        const creds = JSON.parse(credsJSON);
        // Case-insensitive email check to prevent "Invalid Credentials" on casing differences
        const match = creds.find((c: { email: string; password: string }) => 
          c.email.toLowerCase() === email.toLowerCase() && c.password === password
        );
        if (match) {
          const usersJSON = localStorage.getItem('omega_users');
          if (usersJSON) {
            const users: User[] = JSON.parse(usersJSON);
            const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
            if (user) {
              result = { success: true, user, token: 'mock-token-' + Date.now(), error: '' };
            }
          }
        }
      }
    }

    if (result.success && result.user && result.token) {
      // Re-fetch user from localStorage to ensure we have the latest updates,
      // guarding against a stale user object from authService.login.
      const usersJSON = localStorage.getItem('omega_users');
      const users: User[] = usersJSON ? JSON.parse(usersJSON) : [];
      
      let finalUser = result.user;

      // Save credentials locally on successful login (if not already there)
      const credsJSON = localStorage.getItem('omega_credentials');
      const creds = credsJSON ? JSON.parse(credsJSON) : [];
      if (!creds.find((c: { email: string }) => c.email.toLowerCase() === email.toLowerCase())) {
        creds.push({ email, password });
        localStorage.setItem('omega_credentials', JSON.stringify(creds));
      }

      // Try to find existing user by ID first, then by Email (case-insensitive)
      // ensures that if authService returns a default Admin user, we find the *updated* version in local storage
      let freshUser = users.find(u => String(u.id) === String(result.user!.id));
      if (!freshUser) {
        freshUser = users.find(u => u.email.toLowerCase() === result.user!.email.toLowerCase());
      }

      if (freshUser) {
          finalUser = freshUser;
      } else {
          // If user exists in authService but not in local storage (e.g. first login after signup in this session),
          // add them to local storage so settings persist later.
          users.push(finalUser);
          localStorage.setItem('omega_users', JSON.stringify(users));
      }

      setUser(finalUser);
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem('omega_auth_token', result.token);
      storage.setItem('omega_session_expiry', expiryDate.toISOString());
      storage.setItem('omega_user_id', finalUser.id);
      console.log('User logged in:', finalUser.email);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const signup = async (email: string, username: string, password: string) => {
    let result: { success: boolean; user?: User | null; error?: string } = { success: false, user: null, error: '' };
    try {
      result = await authService.signup(email, username, password);
    } catch (e) {
      console.error("AuthService signup error:", e);
    }
    if (result.success && result.user) {
      // Save credentials locally so user can login after refresh/logout
      const credsJSON = localStorage.getItem('omega_credentials');
      const creds = credsJSON ? JSON.parse(credsJSON) : [];
      if (!creds.find((c: { email: string }) => c.email.toLowerCase() === email.toLowerCase())) {
        creds.push({ email, password });
        localStorage.setItem('omega_credentials', JSON.stringify(creds));
      }

      // Ensure user is added to omega_users immediately
      const usersJSON = localStorage.getItem('omega_users');
      const users: User[] = usersJSON ? JSON.parse(usersJSON) : [];
      if (!users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        users.push(result.user!);
        localStorage.setItem('omega_users', JSON.stringify(users));
      }

      // Automatically log in with Remember Me = true
      return login(email, password, true);
    }
    return { success: false, error: result.error };
  };

  const loginWithGoogle = async (credential: string) => {
    const result = await authService.loginWithGoogle(credential);
    if (result.success && result.user && result.token) {
      setUser(result.user);
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);
      localStorage.setItem('omega_auth_token', result.token);
      localStorage.setItem('omega_session_expiry', expiryDate.toISOString());
      localStorage.setItem('omega_user_id', result.user.id);
      
      // Ensure Google user is in omega_users list
      const usersJSON = localStorage.getItem('omega_users');
      const users: User[] = usersJSON ? JSON.parse(usersJSON) : [];
      if (!users.find(u => String(u.id) === String(result.user!.id))) {
        users.push(result.user!);
          localStorage.setItem('omega_users', JSON.stringify(users));
      }

      console.log('User logged in with Google:', result.user.email);
      return { success: true };
    }
    return { success: false, error: result.error };
  };

  const logout = () => {
    const token = localStorage.getItem('omega_auth_token') || sessionStorage.getItem('omega_auth_token');
    if (token) {
      authService.logout(token);
      console.log('User logged out');
    }
    setUser(null);
    localStorage.removeItem('omega_auth_token');
    localStorage.removeItem('omega_session_expiry');
    localStorage.removeItem('omega_user_id');
    sessionStorage.removeItem('omega_auth_token');
    sessionStorage.removeItem('omega_session_expiry');
    sessionStorage.removeItem('omega_user_id');
    
    window.location.href = '/';
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    try {
      // Persist the updated user data to localStorage to ensure it's saved across sessions.
      const usersJSON = localStorage.getItem('omega_users');
      const users: User[] = usersJSON ? JSON.parse(usersJSON) : [];
      
      const userIndex = users.findIndex((u) => String(u.id) === String(updatedUser.id));
      if (userIndex !== -1) {
        users[userIndex] = updatedUser;
      } else {
        users.push(updatedUser);
      }
      
      localStorage.setItem('omega_users', JSON.stringify(users));
    } catch (e) {
      console.error("Failed to persist user update to localStorage:", e);
    }
    console.log('User updated and saved:', updatedUser.email);
  };

  if (!isInitialized) {
    return <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div>
    </div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, signup, loginWithGoogle, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
