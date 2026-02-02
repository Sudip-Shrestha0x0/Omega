import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Users, UserPlus, Mail, Shield, Crown, CheckCircle2, Lock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../hooks/use-toast';
import { emailService } from '../../services/emailService';

const UserTeams = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [inviteEmail, setInviteEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  const teamMembers = [
    { name: user?.username || 'You', email: user?.email, role: 'Owner', status: 'active' },
  ];

  const canInviteMembers = user?.plan === 'pro' || user?.plan === 'unlimited' || user?.role === 'admin';

  const getPlanMessage = () => {
    if (user?.role === 'admin') {
      return 'You can invite unlimited team members';
    }
    if (user?.plan === 'free') {
      return 'Upgrade to Pro or Unlimited to add team members';
    }
    if (user?.plan === 'pro') {
      return 'You can invite up to 5 team members';
    }
    if (user?.plan === 'unlimited') {
      return 'You can invite unlimited team members';
    }
    return '';
  };

  const handleInvite = async () => {
    if (!canInviteMembers) {
      toast({
        title: 'Upgrade Required',
        description: 'Team collaboration requires Pro or Unlimited plan.',
        variant: 'destructive',
      });
      return;
    }

    if (!inviteEmail.trim()) return;

    setIsSending(true);
    const success = await emailService.sendTeamInvitation(
      inviteEmail,
      user?.username || 'Team member',
      'Your Team'
    );

    if (success) {
      toast({
        title: 'Invitation sent!',
        description: `Invitation email sent to ${inviteEmail}`,
        duration: 2000,
      });
      setInviteEmail('');
    } else {
      toast({
        title: 'Failed to send invitation',
        description: 'Please try again later.',
        variant: 'destructive',
        duration: 2000,
      });
    }
    
    setIsSending(false);
  };

  const handleUpgrade = () => {
    navigate('/dashboard/plans');
  };

  return (
    <div className="flex flex-col h-screen w-full bg-black overflow-hidden">
      <header className="flex-shrink-0 flex items-center z-10 gap-2 sm:gap-4 border-b border-zinc-800 bg-black px-3 sm:px-6 py-4">
        <SidebarTrigger />
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Team Collaboration</h1>
          <p className="text-xs sm:text-sm text-gray-400 truncate">Manage your team and collaborate together</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-6 bg-black scrollbar-hide">
        <div className="max-w-6xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6"
          >
            <div className="bg-zinc-900 border border-zinc-800 p-4 sm:p-6 rounded-lg">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 mb-2 sm:mb-3" />
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">{teamMembers.length}</h3>
              <p className="text-sm sm:text-base text-gray-400">Team Members</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-4 sm:p-6 rounded-lg">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 mb-2 sm:mb-3" />
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">1</h3>
              <p className="text-sm sm:text-base text-gray-400">Active Projects</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-4 sm:p-6 rounded-lg">
              <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 mb-2 sm:mb-3" />
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 capitalize">{user?.plan || 'Free'}</h3>
              <p className="text-sm sm:text-base text-gray-400">Current Plan</p>
            </div>
          </motion.div>

          {!canInviteMembers && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 p-4 sm:p-8 rounded-lg border border-orange-500/50"
            >
              <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                <Lock className="w-10 h-10 sm:w-12 sm:h-12 text-orange-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Unlock Team Collaboration</h3>
                  <p className="text-sm sm:text-base text-gray-300 mb-4 sm:mb-6">
                    Team features are available on Pro and Unlimited plans. Upgrade now to invite team members and collaborate together.
                  </p>
                  <button
                    onClick={handleUpgrade}
                    className="bg-orange-500 hover:bg-orange-600 text-black hover:text-black px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-bold transition-all inline-flex items-center gap-2 hover:scale-105 text-sm sm:text-base"
                  >
                    <Crown className="w-4 h-4 sm:w-5 sm:h-5" />
                    Upgrade Now
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-900 border border-zinc-800 p-4 sm:p-6 rounded-lg"
          >
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Invite Team Members</h2>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleInvite()}
                placeholder="teammate@example.com"
                className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                disabled={!canInviteMembers || isSending}
              />
              <button
                onClick={handleInvite}
                disabled={!canInviteMembers || isSending}
                className="bg-orange-500 hover:bg-orange-600 text-black hover:text-black px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
              >
                {isSending ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent" />
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Invite
                  </>
                )}
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-3">
              {getPlanMessage()}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-zinc-900 border border-zinc-800 p-4 sm:p-6 rounded-lg"
          >
            <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Team Members</h2>
            <div className="space-y-3">
              {teamMembers.map((member, index) => (
                <div
                  key={index}
                  className="bg-zinc-800 border border-zinc-700 p-3 sm:p-4 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-zinc-750 transition-colors"
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-black font-bold text-base sm:text-lg">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm sm:text-base text-white break-words">{member.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-400 flex items-center gap-2 break-all">
                        <Mail className="w-3 h-3 flex-shrink-0" />
                        <span className="break-all truncate">{member.email}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                    <span className="bg-orange-500/20 text-orange-500 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                      {member.role}
                    </span>
                    <span className="bg-green-500/20 text-green-500 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span className="hidden sm:inline">{member.status}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default UserTeams;
