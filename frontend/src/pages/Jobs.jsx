import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function Jobs() {
  const [jobs, setJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [location, setLocation] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/jobs", {
          params: { search, location, employmentType },
        });

        setJobs(response.data.jobs || []);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Could not load jobs. Check that the backend is running.",
        );
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [search, location, employmentType]);

  return (
    <main className="page">
      <p className="eyebrow">OPEN ROLES</p>
      <h1>Find your next opportunity</h1>
      <p className="subtitle">Discover roles where your next chapter begins.</p>

      <section className="search-bar">
        <input
          placeholder="Title, skill, or company"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <input
          placeholder="Location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <select
          value={employmentType}
          onChange={(e) => setEmploymentType(e.target.value)}
        >
          <option value="">Any type</option>
          <option>Full-time</option>
          <option>Part-time</option>
          <option>Internship</option>
          <option>Contract</option>
        </select>
      </section>

      {loading && <p>Loading jobs...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && jobs.length === 0 && (
        <p>No jobs found. Try changing your search.</p>
      )}

      <section className="job-list">
        {jobs.map((job) => (
          <article className="job-card" key={job._id}>
            <div className="company-mark">
              {job.companyName?.slice(0, 2).toUpperCase()}
            </div>

            <div className="job-info">
              <h2>
                <Link to={`/jobs/${job._id}`}>{job.title}</Link>
              </h2>
              <p>
                {job.companyName} · {job.location}
              </p>
              <span>{job.employmentType}</span>
              {job.minSalary > 0 && (
                <p>
                  ₹{job.minSalary.toLocaleString("en-IN")} – ₹
                  {job.maxSalary.toLocaleString("en-IN")}
                </p>
              )}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

export default Jobs;
