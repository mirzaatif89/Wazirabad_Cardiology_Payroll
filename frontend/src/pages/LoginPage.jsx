import { Lock, LogIn, User } from "lucide-react";
import React from "react";
import { useState } from "react";
import { loginUser } from "../services/api.js";

export default function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const result = await loginUser(form);
      setStatus({ type: "success", message: result.message });
      onLogin(result.user);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-panel" aria-label="Hospital payroll login">
        <div className="brand-block">
          <div className="brand-mark">
            <img src="/logo.png" alt="Wazirabad Cardiology Hospital logo" />
          </div>
          <div>
            <p className="eyebrow">Cardiology Hospital</p>
            <h1>Payroll System</h1>
          </div>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label>
            <span>Username</span>
            <div className="input-wrap">
              <User size={19} />
              <input
                name="username"
                type="text"
                value={form.username}
                onChange={updateField}
                placeholder="Enter username"
                autoComplete="username"
              />
            </div>
          </label>

          <label>
            <span>Password</span>
            <div className="input-wrap">
              <Lock size={19} />
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={updateField}
                placeholder="Enter password"
                autoComplete="current-password"
              />
            </div>
          </label>

          <button type="submit" disabled={loading}>
            <LogIn size={19} />
            {loading ? "Signing in..." : "Login"}
          </button>

          {status.message ? (
            <p className={`status-message ${status.type}`}>{status.message}</p>
          ) : null}
        </form>
      </section>
    </main>
  );
}
