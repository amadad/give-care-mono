'use client';

import { motion } from 'framer-motion';

interface Message {
  id: number;
  text: string | React.ReactNode;
  isUser: boolean;
}

export default function AnimatedChat({ messages }: { messages: Message[] }) {
  return (
    <div className="w-full">
      {messages.map((message, index) => (
        <motion.div
          key={message.id}
          className={`chat ${message.isUser ? 'chat-end' : 'chat-start'}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: index * 0.8,
            duration: 0.4,
            ease: "easeOut"
          }}
          style={{
            justifyContent: message.isUser ? 'flex-end' : 'flex-start'
          }}
        >
          <div
            className="chat-bubble text-sm"
            style={{
              backgroundColor: message.isUser ? '#65C466' : '#e9e9eb',
              color: message.isUser ? 'white' : 'black',
              textAlign: 'left'
            }}
          >
            {typeof message.text === 'string' && message.text.includes('http') 
              ? message.text.split(' ').map((word, i) => (
                  <span key={i} className={word.startsWith('http') ? 'break-all inline' : 'inline'}>
                    {word}{' '}
                  </span>
                ))
              : message.text}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
