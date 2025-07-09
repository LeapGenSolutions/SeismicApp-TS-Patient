import { CallControls, CallingState, StreamTheme, useCallStateHooks } from "@stream-io/video-react-sdk";
import SideBySideLayout from "./SideBySideLayout";
import { useNavigate } from "react-router-dom";

interface MyUILayoutProps {
  callId: string;
}

const MyUILayout = ({ callId }: MyUILayoutProps) => {
const { useCallCallingState, useParticipants } = useCallStateHooks();
const nav = useNavigate();
const callingState = useCallCallingState();
const participants = useParticipants();

if(callingState === CallingState.LEFT) {
  return <div>You have left the call.Redirecting to the home page</div>;
}

if (
  callingState !== CallingState.JOINED
) {
  return <div>Loading...</div>;
}


const leaveHandler = () => {
  // Handle the leave action here, e.g., navigate to a different page or show a message
  console.log("Leave button clicked");
  setInterval(() => {
    console.log("Redirecting to home page");
    nav(`/${callId}`, { replace: true });
  }, 1000);
};

return (
  <StreamTheme>
    <SideBySideLayout participants={participants} />
    <CallControls onLeave={leaveHandler}/>
  </StreamTheme>
);
};

export default MyUILayout;