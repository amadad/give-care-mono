'use client';

import AnimatedChat from "../components/AnimatedChat";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import Image from "next/image";
import Link from "next/link";

const successChatScenario = {
  "scenario": "Welcome to GiveCare - Getting Started",
  "messages": [
    { "id": 1, "text": "Welcome to GiveCare! 🎉", "isUser": false },
    { "id": 2, "text": "Thanks! I'm excited to get started.", "isUser": true },
    { "id": 3, "text": "Perfect! I've sent setup instructions to your phone. Check your messages to complete your profile.", "isUser": false },
    { "id": 4, "text": "Got it! What's next?", "isUser": true },
    { "id": 5, "text": "Once you complete setup, I'll be here 24/7 to support your caregiving journey. No question is too small.", "isUser": false },
    { "id": 6, "text": "That's exactly what I needed to hear.", "isUser": true },
    { "id": 7, "text": "You're not alone in this. I'm here whenever you need support, guidance, or just someone to listen.", "isUser": false },
    { "id": 8, "text": "I've been feeling so overwhelmed lately.", "isUser": true },
    { "id": 9, "text": "That's completely understandable. Caregiving is one of the hardest things anyone can do. Let's take this one day at a time.", "isUser": false }
  ]
};

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-base-100">
      <Navbar />
      
      <div className="w-full bg-gradient-to-b from-base-100 to-base-200 pt-16 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Left side - Success message */}
            <div className="lg:w-1/2 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center px-4 py-2 bg-success/10 border border-success/20 rounded-full text-success text-sm font-medium mb-4">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Subscription Successful
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold text-base-content mb-4">
                Success! Check your phone
              </h1>
              
              <p className="text-lg text-base-content/70 leading-relaxed">
                Welcome to GiveCare. We've sent you a text message with instructions to complete your setup and get started with AI-powered caregiving support.
              </p>
              
              <div className="space-y-3 text-base-content/60">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-success mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Setup instructions sent to your phone</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-success mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>24/7 AI support ready when you are</span>
                </div>
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-success mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>Personalized caregiving guidance</span>
                </div>
              </div>
              
              <div className="pt-4">
                <Link href="/" className="btn btn-primary btn-lg">
                  Return to Homepage
                </Link>
              </div>
              
              <p className="text-sm text-base-content/50">
                Need help? Contact us at{' '}
                <a href="mailto:support@givecare.ai" className="text-primary hover:underline">
                  support@givecare.ai
                </a>
              </p>
            </div>
            
            {/* Right side - Phone mockup with success chat */}
            <div className="lg:w-1/2 flex flex-col items-center gap-6">
              <div className="w-full">
                <div className="mockup-phone border-primary transform scale-90 shadow-2xl">
                  <div className="mockup-phone-camera"></div>
                  <div className="mockup-phone-display">
                    <div className="artboard artboard-demo phone-1 w-full h-full overflow-y-auto p-2 relative">
                      {/* Background Image */}
                      <div className="absolute inset-0 z-0">
                        <Image 
                          src="/phone.jpg" 
                          alt="Phone background" 
                          fill
                          className="object-cover"
                        />
                      </div>
                      
                      {/* Animated Chat Messages */}
                      <div className="absolute z-10 px-4" style={{ top: '155px', bottom: '20px', left: '0', right: '0', overflowY: 'auto', overflowX: 'hidden' }}>
                        <div className="w-[95%] mx-auto">
                          <AnimatedChat messages={successChatScenario.messages} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}