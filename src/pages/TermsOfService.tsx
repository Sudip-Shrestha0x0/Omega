import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ScrollText } from "lucide-react";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-black text-white px-6 py-12 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-4xl"
      >
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 text-orange-500 hover:text-orange-400 mb-8 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Signup
        </Link>

        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 md:p-12 shadow-2xl">
          <div className="flex items-center gap-4 mb-8 border-b border-zinc-800 pb-6">
            <div className="w-12 h-12 bg-orange-500/10 rounded-xl flex items-center justify-center">
              <ScrollText className="w-6 h-6 text-orange-500" />
            </div>
            <h1 className="text-3xl font-bold">Terms of Service</h1>
          </div>

          <div className="prose prose-invert max-w-none space-y-8 text-gray-300">
            <p className="text-sm text-gray-500">Last updated: {new Date().toLocaleDateString()}</p>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing and using Omega AI ("the Service"), you agree to be bound by these
                Terms of Service. If you do not agree to these terms, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">2. Description of Service</h2>
              <p>
                Omega AI provides advanced artificial intelligence services, including but not
                limited to chat, code generation, and internet search capabilities. The Service
                is provided "as is" and may be updated or modified at any time.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">3. User Responsibilities</h2>
              <p>
                You are responsible for maintaining the confidentiality of your account credentials
                and for all activities that occur under your account. You agree not to use the
                Service for any illegal or unauthorized purpose.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">4. Privacy Policy</h2>
              <p>
                Your use of the Service is also governed by our Privacy Policy. By using the
                Service, you consent to the collection and use of information as detailed in our
                Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-bold text-white mb-3">5. Modifications</h2>
              <p>
                We reserve the right to modify these terms at any time. We will notify users of
                any significant changes. Continued use of the Service constitutes acceptance of
                new terms.
              </p>
            </section>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TermsOfService;