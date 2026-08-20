import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  HelpCircle,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

const AdvisorChat = () => {
  const { chatHistory, sendChatAdvisorMessage, fetchAllFinanceData } = useFinance();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  
  const chatEndRef = useRef(null);

  // Fetch full finance data and chat history on mount
  useEffect(() => {
    fetchAllFinanceData();
  }, [fetchAllFinanceData]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message || message.trim() === '') return;

    const query = message;
    setMessage('');
    setLoading(true);

    await sendChatAdvisorMessage(query);
    setLoading(false);
  };

  const handleChipClick = async (presetText) => {
    setLoading(true);
    await sendChatAdvisorMessage(presetText);
    setLoading(false);
  };

  const promptChips = [
    { text: 'Can I save more this month?', icon: Sparkles },
    { text: 'How is my spending looking?', icon: TrendingUp },
    { text: 'Will I reach my savings goals?', icon: Bot },
    { text: 'Analyze my recurring bills!', icon: Cpu }
  ];

  return (
    <div className="animate-fade-in" style={{
      display: 'flex',
      flexDirection: 'column',
      height: 'calc(100vh - 120px)', // Snug fits under navbar
      gap: '20px'
    }}>
      {/* 1. Rolling Messages Container */}
      <div className="glass-panel" style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '24px',
        overflow: 'hidden'
      }}>
        
        {/* Chat header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          paddingBottom: '14px',
          borderBottom: '1px solid var(--border-glass)',
          marginBottom: '20px'
        }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: 'var(--grad-primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-glow)'
          }}>
            <Bot size={18} style={{ color: '#fff' }} />
          </div>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              Aura AI Coach
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-teal)', boxShadow: '0 0 6px #14b8a6' }} />
            </h3>
            <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Powered by hybrid predictive analytics</p>
          </div>
        </div>

        {/* Rolling message body */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          paddingRight: '6px'
        }}>
          {chatHistory.map((msg, idx) => {
            const isAI = msg.role === 'model';
            return (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  gap: '12px',
                  alignSelf: isAI ? 'flex-start' : 'flex-end',
                  maxWidth: '75%',
                  flexDirection: isAI ? 'row' : 'row-reverse'
                }}
              >
                {/* Avatar Icon */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: isAI ? 'var(--bg-glass-active)' : 'var(--grad-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: isAI ? '1px solid var(--border-glass)' : 'none',
                  flexShrink: 0
                }}>
                  {isAI ? <Bot size={15} style={{ color: 'var(--accent-purple)' }} /> : <User size={15} style={{ color: '#fff' }} />}
                </div>

                {/* Message Bubble */}
                <div style={{
                  padding: '12px 18px',
                  borderRadius: 'var(--radius-lg)',
                  borderTopLeftRadius: isAI ? 0 : 'var(--radius-lg)',
                  borderTopRightRadius: isAI ? 'var(--radius-lg)' : 0,
                  background: isAI ? 'var(--bg-glass)' : 'rgba(124, 58, 237, 0.1)',
                  border: isAI ? '1px solid var(--border-glass)' : '1px solid rgba(124, 58, 237, 0.2)',
                  fontSize: '13px',
                  lineHeight: '1.6',
                  textAlign: 'left',
                  color: 'var(--text-primary)',
                  whiteSpace: 'pre-wrap'
                }}>
                  {msg.text}
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {loading && (
            <div style={{ display: 'flex', gap: '12px', alignSelf: 'flex-start' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-glass-active)', display: 'flex', alignItems: 'center', justify: 'center', border: '1px solid var(--border-glass)' }}>
                <Bot size={15} style={{ color: 'var(--accent-purple)' }} />
              </div>
              <div style={{
                padding: '12px 18px',
                borderRadius: 'var(--radius-lg)',
                borderTopLeftRadius: 0,
                background: 'var(--bg-glass)',
                border: '1px solid var(--border-glass)',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}>
                <span className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)', animation: 'pulse 1s infinite alternate' }} />
                <span className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)', animation: 'pulse 1s infinite alternate 0.2s' }} />
                <span className="dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--text-muted)', animation: 'pulse 1s infinite alternate 0.4s' }} />
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* 2. Chips Actions Panel */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        alignItems: 'center'
      }}>
        {promptChips.map((chip, idx) => {
          const Icon = chip.icon;
          return (
            <button
              key={idx}
              onClick={() => handleChipClick(chip.text)}
              className="glass-panel-interactive"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '16px',
                fontSize: '11px',
                border: '1px solid var(--border-glass)',
                background: 'var(--bg-glass)',
                color: 'var(--text-secondary)',
                transform: 'none'
              }}
              disabled={loading}
            >
              <Icon size={12} style={{ color: 'var(--accent-purple)' }} />
              {chip.text}
            </button>
          );
        })}
      </div>

      {/* 3. Input Message Form */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          placeholder="Ask Aura anything (e.g. 'Can I save more this month?')"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="form-input"
          style={{ padding: '14px 20px', fontSize: '14px' }}
          disabled={loading}
        />
        <button
          type="submit"
          className="btn btn-primary"
          style={{ padding: '0 24px' }}
          disabled={loading}
        >
          <Send size={16} />
        </button>
      </form>

      {/* CSS Animation injection */}
      <style>{`
        @keyframes pulse {
          0% { transform: translateY(0); opacity: 0.3; }
          100% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>

    </div>
  );
};

export default AdvisorChat;
