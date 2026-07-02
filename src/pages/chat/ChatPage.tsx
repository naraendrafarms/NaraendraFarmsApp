import React from 'react'
import { ChatBody } from '@/components/chat/ChatPanel'

export const ChatPage: React.FC = () => (
  <div className="h-[calc(100vh-7rem)] max-w-2xl mx-auto border border-gray-100 rounded-2xl overflow-hidden">
    <ChatBody active={true} />
  </div>
)
