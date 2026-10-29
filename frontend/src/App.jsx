import { Link, Route, Routes, useNavigate } from "react-router-dom";
import Jobs from "./pages/Jobs";
import JobDetails from "./pages/JobDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import "./App.css";
import RecruiterDashboard from "./pages/RecruiterDashboard";
import Profile from "./pages/Profile";
import Applicants from "./pages/Applicants";

function Navigation() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("careernest_user") || "null");

  function logout() {
    localStorage.removeItem("careernest_token");
    localStorage.removeItem("careernest_user");
    navigate("/");
  }

  return (
    <header className="navbar">
      <Link className="brand" to="/">
        CareerNest
      </Link>

      <nav>
        <Link to="/">Find jobs</Link>
        {user && user.role === "applicant" && (
          <Link to="/profile">My profile</Link>
        )}
        {user && user.role === "recruiter" && (
          <Link to="/recruiter">Recruiter dashboard</Link>
        )}

        {user ? (
          <button className="nav-button" onClick={logout}>
            Log out
          </button>
        ) : (
          <>
            <Link to="/login">Log in</Link>
            <Link className="nav-cta" to="/register">
              Get started
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}

function App() {
  return (
    <>
      <Navigation />
      <Routes>
        <Route path="/" element={<Jobs />} />
        <Route path="/jobs/:id" element={<JobDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/recruiter" element={<RecruiterDashboard />} />
        <Route path="/register" element={<Register />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/recruiter/jobs/:id/applicants" element={<Applicants />} />
        <Route
          path="*"
          element={
            <main className="page">
              <h1>Page not found</h1>
              <Link to="/">Back to jobs</Link>
            </main>
          }
        />
      </Routes>

      <footer className="footer">
        CareerNest · Find work that moves you forward.
      </footer>
    </>
  );
}

export default App;
