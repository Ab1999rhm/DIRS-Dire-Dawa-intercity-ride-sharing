import React, { useState, useEffect } from 'react';
import { FaTimes, FaPaperPlane, FaLock, FaUser } from 'react-icons/fa';
import { chatAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './InAppChat.css';

const PASSENGER_CHIPS = [
  "I'm at the entrance",
  "Wearing a blue jacket",
  "Where are you?",
  "Wait 2 minutes please"
];

const DRIVER_CHIPS = [
  "I'm at the pickup location",
  "How will I recognize you?",
  "I've arrived",
  "On my way now"
];

const InAppChat = ({ isOpen, onClose, tripId, driverName, socket, role = 'passenger' }) => {
  const { markTripRead } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const QUICK_CHIPS = role === 'driver' ? DRIVER_CHIPS : PASSENGER_CHIPS;

  // Load persisted chat history each time the modal opens for a trip
  useEffect(() => {
    if (isOpen && tripId) {
      setMessages([]);
      chatAPI.getMessages(tripId, { limit: 200 })
        .then((res) => {
          const history = (res.data?.messages || []).map((m) => ({
            id: m.id,
            sender: m.senderRole === 'driver' ? 'driver' : 'passenger',
            text: m.text,
            time: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'
          }));
          setMessages(history);
        })
        .catch(() => {});
      markTripRead(tripId);
    }
  }, [isOpen, tripId, markTripRead]);

  useEffect(() => {
    if (socket && tripId) {
      const eventName = role === 'driver' ? 'trip_message' : 'chat_message';
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
      socket.on(eventName, handleChatMessage);
      return () => socket.off(eventName, handleChatMessage);
    }
  }, [socket, tripId, role]);

  if (!isOpen) return null;

  const handleSendMessage = (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: role,
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
