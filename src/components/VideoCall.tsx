import {
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  type User,
} from "@stream-io/video-react-sdk";
import axios from "axios";
import { useEffect, useState } from "react";
import MyUILayout from "./MyUILayout";
import { useParams } from "react-router-dom";

const getToken = async (userId: string): Promise<string | null> => {
  try {
    const response = await axios.post(
      "https://seismic-backend-04272025-bjbxatgnadguabg9.centralus-01.azurewebsites.net/get-token",
      { userId }
    );
    return response.data.token;
  } catch (error) {
    console.error("Error fetching token:", error);
    return null;
  }
};

const VideoCall = () => {
  const apiKey = "72499ykcfb3z";
  const { userName, appointmentId, role } = useParams<{ userName?: string; appointmentId?: string; role?: "doctor" | "patient" }>();
  const callId = appointmentId ?? "default-call-id"; // Fallback to a default call ID if not provided
  const userId = (userName ?? "").replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<any>(null);
  const [showCall, setShowCall] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rejected, setRejected] = useState(false);
  const [waitingApproval, setWaitingApproval] = useState(false);
  const [popupVisible, setPopupVisible] = useState(false);
  const [requestingUser, setRequestingUser] = useState<User | null>(null);
  const [doctorNotAvailable, setDoctorNotAvailable] = useState(false);

  // Show browser notification
  const showBrowserNotification = (name: string) => {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      const notif = new Notification(`${name} wants to join the call`, {
        body: "Click here to approve.",
        icon: "https://static.wikia.nocookie.net/starwars/images/4/4c/Satele_Shan.png",
      });
      notif.onclick = () => {
        window.focus();
        setPopupVisible(true); // Show in-app popup as well on click
      };
    }
  };

  // Approve / Reject handlers
  const handleApprove = () => {
    if (!call || !requestingUser) return;
    call.sendCustomEvent({ type: "join-accepted", user: requestingUser });
    setPopupVisible(false);
    setRequestingUser(null);
  };

  const handleReject = () => {
    if (!call || !requestingUser) return;
    call.sendCustomEvent({ type: "join-rejected", user: requestingUser });
    setPopupVisible(false);
    setRequestingUser(null);
  };

  useEffect(() => {
    let isMounted = true;

    const setupCall = async () => {
      setLoading(true);
      const token = await getToken(userId);
      if (!token) {
        setLoading(false);
        return;
      }

      const videoClient = new StreamVideoClient({
        apiKey,
        user: { id: userId, name: userName },
        token,
      });

      const videoCall = videoClient.call("default", callId);

      if (role === "doctor") {
        await videoCall.join({
          create: true,
          data: {
            settings_override: {
              recording: {
                quality: "360p",
                mode: "available",
              },
            },
          },
        });

        videoCall.on("custom", (event) => {
          if (event.custom?.type === "join-request") {
            const name = event.user?.name || "A patient";
            setRequestingUser(event.user || null);
            setPopupVisible(true);
            showBrowserNotification(name);
          }
        });

        if (isMounted) {
          setClient(videoClient);
          setCall(videoCall);
          setShowCall(true);
          setLoading(false);
        }
      } else {
        const proceedToJoinFlow = (count: number) => {
            console.log("Proceeding to join flow with participant count:", count);
            
            if (count >= 2) {
              setShowCall(false);
              setLoading(false);
              
              setTimeout(() => {
                window.location.href = `/${callId}`;
              }, 5000);
              return;
            }

            videoCall.sendCustomEvent({
              type: "join-request",
              user: { id: userId, name: userName },
            });
            setWaitingApproval(true);

            videoCall.on("custom", async (event) => {
              if (event.custom.type === "join-accepted") {
                await videoCall.join();
                if (isMounted) {
                  setClient(videoClient);
                  setCall(videoCall);
                  setShowCall(true);
                  setWaitingApproval(false);
                  setLoading(false);
                }
              }
              if (event.custom.type === "join-rejected") {
                setWaitingApproval(false);
                setRejected(true);
                setLoading(false);
              }
            });
          };
        try {
          await videoCall.get();
          let count = videoCall.state.participantCount;
          console.log("Participant count:", count);

          if (count === 0) {
            setDoctorNotAvailable(true);
            setShowCall(false);
            setLoading(false);
            const intervalId = setInterval(async () => {
              await videoCall.get();
              count = videoCall.state.participantCount;
              console.log("Checking if doctor is available... ", count);
              if (count > 0) {
                clearInterval(intervalId);
                setDoctorNotAvailable(false);
                proceedToJoinFlow(count); // 👈 Now run rest of logic when doctor is available
              }
            }, 5000);
            return;
          }

          proceedToJoinFlow(count); // 👈 Run it immediately if doctor is already available
        } catch (e) {
          console.error(
            "Call does not exist yet, waiting for doctor to create it"
          );
          setWaitingApproval(false);
          setDoctorNotAvailable(true);
          setShowCall(false);
          setLoading(false);
          const intervalId = setInterval(async () => {
            console.log("Checking if call exists...");
            try {
              await videoCall.get();
              var count = videoCall.state.participantCount;
              if (count > 0) {
                clearInterval(intervalId);
                setDoctorNotAvailable(false);
                proceedToJoinFlow(count); // 👈 call logic after doctor joins
              }
            } catch (e) {
              console.error("Call does not exist yet");
            }
          }, 5000);
        }
      }
    };

    setupCall();

    return () => {
      isMounted = false;
      if (call) call.leave();
    };
  }, [userId, callId, role]);

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          /* Popup container */
          .join-request-popup {
            position: fixed;
            bottom: 1.5rem;
            right: 1.5rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.15);
            padding: 1rem 1.5rem;
            display: flex;
            align-items: center;
            gap: 1rem;
            z-index: 99999;
            width: 300px;
            font-family: Arial, sans-serif;
          }
          .join-request-popup button {
            cursor: pointer;
            border: none;
            padding: 0.4rem 0.8rem;
            border-radius: 4px;
            font-weight: 600;
            font-size: 0.9rem;
            color: white;
          }
          .join-request-popup button.approve {
            background-color: #4caf50;
          }
          .join-request-popup button.reject {
            background-color: #f44336;
          }
        `}
      </style>

      {loading && !waitingApproval && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(255,255,255,0.85)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              border: "8px solid #f3f3f3",
              borderTop: "8px solid #3498db",
              borderRadius: "50%",
              width: "60px",
              height: "60px",
              animation: "spin 1s linear infinite",
              marginBottom: "24px",
            }}
          />
          <div style={{ fontSize: "1.2rem", color: "#222" }}>
            Loading, please wait...
          </div>
        </div>
      )}

      {!loading && rejected && (
        <div style={{
          position: 'fixed', top: 0, left: 0,
          width: '100vw', height: '100vh',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '2rem', textAlign: 'center',
          zIndex: 9999
        }}>
          ❌ Your request was rejected by the doctor.
        </div>
      )}

      {waitingApproval && (
        <div style={{
          position: 'fixed', top: 0, left: 0,
          width: '100vw', height: '100vh',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '2rem', textAlign: 'center',
          zIndex: 9999
        }}>
          ⌛ Waiting for doctor’s approval...
        </div>
      )}

      {doctorNotAvailable && (
        <div style={{
          position: 'fixed', top: 0, left: 0,
          width: '100vw', height: '100vh',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '2rem', textAlign: 'center',
          zIndex: 9999
        }}>
          ⚠️ The doctor is not available. You will be joining the call once they are ready.
        </div>
      )}

      {!loading && !showCall && !waitingApproval && !rejected && !doctorNotAvailable && (
        <div style={{
          position: 'fixed', top: 0, left: 0,
          width: '100vw', height: '100vh',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '2rem', textAlign: 'center',
          zIndex: 9999
        }}>
          ⚠️ The call is currently full. You will be redirected in 5 seconds...
        </div>
      )}

      {popupVisible && requestingUser && (
        <div
          className="join-request-popup"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <span>{requestingUser.name} wants to join the call</span>
          <button
            className="approve"
            onClick={handleApprove}
            aria-label="Approve join request"
          >
            Approve
          </button>
          <button
            className="reject"
            onClick={handleReject}
            aria-label="Reject join request"
          >
            Reject
          </button>
        </div>
      )}

      {!loading && showCall && client && call && (
        <StreamVideo client={client}>
          <StreamCall call={call}>
            <MyUILayout callId={callId}/>
          </StreamCall>
        </StreamVideo>
      )}
    </>
  );
};

export default VideoCall;
