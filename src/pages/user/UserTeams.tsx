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
    <div className="flex flex-col h-full w-full bg-black">
      <header className="flex items-center sticky top-0 z-10 gap-4 border-b border-zinc-800 bg-black px-6 py-4">
        <SidebarTrigger />
        <div>
          <h1 className="text-2xl font-bold text-white">Team Collaboration</h1>
          <p className="text-sm text-gray-400">Manage your team and collaborate together</p>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6 bg-black">
        <div className="max-w-6xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid md:grid-cols-3 gap-6"
          >
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg">
              <Users className="w-8 h-8 text-orange-500 mb-3" />
              <h3 className="text-2xl font-bold text-white mb-1">{teamMembers.length}</h3>
              <p className="text-gray-400">Team Members</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg">
              <Shield className="w-8 h-8 text-blue-500 mb-3" />
              <h3 className="text-2xl font-bold text-white mb-1">1</h3>
              <p className="text-gray-400">Active Projects</p>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg">
              <Crown className="w-8 h-8 text-orange-500 mb-3" />
              <h3 className="text-2xl font-bold text-white mb-1 capitalize">{user?.plan || 'Free'}</h3>
              <p className="text-gray-400">Current Plan</p>
            </div>
          </motion.div>

          {!canInviteMembers && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-orange-500/20 to-orange-600/20 p-8 rounded-lg border border-orange-500/50"
            >
              <div className="flex items-start gap-4">
                <Lock className="w-12 h-12 text-orange-500 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2">Unlock Team Collaboration</h3>
                  <p className="text-gray-300 mb-6">
                    Team features are available on Pro and Unlimited plans. Upgrade now to invite team members and collaborate together.
                  </p>
                  <button
                    onClick={handleUpgrade}
                    className="bg-orange-500 hover:bg-orange-600 text-black hover:text-black px-8 py-3 rounded-lg font-bold transition-all inline-flex items-center gap-2 hover:scale-105"
                  >
                    <Crown className="w-5 h-5" />
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
            className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg"
          >
            <h2 className="text-xl font-bold text-white mb-4">Invite Team Members</h2>
            <div className="flex gap-4">
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
            className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg"
          >
            <h2 className="text-xl font-bold text-white mb-4">Team Members</h2>
            <div className="space-y-3">
              {teamMembers.map((member, index) => (
                <div
                  key={index}
                  className="bg-zinc-800 border border-zinc-700 p-4 rounded-lg flex items-center justify-between hover:bg-zinc-750 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                      <span className="text-black font-bold text-lg">
                        {member.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{member.name}</h3>
                      <p className="text-sm text-gray-400 flex items-center gap-2">
                        <Mail className="w-3 h-3" />
                        {member.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="bg-orange-500/20 text-orange-500 px-3 py-1 rounded-full text-sm font-semibold">
                      {member.role}
                    </span>
                    <span className="bg-green-500/20 text-green-500 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {member.status}
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
