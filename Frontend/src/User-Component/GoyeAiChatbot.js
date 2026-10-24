import React, { useState, useRef, useEffect } from 'react';
import { FiX, FiSend, FiPaperclip, FiBot, FiUser, FiMessageSquare } from 'react-icons/fi';
import { FaRobot, FaWhatsapp, FaUsers, FaCoins, FaClock, FaTags, FaBolt, FaSearch, FaShieldAlt, FaQuestionCircle } from 'react-icons/fa';

export default function GoyeAiChatbot({ isOpen, onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const chatAreaRef = useRef(null);

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      if (messages.length > 0) {
        scrollToBottom();
      } else if (chatAreaRef.current) {
        chatAreaRef.current.scrollTop = 0;
      }
    }
  }, [messages, isTyping, isOpen]);

  // Comprehensive Suggestions: Covering Pre-login fundamental doubts + In-app features
  const suggestions = [
    { label: 'Two Logins Guide', icon: <FaUsers className="text-[#25D366]" />, prompt: 'Why are there two logins? Which login should I choose (Normal vs Free User)?' },
    { label: 'Subscription Plans', icon: <FaTags className="text-[#25D366]" />, prompt: 'What are the subscription plans, pricing, and credits?' },
    { label: 'Free User Access', icon: <FaCoins className="text-[#25D366]" />, prompt: 'What is Free User Login and what features can I test?' },
    { label: 'Platform Features', icon: <FaBolt className="text-[#25D366]" />, prompt: 'What features are available in Goye (Bulk Sender, Scraper, Extractor)?' },
    { label: 'Connect WhatsApp', icon: <FaWhatsapp className="text-[#25D366]" />, prompt: 'How do I connect my WhatsApp account to Goye?' },
    { label: 'Social Leads', icon: <FaSearch className="text-[#25D366]" />, prompt: 'How does Social Leads extraction work?' },
    { label: 'Bulk Messaging', icon: <FaBolt className="text-[#25D366]" />, prompt: 'How does bulk messaging work and how to upload contacts?' },
    { label: 'Credits System', icon: <FaCoins className="text-[#25D366]" />, prompt: 'How do daily free credits work in Goye?' }
  ];

  // AI Knowledge Engine
  const getAiResponse = async (userPrompt) => {
    const p = userPrompt.toLowerCase();

    // 1. Two Logins Clarification
    if (p.includes('two login') || p.includes('2 login') || p.includes('which login') || (p.includes('login') && (p.includes('normal') || p.includes('free') || p.includes('diff') || p.includes('choose') || p.includes('both')))) {
      return "🔑 **Goye has Two Types of Logins:**\n\n1. 🌟 **Subscribed Member Login (/userlogin)**:\n• For registered members with a paid subscription (One Day, 1 Week, 1 Month, etc.).\n• Unlocks **99,999 marketing credits**, high-speed broadcasting, and all premium extractors.\n\n2. 🆓 **Free User Login (/free-user/login)**:\n• For new visitors who want to test Goye before purchasing a plan!\n• Simple registration without upfront payment to explore features.\n\n👉 **Which should you use?** If you have already subscribed to a plan, use **Member Login**. If you are a new guest testing the platform, use **Free User Login**!";
    }

    // 2. Free User Details
    if (p.includes('free user') || (p.includes('free') && (p.includes('account') || p.includes('trial') || p.includes('register') || p.includes('login') || p.includes('benefit')))) {
      return "🆓 **Free User Account & Trial Details**:\n\n• **Instant Trial**: Quick registration with your Name, Phone & Business details.\n• **Explore Features**: Test WhatsApp QR connection, explore scrapers, and preview messaging workflows.\n• **Upgrade Anytime**: You can request or be upgraded by Admin to a full Subscribed plan with 99,999 credits anytime!\n\n👉 To get started, click **Free User Login** or head to **/free-user/register**.";
    }

    // 3. Subscription Plans & Pricing
    if (p.includes('subscription') || p.includes('plan') || p.includes('pricing') || p.includes('price') || p.includes('cost') || p.includes('rate') || p.includes('buy') || p.includes('upgrade')) {
      return "💎 **Goye All-Inclusive Subscription Plans**:\n\n• ⚡ **One Day (24 Hours)**: ₹49 (Quick one-time event/campaign blast)\n• 📅 **One Week (7 Days)**: ₹249 (Weekly sales promotion)\n• 🌟 **15 Days Plan**: ₹499 (Semi-monthly campaign)\n• 💎 **One Month (30 Days)**: ₹799 *(Most Popular - Full 99,999 Credits)*\n• 🚀 **3 Months**: ₹1,999 | **6 Months**: ₹3,499 | **1 Year**: ₹5,999\n\n✨ **Every Subscription Includes**:\n✅ 99,999 Broadcast Marketing Credits\n✅ B2B Social Leads & Google Maps Scraper\n✅ Anti-Ban Safe Delay Dispatcher\n✅ Multi-media attach (Images, Docs, Audio Notes, Video)";
    }

    // 4. Platform Overview / Features
    if (p.includes('feature') || p.includes('what is goye') || p.includes('what can') || p.includes('services') || p.includes('overview') || p.includes('platform')) {
      return "⚡ **Top Features of Goye Platform**:\n\n1. 📲 **WhatsApp Bulk Sender**: Broadcast to thousands of numbers with custom variables, images, videos & voice notes.\n2. 🔍 **Social Media Lead Extractor**: Mine public business numbers from Facebook, Instagram, LinkedIn, YouTube & TikTok.\n3. 🌐 **Google Maps & Web Scraper**: Extract local business leads by keyword and target city.\n4. 👥 **WhatsApp Group Extractor**: Extract members directly from any joined WhatsApp group into Excel.\n5. ⏱️ **Scheduled Broadcasting**: Set campaigns to send automatically at future dates/times.";
    }

    // 5. Connect WhatsApp
    if (p.includes('connect') || p.includes('qr') || p.includes('whatsapp') || p.includes('link')) {
      return "📲 **Connecting Your WhatsApp to Goye**:\n\n1. Click **Connect Device Now** on the top navigation bar.\n2. Open WhatsApp on your phone → Settings / Menu → **Linked Devices** → **Link a Device**.\n3. Point your camera and scan the QR code displayed on screen.\n4. Once linked, your WhatsApp is encrypted & ready to broadcast directly from your browser!";
    }

    // 6. Social Leads / Scraper
    if (p.includes('social') || p.includes('soical') || p.includes('lead') || p.includes('extract') || p.includes('scrape') || p.includes('scraper') || p.includes('b2b')) {
      return "🔍 **Goye Social Leads Extractor & Web Scraper**:\n\n1. **Select Platform**: Choose Facebook, Instagram, LinkedIn, YouTube, TikTok, or Google Maps.\n2. **Target Keywords**: Enter your search keyword (e.g. 'Boutiques', 'Real Estate', 'Restaurants') and target location.\n3. **Extract Real-Time**: Click **Search / Extract Leads** to find public verified phone numbers.\n4. **Instant Action**: Export leads to Excel/CSV or transfer directly to the Bulk Sender!";
    }

    // 7. Bulk Messaging & File Uploads
    if (p.includes('bulk') || p.includes('csv') || p.includes('excel') || p.includes('upload') || p.includes('contact')) {
      return "🚀 **Bulk Messaging in Goye**:\n\n1. Upload your CSV or Excel file containing contact numbers, or paste numbers separated by commas.\n2. Type your text message, record voice, or attach media (up to 3 Images, 2 Docs, 1 Video).\n3. Click **Send Messages**! Goye automatically maintains an anti-ban delay between sends.";
    }

    // 8. Team Campaign
    if (p.includes('team') || p.includes('split') || p.includes('lobby') || p.includes('join')) {
      return "👥 **Team Campaign Feature**:\n\nAllows you to split large contact lists among team members:\n1. Click **Split with Team** on the Messages panel.\n2. Set batch size per member & generate a join link.\n3. Share the link with teammates so everyone sends a fraction of the list, preventing single-number rate limits!";
    }

    // 9. Credits System
    if (p.includes('credit') || p.includes('balance') || p.includes('limit')) {
      return "🪙 **Goye Credits Information**:\n\n• 1 Credit = 2 Bulk Messages sent.\n• Subscribed plans receive **99,999 credits** for unlimited campaigning.\n• Free accounts receive daily test credits.\n• You can check your remaining balance in your Profile top bar anytime!";
    }

    // 10. Scheduled Messages
    if (p.includes('schedule') || p.includes('time') || p.includes('off') || p.includes('sleep') || p.includes('later')) {
      return "⏰ **Scheduled Messages in Goye**:\n\n• Schedules are safely stored in **MongoDB Database**.\n• If your PC is ON, the message fires at the exact minute set.\n• If your PC is OFF/sleeping, Goye reloads pending jobs from MongoDB as soon as you turn your PC ON and sends them immediately!\n• For 24/7 exact-time execution while PC is off, deploy Goye to a cloud server like Render.";
    }

    // 11. Voice Features
    if (p.includes('voice') || p.includes('mic') || p.includes('speech') || p.includes('audio') || p.includes('ptt')) {
      return "🎙️ **Goye Voice Features**:\n\n1. **Voice-to-Text**: Click the green 'Voice to Text' button next to the text box and speak into your mic to auto-type.\n2. **Blue Mic Voice Note (PTT)**: Upload any audio file (.mp3/.ogg) and Goye sends it as a genuine WhatsApp Push-To-Talk Voice Note!";
    }

    // 12. Support & Help
    if (p.includes('support') || p.includes('help') || p.includes('contact') || p.includes('call') || p.includes('admin') || p.includes('human') || p.includes('phone')) {
      return "📞 **Goye Support & Assistance**:\n\n• **Admin Phone/WhatsApp**: +91 99430 42369\n• **Email**: support@goye.in\n• **Live Demo & Plan Activation**: Contact us anytime to get an instant demonstration or upgrade!";
    }

    // 13. Greetings
    if (p.includes('hi') || p.includes('hello') || p.includes('hey') || p.includes('greetings') || p.includes('vanakkam')) {
      return "Hello! 👋 Welcome to Goye WhatsApp Growth Platform. I'm Goye AI Assistant! How can I help you today? Feel free to ask about our 2 logins, subscription plans, free user trials, or features!";
    }

    return "Thank you for reaching out! I'm Goye AI Assistant. I can help with choosing between our 2 logins, subscription plans, free user trials, WhatsApp connection, bulk broadcasting, and scrapers. If you need human assistance, feel free to reach admin at +91 99430 42369!";
  };

  const handleSend = async (customPrompt) => {
    const text = customPrompt || input;
    if (!text.trim()) return;

    const userMessage = { id: Date.now(), sender: 'user', text };
    setMessages((prev) => [...prev, userMessage]);
    if (!customPrompt) setInput('');

    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(async () => {
      const botReplyText = await getAiResponse(text);
      const botMessage = { id: Date.now() + 1, sender: 'bot', text: botReplyText };
      setMessages((prev) => [...prev, botMessage]);
      setIsTyping(false);
    }, 600);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed bottom-28 sm:bottom-[138px] right-3 sm:right-6 left-3 sm:left-auto z-[150] w-[calc(100vw-1.5rem)] sm:w-[400px] max-w-[calc(100vw-1.5rem)] sm:max-w-[400px] bg-[#0D1117] border border-white/10 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden animate-fade-in-up text-white"
      style={{
        height: "min(490px, calc(100vh - 225px))",
        maxHeight: "calc(100vh - 225px)",
        fontFamily: "'Inter', sans-serif"
      }}
    >
      {/* Scrollbar-hide utility style */}
      <style>{`
        .gy-no-scrollbar::-webkit-scrollbar {
          display: none !important;
        }
        .gy-no-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}</style>

      {/* ================= TOP HEADER ================= */}
      <div 
        className="bg-[#161B22] border-b border-white/[0.08] px-4 sm:px-5 py-3 sm:py-3.5 flex items-center justify-between shrink-0 relative z-[100] shadow-md select-none"
        style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
      >
        <div className="flex items-center gap-2.5 sm:gap-3 pr-2 min-w-0 flex-1">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#25D366]/10 border border-[#25D366]/20 flex items-center justify-center text-[#25D366] shrink-0 overflow-hidden p-1">
            <img
              src="/bot.gif"
              alt="Goye AI"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'block';
              }}
              className="w-full h-full object-contain select-none pointer-events-none"
            />
            <FaRobot style={{ display: 'none' }} className="text-base sm:text-lg" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-xs sm:text-sm font-bold text-white leading-tight truncate">AI Assistant</h3>
            <p className="text-[10px] sm:text-[11px] text-[#25D366] font-medium truncate flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#25D366] animate-pulse"></span>
              Always Online • Ready to Help
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          type="button"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/5 hover:bg-white/15 text-[#9AA4AF] hover:text-white flex items-center justify-center transition-all duration-200 shrink-0 cursor-pointer border border-white/10 relative z-[9999]"
          style={{ borderRadius: '50%', zIndex: 9999 }}
          title="Close AI Chat"
          aria-label="Close AI Chat"
        >
          <FiX size={16} className="sm:hidden" />
          <FiX size={18} className="hidden sm:block" />
        </button>
      </div>

      {/* ================= CHAT AREA ================= */}
      <div ref={chatAreaRef} className="flex-1 overflow-y-auto min-h-0 p-3 sm:p-4 space-y-3 sm:space-y-4 bg-[#0D1117] gy-no-scrollbar overflow-x-hidden relative z-10">
        {messages.length === 0 ? (
          /* ================= WELCOME SCREEN ================= */
          <div className="flex flex-col items-center justify-start text-center p-1 sm:p-2 w-full pt-1 pb-2">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-b from-[#1b2733] to-[#0e1620] border-2 border-[#25D366]/40 flex items-center justify-center text-[#25D366] mb-2 sm:mb-3 shadow-[0_8px_30px_rgba(0,0,0,0.6),0_0_20px_rgba(37,211,102,0.25)] shrink-0 overflow-hidden p-1">
              <img
                src="/bot.gif"
                alt="Goye AI"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  if (e.currentTarget.nextSibling) e.currentTarget.nextSibling.style.display = 'block';
                }}
                className="w-full h-full object-contain select-none pointer-events-none drop-shadow"
              />
              <FaRobot style={{ display: 'none' }} className="text-3xl sm:text-4xl text-[#25D366]" />
            </div>
            <h2 className="text-sm sm:text-base font-extrabold text-white mb-0.5 sm:mb-1">Hi, I'm Goye AI 👋</h2>
            <p className="text-[11px] sm:text-xs text-[#9AA4AF] max-w-[290px] mb-2.5 sm:mb-3.5 leading-relaxed">
              Ask me about our logins, subscription plans, free trials, or WhatsApp broadcast features.
            </p>

            {/* Suggestion Cards */}
            <div className="grid grid-cols-2 gap-2 sm:gap-2.5 w-full text-left">
              {suggestions.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(item.prompt)}
                  type="button"
                  className="bg-[#1C2128] border border-white/[0.08] hover:border-[#25D366]/40 hover:bg-[#161B22] p-2 sm:p-2.5 rounded-xl transition-all duration-200 group flex flex-col gap-0.5 hover:-translate-y-0.5 cursor-pointer min-w-0"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="shrink-0 text-xs sm:text-sm">{item.icon}</span>
                    <span className="text-[11px] sm:text-xs font-semibold text-white group-hover:text-[#25D366] transition-colors truncate">
                      {item.label}
                    </span>
                  </div>
                  <span className="text-[9px] text-[#9AA4AF] truncate">Tap to ask</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ================= CONVERSATION MESSAGES ================= */
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className="w-7 h-7 rounded-lg bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] flex items-center justify-center text-xs shrink-0 mt-0.5">
                    <FaRobot />
                  </div>
                )}
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[85%] whitespace-pre-line shadow-sm break-words [word-break:break-word] ${
                    msg.sender === 'user'
                      ? 'bg-[#25D366] text-white font-medium rounded-tr-none'
                      : 'bg-[#1C2128] border border-white/[0.08] text-white/90 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Typing Animation */}
            {isTyping && (
              <div className="flex gap-2.5 justify-start">
                <div className="w-7 h-7 rounded-lg bg-[#25D366]/10 border border-[#25D366]/20 text-[#25D366] flex items-center justify-center text-xs shrink-0">
                  <FaRobot />
                </div>
                <div className="bg-[#1C2128] border border-white/[0.08] px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#25D366] animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 rounded-full bg-[#25D366] animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 rounded-full bg-[#25D366] animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* ================= INPUT AREA ================= */}
      <div className="bg-[#161B22] border-t border-white/[0.08] p-2.5 sm:p-3 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-1.5 sm:gap-2 bg-[#0D1117] border border-white/[0.08] rounded-xl px-2.5 sm:px-3 py-1.5 sm:py-2 focus-within:border-[#25D366] focus-within:ring-1 focus-within:ring-[#25D366]/30 transition-all"
        >
          <button
            type="button"
            className="text-[#9AA4AF] hover:text-white transition-colors p-1"
            title="Attach file (coming soon)"
          >
            <FiPaperclip size={16} />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything about Goye..."
            className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm text-white placeholder:text-[#9AA4AF]"
          />

          <button
            type="submit"
            disabled={!input.trim()}
            className="w-8 h-8 rounded-full bg-[#25D366] hover:bg-[#1EBE5D] disabled:opacity-30 text-white flex items-center justify-center shrink-0 transition-all duration-200 shadow-sm cursor-pointer"
            title="Send message"
          >
            <FiSend size={14} className="ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
