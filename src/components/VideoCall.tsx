import {
  StreamCall,
  StreamVideo,
  StreamVideoClient,
  type User,
} from "@stream-io/video-react-sdk";
import axios from "axios";
import { useEffect, useState, useRef } from "react";
import MyUILayout from "./MyUILayout";
import { useParams } from "react-router-dom";

const getToken = async (userId: string): Promise<string | null> => {
  try {
    const response = await axios.post(
      "https://seismic-backend-04272025-bjbxatgnadguabg9.centralus-01.azurewebsites.net/get-token",
      { userId },
    );
    return response.data.token;
  } catch (error) {
    console.error("Error fetching token:", error);
    return null;
  }
};

const VideoCall = () => {
  const apiKey = "72499ykcfb3z";
  const { userName, appointmentId, role } = useParams<{
    userName?: string;
    appointmentId?: string;
    role?: "doctor" | "patient";
  }>();
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
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

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
            "Call does not exist yet, waiting for doctor to create it",
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

  const encodeWav = (
    samples: Float32Array,
    sampleRate: number,
    numChannels: number,
  ) => {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (dv: DataView, offset: number, str: string) => {
      for (let i = 0; i < str.length; i++)
        dv.setUint8(offset + i, str.charCodeAt(i));
    };

    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, "WAVE");
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, "data");
    view.setUint32(40, samples.length * 2, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      let s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }

    return buffer;
  };

  // Start/stop realtime transcription websocket + audio capture when call is active
  useEffect(() => {
    if (!call || !showCall) return;

    let mounted = true;

    const roleParam = "patient";
    const userParam = userName;
    const sessionId = callId;

    const wsUrl = `wss://seismicdockerbackend-fthfbxbscbcwe3hr.centralus-01.azurewebsites.net/realtime/ws/${roleParam}/${userParam}/${sessionId}`;

    try {
      const ws = new WebSocket(wsUrl);
      ws.binaryType = "arraybuffer";
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("transcription websocket open", wsUrl);
      };

      ws.onmessage = (e) => {
        try {
          console.log("transcription websocket message received", e.data);
          // try to parse JSON text messages from transcription backend
          if (typeof e.data === "string") {
            const parsed = JSON.parse(e.data);

            const text = parsed.text || parsed.transcript || "";
            const isFinal = !!parsed.is_final || parsed.status === "final";
            const speaker = parsed.speaker || "patient";

            const payload = {
              type: isFinal ? "transcript.final" : "transcript.partial",
              sessionId,
              speaker,
              userId: parsed.user_id,
              text,
              isFinal,
              timestamp: parsed.timestamp || Date.now(),
            };

            // forward to other call participants via Stream custom event
            try {
              if (call && typeof call.sendCustomEvent === "function") {
                call.sendCustomEvent(payload);
              }
            } catch (err) {
              console.warn("error forwarding transcript via custom event", err);
            }

            console.log("transcription ws message parsed", payload);
          } else {
            // ignore binary or non-text messages here
            console.log("transcription ws binary message received");
          }
        } catch (err) {
          console.warn("error handling transcription ws message", err);
        }
      };

      ws.onclose = (ev) =>
        console.log(
          "transcription websocket closed",
          ev && ev.code,
          ev && ev.reason,
        );
      ws.onerror = (e) => console.warn("transcription websocket error", e);
    } catch (e) {
      console.warn("websocket init error", e);
    }

    const startAudio = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        if (!mounted) {
          mediaStream.getTracks().forEach((t) => t.stop());
          return;
        }
        mediaStreamRef.current = mediaStream;

        const AudioContextCtor =
          (window as any).AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextCtor();
        audioCtxRef.current = audioCtx;
        audioCtx.resume().catch(() => {});

        const source = audioCtx.createMediaStreamSource(mediaStream);
        sourceRef.current = source;

        const sampleRate = audioCtx.sampleRate;
        const numChannels = 1;

        const bufferSize = 4096;
        const processor = audioCtx.createScriptProcessor(
          bufferSize,
          numChannels,
          numChannels,
        );
        processorRef.current = processor;

        let ring = new Float32Array(0);

        processor.onaudioprocess = (evt: AudioProcessingEvent) => {
          if (!mediaStreamRef.current) return;

          const input = evt.inputBuffer.getChannelData(0);
          const tmp = new Float32Array(ring.length + input.length);
          tmp.set(ring, 0);
          tmp.set(input, ring.length);
          ring = tmp;

          while (ring.length >= Math.floor(sampleRate * 0.25)) {
            const chunk = ring.slice(0, Math.floor(sampleRate * 0.25));
            ring = ring.slice(Math.floor(sampleRate * 0.25));

            const wavBuffer = encodeWav(chunk, sampleRate, 1);

            try {
              if (
                wsRef.current &&
                wsRef.current.readyState === WebSocket.OPEN
              ) {
                wsRef.current.send(wavBuffer);
              }
            } catch (e) {
              console.warn("ws send error", e);
            }
          }
        };

        source.connect(processor);
        processor.connect(audioCtx.destination);
      } catch (err) {
        console.warn("error starting audio capture for transcription", err);
        try {
          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN)
            wsRef.current.send(JSON.stringify({ audio: null }));
        } catch (e) {}
      }
    };

    startAudio();

    return () => {
      mounted = false;
      try {
        if (processorRef.current) {
          processorRef.current.disconnect();
          processorRef.current.onaudioprocess = null;
          processorRef.current = null;
        }
        if (sourceRef.current) {
          sourceRef.current.disconnect();
          sourceRef.current = null;
        }
        if (audioCtxRef.current) {
          try {
            audioCtxRef.current.close();
          } catch (e) {}
          audioCtxRef.current = null;
        }
        if (mediaStreamRef.current) {
          mediaStreamRef.current.getTracks().forEach((t) => t.stop());
          mediaStreamRef.current = null;
        }
      } catch (e) {
        console.warn("cleanup audio error", e);
      }

      try {
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          try {
            wsRef.current.send(JSON.stringify({ audio: null }));
          } catch (e) {}
          wsRef.current.close();
        }
        wsRef.current = null;
      } catch (e) {
        console.warn("error closing websocket", e);
      }
    };
  }, [call, showCall, role, userId, callId]);

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
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            textAlign: "center",
            zIndex: 9999,
          }}
        >
          ❌ Your request was rejected by the doctor.
        </div>
      )}

      {waitingApproval && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            textAlign: "center",
            zIndex: 9999,
          }}
        >
          ⌛ Waiting for doctor’s approval...
        </div>
      )}

      {doctorNotAvailable && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            textAlign: "center",
            zIndex: 9999,
          }}
        >
          ⚠️ The doctor is not available. You will be joining the call once they
          are ready.
        </div>
      )}

      {!loading &&
        !showCall &&
        !waitingApproval &&
        !rejected &&
        !doctorNotAvailable && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "2rem",
              textAlign: "center",
              zIndex: 9999,
            }}
          >
            ⚠️ The call is currently full. You will be redirected in 5
            seconds...
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
            <MyUILayout callId={callId} />
          </StreamCall>
        </StreamVideo>
      )}
    </>
  );
};

export default VideoCall;
