import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Search, Code, Zap, TrendingUp, Clock } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useAuth } from '../../contexts/AuthContext';
import { paymentService } from '../../services/paymentService';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const plan = user ? paymentService.plans[user.plan] : null;

  useEffect(() => {
    // Redirect to chat by default
    navigate('/dashboard/chat', { replace: true });
  }, [navigate]);

  const stats = [
    { label: 'Messages Today', value: '23', icon: MessageSquare, color: 'text-blue-400' },
    { label: 'Searches Used', value: '8', icon: Search, color: 'text-green-400' },
    { label: 'Code Generated', value: '5', icon: Code, color: 'text-purple-400' },
    { label: 'Response Time', value: '0.8s', icon: Zap, color: 'text-yellow-400' },
  ];

  const quickActions = [
    { title: 'Start Chat', icon: MessageSquare, href: '/dashboard/chat', color: 'bg-blue-500' },
    { title: 'Search Web', icon: Search, href: '/dashboard/search', color: 'bg-green-500' },
    { title: 'Generate Code', icon: Code, href: '/dashboard/artifacts', color: 'bg-purple-500' },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-omega-darkest">
      <header className="flex items-center sticky top-0 z-10 gap-4 border-b border-omega-copper/30 bg-omega-darker px-6 py-4">
        <SidebarTrigger className="text-white" />
        <div>
          <h1 className="text-2xl font-bold text-white">Welcome back, {user?.username}!</h1>
          <p className="text-sm text-gray-400">Here's what's happening with your AI assistant</p>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-omega-dark p-6 rounded-xl border border-omega-copper/30 hover:border-omega-orange/50 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                  <TrendingUp className="w-4 h-4 text-green-400" />
                </div>
                <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <motion.button
                  key={action.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  onClick={() => navigate(action.href)}
                  className={`${action.color} p-6 rounded-xl text-white hover:opacity-90 transition-all hover:scale-105 group`}
                >
                  <action.icon className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                  <h3 className="text-lg font-bold">{action.title}</h3>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Current Plan */}
          {plan && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-omega-dark p-6 rounded-xl border border-omega-copper/30"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-white">Your Plan: {plan.name}</h2>
                  <p className="text-gray-400">
                    {plan.price === 0 ? 'Free forever' : `$${plan.price}/month`}
                  </p>
                </div>
                <button
                  onClick={() => navigate('/dashboard/plans')}
                  className="bg-omega-orange hover:bg-omega-burnt text-white px-6 py-2 rounded-lg font-semibold transition-all"
                >
                  Upgrade
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-omega-orange">
                    {plan.limits.messagesPerDay === Infinity ? '∞' : plan.limits.messagesPerDay}
                  </p>
                  <p className="text-sm text-gray-400">Messages/day</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-omega-orange">
                    {plan.limits.searchesPerDay === Infinity ? '∞' : plan.limits.searchesPerDay}
                  </p>
                  <p className="text-sm text-gray-400">Searches/day</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-omega-orange">
                    {plan.limits.codeGenerations === Infinity ? '∞' : plan.limits.codeGenerations}
                  </p>
                  <p className="text-sm text-gray-400">Code Gens</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-omega-orange">
                    {plan.limits.teamMembers === Infinity ? '∞' : plan.limits.teamMembers}
                  </p>
                  <p className="text-sm text-gray-400">Team Size</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Recent Activity */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">Recent Activity</h2>
            <div className="bg-omega-dark rounded-xl border border-omega-copper/30 divide-y divide-omega-copper/30">
              {[
                { action: 'Started chat session', time: '2 minutes ago', icon: MessageSquare },
                { action: 'Generated React component', time: '15 minutes ago', icon: Code },
                { action: 'Searched for "AI trends 2024"', time: '1 hour ago', icon: Search },
              ].map((activity, index) => (
                <div key={index} className="p-4 flex items-center gap-4 hover:bg-omega-darker/50 transition-colors">
                  <activity.icon className="w-5 h-5 text-omega-orange" />
                  <div className="flex-1">
                    <p className="text-white">{activity.action}</p>
                    <p className="text-sm text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
