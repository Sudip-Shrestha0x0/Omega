import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { User, Mail, Lock, Shield, Bell, Smartphone, Github, CheckCircle2, Edit2, Camera, LogOut, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/use-toast';
import { authService } from '../../services/authService';
import { githubService, GitHubUser } from '../../services/githubService';
import TwoFactorModal from '../../components/modals/TwoFactorModal';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const UserSettings = () => {
  const { user, updateUser, logout } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUsername, setEditedUsername] = useState(user?.username || '');
  const [editedAvatar, setEditedAvatar] = useState(user?.avatar);
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(user?.twoFactorEnabled || false);
  const [twoFactorMethod, setTwoFactorMethod] = useState<'email' | 'phone'>(user?.twoFactorMethod || 'email');
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubUser, setGithubUser] = useState<GitHubUser | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: '',
    new: '',
    confirm: '',
  });

  useEffect(() => {
    setGithubConnected(githubService.isConnected());
    setGithubUser(githubService.getConnectedUser());
  }, []);

  const handleUpdateInfo = () => {
    if (user) {
      const hasChanges = (editedUsername.trim() && editedUsername !== user.username) || (editedAvatar !== user.avatar);
      
      if (hasChanges) {
        const updatedUser = { ...user, username: editedUsername.trim(), avatar: editedAvatar };
        updateUser(updatedUser);
        toast({
          title: 'Profile Updated',
          description: 'Your profile information has been updated successfully.',
          duration: 2000,
        });
        setIsEditing(false);
      }
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;

    if (passwordData.new !== passwordData.confirm) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure your new passwords match.',
        variant: 'destructive',
        duration: 2000,
      });
      return;
    }

    if (passwordData.new.length < 6) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
        duration: 2000,
      });
      return;
    }

    const result = await authService.changePassword(user.id, passwordData.current, passwordData.new);

    if (result.success) {
      toast({
        title: 'Password Changed',
        description: result.message,
        duration: 2000,
      });
      setShowPasswordModal(false);
      setPasswordData({ current: '', new: '', confirm: '' });
    } else {
      toast({
        title: 'Failed to Change Password',
        description: result.message,
        variant: 'destructive',
        duration: 2000,
      });
    }
  };

  const handleEnable2FA = (method: 'email' | 'phone') => {
    setTwoFactorMethod(method);
    setShow2FAModal(true);
  };

  const handle2FAComplete = (contact: string) => {
    if (user) {
      authService.enableTwoFactor(user.id, twoFactorMethod, contact);
      setTwoFactorEnabled(true);
      const updatedUser = { ...user, twoFactorEnabled: true, twoFactorMethod, twoFactorContact: contact };
      updateUser(updatedUser);
    }
  };

  const handleConnectGitHub = async () => {
    toast({
      title: 'Opening GitHub',
      description: 'Redirecting to GitHub authentication...',
      duration: 2000,
    });
    
    const result = await githubService.connectGitHub();
    if (result.success) {
      setGithubConnected(true);
      setGithubUser(githubService.getConnectedUser());
      toast({
        title: 'GitHub Connected',
        description: result.message,
        duration: 2000,
      });
    } else {
      toast({
        title: 'Connection Failed',
        description: result.message,
        variant: 'destructive',
        duration: 2000,
      });
    }
  };

  const handleDisconnectGitHub = async () => {
    await githubService.disconnectGitHub();
    setGithubConnected(false);
    setGithubUser(null);
    toast({
      title: 'GitHub Disconnected',
      description: 'Your GitHub account has been disconnected.',
      duration: 2000,
    });
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setEditedAvatar(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteAccount = () => {
    toast({
      title: 'Account Deleted',
      description: 'Your account has been permanently deleted.',
      duration: 2000,
    });
    logout();
  };

  return (
    <div className="flex flex-col h-full w-full bg-black">
      {/* Sticky header */}
      <header className="sticky top-0 flex-shrink-0 flex items-center justify-between z-20 gap-2 sm:gap-4 border-b border-zinc-800 bg-black px-3 sm:px-6 py-4">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <SidebarTrigger />
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-white">Settings</h1>
            <p className="text-xs sm:text-sm text-gray-400 truncate">Manage your account and preferences</p>
          </div>
        </div>
        <button onClick={logout} className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg transition-colors border border-zinc-800 flex-shrink-0 text-sm sm:text-base">
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 bg-black scrollbar-hide">
        <div className="max-w-4xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <User className="w-5 h-5 text-orange-500" />
                Profile Information
              </h2>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 text-orange-500 hover:text-orange-400 font-semibold transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
              )}
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border-2 border-zinc-700">
                    {(isEditing ? editedAvatar : user?.avatar) ? (
                      <img src={isEditing ? editedAvatar : user?.avatar} alt={user?.username} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-zinc-500" />
                    )}
                  </div>
                  {isEditing && (
                    <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 cursor-pointer rounded-full transition-opacity">
                      <Camera className="w-6 h-6 text-white" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    </label>
                  )}
                </div>
                <p className="text-sm text-gray-400">Click to upload a new profile picture.<br/>Recommended size: 400x400px</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Username</label>
                <input
                  type="text"
                  value={isEditing ? editedUsername : user?.username}
                  onChange={(e) => setEditedUsername(e.target.value)}
                  readOnly={!isEditing}
                  className={`w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 ${
                    isEditing ? 'focus:outline-none focus:ring-2 focus:ring-orange-500' : 'opacity-75'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                <input
                  type="email"
                  value={user?.email}
                  readOnly
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 opacity-75"
                />
              </div>
              {user?.role === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                  <input
                    type="text"
                    value="Administrator"
                    readOnly
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 opacity-75 capitalize"
                  />
                </div>
              )}
              {isEditing && (
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditedUsername(user?.username || '');
                      setEditedAvatar(user?.avatar);
                    }}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white py-3 rounded-lg font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateInfo}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-black hover:text-black py-3 rounded-lg font-semibold transition-all"
                  >
                    Update Information
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg"
          >
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Github className="w-5 h-5 text-orange-500" />
              GitHub Integration
            </h2>
            
            {githubConnected && githubUser ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between bg-zinc-800 border border-zinc-700 p-4 rounded-lg">
                  <div className="flex items-center gap-4">
                    <img
                      src={githubUser.avatar}
                      alt={githubUser.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <p className="font-semibold text-white">{githubUser.name}</p>
                      <p className="text-sm text-gray-400">@{githubUser.login}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-green-500">
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-sm font-semibold">Connected</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center bg-zinc-800 border border-zinc-700 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-white">{githubUser.repos}</p>
                    <p className="text-sm text-gray-400">Repositories</p>
                  </div>
                  <div className="text-center bg-zinc-800 border border-zinc-700 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-white">{githubUser.followers}</p>
                    <p className="text-sm text-gray-400">Followers</p>
                  </div>
                  <div className="text-center bg-zinc-800 border border-zinc-700 p-4 rounded-lg">
                    <p className="text-2xl font-bold text-white">{githubUser.following}</p>
                    <p className="text-sm text-gray-400">Following</p>
                  </div>
                </div>
                
                <button
                  onClick={handleDisconnectGitHub}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-semibold transition-all"
                >
                  Disconnect GitHub
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Github className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Connect GitHub Account</h3>
                <p className="text-gray-400 mb-6">
                  Authenticate with your GitHub account for repository management
                </p>
                <button
                  onClick={handleConnectGitHub}
                  className="bg-orange-500 hover:bg-orange-600 text-black hover:text-black px-8 py-3 rounded-lg font-semibold transition-all inline-flex items-center gap-2"
                >
                  <Github className="w-5 h-5" />
                  Connect GitHub
                </button>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg"
          >
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Shield className="w-5 h-5 text-orange-500" />
              Security
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Change Password</h3>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white py-2 px-6 rounded-lg transition-all flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Update Password
                </button>
              </div>

              <div className="pt-6 border-t border-zinc-800">
                <h3 className="text-lg font-semibold text-white mb-3">Two-Factor Authentication</h3>
                <p className="text-gray-400 mb-4">
                  Add an extra layer of security to your account
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-zinc-800 border border-zinc-700 p-4 rounded-lg">
                    <div>
                      <p className="font-medium text-white">2FA Status</p>
                      <p className="text-sm text-gray-400">
                        {twoFactorEnabled ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                    <div className={`px-4 py-2 rounded-full font-semibold ${
                      twoFactorEnabled 
                        ? 'bg-green-500/20 text-green-500' 
                        : 'bg-red-500/20 text-red-500'
                    }`}>
                      {twoFactorEnabled ? 'Active' : 'Inactive'}
                    </div>
                  </div>

                  {!twoFactorEnabled && (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-300">
                        Choose 2FA Method
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => handleEnable2FA('email')}
                          className="p-4 rounded-lg border border-zinc-700 hover:border-orange-500 transition-all"
                        >
                          <Mail className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                          <p className="font-medium text-white">Email</p>
                        </button>
                        <button
                          onClick={() => handleEnable2FA('phone')}
                          className="p-4 rounded-lg border border-zinc-700 hover:border-orange-500 transition-all"
                        >
                          <Smartphone className="w-6 h-6 text-orange-500 mx-auto mb-2" />
                          <p className="font-medium text-white">Phone</p>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg"
          >
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-500" />
              Notifications
            </h2>
            <div className="space-y-4">
              {[
                { label: 'Email notifications', description: 'Receive updates via email' },
                { label: 'Product updates', description: 'News about new features' },
                { label: 'Security alerts', description: 'Important security notifications' },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between bg-zinc-800 border border-zinc-700 p-4 rounded-lg hover:bg-zinc-750 transition-colors">
                  <div>
                    <p className="font-medium text-white">{item.label}</p>
                    <p className="text-sm text-gray-400">{item.description}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
                  </label>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-red-950/10 border border-red-900/20 p-6 rounded-lg"
          >
            <h2 className="text-xl font-bold text-red-500 mb-6 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Danger Zone
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Delete Account</h3>
                <p className="text-sm text-gray-400">Permanently delete your account and all of your content.</p>
              </div>
              <button onClick={() => setShowDeleteModal(true)} className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors">
                Delete Account
              </button>
            </div>
          </motion.div>
        </div>
      </main>

      <TwoFactorModal
        isOpen={show2FAModal}
        onClose={() => setShow2FAModal(false)}
        method={twoFactorMethod}
        onComplete={handle2FAComplete}
        userEmail={user?.email}
      />

      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 max-w-md w-full"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Change Password</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                <input
                  type="password"
                  value={passwordData.current}
                  onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                <input
                  type="password"
                  value={passwordData.new}
                  onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordData({ current: '', new: '', confirm: '' });
                  }}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-white py-3 rounded-lg font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleChangePassword}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-black hover:text-black py-3 rounded-lg font-semibold transition-all"
                >
                  Update Password
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              This action cannot be undone. This will permanently delete your account and remove your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 hover:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700 text-white border-0">Delete Account</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserSettings;
