import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaArrowLeft, FaPaperPlane, FaUser, FaHome, FaListUl, FaWallet } from 'react-icons/fa';
import './Pages.css';

const ChatPage = () => {
  const navigate = useNavigate();
  const { socket, user, chatMessages, loadTripMessages, markTripRead } = useAuth();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const tripId = sessionStorage.getItem('activeTripId');
  const passengerName = sessionStorage.getItem('chatPassengerName') || 'Passenger';
  const tripMessages = chatMessages[tripId] || [];
  const [localSent, setLocalSent] = useState([]);
  const messages = [...tripMessages, ...localSent];

  // Load persisted history from the server (survives page switches / reloads)
  useEffect(() => {
    if (!socket || !tripId) return;
    socket.emit('join_trip', tripId);
    loadTripMessages(tripId).catch(() => {});
    markTripRead(tripId);
    return () => {
      socket.emit('leave_trip', tripId);
    };
  }, [socket, tripId, loadTripMessages, markTripRead]);

  // Keep unread clear while the chat is open (live messages arrive via context)
  useEffect(() => {
    if (tripId && tripMessages.length > 0) markTripRead(tripId);
  }, [tripMessages.length, tripId, markTripRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = useCallback(() => {
    if (!input.trim() || !socket || !tripId || !user) return;

    const localMsg = {
      tripId,
      text: input.trim(),
      senderId: user._id,
      senderRole: 'driver',
      timestamp: new Date().toISOString(),
      isOwn: true
    };

    // Optimistic local echo (the backend routes this message to the passenger only)
    socket.emit('trip_message', { tripId, text: localMsg.text });
    setLocalSent((prev) => [...prev, localMsg]);
    setInput('');
  }, [input, socket, tripId, user]);

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
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-bar">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="chat-input"
        />
        <button className="chat-send-btn" onClick={handleSend} disabled={!input.trim()}>
          <FaPaperPlane />
        </button>
      </div>

      <nav className="bottom-nav">
        <button className="nav-btn" onClick={() => navigate('/')}>
          <FaHome /> <span>Home</span>
        </button>
        <button className="nav-btn" onClick={() => navigate('/trips')}>
          <FaListUl /> <span>Trips</span>
        </button>
        <button className="nav-btn" onClick={() => navigate('/earnings')}>
          <FaWallet /> <span>Earnings</span>
        </button>
        <button className="nav-btn" onClick={() => navigate('/profile')}>
          <FaUser /> <span>Profile</span>
        </button>
      </nav>
    </div>
  );
};

export default ChatPage;