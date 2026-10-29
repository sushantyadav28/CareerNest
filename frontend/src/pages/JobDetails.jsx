import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";

function JobDetails() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [resume, setResume] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/jobs/${id}`)
      .then((res) => setJob(res.data.job))
      .catch(() => setError("Unable to load this job."))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleApply(e) {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!localStorage.getItem("careernest_token")) {
      setError("Please log in as an applicant before applying.");
      return;
    }

    if (!resume) {
      setError("Please select your resume.");
      return;
    }

    const formData = new FormData();
    formData.append("coverLetter", coverLetter);
    formData.append("resume", resume);

    try {
      const response = await api.post(`/applications/${id}`, formData);
      setMessage(response.data.message || "Application submitted!");
      setCoverLetter("");
      setResume(null);
      e.target.reset();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit application.");
    }
  }

  if (loading) return <main className="page">Loading job...</main>;
  if (error && !job) return <main className="page error">{error}</main>;
  if (!job) return <main className="page">Job not found.</main>;

  return (
    <main className="page">
      <Link to="/" className="back-link">
        ← All jobs
      </Link>

      <p className="eyebrow">{job.employmentType}</p>
      <h1>{job.title}</h1>
      <p className="subtitle">
        {job.companyName} · {job.location}
      </p>

      <section className="detail-section">
        <h2>About the role</h2>
        <p>{job.description}</p>

        <div className="skills">
          {(job.skills || []).map((skill) => (
            <span key={skill}>{skill}</span>
          ))}
        </div>

        <h2>About {job.companyName}</h2>
        <p>{job.aboutCompany || "Company information coming soon."}</p>

        {job.minSalary > 0 && (
          <p>
            Salary: ₹{job.minSalary.toLocaleString("en-IN")} – ₹
            {job.maxSalary.toLocaleString("en-IN")}
          </p>
        )}
      </section>

      <section className="application-panel">
        <h2>Interested? Make your move.</h2>
        <p>Apply directly and track your application.</p>

        <form onSubmit={handleApply}>
          <label htmlFor="coverLetter">Cover letter (optional)</label>
          <textarea
            id="coverLetter"
            rows="5"
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
          />

          <label htmlFor="resume">Résumé (PDF, DOC, or DOCX · 5 MB max)</label>
          <input
            id="resume"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setResume(e.target.files[0] || null)}
            required
          />

          <button type="submit">Submit application</button>
        </form>

        {message && <p className="success">{message}</p>}
        {error && <p className="error">{error}</p>}
      </section>
    </main>
  );
}

export default JobDetails;
