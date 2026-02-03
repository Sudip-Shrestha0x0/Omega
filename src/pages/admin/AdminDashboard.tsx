import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Users, UserPlus, Shield, Edit, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authService, User } from '../../services/authService';
import { useToast } from '../../hooks/use-toast';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    username: '',
    password: '',
    role: 'user' as 'user' | 'admin',
  });
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [allUsers, setAllUsers] = useState<User[]>(() => authService.getAllUsers());

  const refreshUsers = () => {
    setAllUsers(authService.getAllUsers());
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    const result = await authService.createUserAsAdmin(
      user.id,
      newUser.email,
      newUser.username,
      newUser.password,
      newUser.role
    );

    if (result.success && result.user) {
      // Store credentials for persistence
      const credsJSON = localStorage.getItem('omega_credentials');
      const creds = credsJSON ? JSON.parse(credsJSON) : [];
      if (!creds.find((c: { email: string }) => c.email.toLowerCase() === newUser.email.toLowerCase())) {
        creds.push({ email: newUser.email, password: newUser.password });
        localStorage.setItem('omega_credentials', JSON.stringify(creds));
      }

      // Persist user to storage
      const usersJSON = localStorage.getItem('omega_users');
      const users: User[] = usersJSON ? JSON.parse(usersJSON) : [];
      if (!users.find(u => u.email.toLowerCase() === newUser.email.toLowerCase())) {
        users.push(result.user);
        localStorage.setItem('omega_users', JSON.stringify(users));
      }

      toast({
        title: 'User Created',
        description: `Successfully created ${newUser.role} account for ${newUser.email}`,
      });
      setShowCreateModal(false);
      setNewUser({ email: '', username: '', password: '', role: 'user' });
      refreshUsers();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to create user',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      const success = authService.deleteUser(userId);
      if (success) {
        toast({
          title: 'User Deleted',
          description: 'The user has been successfully removed.',
        });
        refreshUsers();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete user.',
          variant: 'destructive',
        });
      }
    }
  };

  const handleEditClick = (user: User) => {
    setEditingUser({ ...user });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const result = authService.updateUser(editingUser.id, {
      email: editingUser.email,
      username: editingUser.username,
      role: editingUser.role,
      plan: editingUser.plan,
    });

    if (result.success) {
      // Persist updated user to storage
      const usersJSON = localStorage.getItem('omega_users');
      const users: User[] = usersJSON ? JSON.parse(usersJSON) : [];
      const userIndex = users.findIndex(u => String(u.id) === String(editingUser.id));
      if (userIndex !== -1) {
        users[userIndex] = { ...users[userIndex], ...editingUser };
      } else {
        users.push(editingUser);
      }
      localStorage.setItem('omega_users', JSON.stringify(users));

      toast({
        title: 'User Updated',
        description: `Successfully updated details for ${editingUser.username}`,
      });
      setShowEditModal(false);
      setEditingUser(null);
      refreshUsers();
    } else {
      toast({
        title: 'Error',
        description: result.error || 'Failed to update user',
        variant: 'destructive',
      });
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col h-full w-full overflow-x-hidden">
        <header className="flex items-center sticky top-0 z-10 gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4">
          <SidebarTrigger />
          <h1 className="text-2xl font-bold">Access Denied</h1>
        </header>
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Shield className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Admin Access Required</h2>
            <p className="text-muted-foreground">
              You do not have permission to access this page.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-black">
      {/* Sticky header */}
      <header className="sticky top-0 flex-shrink-0 flex items-center justify-between z-20 gap-2 sm:gap-4 border-b border-zinc-800 bg-black px-3 sm:px-6 py-4">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <SidebarTrigger />
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-xs sm:text-sm text-gray-400 truncate">Manage users and system settings</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-orange-500 hover:bg-orange-600 text-black hover:text-black px-3 sm:px-4 py-2 rounded-lg font-semibold transition-all flex items-center gap-1 sm:gap-2 flex-shrink-0 text-sm sm:text-base"
        >
          <UserPlus className="w-4 h-4" />
          <span className="hidden sm:inline">Create User</span>
          <span className="sm:hidden">New</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 bg-black scrollbar-hide">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border p-4 sm:p-6 rounded-lg"
            >
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-primary mb-2 sm:mb-3" />
              <h3 className="text-xl sm:text-2xl font-bold mb-1">{allUsers.length}</h3>
              <p className="text-sm sm:text-base text-muted-foreground">Total Users</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-card border p-4 sm:p-6 rounded-lg"
            >
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 mb-2 sm:mb-3" />
              <h3 className="text-xl sm:text-2xl font-bold mb-1">
                {allUsers.filter(u => u.role === 'admin').length}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">Administrators</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-card border p-4 sm:p-6 rounded-lg"
            >
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 mb-2 sm:mb-3" />
              <h3 className="text-xl sm:text-2xl font-bold mb-1">
                {allUsers.filter(u => u.role === 'user').length}
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground">Regular Users</p>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border rounded-lg overflow-hidden"
          >
            <div className="p-4 sm:p-6 border-b">
              <h2 className="text-lg sm:text-xl font-bold">All Users</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Username</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Role</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Plan</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {allUsers.map((u, index) => (
                    <tr key={index} className="hover:bg-accent">
                      <td className="px-6 py-4 font-medium break-words">{u.username}</td>
                      <td className="px-6 py-4 text-muted-foreground break-all">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          u.role === 'admin' 
                            ? 'bg-blue-500/20 text-blue-500' 
                            : 'bg-green-500/20 text-green-500'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-primary/20 text-primary uppercase">
                          {u.plan}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleEditClick(u)}
                            className="p-2 hover:bg-accent rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4 text-muted-foreground" />
                          </button>
                          <button 
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-2 hover:bg-accent rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border rounded-lg p-8 max-w-md w-full"
          >
            <h2 className="text-2xl font-bold mb-6">Create New User</h2>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full bg-secondary border-0 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Username</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className="w-full bg-secondary border-0 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full bg-secondary border-0 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'user' | 'admin' })}
                  className="w-full bg-secondary border-0 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-secondary hover:bg-accent py-3 rounded-lg font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg font-semibold transition-all"
                >
                  Create
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card border rounded-lg p-8 max-w-md w-full"
          >
            <h2 className="text-2xl font-bold mb-6">Edit User</h2>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full bg-secondary border-0 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Username</label>
                <input
                  type="text"
                  value={editingUser.username}
                  onChange={(e) => setEditingUser({ ...editingUser, username: e.target.value })}
                  className="w-full bg-secondary border-0 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Role</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as 'user' | 'admin' })}
                  className="w-full bg-secondary border-0 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Plan</label>
                <select
                  value={editingUser.plan}
                  onChange={(e) => setEditingUser({ ...editingUser, plan: e.target.value as 'free' | 'pro' | 'unlimited' })}
                  className="w-full bg-secondary border-0 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="unlimited">Unlimited</option>
                </select>
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-secondary hover:bg-accent py-3 rounded-lg font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground py-3 rounded-lg font-semibold transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
