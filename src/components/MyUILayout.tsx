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
  setTimeout(() => {
    console.log("Redirecting to home page");
    nav(`/${callId}`, { replace: true });
  }, 1000);
  return <div>Call ended or you left the call. Taking you back to the home page…</div>;
}

if (
  callingState !== CallingState.JOINED
) {
  return <div>Loading...</div>;
}

return (
  <StreamTheme>
    <SideBySideLayout participants={participants} />
    <CallControls />
  </StreamTheme>
);
};

export default MyUILayout;