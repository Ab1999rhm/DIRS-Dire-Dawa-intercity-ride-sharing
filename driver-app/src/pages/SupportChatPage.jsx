import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaPaperPlane, FaUser, FaHeadset } from 'react-icons/fa';
import { toast } from 'react-toastify';
import api from '../services/api';
import './Pages.css';

const SupportChatPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([
    { sender: 'support', text: 'Hello! How can we help you today?', timestamp: new Date().toISOString() }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: 'user', text: input.trim(), timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

    try {
      await api.post('/notifications', {
        type: 'support_message',
        title: 'Support Message',
        message: input.trim(),
        channel: 'in_app'
      });

      setTimeout(() => {
        setMessages(prev => [...prev, {
          sender: 'support',
          text: 'Thank you for your message. Our support team will respond shortly. You can also reach us at support@dirs.et',
          timestamp: new Date().toISOString()
        }]);
      }, 1500);
    } catch (error) {
      console.error('Support message error:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="page-container chat-page">
      <header className="page-header chat-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </button>
        <div className="chat-user-info">
          <div className="chat-avatar support-avatar"><FaHeadset /></div>
          <span className="chat-user-name">Support Team</span>
        </div>
        <span className="spacer" />
      </header>

      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.sender === 'user' ? 'own' : 'other'}`}>
            <p>{msg.text}</p>
            <span className="chat-time">
              {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-bar">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Describe your issue..."
          className="chat-input"
        />
        <button className="chat-send-btn" onClick={handleSend} disabled={!input.trim()}>
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
};

export default SupportChatPage;
