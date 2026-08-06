import React, { useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import './Modal.css';

const Modal = ({ isOpen, onClose, title, children, size = 'md', showClose = true }) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content modal-${size}`} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          {showClose && (
            <button className="modal-close" onClick={onClose}>
              <FaTimes />
            </button>
          )}
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
};

export const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = false }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <div className="modal-message">{typeof message === 'object' && message?.message ? message.message : message}</div>
    <div className="modal-actions" style={{ paddingBottom: '4px' }}>
      <button className="btn btn-ghost btn-animated" onClick={onClose} style={{ minWidth: '90px' }}>Cancel</button>
      <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'} btn-animated btn-glow`} onClick={onConfirm} style={{ minWidth: '140px' }}>
        <span className="btn-text">{confirmText}</span>
        <span className="btn-shine"></span>
      </button>
    </div>
  </Modal>
);

export default Modal;
