import React, { useState, useEffect } from 'react';
import { FaTimes, FaPaperPlane, FaLock, FaUser, FaEdit, FaTrashAlt, FaCheck, FaTimes as FaCancel } from 'react-icons/fa';
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
  edited: Boolean(m.edited),
  deleted: Boolean(m.deleted),
  time: m.timestamp ? new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'
});

const mergeMessages = (prev, incoming) => {
  const result = [...prev];
  for (const item of incoming) {
    const idx = result.findIndex((p) => p.id === item.id);
    if (idx >= 0) {
      result[idx] = item;
    } else {
      const duplicate = result.some(
        (p) => p.text === item.text && p.sender === item.sender
      );
      if (!duplicate) result.push(item);
    }
  }
  return result;
};

const STATUS_LABELS = {
  in_progress: 'Trip in progress',
  driver_arriving: 'Driver arriving',
  driver_arrived: 'Driver arrived',
  completed: 'Trip completed',
  cancelled: 'Trip cancelled'
};

const InAppChat = ({ isOpen, onClose, tripId, driverName, socket, role = 'passenger', tripStatus, route }) => {
  const { markTripRead } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const QUICK_CHIPS = role === 'driver' ? DRIVER_CHIPS : PASSENGER_CHIPS;
  const isLive = !!socket?.connected;
  const statusLabel = tripStatus ? (STATUS_LABELS[tripStatus] || tripStatus) : '';

  // Load persisted chat history each time the modal opens for a trip
  useEffect(() => {
    if (isOpen && tripId) {
      setMessages([]);
      setEditingId(null);
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
      const handleChatEdited = (msg) => {
        if (msg.tripId && msg.tripId !== tripId) return;
        setMessages((prev) => mergeMessages(prev, [toViewItem(msg)]));
      };
      socket.on(eventName, handleChatMessage);
      socket.on('chat_edited', handleChatEdited);
      socket.on('chat_deleted', handleChatEdited);
      return () => {
        socket.off(eventName, handleChatMessage);
        socket.off('chat_edited', handleChatEdited);
        socket.off('chat_deleted', handleChatEdited);
      };
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
        edited: false,
        deleted: false,
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
          edited: false,
          deleted: false,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]));
      }
    }

    if (!textToSend) setInputText('');
  };

  const handleEdit = (m) => {
    if (m.sender !== role || m.deleted) return;
    setEditingId(m.id);
    setEditText(m.text);
  };

  const saveEdit = async () => {
    const text = editText.trim();
    if (!text) return;
    try {
      const res = await chatAPI.editMessage(editingId, text);
      if (res.data?.message) setMessages((prev) => mergeMessages(prev, [toViewItem(res.data.message)]));
      setEditingId(null);
    } catch (error) {
      window.alert('Could not edit the message. Please try again.');
    }
  };

  const handleDelete = async (m) => {
    if (m.sender !== role || m.deleted) return;
    if (!window.confirm('Delete this message?')) return;
    try {
      const res = await chatAPI.deleteMessage(m.id);
      if (res.data?.message) setMessages((prev) => mergeMessages(prev, [toViewItem(res.data.message)]));
    } catch (error) {
      window.alert('Could not delete the message. Please try again.');
    }
  };

  return (
    <div className="chat-drawer-overlay">
      <div className="chat-drawer">
        <div className="chat-header">
          <div className="driver-chat-meta">
            <FaUser className="user-icon" />
            <div>
              <strong>{driverName || 'Driver'}</strong>
              <div className="chat-trip-line">
                {statusLabel && <span className={`trip-status trip-status-${tripStatus}`}>{statusLabel}</span>}
                {route && <span className="trip-route">{route}</span>}
              </div>
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
            <div key={m.id} className={`chat-bubble ${m.sender} ${m.deleted ? 'chat-deleted' : ''}`}>
              {editingId === m.id ? (
                <div className="chat-edit-row">
                  <input
                    autoFocus
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEdit();
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                  />
                  <button className="chat-edit-save" onClick={saveEdit} title="Save"><FaCheck /></button>
                  <button className="chat-edit-cancel" onClick={() => setEditingId(null)} title="Cancel"><FaCancel /></button>
                </div>
              ) : m.deleted ? (
                <p className="chat-deleted-msg">This message was deleted</p>
              ) : (
                <>
                  <p>{m.text}</p>
                  <span className="chat-time">
                    {m.time}{m.edited ? ' • edited' : ''}
                  </span>
                </>
              )}
              {!m.deleted && m.sender === role && editingId !== m.id && (
                <div className="chat-msg-actions">
                  <button onClick={() => handleEdit(m)} title="Edit"><FaEdit /></button>
                  <button onClick={() => handleDelete(m)} title="Delete"><FaTrashAlt /></button>
                </div>
              )}
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
