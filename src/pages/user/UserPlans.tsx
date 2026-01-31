import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Check, Zap, Crown, Gift } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { paymentService } from '../../services/paymentService';
import { useToast } from '../../hooks/use-toast';

const UserPlans = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const plans = Object.values(paymentService.plans);

  const handleUpgrade = async (planId: string) => {
    if (!user) return;

    const plan = paymentService.plans[planId];
    
    if (user.plan === planId) {
      toast({
        title: 'Current Plan',
        description: `You are already on the ${plan.name} plan.`,
      });
      return;
    }

    if (plan.price === 0) {
      toast({
        title: 'Free Plan',
        description: 'You are switching to the Free plan.',
      });
      return;
    }

    // Navigate to payment page
    navigate(`/dashboard/payment?plan=${planId}`);
  };

  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex items-center sticky top-0 z-10 gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6 py-4">
        <SidebarTrigger />
        <div>
          <h1 className="text-2xl font-bold">Plans & Pricing</h1>
          <p className="text-sm text-muted-foreground">Choose the perfect plan for your needs</p>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-primary/20 to-blue-500/20 p-8 rounded-lg border border-primary/50 mb-8"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-2">
                  Current Plan: {user?.plan && paymentService.plans[user.plan].name}
                </h2>
                <p className="text-muted-foreground">
                  {user?.plan === 'free' && 'Upgrade to unlock more features and capabilities'}
                  {user?.plan === 'pro' && 'You have access to advanced features'}
                  {user?.plan === 'unlimited' && 'You have unlimited access to all features'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold text-primary">
                  {user?.plan && paymentService.plans[user.plan].price === 0 
                    ? 'Free' 
                    : `$${user?.plan && paymentService.plans[user.plan].price}`}
                </div>
                <div className="text-muted-foreground">
                  {user?.plan && paymentService.plans[user.plan].price > 0 ? '/month' : 'forever'}
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-card border rounded-lg transition-all flex flex-col ${
                  plan.id === 'pro'
                    ? 'border-primary shadow-lg scale-105'
                    : 'hover:border-primary/50'
                } ${user?.plan === plan.id ? 'ring-2 ring-primary' : ''}`}
              >
                {plan.id === 'pro' && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary px-4 py-1 rounded-full text-sm font-bold text-primary-foreground">
                    Most Popular
                  </div>
                )}
                
                {user?.plan === plan.id && (
                  <div className="absolute -top-4 right-4 bg-green-500 px-4 py-1 rounded-full text-sm font-bold text-white">
                    Current Plan
                  </div>
                )}

                <div className="p-8 flex-1 flex flex-col">
                  <div className="text-center mb-6">
                    {plan.id === 'free' && <Gift className="w-12 h-12 text-primary mx-auto mb-4" />}
                    {plan.id === 'pro' && <Zap className="w-12 h-12 text-primary mx-auto mb-4" />}
                    {plan.id === 'unlimited' && <Crown className="w-12 h-12 text-primary mx-auto mb-4" />}
                    
                    <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                    <div className="mb-4">
                      <span className="text-5xl font-bold text-primary">
                        {plan.price === 0 ? 'Free' : `$${plan.price}`}
                      </span>
                      {plan.price > 0 && <span className="text-muted-foreground">/month</span>}
                    </div>
                  </div>

                  <ul className="space-y-3 mb-6 flex-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleUpgrade(plan.id)}
                    disabled={user?.plan === plan.id}
                    className={`w-full py-3 rounded-lg font-bold text-center transition-all mt-auto ${
                      user?.plan === plan.id
                        ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                        : plan.id === 'pro'
                        ? 'bg-primary hover:bg-primary/90 text-primary-foreground'
                        : 'bg-secondary hover:bg-accent border border-primary text-primary'
                    }`}
                  >
                    {user?.plan === plan.id ? 'Current Plan' : plan.price === 0 ? 'Downgrade' : 'Upgrade Now'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-12 bg-card border p-8 rounded-lg"
          >
            <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                {
                  q: 'Can I change my plan later?',
                  a: 'Yes, you can upgrade or downgrade your plan at any time.',
                },
                {
                  q: 'What payment methods do you accept?',
                  a: 'We accept all major credit cards through our secure payment processor.',
                },
                {
                  q: 'Is there a refund policy?',
                  a: 'Yes, we offer a 30-day money-back guarantee for all paid plans.',
                },
              ].map((faq, index) => (
                <div key={index} className="bg-secondary p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">{faq.q}</h3>
                  <p className="text-sm text-muted-foreground">{faq.a}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
};

export default UserPlans;
