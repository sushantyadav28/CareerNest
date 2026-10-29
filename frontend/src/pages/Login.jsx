import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "applicant",
  });
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    try {
      const { data } = await api.post("/auth/login", form);

      localStorage.setItem("careernest_token", data.token);
      localStorage.setItem("careernest_user", JSON.stringify(data.user));

      navigate(data.user.role === "recruiter" ? "/recruiter" : "/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
    }
  }

  return (
    <main className="form-page">
      <form className="form-card" onSubmit={handleSubmit}>
        <p className="eyebrow">WELCOME BACK</p>
        <h1>Log in to CareerNest</h1>

        <label>Email</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />

        <label>Password</label>
        <input
          type="password"
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

        {error && <p className="error">{error}</p>}
        <button type="submit">Log in</button>

        <p>
          New here? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </main>
  );
}

export default Login;
