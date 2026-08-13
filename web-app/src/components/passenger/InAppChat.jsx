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

const toViewItem = (m) => ({
  id: m.id,
  sender: m.senderRole === 'driver' ? 'driver' : 'passenger',
  text: m.text,
  time: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'
});

const mergeMessages = (prev, incoming) => {
  const result = [...prev];
  for (const item of incoming) {
    const duplicate = result.some(
      (p) => p.id === item.id || (p.text === item.text && p.sender === item.sender)
    );
    if (!duplicate) result.push(item);
  }
  return result;
};

const InAppChat = ({ isOpen, onClose, tripId, driverName, socket, role = 'passenger' }) => {
  const { markTripRead } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const QUICK_CHIPS = role === 'driver' ? DRIVER_CHIPS : PASSENGER_CHIPS;
  const isLive = !!socket?.connected;

  // Load persisted chat history each time the modal opens for a trip
  useEffect(() => {
    if (isOpen && tripId) {
      setMessages([]);
      chatAPI.getMessages(tripId, { limit: 200 })
        .then((res) => setMessages((res.data?.messages || []).map(toViewItem)))
        .catch(() => {});
      markTripRead(tripId);
    }
  }, [isOpen, tripId, markTripRead]);

  // Fallback polling so messages still appear when the WebSocket is unavailable
  useEffect(() => {
    if (!isOpen || !tripId) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const res = await chatAPI.getMessages(tripId, { limit: 200 });
        if (!cancelled) {
          setMessages((prev) => mergeMessages(prev, (res.data?.messages || []).map(toViewItem)));
        }
      } catch (error) { /* ignore */ }
    };
    const timer = setInterval(poll, 4000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [isOpen, tripId]);

  useEffect(() => {
    if (socket && tripId) {
      const eventName = role === 'driver' ? 'trip_message' : 'chat_message';
      const handleChatMessage = (msg) => {
        if (msg.tripId && msg.tripId !== tripId) return;
        setMessages((prev) => mergeMessages(prev, [toViewItem(msg)]));
      };
      socket.on(eventName, handleChatMessage);
      return () => socket.off(eventName, handleChatMessage);
    }
  }, [socket, tripId, role]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    if (socket?.connected && tripId) {
      setMessages((prev) => [...prev, {
        id: Date.now(),
        sender: role,
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
      socket.emit('send_chat', { tripId, message: text });
    } else if (tripId) {
      try {
        const res = await chatAPI.sendMessage(tripId, text);
        if (res.data?.message) setMessages((prev) => mergeMessages(prev, [toViewItem(res.data.message)]));
      } catch (error) {
        setMessages((prev) => mergeMessages(prev, [{
          id: Date.now(),
          sender: role,
          text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]));
      }
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
              <span className={`chat-conn ${isLive ? 'chat-conn-on' : 'chat-conn-off'}`}>
                {isLive ? 'Live' : 'Reconnecting…'}
              </span>
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
