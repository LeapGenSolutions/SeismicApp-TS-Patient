  import TestApp from "./components/TestApp" 
  import { Route, Routes } from "react-router-dom"

  const App = () => {

    return (
      <>
      <Routes>
        <Route path="/" element={<TestApp />} />
        <Route path="/:appointmentId" element={<TestApp />} />
        <Route path="*" element={<div>Page Not Found</div>} />
      </Routes>
      </>
    )
  }

  export default App


  // H1djvTYWPMS9