'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageCircle, Send, Crown, ShieldCheck, Circle,
  Search, X, User, Clock, Paperclip, RefreshCw, Sparkles
} from 'lucide-react';

interface ChatMessage {
  id: string;
  senderType: 'admin' | 'user';
  senderName: string;
  text: string;
  time: string;
  isRead: boolean;
}

interface ChatRoom {
  id: string;
  customerName: string;
  customerPhone: string;
  vipTier: 'الكفو' | 'الهيبة' | 'الشامخ' | 'الملكي النادر' | 'none';
  status: 'open' | 'pending' | 'closed';
  lastMessage: string;
  lastTime: string;
  unreadCount: number;
  messages: ChatMessage[];
}

const VIP_COLORS: Record<string, string> = {
  'الكفو': 'text-amber-600',
  'الهيبة': 'text-gray-300',
  'الشامخ': 'text-blue-600',
  'الملكي النادر': 'text-blue-300',
  'none': 'text-gray-500',
};

const MOCK_CHATS: ChatRoom[] = [
  {
    id: 'chat-1',
    customerName: 'خالد العليا',
    customerPhone: '0559876543',
    vipTier: 'الشامخ',
    status: 'open',
    lastMessage: 'متى يصل الطلب رقم ORD-10021؟',
    lastTime: '14:32',
    unreadCount: 3,
    messages: [
      { id: 'm1', senderType: 'user', senderName: 'خالد', text: 'السلام عليكم، أريد الاستفسار عن طلبي', time: '14:20', isRead: true },
      { id: 'm2', senderType: 'admin', senderName: 'أحمد الأدمن', text: 'أهلاً بك يا خالد! كيف أستطيع مساعدتك؟', time: '14:22', isRead: true },
      { id: 'm3', senderType: 'user', senderName: 'خالد', text: 'متى يصل الطلب رقم ORD-10021؟', time: '14:32', isRead: false },
    ],
  },
  {
    id: 'chat-2',
    customerName: 'محمد النخبة',
    customerPhone: '0551112233',
    vipTier: 'الهيبة',
    status: 'pending',
    lastMessage: 'أريد تغيير اللون في طلبي السابق',
    lastTime: '12:05',
    unreadCount: 1,
    messages: [
      { id: 'm4', senderType: 'user', senderName: 'محمد', text: 'أريد تغيير اللون في طلبي السابق', time: '12:05', isRead: false },
    ],
  },
  {
    id: 'chat-3',
    customerName: 'فاطمة المجد',
    customerPhone: '0501234567',
    vipTier: 'الملكي النادر',
    status: 'open',
    lastMessage: 'شكراً جزيلاً على الخدمة الممتازة!',
    lastTime: 'أمس',
    unreadCount: 0,
    messages: [
      { id: 'm5', senderType: 'admin', senderName: 'أحمد الأدمن', text: 'أختارنا لك هدية خاصة مع شحنتك القادمة', time: '09:00', isRead: true },
      { id: 'm6', senderType: 'user', senderName: 'فاطمة', text: 'شكراً جزيلاً على الخدمة الممتازة!', time: '09:15', isRead: true },
    ],
  },
];

