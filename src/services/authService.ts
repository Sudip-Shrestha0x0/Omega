import CryptoJS from 'crypto-js';

export interface User {
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
  lastLogin?: Date;
}

interface StoredUser extends User {
  passwordHash: string;
  emailHash: string;
}

class AuthService {
  private users: Map<string, StoredUser> = new Map();
  private sessions: Map<string, string> = new Map();
  private resetTokens: Map<string, { email: string; expiry: Date }> = new Map();
  
  private readonly ADMIN_EMAIL = 'light0x01@gmail.com';
  private readonly ADMIN_EMAIL_HASH = CryptoJS.SHA256('light0x01@gmail.com').toString();

  constructor() {
    // First, load any persisted users from localStorage
    this.loadUsersFromStorage();

    // Ensure admin user exists (create default if not in storage)
    if (!this.users.has(this.ADMIN_EMAIL_HASH)) {
      const adminPasswordHash = this.hashPassword('developer123');
      const adminUser: StoredUser = {
        id: 'admin-secure-001',
        email: this.ADMIN_EMAIL,
        emailHash: this.ADMIN_EMAIL_HASH,
        username: 'Administrator',
        role: 'admin',
        plan: 'unlimited',
        passwordHash: adminPasswordHash,
        twoFactorEnabled: false,
        createdAt: new Date(),
      };
      this.users.set(this.ADMIN_EMAIL_HASH, adminUser);
    }
  }

  private loadUsersFromStorage(): void {
    try {
      // Load users from omega_users
      const usersJSON = localStorage.getItem('omega_users');
      const credsJSON = localStorage.getItem('omega_credentials');

      if (usersJSON) {
        const users = JSON.parse(usersJSON);
        const creds = credsJSON ? JSON.parse(credsJSON) : [];

        for (const user of users) {
          const emailHash = this.hashEmail(user.email);
          // Find matching credentials to get the password
          const credential = creds.find((c: { email: string; password: string }) =>
            c.email.toLowerCase() === user.email.toLowerCase()
          );

          const storedUser: StoredUser = {
            ...user,
            emailHash,
            passwordHash: credential ? this.hashPassword(credential.password) : this.hashPassword('developer123'),
            createdAt: new Date(user.createdAt),
          };

          this.users.set(emailHash, storedUser);
        }
      }
    } catch (e) {
      console.error('Failed to load users from storage:', e);
    }
  }

  private hashEmail(email: string): string {
    return CryptoJS.SHA256(email.toLowerCase()).toString();
  }

  hashPassword(password: string): string {
    return CryptoJS.SHA256(password).toString();
  }

  async signup(email: string, username: string, password: string, asRole?: 'user' | 'admin'): Promise<{ success: boolean; user?: User; error?: string }> {
    const emailHash = this.hashEmail(email);
    
    if (this.users.has(emailHash)) {
      return { success: false, error: 'Email already registered' };
    }

    const passwordHash = this.hashPassword(password);
    const userId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const role = asRole === 'admin' ? 'admin' : 'user';
    
    const newUser: StoredUser = {
      id: userId,
      email: email,
      emailHash: emailHash,
      username,
      role,
      plan: role === 'admin' ? 'unlimited' : 'free',
      passwordHash,
      twoFactorEnabled: false,
      createdAt: new Date(),
    };

    this.users.set(emailHash, newUser);
    const { passwordHash: _, emailHash: __, ...userWithoutSensitive } = newUser;
    
    return { success: true, user: userWithoutSensitive };
  }

  async login(email: string, password: string): Promise<{ success: boolean; user?: User; token?: string; error?: string }> {
    const emailHash = this.hashEmail(email);
    const user = this.users.get(emailHash);
    
    if (!user) {
      return { success: false, error: 'Invalid credentials' };
    }

    const passwordHash = this.hashPassword(password);
    if (passwordHash !== user.passwordHash) {
      return { success: false, error: 'Invalid credentials' };
    }

    const token = this.generateToken();
    this.sessions.set(token, user.id);
    user.lastLogin = new Date();
    
    const { passwordHash: _, emailHash: __, ...userWithoutSensitive } = user;
    
    return { success: true, user: userWithoutSensitive, token };
  }

