import { useState } from "react";
import { useParams } from "react-router-dom";
import VideoCall from "./VideoCall";
import "../styles/TestApp.css";


const TestApp = () => {
  const [submitted, setSubmitted] = useState(false);
  const [userName, setUserName] = useState("");
  const role = "patient";
  const { appointmentId } = useParams();
  const [meetingId, setMeetingId] = useState(appointmentId!== undefined ? appointmentId : "");
  console.log(appointmentId);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      setSubmitted(true);
    } else {
      alert("Please enter your name");
    }
  };

  return (
    <div className="container">
      {!submitted ? (
        <form className="form" onSubmit={handleSubmit}>
          <h2>Join a Video Call</h2>

          <label>
            Your Name:
            <input
              type="text"
              value={userName}
              placeholder="Enter your name"
              onChange={(e) => setUserName(e.target.value)}
              required
            />
          </label>

          <label>
            Meeting ID:
            <input
              type="text"
              value={meetingId}
              placeholder="Enter Meeting ID"
              onChange={(e) => setMeetingId(e.target.value)}
              readOnly={!!appointmentId}
              required
            />
          </label>

          <button type="submit">Join Call</button>
        </form>
      ) : (
        <VideoCall userName={userName} role={role} meetingId={meetingId} />
      )}
    </div>
  );
};

export default TestApp;
