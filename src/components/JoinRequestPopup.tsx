import React from 'react';

type JoinRequestPopupProps = {
  patientName: string;
  onAccept: () => void;
  onReject: () => void;
};

const JoinRequestPopup: React.FC<JoinRequestPopupProps> = ({ patientName, onAccept, onReject }) => {
  return (
    <div style={popupStyles.container}>
      <div style={popupStyles.message}>
        <strong>{patientName}</strong> wants to join the call.
      </div>
      <div style={popupStyles.actions}>
        <button style={popupStyles.accept} onClick={onAccept}>Accept</button>
        <button style={popupStyles.reject} onClick={onReject}>Reject</button>
      </div>
    </div>
  );
};

const popupStyles = {
  container: {
    position: 'fixed' as const,
    bottom: '20px',
    right: '20px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
    padding: '16px',
    zIndex: 9999,
    animation: 'slideIn 0.3s ease-out',
    maxWidth: '300px',
  },
  message: {
    marginBottom: '12px',
    fontSize: '16px',
  },
  actions: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'flex-end',
  },
  accept: {
    backgroundColor: '#4CAF50',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  reject: {
    backgroundColor: '#f44336',
    color: '#fff',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
  },
};

export default JoinRequestPopup;
