import React, { useState, useEffect } from 'react';
import { FaTimes, FaPaperPlane, FaLock, FaUser } from 'react-icons/fa';
import './InAppChat.css';

const QUICK_CHIPS = [
  "I'm at the entrance",
  "Wearing a blue jacket",
  "Where are you?",
  "Wait 2 minutes please"
];

const InAppChat = ({ isOpen, onClose, tripId, driverName, socket }) => {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'driver', text: `Hello! I'm on my way to pick you up.`, time: 'Just now' }
  ]);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    if (socket && tripId) {
      const handleChatMessage = (msg) => {
        if (msg.tripId && msg.tripId !== tripId) return;
        setMessages((prev) => [
          ...prev,
          {
            id: msg.id || Date.now() + Math.random(),
            sender: msg.senderRole === 'driver' ? 'driver' : 'passenger',
            text: msg.text,
            time: msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'
          }
        ]);
      };
      socket.on('chat_message', handleChatMessage);
      return () => socket.off('chat_message', handleChatMessage);
    }
  }, [socket, tripId]);

  if (!isOpen) return null;

  const handleSendMessage = (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: 'passenger',
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, newMsg]);
    if (socket && tripId) {
      socket.emit('send_chat', { tripId, message: text });
    }
    if (!textToSend) setInputText('');
  };

  return (
    <div className="chat-drawer-overlay">
      <div className="chat-drawer">
        <div className="chat-header">
          <div className="driver-chat-meta">
            <FaUser className="user-icon" />
            <div>
              <strong>{driverName || 'Driver'}</strong>
              <span className="privacy-badge"><FaLock /> Phone Number Masked</span>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}><FaTimes /></button>
        </div>

        <div className="chat-body">
          {messages.map((m) => (
            <div key={m.id} className={`chat-bubble ${m.sender}`}>
              <p>{m.text}</p>
              <span className="chat-time">{m.time}</span>
            </div>
          ))}
        </div>

        <div className="quick-chips">
          {QUICK_CHIPS.map((chip, i) => (
            <button key={i} className="chip-btn" onClick={() => handleSendMessage(chip)}>
              {chip}
            </button>
          ))}
        </div>

        <div className="chat-input-row">
          <input
            type="text"
            placeholder="Type message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <button className="send-btn" onClick={() => handleSendMessage()}>
            <FaPaperPlane />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InAppChat;
