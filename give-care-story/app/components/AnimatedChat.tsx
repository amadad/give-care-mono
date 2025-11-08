"use client"

import {  useState } from 'react'

interface Message {
  id: number
  text: string
  isUser: boolean
}

interface AnimatedChatProps {
  messages: Message[]
}

export default function AnimatedChat({ messages }: AnimatedChatProps) {
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([])

  useEffect(() => {
    setVisibleMessages([])
    const delays = messages.map((_, i) => i * 700) // 0.7 seconds between each message
    const timeouts: NodeJS.Timeout[] = []

    messages.forEach((message, index) => {
      const timeout = setTimeout(() => {
        setVisibleMessages(prev => {
          // Only add the message if it's not already there
          if (prev.some(m => m.id === message.id)) return prev
          return [...prev, message]
        })
      }, delays[index])
      timeouts.push(timeout)
    })

    // Cleanup function to clear all timeouts
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout))
    }
  }, [messages])

  return (
    <div className="flex flex-col gap-2 p-2">
      {visibleMessages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`rounded-2xl px-3 py-2 font-heading text-sm max-w-[85%] shadow-sm text-center ${
              message.isUser
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-800 border border-gray-100'
            }`}
          >
            {message.text}
          </div>
        </div>
      ))}
    </div>
  )
}
