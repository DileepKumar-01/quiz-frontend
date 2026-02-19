import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import TeacherDashboard from "./pages/TeacherDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import ProtectedRoute from "./ProtectedRoute";
import Quiz from "./Components/Quiz/Quiz"; // This links to your Quiz component

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected Teacher Route */}
        <Route
          path="/teacherdashboard"
          element={
            <ProtectedRoute allowedRole="teacher">
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />

        {/* Protected Student Route */}
        <Route
          path="/studentdashboard"
          element={
            <ProtectedRoute allowedRole="student">
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        {/* ASSESSMENT ROUTE: Links the code from the dashboard to the Quiz component */}
        <Route
          path="/quiz/:code"
          element={
            <ProtectedRoute allowedRole="student">
              <Quiz />
            </ProtectedRoute>
          }
        />

        {/* Catch All Route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;