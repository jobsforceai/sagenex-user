"use client"
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, FileText, Fingerprint, Key, CheckCircle, Globe } from 'lucide-react';

interface Step {
  id: number;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const SagenexKYC: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(0);

  const steps: Step[] = [
    {
      id: 1,
      title: 'Identity Verification',
      description: 'Submit government-issued identification documents for AI-powered document authentication, biometric checks, and fraud detection.',
      icon: <FileText className="w-8 h-8" />
    },
    {
      id: 2,
      title: 'Security Assessment',
      description: 'Multi-layer security screening including geolocation, address confirmation, and cross-checks with global sanction lists.',
      icon: <Shield className="w-8 h-8" />
    },
    {
      id: 3,
      title: 'Unique SGX ID Creation',
      description: 'Upon successful onboarding, each investor receives a Universal SGX ID (USGX-ID), serving as a digital passport across all Sagenex products and services.',
      icon: <Fingerprint className="w-8 h-8" />
    },
    {
      id: 4,
      title: 'Ecosystem Access',
      description: 'Your USGX-ID enables seamless login and interaction with all Sagenex investment platforms — from PMS to Crypto Assets & Trading Bots — using a single, secure identity.',
      icon: <Key className="w-8 h-8" />
    }
  ];

  const benefits = [
    'Investor authenticity through advanced verification.',
    'Protection of both active leaders and passive investors.',
    'Global compliance across finance & technology jurisdictions.',
    'Long-term transparency that builds credibility & confidence in the Sagenex ecosystem.'
  ];

  return (
    <div className="min-h-screen bg-black text-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-emerald-400 to-green-600 bg-clip-text text-transparent">
            Next-Gen KYC & Compliance Process
          </h1>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Sagenex Passport implements a cutting-edge Know Your Customer (KYC) and Anti-Money Laundering (AML) framework, ensuring security, compliance, and global accessibility across our ecosystem.
          </p>
        </motion.div>

        {/* Process Steps */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          {steps.map((step, index) => (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              onHoverStart={() => setActiveStep(index)}
              className={`relative p-8 rounded-2xl border-2 transition-all duration-300 cursor-pointer ${
                activeStep === index
                  ? 'bg-gradient-to-br from-green-900/40 to-emerald-900/40 border-emerald-500'
                  : 'bg-gradient-to-br from-gray-900/60 to-green-950/40 border-green-800/30'
              }`}
            >
              <div className="flex items-start gap-4">
                <motion.div
                  animate={{
                    scale: activeStep === index ? 1.1 : 1,
                    rotate: activeStep === index ? 5 : 0
                  }}
                  className={`p-4 rounded-xl ${
                    activeStep === index ? 'bg-emerald-600' : 'bg-green-800'
                  }`}
                >
                  {step.icon}
                </motion.div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-emerald-400 font-mono text-sm">STEP {step.id}</span>
                  </div>
                  <h3 className="text-2xl font-bold mb-3 text-white">{step.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{step.description}</p>
                </div>
              </div>

              {/* {activeStep === index && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute inset-0 rounded-2xl border-2 border-emerald-400 pointer-events-none"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )} */}
            </motion.div>
          ))}
        </div>

        {/* Trust Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="bg-gradient-to-br from-green-950/60 to-emerald-950/60 border-2 border-green-700/50 rounded-3xl p-10 md:p-12"
        >
          <div className="flex items-center gap-3 mb-8">
            <Globe className="w-10 h-10 text-emerald-400" />
            <h2 className="text-3xl font-bold text-white">
              Driving Trust Through Transparent KYC
            </h2>
          </div>
          <p className="text-gray-300 text-lg mb-8">
            Sagenex&apos;s regulatory-first approach ensures:
          </p>
          <div className="grid md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                className="flex items-start gap-3 group"
              >
                <CheckCircle className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1 group-hover:scale-110 transition-transform" />
                <p className="text-gray-200 leading-relaxed">{benefit}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Footer CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="text-center mt-16"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-10 py-4 bg-gradient-to-r from-emerald-600 to-green-700 text-white text-lg font-semibold rounded-xl shadow-lg hover:shadow-emerald-500/50 transition-shadow"
          >
            Start Your KYC Process
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
};

export default SagenexKYC;