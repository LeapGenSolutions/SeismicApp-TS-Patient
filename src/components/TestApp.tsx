import { useState } from 'react';
import VideoCall from './VideoCall';

const TestApp = () => {
  const [submitted, setSubmitted] = useState(false);
  const [userName, setUserName] = useState('');
  const [role, setRole] = useState<'doctor' | 'patient'>('patient');
  const [meetingId, setMeetingId] = useState('test-meeting-123');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      setSubmitted(true);
    } else {
      alert('Please enter your name');
    }
  };

  return (
    <>
      {!submitted ? (
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            maxWidth: '400px',
            margin: 'auto',
            gap: '1rem',
          }}
        >
          <h2 style={{ textAlign: 'center' }}>Join a Video Call</h2>

          <label>
            Your Name:
            <input
              type="text"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </label>

          <label>
            Role:
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'doctor' | 'patient')}
              style={{ width: '100%' }}
            >
              <option value="doctor">Doctor</option>
              <option value="patient">Patient</option>
            </select>
          </label>

          <label>
            Meeting ID:
            <input
              type="text"
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </label>

          <button type="submit" style={{ padding: '0.5rem', fontSize: '1rem' }}>
            Join Call
          </button>
        </form>
      ) : (
        <VideoCall userName={userName} role={role} meetingId={meetingId} />
      )}
    </>
  );
};

export default TestApp;
