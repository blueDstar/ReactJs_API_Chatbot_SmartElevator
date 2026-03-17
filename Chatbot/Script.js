import React, { useEffect, useRef, useState } from 'react';
import './Style.scss';

function Script() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBackendOnline, setIsBackendOnline] = useState(false);

  const chatMessagesRef = useRef(null);
  const textareaRef = useRef(null);
  const sessionIdRef = useRef(`session_${Date.now()}`);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
    checkBackendHealth();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const checkBackendHealth = async () => {
    try {
      const response = await fetch('http://localhost:5432/api/health');
      const data = await response.json();
      setIsBackendOnline(Boolean(data.success));
    } catch (error) {
      setIsBackendOnline(false);
    }
  };

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (chatMessagesRef.current) {
        chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
      }
    });
  };

  const autoResizeTextarea = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
  };

  const handleInputChange = (e) => {
    setMessage(e.target.value);
    setTimeout(autoResizeTextarea, 0);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (message.trim() && !isLoading) {
        sendMessage();
      }
    }
  };

  const escapeHtml = (text) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  };

  const formatMessage = (content) => {
    let formatted = escapeHtml(content);

    formatted = formatted.replace(/```(\w*)\n?([\s\S]*?)```/g, (_, __, code) => {
      return `<pre><code>${code.trim()}</code></pre>`;
    });

    formatted = formatted.replace(/`([^`]+)`/g, '<code>$1</code>');
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/\n/g, '<br>');

    return `<p>${formatted}</p>`;
  };

  const appendMessage = (role, content) => {
    setMessages((prev) => [...prev, { role, content }]);
  };

  const sendMessage = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || isLoading) return;

    appendMessage('user', trimmedMessage);
    setMessage('');
    setIsLoading(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const response = await fetch('http://localhost:5432/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: trimmedMessage,
          session_id: sessionIdRef.current,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        appendMessage('error', data.error || 'Yêu cầu thất bại.');
        return;
      }

      if (data.success) {
        appendMessage('assistant', data.message || 'Không có nội dung trả về.');
      } else {
        appendMessage('error', data.error || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Send message error:', error);
      appendMessage('error', 'Không thể kết nối đến backend. Vui lòng kiểm tra server Flask.');
      setIsBackendOnline(false);
    } finally {
      setIsLoading(false);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  const clearChat = async () => {
    setMessages([]);

    try {
      await fetch('http://localhost:5432/api/clear', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          session_id: sessionIdRef.current,
        }),
      });
    } catch (error) {
      console.error('Clear history error:', error);
    }

    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  return (
    <div className="app-container">
      <div className="bg-animation">
        <div className="bg-gradient"></div>
        <div className="bg-orbs">
          <div className="orb orb-1"></div>
          <div className="orb orb-2"></div>
          <div className="orb orb-3"></div>
        </div>
      </div>

      <div className="chat-container">
        <header className="chat-header">
          <div className="header-content">
            <div className="logo">
              <div className="logo-icon">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"
                    fill="currentColor"
                  />
                </svg>
              </div>

              <div className="logo-text">
                <h1>VanDat Chatbot AI</h1>
                <span className="status">
                  <span className="status-dot"></span>
                  {isBackendOnline ? 'Backend Online' : 'Backend Offline'}
                </span>
              </div>
            </div>

            <button className="clear-btn" onClick={clearChat} title="Xóa lịch sử chat">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>
        </header>

        <main className="chat-messages" ref={chatMessagesRef}>
          {messages.length === 0 && !isLoading && (
            <div className="welcome-message">
              <div className="welcome-icon">👋</div>
              <h2>Xin chào!</h2>
              <p>Tôi là VanDatbot, trợ lý AI của bạn. Hãy hỏi tôi bất cứ điều gì!</p>
            </div>
          )}

          {messages.map((msg, index) => {
            if (msg.role === 'error') {
              return (
                <div key={index} className="error-message">
                  {msg.content}
                </div>
              );
            }

            return (
              <div key={index} className={`message ${msg.role}`}>
                <div className="message-avatar">
                  {msg.role === 'user' ? '👤' : '🤖'}
                </div>
                <div
                  className="message-content"
                  dangerouslySetInnerHTML={{ __html: formatMessage(msg.content) }}
                />
              </div>
            );
          })}

          {isLoading && (
            <div className="typing-indicator">
              <div className="message-avatar">🤖</div>
              <div className="typing-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
        </main>

        <footer className="chat-input-area">
          <div className="input-container">
            <textarea
              ref={textareaRef}
              placeholder="Nhập tin nhắn của bạn..."
              rows="1"
              value={message}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button
              className="send-btn"
              onClick={sendMessage}
              disabled={!message.trim() || isLoading}
              title="Gửi tin nhắn"
            >
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="currentColor" />
              </svg>
            </button>
          </div>
          <p className="input-hint">Nhấn Enter để gửi, Shift+Enter để xuống dòng</p>
        </footer>
      </div>
    </div>
  );
}

export default Script;