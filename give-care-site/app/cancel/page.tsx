'use client';

import AnimatedChat from "../components/AnimatedChat";
import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import Image from "next/image";
import Link from "next/link";

const cancelChatScenario = {
  "scenario": "Understanding Your Decision",
  "messages": [
    { "id": 1, "text": "I understand you've decided not to continue with the subscription right now.", "isUser": false },
    { "id": 2, "text": "Yeah, I'm just not ready yet.", "isUser": true },
    { "id": 3, "text": "That's completely okay. Caregiving decisions are deeply personal, and timing matters.", "isUser": false },
    { "id": 4, "text": "I appreciate that. Maybe someday when things feel different.", "isUser": true },
    { "id": 5, "text": "Absolutely. When you're ready for support, I'll be here. Your caregiving journey is valid at any stage.", "isUser": false },
    { "id": 6, "text": "Thank you for understanding.", "isUser": true },
    { "id": 7, "text": "Take care of yourself. You're doing important work, and you deserve support whenever you're ready.", "isUser": false },
    { "id": 8, "text": "It means a lot that you're not pressuring me.", "isUser": true },
    { "id": 9, "text": "Never. This is about you and what feels right. Trust your instincts—they're guiding you well.", "isUser": false }
  ]
};

export default function CancelPage() {
  return (
    <div className="min-h-screen bg-base-100">
      <Navbar />
      
      <div className="w-full bg-gradient-to-b from-base-100 to-base-200 pt-16 pb-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Left side - Cancel message */}
            <div className="lg:w-1/2 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center px-4 py-2 bg-warning/10 border border-warning/20 rounded-full text-warning text-sm font-medium mb-4">
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Subscription Cancelled
              </div>
              
              <h1 className="text-4xl lg:text-5xl font-bold text-base-content mb-4">
                No worries at all
              </h1>
              
              <p className="text-lg text-base-content/70 leading-relaxed">
                We understand that timing isn't always right. You haven't been charged, and you can come back anytime when you're ready to experience AI-powered caregiving support.
              </p>
              
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link href="/" className="btn btn-primary">
                    Return to Homepage
                  </Link>
                  <Link href="/how-it-works" className="btn btn-outline">
                    Learn More
                  </Link>
                </div>
              </div>
              
              <div className="pt-6 space-y-4">
                <p className="text-base-content/60 font-medium">
                  In the meantime, you can:
                </p>
                <div className="space-y-2 text-base-content/60">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-primary mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                    </svg>
                    <span>Explore our <a href="/how-it-works" className="text-primary hover:underline">caregiving resources</a></span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-primary mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                    </svg>
                    <span>Follow us on <a href="#" className="text-primary hover:underline">social media</a> for tips</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-primary mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span>Contact us at <a href="mailto:support@givecare.ai" className="text-primary hover:underline">support@givecare.ai</a></span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right side - Phone mockup with cancel chat */}
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
                          <AnimatedChat messages={cancelChatScenario.messages} />
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