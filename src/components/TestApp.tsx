
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../styles/TestApp.css";

const TestApp = () => {
  const [submitted, setSubmitted] = useState(false);
  const [userName, setUserName] = useState("");
  const nav = useNavigate();
  const role = "patient";
  const { appointmentId } = useParams();
  const [meetingId, setMeetingId] = useState(
    appointmentId !== undefined ? appointmentId : ""
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (userName.trim()) {
      setSubmitted(true);
    } else {
      alert("Please enter your name");
    }
  };

  useEffect(() => {
    if (submitted) {
      nav(`/video-call/${meetingId}/${userName}/${role}`, {
        replace: true,});
    }
  }, [submitted, meetingId, nav]);

  return (
    <div className="page-wrapper">
      <div className="background-shapes">
        <div className="shape shape1"></div>
        <div className="shape shape2"></div>
        <div className="shape shape3"></div>
      </div>
      {!submitted ? (
        <div className="form-container">
          <form className="form" onSubmit={handleSubmit}>
            <h2 className="title">Join a Video Call</h2>

            <label className="fieldLabel">
              Your Name:
              <input
                className="input"
                type="text"
                value={userName}
                placeholder="Enter your name"
                onChange={(e) => setUserName(e.target.value)}
                required
              />
            </label>

            <label className="fieldLabel">
              {appointmentId ? "Meeting ID (read-only):" : "Meeting ID:"}
              <input
                type="text"
                value={meetingId}
                className="input"
                placeholder="Enter Meeting ID"
                onChange={(e) => setMeetingId(e.target.value)}
                readOnly={appointmentId !== undefined}
                style={{backgroundColor:appointmentId !== undefined ? "gray":"white", 
                  color:appointmentId !== undefined ? "white":"black"}}
                required
              />
            </label>
            <button type="submit" className="button">
              Join Call
            </button>
          </form>
        </div>
      ) : (
        null
      )}
    </div>
  );
};

export default TestApp;
