import { Route, Routes } from "react-router-dom";
import TestApp from "./components/TestApp";
import VideoCall from "./components/VideoCall";

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<TestApp />} />
        <Route path="/:appointmentId" element={<TestApp />} />
        <Route path="/video-call/:appointmentId/:userName/:role" element={<VideoCall />} />
        <Route path="*" element={<div>404 Page not found</div>} />
      </Routes>
    </>
  );
};

export default App;

