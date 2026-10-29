import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";

const statuses = [
  "Pending",
  "Under Review",
  "Shortlisted",
  "Rejected",
  "Accepted",
];

function Applicants() {
  const { id } = useParams();
  const [applications, setApplications] = useState([]);
  const [job, setJob] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadApplicants() {
      try {
        const [jobResponse, applicantsResponse] = await Promise.all([
          api.get(`/jobs/${id}`),
          api.get(`/applications/job/${id}`),
        ]);

        setJob(jobResponse.data.job);
        setApplications(applicantsResponse.data.applications || []);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Unable to load applicants. Make sure you are logged in as the job's recruiter.",
        );
      } finally {
        setLoading(false);
      }
    }

    loadApplicants();
  }, [id]);

  async function changeStatus(applicationId, status) {
    try {
      await api.patch(`/applications/${applicationId}/status`, {
        status,
      });

      setApplications((previous) =>
        previous.map((application) =>
          application._id === applicationId
            ? { ...application, status }
            : application,
        ),
      );

      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message || "Could not update application status.",
      );
    }
  }

  if (loading) return <main className="page">Loading applicants...</main>;

  return (
    <main className="page">
      <Link to="/recruiter" className="back-link">
        ← Recruiter dashboard
      </Link>

      <p className="eyebrow">RECRUITER WORKSPACE</p>
      <h1>Applicants</h1>
      <p className="subtitle">
        {job ? `${job.title} · ${job.companyName}` : "Review submissions"}
      </p>

      {error && <p className="error">{error}</p>}

      {!error && applications.length === 0 && (
        <p>No applications have been submitted for this job yet.</p>
      )}

      <section className="job-list">
        {applications.map((application) => (
          <article className="job-card" key={application._id}>
            <div className="company-mark">
              {(application.applicant?.name || "A").slice(0, 1).toUpperCase()}
            </div>

            <div className="job-info applicant-info">
              <h2>{application.applicant?.name || "Applicant"}</h2>
              <p>{application.applicant?.email || "No email provided"}</p>
              {application.applicant?.phone && (
                <p>{application.applicant.phone}</p>
              )}

              <p>
                Skills:{" "}
                {(application.applicant?.skills || []).join(", ") ||
                  "Not provided"}
              </p>

              <p>
                Applied: {new Date(application.createdAt).toLocaleDateString()}
              </p>

              <p>Cover letter: {application.coverLetter || "Not provided"}</p>

              {application.resumePath && (
                <p>
                  <a
                    href={`http://localhost:5000${application.resumePath}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View resume
                  </a>
                </p>
              )}

              <label htmlFor={`status-${application._id}`}>
                Application status
              </label>

              <select
                id={`status-${application._id}`}
                value={application.status}
                onChange={(e) => changeStatus(application._id, e.target.value)}
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

export default Applicants;
