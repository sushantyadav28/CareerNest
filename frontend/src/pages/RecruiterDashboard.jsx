import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const initialForm = {
  title: "",
  companyName: "",
  location: "",
  employmentType: "Full-time",
  skills: "",
  minSalary: "",
  maxSalary: "",
  aboutCompany: "",
  description: "",
  isPublished: true,
};

function RecruiterDashboard() {
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadJobs() {
    try {
      setLoading(true);
      const { data } = await api.get("/jobs/mine");
      setJobs(data.jobs || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Could not load your jobs.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadJobs();
  }, []);

  function updateField(e) {
    const { name, value, type, checked } = e.target;
    setForm((previous) => ({
      ...previous,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function startEdit(job) {
    setEditingId(job._id);
    setForm({
      title: job.title || "",
      companyName: job.companyName || "",
      location: job.location || "",
      employmentType: job.employmentType || "Full-time",
      skills: (job.skills || []).join(", "),
      minSalary: job.minSalary ?? "",
      maxSalary: job.maxSalary ?? "",
      aboutCompany: job.aboutCompany || "",
      description: job.description || "",
      isPublished: job.isPublished ?? true,
    });
    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(initialForm);
    setError("");
    setMessage("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        ...form,
        minSalary: Number(form.minSalary || 0),
        maxSalary: Number(form.maxSalary || 0),
        skills: form.skills
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean),
      };

      if (editingId) {
        await api.put(`/jobs/${editingId}`, payload);
        setMessage("Job updated successfully.");
      } else {
        await api.post("/jobs", payload);
        setMessage("Job published successfully.");
      }

      setForm(initialForm);
      setEditingId(null);
      await loadJobs();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save job.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteJob(id) {
    if (!window.confirm("Are you sure you want to delete this job?")) {
      return;
    }

    try {
      await api.delete(`/jobs/${id}`);
      setJobs((previous) => previous.filter((job) => job._id !== id));
      setMessage("Job deleted successfully.");
      setError("");
      if (editingId === id) cancelEdit();
    } catch (err) {
      setError(err.response?.data?.message || "Could not delete job.");
    }
  }

  return (
    <main className="page">
      <p className="eyebrow">RECRUITER WORKSPACE</p>
      <h1>Manage your hiring</h1>
      <p className="subtitle">
        Create opportunities and manage your published job listings.
      </p>

      <section className="application-panel">
        <h2>{editingId ? "Edit job" : "Create a job post"}</h2>

        <form onSubmit={handleSubmit}>
          <label>Job title</label>
          <input
            name="title"
            value={form.title}
            onChange={updateField}
            placeholder="e.g. Frontend Developer"
            required
          />

          <label>Company name</label>
          <input
            name="companyName"
            value={form.companyName}
            onChange={updateField}
            required
          />

          <label>Location</label>
          <input
            name="location"
            value={form.location}
            onChange={updateField}
            placeholder="e.g. Delhi or Remote"
            required
          />

          <label>Employment type</label>
          <select
            name="employmentType"
            value={form.employmentType}
            onChange={updateField}
          >
            <option>Full-time</option>
            <option>Part-time</option>
            <option>Internship</option>
            <option>Contract</option>
          </select>

          <label>Skills (comma-separated)</label>
          <input
            name="skills"
            value={form.skills}
            onChange={updateField}
            placeholder="React, JavaScript, CSS"
          />

          <div className="salary-grid">
            <div>
              <label>Minimum salary (₹)</label>
              <input
                name="minSalary"
                type="number"
                min="0"
                value={form.minSalary}
                onChange={updateField}
              />
            </div>
            <div>
              <label>Maximum salary (₹)</label>
              <input
                name="maxSalary"
                type="number"
                min="0"
                value={form.maxSalary}
                onChange={updateField}
              />
            </div>
          </div>

          <label>About the company</label>
          <textarea
            name="aboutCompany"
            rows="3"
            value={form.aboutCompany}
            onChange={updateField}
          />

          <label>Job description</label>
          <textarea
            name="description"
            rows="6"
            value={form.description}
            onChange={updateField}
            required
          />

          <label className="publish-toggle">
            <input
              type="checkbox"
              name="isPublished"
              checked={form.isPublished}
              onChange={updateField}
            />
            Publish this job so applicants can see it
          </label>

          <div className="form-actions">
            <button type="submit" disabled={saving}>
              {saving
                ? "Saving..."
                : editingId
                  ? "Save changes"
                  : "Publish job"}
            </button>

            {editingId && (
              <button
                type="button"
                className="secondary-button"
                onClick={cancelEdit}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>

      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}

      <section className="recruiter-jobs">
        <h2>Your job listings</h2>

        {loading && <p>Loading your jobs...</p>}

        {!loading && jobs.length === 0 && (
          <p>You haven't posted any jobs yet.</p>
        )}

        {jobs.map((job) => (
          <article className="job-card" key={job._id}>
            <div className="job-info">
              <h2>{job.title}</h2>
              <p>
                {job.companyName} · {job.location}
              </p>
              <span>{job.employmentType}</span>
              <span>{job.isPublished ? "Published" : "Draft"}</span>
              <p>
                <Link to={`/jobs/${job._id}`}>View job</Link>
              </p>
              <div className="form-actions">
                <button type="button" onClick={() => startEdit(job)}>
                  Edit
                </button>
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => deleteJob(job._id)}
                >
                  Delete
                </button>
                <Link to={`/recruiter/jobs/${job._id}/applicants`}>
                  View applicants
                </Link>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

export default RecruiterDashboard;
