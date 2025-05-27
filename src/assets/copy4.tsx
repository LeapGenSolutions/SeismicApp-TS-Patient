// import {
//   StreamCall,
//   StreamVideo,
//   StreamVideoClient,
//   type User,
// } from '@stream-io/video-react-sdk';
// import axios from 'axios';
// import { useEffect, useState, useRef } from 'react';
// import MyUILayout from './MyUILayout';

// type VideoCallProps = {
//   userName: string;
//   meetingId: string;
//   role: 'doctor' | 'patient';
// };

// const getToken = async (userId: string): Promise<string | null> => {
//   try {
//     const response = await axios.post('http://localhost:3000/get-token', { userId });
//     return response.data.token;
//   } catch (error) {
//     console.error('Error fetching token:', error);
//     return null;
//   }
// };

// const VideoCall = ({ userName, meetingId, role }: VideoCallProps) => {
//   const apiKey = 'jzjtebythm5q';
//   const userId = userName;
//   const callId = meetingId;

//   const [client, setClient] = useState<StreamVideoClient | null>(null);
//   const [call, setCall] = useState<any>(null);
//   const [showCall, setShowCall] = useState(false);
//   const [loading, setLoading] = useState(true);
//   const [rejected, setRejected] = useState(false);
//   const [waitingApproval, setWaitingApproval] = useState(false);

//   // State for custom popup in doctor UI when patient requests to join
//   const [joinRequestUser, setJoinRequestUser] = useState<User | null>(null);

//   // Ref for timeout to auto-dismiss popup
//   const popupTimeoutRef = useRef<number | null>(null);

//   const user: User = {
//     id: userId,
//     name: userName,
//     image: 'https://static.wikia.nocookie.net/starwars/images/4/4c/Satele_Shan.png',
//   };

//   // Function to show browser notification
//   const showBrowserNotification = (patientName: string) => {
//     if (!('Notification' in window)) return;

//     if (Notification.permission === 'default') {
//       Notification.requestPermission();
//     }

//     if (Notification.permission === 'granted') {
//       const notif = new Notification('Join Request', {
//         body: `${patientName} wants to join the call.`,
//         icon: '/icon.png', // Optional: add an icon path here
//         tag: 'join-request', // Prevent multiple notifications stacking
//       });

//       notif.onclick = () => {
//         window.focus();
//         // Show the popup in the app UI on notification click
//         setJoinRequestUser({ id: 'temp', name: patientName, image: '' });
//         // Clear any existing timeout so popup stays visible on click
//         if (popupTimeoutRef.current) {
//           clearTimeout(popupTimeoutRef.current);
//         }
//       };
//     }
//   };

//   useEffect(() => {
//     let isMounted = true;

//     const setupCall = async () => {
//       setLoading(true);
//       const token = await getToken(userId);
//       if (!token) return setLoading(false);

//       const videoClient = new StreamVideoClient({ apiKey, user, token });
//       const videoCall = videoClient.call('default', callId);
//       await videoCall.get();

//       if (role === 'doctor') {
//         await videoCall.join({ create: true });

//         videoCall.on('custom', (event) => {
//           if (event.custom?.type === 'join-request') {
//             const requestingUser = event.user;
//             if (!requestingUser) return;

//             // Show browser notification
//             showBrowserNotification(requestingUser.name || 'Unknown User');


//             // Show in-app popup for doctor approval
//             setJoinRequestUser(requestingUser);

//             // Auto hide popup after 20 seconds
//             if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
//             popupTimeoutRef.current = window.setTimeout(() => {
//               setJoinRequestUser(null);
//             }, 20000);
//           }
//         });

//         if (isMounted) {
//           setClient(videoClient);
//           setCall(videoCall);
//           setShowCall(true);
//           setLoading(false);
//         }
//       } else {
//         // Patient logic - check if call is full (2 users max)
//         const participantCount = videoCall.state.participantCount;
//         if (participantCount >= 2) {
//           setLoading(false);
//           return; // Call is full, patient can't join now
//         }

//         // Send join request and wait for approval
//         videoCall.sendCustomEvent({ type: 'join-request', user });
//         setWaitingApproval(true);

//         videoCall.on('custom', async (event) => {
//           if (event.custom.type === 'join-accepted') {
//             await videoCall.join();
//             if (isMounted) {
//               setClient(videoClient);
//               setCall(videoCall);
//               setShowCall(true);
//               setWaitingApproval(false);
//               setLoading(false);
//             }
//           }
//           if (event.custom.type === 'join-rejected') {
//             setWaitingApproval(false);
//             setRejected(true);
//             setLoading(false);
//           }
//         });
//       }
//     };