  async loginWithGoogle(credential: string): Promise<{ success: boolean; user?: User; token?: string; error?: string }> {
    try {
      const payload = JSON.parse(atob(credential.split('.')[1]));
      const email = payload.email;
      const name = payload.name || email.split('@')[0];
      
      const emailHash = this.hashEmail(email);
      let user = this.users.get(emailHash);
      
      if (!user) {
        const userId = `user-google-${Date.now()}`;
        user = {
          id: userId,
          email: email,
          emailHash: emailHash,
          username: name,
          role: 'user',
          plan: 'free',
          passwordHash: this.generateToken(),
          twoFactorEnabled: false,
          createdAt: new Date(),
        };
        this.users.set(emailHash, user);
      }
      
      const token = this.generateToken();
      this.sessions.set(token, user.id);
      user.lastLogin = new Date();
      
      const { passwordHash: _, emailHash: __, ...userWithoutSensitive } = user;
      
      return { success: true, user: userWithoutSensitive, token };
    } catch (error) {
      return { success: false, error: 'Google authentication failed' };
    }
  }

  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string }> {
    const emailHash = this.hashEmail(email);
    const user = this.users.get(emailHash);
    
    if (!user) {
      return { 
        success: true, 
        message: 'If this email exists, you will receive reset instructions.' 
      };
    }

    const resetToken = this.generateToken();
    const expiry = new Date(Date.now() + 3600000);
    this.resetTokens.set(resetToken, { email, expiry });
    
    return { 
      success: true, 
      message: 'Password reset instructions sent to your email.' 
    };
  }

  async resetPassword(token: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const resetData = this.resetTokens.get(token);
    
    if (!resetData || new Date() > resetData.expiry) {
      this.resetTokens.delete(token);
      return { success: false, message: 'Invalid or expired reset token.' };
    }

    const emailHash = this.hashEmail(resetData.email);
    const user = this.users.get(emailHash);
    
    if (!user) {
      return { success: false, message: 'User not found.' };
    }

    user.passwordHash = this.hashPassword(newPassword);
    this.resetTokens.delete(token);
    
    return { success: true, message: 'Password reset successful. Please login.' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    let user: StoredUser | undefined;
    
    for (const u of this.users.values()) {
      if (u.id === userId) {
        user = u;
        break;
      }
    }
    
    if (!user) {
      return { success: false, message: 'User not found.' };
    }

    const currentPasswordHash = this.hashPassword(currentPassword);
    if (currentPasswordHash !== user.passwordHash) {
      return { success: false, message: 'Current password is incorrect.' };
    }

    user.passwordHash = this.hashPassword(newPassword);
    return { success: true, message: 'Password changed successfully.' };
  }

  async logout(token: string): Promise<void> {
    this.sessions.delete(token);
  }

  getUserByToken(token: string): User | null {
    const userId = this.sessions.get(token);
    if (!userId) return null;

    for (const user of this.users.values()) {
      if (user.id === userId) {
        const { passwordHash: _, emailHash: __, ...userWithoutSensitive } = user;
        return userWithoutSensitive;
      }
    }
    return null;
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values()).map(user => {
      const { passwordHash: _, emailHash: __, ...userWithoutSensitive } = user;
      return userWithoutSensitive;
    });
  }

  updateUserPlan(userId: string, plan: 'free' | 'pro' | 'unlimited'): boolean {
    for (const user of this.users.values()) {
      if (user.id === userId) {
        user.plan = plan;
        return true;
      }
    }
    return false;
  }

  enableTwoFactor(userId: string, method: 'email' | 'phone', contact: string): boolean {
    for (const user of this.users.values()) {
      if (user.id === userId) {
        user.twoFactorEnabled = true;
        user.twoFactorMethod = method;
        user.twoFactorContact = contact;
        return true;
      }
    }
    return false;
  }

  deleteUser(userId: string): boolean {
    let emailHashToDelete: string | null = null;
    for (const [hash, user] of this.users.entries()) {
      if (user.id === userId) {
        emailHashToDelete = hash;
        break;
      }
    }

    if (emailHashToDelete) {
      this.users.delete(emailHashToDelete);
      // Remove active sessions for this user
      for (const [token, uid] of this.sessions.entries()) {
        if (uid === userId) {
          this.sessions.delete(token);
        }
      }
      return true;
    }
    return false;
  }

  updateUser(userId: string, data: { email?: string; username?: string; role?: 'user' | 'admin'; plan?: 'free' | 'pro' | 'unlimited' }): { success: boolean; error?: string } {
    let targetUser: StoredUser | undefined;
    let oldEmailHash: string | undefined;

    for (const [hash, user] of this.users.entries()) {
      if (user.id === userId) {
        targetUser = user;
        oldEmailHash = hash;
        break;
      }
    }

    if (!targetUser || !oldEmailHash) return { success: false, error: 'User not found' };

    if (data.email && data.email !== targetUser.email) {
      const newEmailHash = this.hashEmail(data.email);
      if (this.users.has(newEmailHash)) {
        return { success: false, error: 'Email already in use' };
      }
      this.users.delete(oldEmailHash);
      targetUser.email = data.email;
      targetUser.emailHash = newEmailHash;
      this.users.set(newEmailHash, targetUser);
    }

    if (data.username) targetUser.username = data.username;
    if (data.role) targetUser.role = data.role;
    if (data.plan) targetUser.plan = data.plan;

    return { success: true };
  }

  async createUserAsAdmin(adminUserId: string, email: string, username: string, password: string, role: 'user' | 'admin'): Promise<{ success: boolean; user?: User; error?: string }> {
    const admin = this.getUserById(adminUserId);
    if (!admin || admin.role !== 'admin') {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }
    return this.signup(email, username, password, role);
  }

  async changeUserPasswordAsAdmin(adminUserId: string, targetUserId: string, newPassword: string): Promise<{ success: boolean; message: string }> {
    const admin = this.getUserById(adminUserId);
    if (!admin || admin.role !== 'admin') {
      return { success: false, message: 'Unauthorized: Admin access required' };
    }

    for (const user of this.users.values()) {
      if (user.id === targetUserId) {
        user.passwordHash = this.hashPassword(newPassword);
        return { success: true, message: 'Password changed successfully.' };
      }
    }
    return { success: false, message: 'User not found.' };
  }

  private getUserById(userId: string): User | null {
    for (const user of this.users.values()) {
      if (user.id === userId) {
        const { passwordHash: _, emailHash: __, ...userWithoutSensitive } = user;
        return userWithoutSensitive;
      }
    }
    return null;
  }

  private generateToken(): string {
    return CryptoJS.lib.WordArray.random(32).toString();
  }
}

export const authService = new AuthService();
