import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "applicant",
    companyName: "",
  });
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const { data } = await api.post("/auth/register", form);

      localStorage.setItem("careernest_token", data.token);
      localStorage.setItem("careernest_user", JSON.stringify(data.user));

      navigate(data.user.role === "recruiter" ? "/recruiter" : "/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    }
  }

  return (
    <main className="form-page">
      <form className="form-card" onSubmit={handleSubmit}>
        <p className="eyebrow">JOIN CAREERNEST</p>
        <h1>Create your account</h1>

        <label>Full name</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />

        <label>Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <label>Password (minimum 6 characters)</label>
        <input
          type="password"
          minLength={6}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />

        <label>Account type</label>
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value })}
        >
          <option value="applicant">Applicant</option>
          <option value="recruiter">Recruiter</option>
        </select>

        {form.role === "recruiter" && (
          <>
            <label>Company name</label>
            <input
              value={form.companyName}
              onChange={(e) =>
                setForm({ ...form, companyName: e.target.value })
              }
              required
            />
          </>
        )}

        {error && <p className="error">{error}</p>}
        <button type="submit">Create account</button>

        <p>
          Already registered? <Link to="/login">Log in</Link>
        </p>
      </form>
    </main>
  );
}

export default Register;
