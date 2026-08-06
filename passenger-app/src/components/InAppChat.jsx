import React, { useState, useEffect, useRef } from 'react';
import { FaPaperPlane, FaTimes, FaComments, FaShieldAlt } from 'react-icons/fa';
import { ridesAPI } from '../services/api';
import './InAppChat.css';

const QUICK_CHIPS = [
  "I'm standing outside",
  "Wearing a blue jacket",
  "Near the main bank entrance",
  "I'll be there in 1 min",
  "Please wait for me"
];

const InAppChat = ({ isOpen, onClose, tripId, driverName, socket }) => {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'driver', text: `Hello! I'm on my way to pick you up.`, timestamp: 'Just now' }
  ]);
  const [inputText, setInputText] = useState('');
  const chatBottomRef = useRef(null);

  useEffect(() => {
    if (socket && tripId) {
      const handleChatMessage = (msgData) => {
        if (msgData.tripId === tripId) {
          setMessages((prev) => [...prev, msgData]);
        }
      };

      socket.on('chat_message', handleChatMessage);
      return () => socket.off('chat_message', handleChatMessage);
    }
  }, [socket, tripId]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!isOpen) return null;

  const handleSend = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: 'passenger',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    if (socket) {
      socket.emit('send_chat_message', { tripId, message: text.trim() });
    }

    try {
      await ridesAPI.getTripDetails(tripId);
    } catch (err) {
      console.warn('Chat record sync:', err);
    }
  };

  return (
    <div className="chat-drawer-overlay">
      <div className="chat-drawer">
        <div className="chat-header">
          <div className="driver-chat-meta">
            <FaComments className="chat-icon-head" />
            <div>
              <h4>Chat with {driverName || 'Driver'}</h4>
              <span className="privacy-badge"><FaShieldAlt /> Phone Number Masked</span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><FaTimes /></button>
        </div>

        <div className="chat-messages-body">
          {messages.map((m) => (
            <div key={m.id} className={`chat-bubble-row ${m.sender === 'passenger' ? 'me' : 'them'}`}>
              <div className="chat-bubble">
                <p>{m.text}</p>
                <span className="chat-time">{m.timestamp}</span>
              </div>
            </div>
          ))}
          <div ref={chatBottomRef} />
        </div>

        <div className="quick-chips-bar">
          {QUICK_CHIPS.map((chip, idx) => (
            <button key={idx} className="chip-btn" onClick={() => handleSend(chip)}>
              {chip}
            </button>
          ))}
        </div>

        <div className="chat-input-bar">
          <input
            type="text"
            placeholder="Type a message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <button className="send-msg-btn" onClick={() => handleSend()}>
            <FaPaperPlane />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InAppChat;