export default function AdminChatPage() {
  const [chats, setChats] = useState<ChatRoom[]>(MOCK_CHATS);
  const [activeChat, setActiveChat] = useState<ChatRoom | null>(null);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const adminUser = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('shamikh_admin_user') || '{}')
    : {};

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages]);

  const openChat = (chat: ChatRoom) => {
    // Mark all as read
    const updated = chats.map(c =>
      c.id === chat.id
        ? { ...c, unreadCount: 0, messages: c.messages.map(m => ({ ...m, isRead: true })) }
        : c
    );
    setChats(updated);
    setActiveChat(updated.find(c => c.id === chat.id) || null);
  };

  const sendMessage = () => {
    if (!message.trim() || !activeChat) return;
    setSending(true);

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderType: 'admin',
      senderName: adminUser.name || 'الأدمن',
      text: message,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      isRead: true,
    };

    setTimeout(() => {
      const updated = chats.map(c =>
        c.id === activeChat.id
          ? { ...c, messages: [...c.messages, newMsg], lastMessage: message, lastTime: newMsg.time }
          : c
      );
      setChats(updated);
      setActiveChat(updated.find(c => c.id === activeChat.id) || null);
      setMessage('');
      setSending(false);
    }, 400);
  };

  const filteredChats = chats.filter(c =>
    c.customerName.toLowerCase().includes(search.toLowerCase()) ||
    c.customerPhone.includes(search)
  );

  const totalUnread = chats.reduce((s, c) => s + c.unreadCount, 0);

  return (
    <div className="h-screen bg-slate-50 text-gray-900 font-sans flex flex-col overflow-hidden pt-16 lg:pt-0" dir="rtl">

      {/* Top Bar */}
      <div className="border-b border-gray-200 p-5 flex items-center justify-between shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MessageCircle className="text-blue-600" size={22} />
            شات الدعم الحصري
            {totalUnread > 0 && (
              <span className="bg-red-500 text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {totalUnread}
              </span>
            )}
          </h1>
          <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-0.5">SHAMIKH VIP LIVE SUPPORT CENTER</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e] animate-pulse" />
          <span className="text-[10px] text-green-500 font-bold">مباشر</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Chat List Panel */}
        <div className={`w-full lg:w-[320px] shrink-0 border-l border-gray-200 flex flex-col bg-[#0A0A0A] ${activeChat ? 'hidden lg:flex' : 'flex'}`}>

          {/* Search */}
          <div className="p-4 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
              <input
                type="text"
                placeholder="ابحث عن عميل..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-blue-600/40 border border-gray-200 rounded-xl py-2.5 pr-9 pl-4 text-gray-900 text-xs placeholder-gray-700 focus:outline-none focus:border-[#C5A059]"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto divide-y divide-white/5">
            {filteredChats.map(chat => {
              const isActive = activeChat?.id === chat.id;
              return (
                <button
                  key={chat.id}
                  onClick={() => openChat(chat)}
                  className={`w-full p-4 flex items-start gap-3 text-right transition-all hover:bg-gray-50 ${isActive ? 'bg-blue-600/10' : ''}`}
                >
                  {/* Avatar */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 border-2 ${
                    chat.vipTier === 'الشامخ' ? 'border-[#C5A059] bg-blue-600/10 text-blue-600' :
                    chat.vipTier === 'الملكي النادر' ? 'border-blue-400 bg-blue-400/10 text-blue-300' :
                    chat.vipTier === 'الهيبة' ? 'border-gray-400 bg-gray-400/10 text-gray-300' :
                    'border-gray-200 bg-gray-50 text-gray-400'
                  }`}>
                    {chat.customerName.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-gray-900 truncate">{chat.customerName}</span>
                      <span className="text-[9px] text-gray-600 shrink-0 mr-2">{chat.lastTime}</span>
                    </div>
                    {chat.vipTier !== 'none' && (
                      <p className={`text-[9px] font-bold mb-1 flex items-center gap-1 ${VIP_COLORS[chat.vipTier]}`}>
                        <Crown size={9} /> {chat.vipTier}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] text-gray-500 truncate">{chat.lastMessage}</p>
                      {chat.unreadCount > 0 && (
                        <span className="bg-blue-600 text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0 mr-2">
                          {chat.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat Window */}
        {activeChat ? (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 flex items-center gap-3 bg-[#0A0A0A]">
              <button
                onClick={() => setActiveChat(null)}
                className="lg:hidden text-gray-500 hover:text-gray-900"
              >
                <X size={18} />
              </button>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                activeChat.vipTier === 'الشامخ' ? 'border-[#C5A059] bg-blue-600/10 text-blue-600' :
                'border-gray-200 bg-gray-50 text-gray-400'
              }`}>
                {activeChat.customerName.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{activeChat.customerName}</p>
                <p className="text-[10px] text-gray-500">{activeChat.customerPhone}</p>
              </div>
              {activeChat.vipTier !== 'none' && (
                <span className={`mr-auto text-[9px] font-bold flex items-center gap-1 ${VIP_COLORS[activeChat.vipTier]} bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full`}>
                  <Crown size={9} /> {activeChat.vipTier}
                </span>
              )}
              <div className="flex items-center gap-1 text-[9px] text-green-500 mr-2">
                <Circle size={6} className="fill-green-500" />
                نشط
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeChat.messages.map((msg, idx) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`flex gap-3 ${msg.senderType === 'admin' ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    msg.senderType === 'admin'
                      ? 'bg-gradient-to-br from-blue-600 to-indigo-600 text-black'
                      : 'bg-white/10 border border-gray-200 text-gray-900'
                  }`}>
                    {msg.senderType === 'admin' ? <ShieldCheck size={14} /> : msg.senderName.charAt(0)}
                  </div>
                  <div className={`max-w-xs lg:max-w-md ${msg.senderType === 'admin' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    <p className={`text-[9px] text-gray-600`}>{msg.senderName} · {msg.time}</p>
                    <div className={`px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                      msg.senderType === 'admin'
                        ? 'bg-blue-600 text-black font-medium rounded-tl-none'
                        : 'bg-white/10 text-gray-900 border border-gray-200 rounded-tr-none'
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            <div className="px-6 pb-2 flex gap-2 flex-wrap">
              {[
                'شكراً لتواصلك!',
                'سيتم شحن طلبك خلال 24 ساعة',
                'سأقوم بمراجعة طلبك الآن',
              ].map(quick => (
                <button
                  key={quick}
                  onClick={() => setMessage(quick)}
                  className="text-[10px] bg-gray-50 hover:bg-blue-600/10 border border-gray-200 hover:border-[#C5A059]/30 text-gray-400 hover:text-blue-600 px-3 py-1.5 rounded-full transition-all font-bold"
                >
                  {quick}
                </button>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-gray-200 bg-[#0A0A0A]">
              <div className="flex gap-3 items-end">
                <div className="flex-1 bg-blue-600/40 border border-gray-200 rounded-2xl focus-within:border-[#C5A059] transition-all">
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                    placeholder="اكتب رداً فاخراً للعميل..."
                    rows={2}
                    className="w-full bg-transparent py-3 px-4 text-gray-900 text-xs placeholder-gray-700 focus:outline-none resize-none"
                  />
                </div>
                <button
                  onClick={sendMessage}
                  disabled={!message.trim() || sending}
                  className="w-10 h-10 bg-blue-600 hover:bg-[#b08d4b] text-black rounded-xl flex items-center justify-center transition-all shadow-lg disabled:bg-gray-700 disabled:text-gray-500 shrink-0"
                >
                  {sending ? <RefreshCw size={16} className="animate-spin" /> : <Send size={16} />}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="hidden lg:flex flex-1 items-center justify-center text-center">
            <div>
              <MessageCircle className="mx-auto text-gray-700 mb-4" size={64} />
              <p className="text-gray-500 text-sm font-bold">اختر محادثة لبدء الدعم الفاخر</p>
              <p className="text-gray-700 text-xs mt-2">SHAMIKH VIP CONCIERGE SUPPORT</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
