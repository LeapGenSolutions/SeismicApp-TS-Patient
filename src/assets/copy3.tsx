// import {
//   StreamCall,
//   StreamVideo,
//   StreamVideoClient,
//   type User,
// } from '@stream-io/video-react-sdk';
// import axios from 'axios';
// import { useEffect, useState } from 'react';
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

// const showNotification = (title: string, body: string) => {
//   if (Notification.permission === 'granted') {
//     new Notification(title, { body });
//   }
// };

// const requestNotificationPermission = async () => {
//   if (Notification.permission === 'default') {
//     await Notification.requestPermission();
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

//   useEffect(() => {
//     let isMounted = true;
//     const broadcast = new BroadcastChannel('join-requests');

//     const setupCall = async () => {
//       await requestNotificationPermission();
//       const token = await getToken(userId);
//       if (!token) return setLoading(false);

//       const videoClient = new StreamVideoClient({ apiKey, user: { id: userId, name: userName }, token });
//       const videoCall = videoClient.call('default', callId);
//       await videoCall.get();

//       if (role === 'doctor') {
//         await videoCall.join({ create: true });

//         videoCall.on('custom', (event) => {
//           if (event.custom?.type === 'join-request') {
//             const name = event.user?.name || 'A patient';
//             showNotification('Join Request', `${name} wants to join`);

//             broadcast.postMessage({ type: 'join-request', user: event.user, name });
//           }
//         });

//         broadcast.onmessage = (msg) => {
//           if (msg.data.type === 'join-request') {
//             const accept = window.confirm(`${msg.data.name} wants to join. Allow?`);
//             const type = accept ? 'join-accepted' : 'join-rejected';
//             videoCall.sendCustomEvent({ type, user: msg.data.user });
//           }
//         };

//         if (isMounted) {
//           setClient(videoClient);
//           setCall(videoCall);
//           setShowCall(true);
//           setLoading(false);
//         }
//       } else {
//         if (videoCall.state.participantCount >= 2) {
//           setLoading(false);
//           return;
//         }

//         videoCall.sendCustomEvent({ type: 'join-request', user: { id: userId, name: userName } });
//         setWaitingApproval(true);

//         videoCall.on('custom', async (event) => {
//           if (event.custom?.type === 'join-accepted') {
//             await videoCall.join();
//             if (isMounted) {
//               setClient(videoClient);
//               setCall(videoCall);
//               setShowCall(true);
//               setWaitingApproval(false);
//               setLoading(false);
//             }
//           }

//           if (event.custom?.type === 'join-rejected') {
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
//       broadcast.close();
//       if (call) call.leave();
//     };
//   }, [userId, callId, role]);

//   return (
//     <>
//       <style>
//          {`
//            @keyframes spin {
//              0% { transform: rotate(0deg); }
//              100% { transform: rotate(360deg); }

//            }
//            @keyframes slideUp {
//              from { transform: translateY(100%); opacity: 0; }
//              to { transform: translateY(0); opacity: 1; }
//            }
//            .popup {
//              position: fixed;
//              bottom: 1rem;
//              right: 1rem;
//              background: #fff;
//              border-radius: 8px;
//              padding: 1rem;
//              box-shadow: 0 4px 8px rgba(0,0,0,0.2);
//              animation: slideUp 0.4s ease-out;
//              z-index: 10000;
//            }
//            .popup button {
//              margin: 0 0.5rem;
//            }
//          `}
//        </style>
//       {loading && (
//         <div style={{
//           position: 'fixed',
//           top: 0, left: 0,
//           width: '100vw', height: '100vh',
//           background: 'rgba(255,255,255,0.85)',
//           display: 'flex', flexDirection: 'column',
//           alignItems: 'center', justifyContent: 'center',
//         }}>
//           <div style={{
//             border: '8px solid #f3f3f3',
//             borderTop: '8px solid #3498db',
//             borderRadius: '50%',
//             width: '60px', height: '60px',
//             animation: 'spin 1s linear infinite',
//             marginBottom: '24px'
//           }} />
//           <div>Loading, please wait...</div>
//         </div>
//       )}

//       {!loading && rejected && (
//         <div style={{ padding: '2rem' }}>❌ Your request was rejected.</div>
//       )}
//       {!loading && waitingApproval && (
//         <div style={{ padding: '2rem' }}>⌛ Waiting for doctor’s approval...</div>
//       )}
//       {!loading && !showCall && !waitingApproval && !rejected && (
//         <div style={{ padding: '2rem' }}>
//           ⚠️ Call is full. Please wait or leave.
//           <button onClick={() => window.location.reload()} style={{ marginTop: '1rem' }}>
//             Leave
//           </button>
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
