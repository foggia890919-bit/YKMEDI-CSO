'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import Link from 'next/link';

interface ChatMessage {
  id: string;
  sender: 'user' | 'support';
  senderName: string;
  message: string;
  timestamp: Date;
}

export default function ChatPage() {
  const { user, isAuthenticated } = useAuthStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 초기 환영 메시지
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: '1',
          sender: 'support',
          senderName: '비타앤오리진 고객지원',
          message: '안녕하세요! 비타앤오리진 고객지원팀입니다. 어떤 도움이 필요하신가요?',
          timestamp: new Date(),
        },
      ]);
    }
  }, [isOpen, messages.length]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    setIsSending(true);

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      senderName: user?.name || '손님',
      message: inputMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');

    // 자동 응답 시뮬레이션
    setTimeout(() => {
      const supportMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'support',
        senderName: '비타앤오리진 지원팀',
        message: '빠르게 답변드리겠습니다. 잠시만 기다려주세요.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, supportMessage]);

      setTimeout(() => {
        const finalMessage: ChatMessage = {
          id: (Date.now() + 2).toString(),
          sender: 'support',
          senderName: '비타앤오리진 지원팀',
          message:
            '더 빠른 해결을 위해 support@vitaorigin.com으로 문의해 주시면 감사하겠습니다. 😊',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, finalMessage]);
      }, 1000);

      setIsSending(false);
    }, 1500);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-[#2d5016] text-white rounded-full p-4 shadow-lg hover:shadow-xl transition"
        title="고객 지원"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute bottom-16 right-0 w-96 bg-white rounded-lg shadow-xl overflow-hidden flex flex-col">
          {/* 헤더 */}
          <div className="bg-[#2d5016] text-white p-4 flex justify-between items-center">
            <div>
              <h3 className="font-bold">비타앤오리진 고객지원</h3>
              <p className="text-xs mt-1">평일 09:00 ~ 18:00</p>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-[#1f3810] p-2 rounded"
            >
              ✕
            </button>
          </div>

          {/* 채팅 영역 */}
          <div className="h-96 overflow-y-auto p-4 bg-gray-50 space-y-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.sender === 'user'
                      ? 'bg-[#2d5016] text-white'
                      : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                >
                  <p className="text-xs font-semibold mb-1 opacity-75">
                    {msg.senderName}
                  </p>
                  <p className="text-sm">{msg.message}</p>
                  <p className="text-xs mt-1 opacity-50">
                    {msg.timestamp.toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* 입력 영역 */}
          <form onSubmit={handleSendMessage} className="border-t p-4 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="메시지를 입력하세요..."
                className="flex-1 border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-[#2d5016]"
                disabled={isSending}
              />
              <button
                type="submit"
                disabled={isSending}
                className="bg-[#2d5016] text-white px-4 py-2 rounded hover:bg-[#1f3810] disabled:opacity-50"
              >
                전송
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
