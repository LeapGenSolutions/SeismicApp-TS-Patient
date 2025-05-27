import { CallControls, CallingState, StreamTheme, useCallStateHooks } from "@stream-io/video-react-sdk";
import SideBySideLayout from "./SideBySideLayout";


const MyUILayout = () => {
  const {
    useCallCallingState,
    useParticipants,
  } = useCallStateHooks();
  console.log("Inside MyUILayout");
  
  const callingState = useCallCallingState();
  const Participants = useParticipants();

  if (callingState !== CallingState.JOINED) {
    return <div>Loading...</div>;
  }
  return (
      <StreamTheme>
        <SideBySideLayout participants={Participants}/>
        <CallControls />
      </StreamTheme>
  );
};

export default MyUILayout;