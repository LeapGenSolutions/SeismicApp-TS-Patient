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

//   const user: User = {
//     id: userId,
//     name: userName,
//     image: 'https://static.wikia.nocookie.net/starwars/images/4/4c/Satele_Shan.png',
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
//             const name = event.user?.name || 'A patient';
//             const accept = window.confirm(`${name} wants to join. Allow?`);
//             const type = accept ? 'join-accepted' : 'join-rejected';
//             videoCall.sendCustomEvent({ type, user: event.user });
//           }
//         });

//         if (isMounted) {
//           setClient(videoClient);
//           setCall(videoCall);
//           setShowCall(true);
//           setLoading(false);
//         }
//       } else {
//         const count = videoCall.state.participantCount;
//         if (count >= 2) {
//           setLoading(false);
//           return;
//         }

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
//     };
//   }, [userId, callId, role]);

//   return (
//     <>
//       <style>
//         {`
//           @keyframes spin {
//             0% { transform: rotate(0deg); }
//             100% { transform: rotate(360deg); }
//           }
//         `}
//       </style>

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

//       {!loading && rejected && <div style={{ padding: '2rem' }}>❌ Your request was rejected by the doctor.</div>}
//       {!loading && waitingApproval && <div style={{ padding: '2rem' }}>⌛ Waiting for doctor’s approval...</div>}
//       {!loading && !showCall && !waitingApproval && !rejected && (
//         <>
//           <div style={{ padding: '2rem' }}>⚠️ Call is full wait or leave.</div>
//           <button onClick={() => window.location.reload()} style={{ marginTop: '1rem' }}>
//             leave
//           </button>
//         </>
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
