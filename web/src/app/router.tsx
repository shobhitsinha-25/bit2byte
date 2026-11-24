
import { createBrowserRouter } from "react-router-dom";

import Home from "../features/home/pages/Home";
import Login from "../features/auth/pages/Login";
import Register from "../features/auth/pages/Register";

import StudentDashboard from "../features/Student/dashboard/pages/StudentDashboard";
import MentorDiscovery from "../features/Student/pages/MentorDiscovery";

import MentorDashboard from "../features/Mentor/dashboard/pages/MentorDashboard";
import MentorExpertise from "../features/Mentor/expertise/pages/MentorExpertise";
import MentorAvailability from "../features/Mentor/availability/pages/MentorAvailability";
import MentorDetails from "../features/Student/pages/MentorDetails";
import SessionBooking from "../features/Student/pages/SessionBooking";

import ProtectedRoute from "../components/common/ProtectedRoute";
import StudentSessions from "../features/Student/dashboard/pages/StudentSessions";
import MentorSessions from "../features/Mentor/dashboard/pages/MentorSessions";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },

  // Student Routes
  {
    path: "/student/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["STUDENT"]}>
        <StudentDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/student/mentors",
    element: (
      <ProtectedRoute allowedRoles={["STUDENT"]}>
        <MentorDiscovery />
      </ProtectedRoute>
    ),
  },

  // Mentor Routes
  {
    path: "/mentor/dashboard",
    element: (
      <ProtectedRoute allowedRoles={["MENTOR"]}>
        <MentorDashboard />
      </ProtectedRoute>
    ),
  },
  {
  path: "/mentor/sessions",
  element: (
    <ProtectedRoute allowedRoles={["MENTOR"]}>
      <MentorSessions />
    </ProtectedRoute>
  ),
},
  {
    path: "/mentor/expertise",
    element: (
      <ProtectedRoute allowedRoles={["MENTOR"]}>
        <MentorExpertise />
      </ProtectedRoute>
    ),
  },
  {
    path: "/mentor/availability",
    element: (
      <ProtectedRoute allowedRoles={["MENTOR"]}>
        <MentorAvailability />
      </ProtectedRoute>
    ),
  },
  {
  path: "/student/mentors/:mentorId",
  element: (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <MentorDetails />
    </ProtectedRoute>
  ),
},
{
  path: "/student/mentors/:mentorId/book/:availabilityId",
  element: (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <SessionBooking />
    </ProtectedRoute>
  ),
},
{
  path: "/student/sessions",
  element: (
    <ProtectedRoute allowedRoles={["STUDENT"]}>
      <StudentSessions />
    </ProtectedRoute>
  ),
},
]);

export default router;
