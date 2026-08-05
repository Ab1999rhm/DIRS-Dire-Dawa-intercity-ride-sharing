import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaArrowLeft, FaPaperPlane, FaUser } from 'react-icons/fa';
import { toast } from 'react-toastify';
import './Pages.css';

const ChatPage = () => {
  const navigate = useNavigate();
  const { socket } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const tripId = sessionStorage.getItem('activeTripId');
  const passengerName = sessionStorage.getItem('chatPassengerName') || 'Passenger';

  useEffect(() => {
    if (socket && tripId) {
      socket.emit('join_trip', tripId);

      socket.on('trip_message', (data) => {
        setMessages(prev => [...prev, { ...data, isOwn: false }]);
      });

      socket.on('user_typing', (data) => {
        if (!data.isOwn) {
          setTyping(true);
          setTimeout(() => setTyping(false), 3000);
        }
      });

      return () => {
        socket.off('trip_message');
        socket.off('user_typing');
        socket.emit('leave_trip', tripId);
      };
    }
  }, [socket, tripId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !socket || !tripId) return;

    const message = {
      tripId,
      text: input.trim(),
      senderId: 'driver',
      timestamp: new Date().toISOString()
    };

    socket.emit('trip_message', message);
    setMessages(prev => [...prev, { ...message, isOwn: true }]);
    setInput('');
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (socket && tripId) {
      socket.emit('typing', { tripId, isTyping: true });
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing', { tripId, isTyping: false });
      }, 2000);
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
          <div className="chat-avatar"><FaUser /></div>
          <span className="chat-user-name">{passengerName}</span>
        </div>
        <span className="spacer" />
      </header>

      <div className="chat-messages">
        {messages.length === 0 && (
          <div className="chat-empty">
            <p>Start a conversation with {passengerName}</p>
            <div className="quick-replies">
              {['I am on my way', 'I have arrived', 'Please wait a moment'].map((msg) => (
                <button key={msg} className="quick-reply" onClick={() => { setInput(msg); }}>
                  {msg}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.isOwn ? 'own' : 'other'}`}>
            <p>{msg.text}</p>
            <span className="chat-time">
              {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        {typing && (
          <div className="chat-bubble other typing-bubble">
            <span className="typing-dots">...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-bar">
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="chat-input"
        />
        <button className="chat-send-btn" onClick={handleSend} disabled={!input.trim()}>
          <FaPaperPlane />
        </button>
      </div>
    </div>
  );
};

export default ChatPage;
