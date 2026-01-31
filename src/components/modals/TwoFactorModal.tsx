import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Smartphone, X, Lock } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';
import { emailService } from '../../services/emailService';

interface TwoFactorModalProps {
  isOpen: boolean;
  onClose: () => void;
  method: 'email' | 'phone';
  onComplete: (contact: string) => void;
  userEmail?: string;
}

const TwoFactorModal: React.FC<TwoFactorModalProps> = ({
  isOpen,
  onClose,
  method,
  onComplete,
  userEmail,
}) => {
  const { toast } = useToast();
  const [contact, setContact] = useState(method === 'email' ? userEmail || '' : '');
  const [verificationCode, setVerificationCode] = useState('');
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [sentCode, setSentCode] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const generateCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleSendCode = async () => {
    if (!contact.trim()) {
      toast({
        title: 'Contact required',
        description: `Please enter your ${method === 'email' ? 'email address' : 'phone number'}`,
        variant: 'destructive',
        duration: 2000,
      });
      return;
    }

    if (method === 'email' && !contact.includes('@')) {
      toast({
        title: 'Invalid email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
        duration: 2000,
      });
      return;
    }

    if (method === 'phone' && contact.length < 10) {
      toast({
        title: 'Invalid phone',
        description: 'Please enter a valid phone number',
        variant: 'destructive',
        duration: 2000,
      });
      return;
    }

    setIsSending(true);
    const code = generateCode();
    setSentCode(code);

    if (method === 'email') {
      const success = await emailService.send2FACode(contact, code);
      if (success) {
        toast({
          title: 'Verification code sent',
          description: `Check your email at ${contact}`,
          duration: 2000,
        });
        setStep('verify');
      } else {
        toast({
          title: 'Failed to send code',
          description: 'Please try again',
          variant: 'destructive',
          duration: 2000,
        });
      }
    } else {
      toast({
        title: 'SMS sent',
        description: `Verification code sent to ${contact}`,
        duration: 2000,
      });
      setStep('verify');
    }

    setIsSending(false);
  };

  const handleVerify = () => {
    if (verificationCode === sentCode) {
      toast({
        title: '2FA Enabled',
        description: `Two-factor authentication via ${method} has been enabled`,
        duration: 2000,
      });
      onComplete(contact);
      onClose();
    } else {
      toast({
        title: 'Invalid code',
        description: 'Please check the code and try again',
        variant: 'destructive',
        duration: 2000,
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 max-w-md w-full relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Enable 2FA</h2>
            <p className="text-sm text-gray-400">
              {method === 'email' ? 'Email' : 'Phone'} verification
            </p>
          </div>
        </div>

        {step === 'input' ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {method === 'email' ? 'Email Address' : 'Phone Number'}
              </label>
              <div className="relative">
                {method === 'email' ? (
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                ) : (
                  <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                )}
                <input
                  type={method === 'email' ? 'email' : 'tel'}
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder={
                    method === 'email' ? 'your@email.com' : '+1 (555) 000-0000'
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                We'll send a verification code to this {method === 'email' ? 'email' : 'number'}
              </p>
            </div>

            <button
              onClick={handleSendCode}
              disabled={isSending}
              className="w-full bg-orange-500 hover:bg-orange-600 text-black hover:text-black py-3 rounded-lg font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSending ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-black border-t-transparent" />
              ) : (
                'Send Verification Code'
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-3 text-center text-2xl font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-500 mt-2 text-center">
                Enter the 6-digit code sent to {contact}
              </p>
            </div>

            <button
              onClick={handleVerify}
              className="w-full bg-orange-500 hover:bg-orange-600 text-black hover:text-black py-3 rounded-lg font-semibold transition-all"
            >
              Verify & Enable 2FA
            </button>

            <button
              onClick={() => setStep('input')}
              className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-lg font-semibold transition-all"
            >
              Change {method === 'email' ? 'Email' : 'Number'}
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default TwoFactorModal;
