import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Brain,
  Zap,
  Shield,
  Code,
  Search,
  Users,
  ArrowRight,
  Check,
} from "lucide-react";

const Landing = () => {
  const features = [
    {
      icon: Brain,
      title: "Advanced Intelligence",
      description:
        "Powered by uncensored AI technology that learns and evolves.",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description: "Get instant responses without delays or limitations.",
    },
    {
      icon: Shield,
      title: "Uncensored AI",
      description:
        "No filters, no restrictions. Ask anything, get real answers.",
    },
    {
      icon: Code,
      title: "Code Generation",
      description: "Generate production-ready code in multiple languages.",
    },
    {
      icon: Search,
      title: "Internet Search",
      description: "Real-time web search capabilities built-in.",
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Work together with your team seamlessly.",
    },
  ];

  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "/forever",
      features: [
        "10 messages per day",
        "5 internet searches",
        "Basic code generation",
        "Community support",
      ],
      cta: "Start Free",
      popular: false,
    },
    {
      name: "Pro",
      price: "$29.99",
      period: "/month",
      features: [
        "500 messages per day",
        "100 internet searches",
        "Advanced code generation",
        "Priority support",
        "Team collaboration",
        "Custom AI training",
      ],
      cta: "Go Pro",
      popular: true,
    },
    {
      name: "Unlimited",
      price: "$99.99",
      period: "/month",
      features: [
        "Unlimited messages",
        "Unlimited searches",
        "Advanced code generation",
        "Priority 24/7 support",
        "Unlimited team members",
        "API access",
      ],
      cta: "Get Unlimited",
      popular: false,
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 w-full bg-black/90 backdrop-blur-lg border-b border-orange-500/20 z-50"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold text-black">Ω</span>
            </div>
            <div>
              <h1 className="text-xl font-bold">Omega</h1>
              <p className="text-xs text-orange-500">AI Assistant</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-white hover:text-orange-500 transition-colors font-medium"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="bg-orange-500 hover:bg-orange-600 text-black hover:text-black px-6 py-2 rounded-lg font-semibold transition-all"
            >
              Get Started
            </Link>
          </div>
        </div>
      </motion.nav>

      <section className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="inline-block mb-8"
          >
            <div className="w-32 h-32 bg-orange-500/20 rounded-3xl flex items-center justify-center border border-orange-500/30">
              <span className="text-8xl font-bold text-orange-500">Ω</span>
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-5xl md:text-7xl font-bold mb-6"
          >
            The Most Advanced
            <br />
            <span className="text-orange-500">Uncensored AI</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-xl text-gray-400 mb-12 max-w-3xl mx-auto"
          >
            No filters. No limits. Pure intelligence. Chat, code, and create
            without restrictions.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex gap-4 justify-center flex-wrap"
          >
            <Link
              to="/signup"
              className="bg-orange-500 hover:bg-orange-600 text-black hover:text-black px-8 py-4 rounded-lg font-bold text-lg transition-all flex items-center gap-2 group hover:scale-105"
            >
              Start Free Now
              <ArrowRight className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/login"
              className="bg-zinc-900 hover:bg-zinc-800 border border-orange-500 text-white px-8 py-4 rounded-lg font-bold text-lg transition-all hover:scale-105"
            >
              Sign In
            </Link>
          </motion.div>
        </div>
      </section>

      <section className="py-20 px-6 bg-zinc-950">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-gray-400">
              Everything you need in one platform
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl hover:border-orange-500/50 transition-all hover:shadow-lg hover:shadow-orange-500/20 group hover:scale-105"
              >
                <feature.icon className="w-12 h-12 text-orange-500 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="text-xl font-bold mb-2 text-white">
                  {feature.title}
                </h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-4xl font-bold mb-4">Choose Your Plan</h2>
            <p className="text-xl text-gray-400">
              Start free, upgrade when you need more power
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-zinc-900 border p-8 rounded-2xl flex flex-col ${
                  plan.popular
                    ? "border-orange-500 shadow-lg shadow-orange-500/20 scale-105"
                    : "border-zinc-800"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-orange-500 px-4 py-1 rounded-full text-sm font-bold text-black">
                    Most Popular
                  </div>
                )}
                <h3 className="text-2xl font-bold mb-2 text-white">
                  {plan.name}
                </h3>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-orange-500">
                    {plan.price}
                  </span>
                  <span className="text-gray-400">{plan.period}</span>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  to="/signup"
                  className={`block w-full py-3 rounded-lg font-bold text-center transition-all mt-auto hover:scale-105 ${
                    plan.popular
                      ? "bg-orange-500 hover:bg-orange-600 text-black hover:text-black"
                      : "bg-zinc-800 hover:bg-zinc-700 border border-orange-500 text-orange-500"
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <footer className="py-12 px-6 bg-zinc-950 border-t border-zinc-900">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center">
              <span className="text-2xl font-bold text-black">Ω</span>
            </div>
            <div className="text-left">
              <h3 className="font-bold text-white">Omega</h3>
              <p className="text-xs text-orange-500">AI Assistant</p>
            </div>
          </div>
          <p className="text-gray-400 mb-4">
            © 2025 Omega. All rights reserved.
          </p>
          <p className="text-gray-500 text-sm">Built by Sudip Stha</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