//     setupCall();

//     return () => {
//       isMounted = false;
//       if (call) call.leave();
//       if (popupTimeoutRef.current) clearTimeout(popupTimeoutRef.current);
//     };
//   }, [userId, callId, role]);

//   // Doctor clicks Accept on popup
//   const handleAccept = () => {
//     if (!call || !joinRequestUser) return;
//     call.sendCustomEvent({ type: 'join-accepted', user: joinRequestUser });
//     setJoinRequestUser(null);
//   };

//   // Doctor clicks Reject on popup
//   const handleReject = () => {
//     if (!call || !joinRequestUser) return;
//     call.sendCustomEvent({ type: 'join-rejected', user: joinRequestUser });
//     setJoinRequestUser(null);
//   };

//   return (
//     <>
//       <style>{`
//         @keyframes spin {
//           0% { transform: rotate(0deg); }
//           100% { transform: rotate(360deg); }
//         }
//         .popup {
//           position: fixed;
//           bottom: 20px;
//           right: 20px;
//           background: white;
//           border-radius: 8px;
//           box-shadow: 0 3px 10px rgba(0,0,0,0.2);
//           padding: 1rem 1.5rem;
//           display: flex;
//           align-items: center;
//           gap: 1rem;
//           z-index: 9999;
//           max-width: 300px;
//           font-family: Arial, sans-serif;
//         }
//         .popup img {
//           width: 40px;
//           height: 40px;
//           border-radius: 50%;
//           object-fit: cover;
//         }
//         .popup-buttons button {
//           margin-left: 8px;
//           padding: 6px 12px;
//           border: none;
//           border-radius: 4px;
//           cursor: pointer;
//           font-weight: 600;
//         }
//         .popup-buttons .accept {
//           background-color: #4caf50;
//           color: white;
//         }
//         .popup-buttons .reject {
//           background-color: #f44336;
//           color: white;
//         }
//       `}</style>

//       {loading && (
//         <div
//           style={{
//             position: 'fixed',
//             top: 0,
//             left: 0,
//             width: '100vw',
//             height: '100vh',
//             background: 'rgba(255,255,255,0.85)',
//             display: 'flex',
//             flexDirection: 'column',
//             alignItems: 'center',
//             justifyContent: 'center',
//             zIndex: 9999,
//           }}
//         >
//           <div
//             style={{
//               border: '8px solid #f3f3f3',
//               borderTop: '8px solid #3498db',
//               borderRadius: '50%',
//               width: '60px',
//               height: '60px',
//               animation: 'spin 1s linear infinite',
//               marginBottom: '24px',
//             }}
//           />
//           <div style={{ fontSize: '1.2rem', color: '#222' }}>Loading, please wait...</div>
//         </div>
//       )}

//       {!loading && rejected && (
//         <div style={{ padding: '2rem' }}>❌ Your request was rejected by the doctor.</div>
//       )}
//       {!loading && waitingApproval && (
//         <div style={{ padding: '2rem' }}>⌛ Waiting for doctor’s approval...</div>
//       )}
//       {!loading && !showCall && !waitingApproval && !rejected && (
//         <>
//           <div style={{ padding: '2rem' }}>⚠️ Call is full wait or leave.</div>
//           <button onClick={() => window.location.reload()} style={{ marginTop: '1rem' }}>
//             Leave
//           </button>
//         </>
//       )}

//       {/* Custom popup for doctor when patient requests to join */}
//       {role === 'doctor' && joinRequestUser && (
//         <div className="popup" role="alert" aria-live="assertive">
//           <img
//             src={
//               joinRequestUser.image ||
//               'https://static.wikia.nocookie.net/starwars/images/4/4c/Satele_Shan.png'
//             }
//             alt={`${joinRequestUser.name}'s avatar`}
//           />
//           <div>
//             <strong>{joinRequestUser.name}</strong> wants to join the call.
//           </div>
//           <div className="popup-buttons">
//             <button className="accept" onClick={handleAccept}>
//               Accept
//             </button>
//             <button className="reject" onClick={handleReject}>
//               Reject
//             </button>
//           </div>
//         </div>
//       )}

//       {!loading && showCall && client && call && (
//         <StreamVideo client={client}>
//           <StreamCall call={call}>
//             <MyUILayout />
//           </StreamCall>
//         </StreamVideo>
//       )}
//     </>
//   );
// };

// export default VideoCall;
