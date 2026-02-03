import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { CreditCard, Lock, CheckCircle2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { paymentService } from '../../services/paymentService';
import { useToast } from '../../hooks/use-toast';

const Payment = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get('plan') || 'pro';

  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const plan = paymentService.plans[planId];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: 'Authentication Required',
        description: 'Please login to continue.',
        variant: 'destructive',
      });
      navigate('/login');
      return;
    }

    setIsProcessing(true);

    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    const result = await paymentService.processPayment(user.id, planId, plan.price);

    if (result.status === 'completed') {
      setPaymentSuccess(true);
      toast({
        title: 'Payment Successful!',
        description: `You've been upgraded to the ${plan.name} plan.`,
      });

      // Update user plan (in production, this would be done on backend)
      setTimeout(() => navigate('/dashboard/plans'), 3000);
    } else {
      toast({
        title: 'Payment Failed',
        description: 'Unable to process payment. Please try again.',
        variant: 'destructive',
      });
    }

    setIsProcessing(false);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.slice(0, 2)}/${v.slice(2, 4)}`;
    }
    return v;
  };

  if (paymentSuccess) {
    return (
      <div className="flex flex-col h-full w-full bg-black">
        {/* Sticky header  */}
        <header className="sticky top-0 flex-shrink-0 flex items-center z-20 gap-2 sm:gap-4 border-b border-zinc-800 bg-black px-3 sm:px-6 py-4">
          <SidebarTrigger />
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-white">Payment Successful</h1>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide flex items-center justify-center p-3 sm:p-6 bg-black">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md"
          >
            <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-3xl font-bold mb-4 text-white">Payment Successful!</h2>
            <p className="text-gray-400 mb-2">
              You've been upgraded to the <strong>{plan.name}</strong> plan.
            </p>
            <p className="text-sm text-gray-400 mb-8">
              Redirecting you to your dashboard...
            </p>
            <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg">
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Plan</span>
                <span className="font-semibold text-white">{plan.name}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Amount</span>
                <span className="font-semibold text-white">${plan.price}/month</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Status</span>
                <span className="text-green-500 font-semibold">Completed</span>
              </div>
            </div>
          </motion.div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-black">
      {/* Sticky header - stays visible while scrolling */}
      <header className="sticky top-0 flex-shrink-0 flex items-center z-20 gap-2 sm:gap-4 border-b border-zinc-800 bg-black px-3 sm:px-6 py-4">
        <SidebarTrigger />
        <button
          onClick={() => navigate('/dashboard/plans')}
          className="flex items-center gap-2 text-gray-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-white">Complete Payment</h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide p-3 sm:p-6 bg-black">
        <div className="max-w-4xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg">
                <h2 className="text-xl font-bold mb-4 text-white">Order Summary</h2>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Plan</span>
                    <span className="font-semibold text-white">{plan.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Billing Cycle</span>
                    <span className="font-semibold text-white">Monthly</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Subtotal</span>
                    <span className="font-semibold text-white">${plan.price}</span>
                  </div>
                  <div className="border-t border-zinc-800 pt-4 flex justify-between text-lg">
                    <span className="font-bold text-white">Total Due Today</span>
                    <span className="font-bold text-orange-500">${plan.price}</span>
                  </div>
                </div>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/20 p-6 rounded-lg">
                <div className="flex items-start gap-3">
                  <Lock className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1 text-white">Secure Payment</h3>
                    <p className="text-sm text-gray-400">
                      Your payment information is encrypted and secure. We use industry-standard SSL encryption.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-lg">
                <h3 className="font-semibold mb-3 text-white">What's Included</h3>
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-zinc-900 border border-zinc-800 p-8 rounded-lg"
            >
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-white">
                <CreditCard className="w-6 h-6 text-orange-500" />
                Payment Details
              </h2>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">Card Number</label>
                  <input
                    type="text"
                    value={cardDetails.number}
                    onChange={(e) =>
                      setCardDetails({ ...cardDetails, number: formatCardNumber(e.target.value) })
                    }
                    maxLength={19}
                    className="w-full bg-zinc-800 border-0 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                    placeholder="1234 5678 9012 3456"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-white">Cardholder Name</label>
                  <input
                    type="text"
                    value={cardDetails.name}
                    onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                    className="w-full bg-zinc-800 border-0 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                    placeholder="John Doe"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">Expiry Date</label>
                    <input
                      type="text"
                      value={cardDetails.expiry}
                      onChange={(e) =>
                        setCardDetails({ ...cardDetails, expiry: formatExpiry(e.target.value) })
                      }
                      maxLength={5}
                      className="w-full bg-zinc-800 border-0 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                      placeholder="MM/YY"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2 text-white">CVV</label>
                    <input
                      type="text"
                      value={cardDetails.cvv}
                      onChange={(e) =>
                        setCardDetails({ ...cardDetails, cvv: e.target.value.replace(/\D/g, '') })
                      }
                      maxLength={4}
                      className="w-full bg-zinc-800 border-0 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500 text-white"
                      placeholder="123"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isProcessing}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-lg font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-5 h-5" />
                      Pay ${plan.price}
                    </>
                  )}
                </button>

                <p className="text-xs text-center text-gray-400">
                  By completing this purchase, you agree to our Terms of Service and Privacy Policy.
                  Your subscription will renew automatically each month.
                </p>
              </form>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Payment;
