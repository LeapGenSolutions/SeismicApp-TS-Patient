import { Route, Routes } from "react-router-dom";
import TestApp from "./components/TestApp";

const App = () => {
  return (
    <>
      <Routes>
        <Route path="/" element={<TestApp />} />
        <Route path="/:appointmentId" element={<TestApp />} />
        <Route path="*" element={<div>404 Page not found</div>} />
      </Routes>
    </>
  );
};

export default App;

// H1djvTYWPMS9
