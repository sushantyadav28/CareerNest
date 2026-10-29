import { useEffect, useState } from "react";
import api from "../services/api";

function Profile() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    skills: "",
  });
  const [applications, setApplications] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProfile() {
      try {
        const [profileResponse, applicationsResponse] = await Promise.all([
          api.get("/auth/me"),
          api.get("/applications/mine"),
        ]);

        const user = profileResponse.data.user;

        setForm({
          name: user.name || "",
          email: user.email || "",
          phone: user.phone || "",
          skills: (user.skills || []).join(", "),
        });

        localStorage.setItem("careernest_user", JSON.stringify(user));

        setApplications(applicationsResponse.data.applications || []);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load profile. Log in as an applicant.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setMessage("");

    try {
      const { data } = await api.put("/auth/me", {
        ...form,
        skills: form.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
      });

      localStorage.setItem("careernest_user", JSON.stringify(data.user));

      setMessage("Profile updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Could not update profile.");
    }
  }

  if (loading) return <main className="page">Loading profile...</main>;

  return (
    <main className="page">
      <p className="eyebrow">APPLICANT ACCOUNT</p>
      <h1>Your profile</h1>
      <p className="subtitle">
        Keep your information up to date for your next opportunity.
      </p>

      <section className="application-panel">
        <h2>Personal information</h2>

        <form onSubmit={handleSubmit}>
          <label>Full name</label>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <label>Email address</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />

          <label>Phone number</label>
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          <label>Skills (comma-separated)</label>
          <textarea
            rows="3"
            value={form.skills}
            onChange={(e) => setForm({ ...form, skills: e.target.value })}
            placeholder="React, JavaScript, HTML, CSS"
          />

          <button type="submit">Save profile</button>
        </form>

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
      </section>

      <section className="recruiter-jobs">
        <h2>My applications</h2>

        {applications.length === 0 && (
          <p>You haven't applied for any jobs yet.</p>
        )}

        {applications.map((application) => (
          <article className="job-card" key={application._id}>
            <div className="job-info">
              <h2>{application.job?.title || "Job unavailable"}</h2>
              <p>
                {application.job?.companyName || "Company unavailable"}
                {" · "}
                {application.job?.location || ""}
              </p>
              <span>{application.status}</span>
              <p>
                Applied on{" "}
                {new Date(application.createdAt).toLocaleDateString()}
              </p>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

export default Profile;
