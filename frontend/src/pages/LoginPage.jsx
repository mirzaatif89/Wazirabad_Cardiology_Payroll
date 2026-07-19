import { Eye, EyeOff, Lock, LogIn, User } from "lucide-react";
import React from "react";
import { useState } from "react";
import {
  loginUser,
  requestPasswordResetOtp,
  resetPasswordWithOtp,
  verifyPasswordResetOtp
} from "../services/api.js";

export default function LoginPage({ onLogin }) {
  const [form, setForm] = useState({ username: "", password: "" });
  const [status, setStatus] = useState({ type: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetMode, setResetMode] = useState(false);
  const [resetStep, setResetStep] = useState("request");
  const [resetForm, setResetForm] = useState({
    usernameOrEmail: "admin",
    otp: "",
    resetToken: "",
    newPassword: "",
    confirmPassword: ""
  });

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

  const updateResetField = (event) => {
    const { name, value } = event.target;
    const nextValue = name === "otp" ? value.replace(/\D/g, "").slice(0, 6) : value;
    setResetForm((current) => ({ ...current, [name]: nextValue }));
  };

  const sendOtp = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const result = await requestPasswordResetOtp(resetForm.usernameOrEmail);
      setResetStep("verify");
      setResetForm((current) => ({ ...current, otp: "", resetToken: "", newPassword: "", confirmPassword: "" }));
      setStatus({ type: "success", message: result.message });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const result = await verifyPasswordResetOtp({
        usernameOrEmail: resetForm.usernameOrEmail,
        otp: resetForm.otp
      });
      setResetForm((current) => ({ ...current, resetToken: result.resetToken, newPassword: "", confirmPassword: "" }));
      setResetStep("password");
      setStatus({ type: "success", message: result.message });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setLoading(true);
    setStatus({ type: "", message: "" });

    try {
      const result = await resetPasswordWithOtp({
        usernameOrEmail: resetForm.usernameOrEmail,
        resetToken: resetForm.resetToken,
        newPassword: resetForm.newPassword,
        confirmPassword: resetForm.confirmPassword
      });
      setStatus({ type: "success", message: result.message });
      setResetMode(false);
      setResetStep("request");
      setForm((current) => ({ ...current, username: resetForm.usernameOrEmail.includes("@") ? current.username : resetForm.usernameOrEmail, password: "" }));
      setResetForm({ usernameOrEmail: "admin", otp: "", resetToken: "", newPassword: "", confirmPassword: "" });
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

        {!resetMode ? (
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
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={updateField}
                placeholder="Enter password"
                autoComplete="current-password"
              />
              <button
                className="password-toggle"
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
              </button>
            </div>
          </label>

          <button type="submit" disabled={loading}>
            <LogIn size={19} />
            {loading ? "Signing in..." : "Login"}
          </button>

          <button
            className="forgot-password-link"
            type="button"
            onClick={() => {
              setResetMode(true);
              setStatus({ type: "", message: "" });
            }}
          >
            Forgot password?
          </button>

          {status.message ? (
            <p className={`status-message ${status.type}`}>{status.message}</p>
          ) : null}
        </form>
        ) : (
        <form
          className="login-form"
          onSubmit={resetStep === "request" ? sendOtp : resetStep === "verify" ? verifyOtp : resetPassword}
        >
          <label>
            <span>Username or Email</span>
            <div className="input-wrap">
              <User size={19} />
              <input
                name="usernameOrEmail"
                type="text"
                value={resetForm.usernameOrEmail}
                onChange={updateResetField}
                placeholder="admin or your email"
                autoComplete="username"
              />
            </div>
          </label>

          {resetStep === "verify" ? (
            <label>
              <span>OTP</span>
              <div className="input-wrap">
                <Lock size={19} />
                <input
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  value={resetForm.otp}
                  onChange={updateResetField}
                  placeholder="6 digit OTP"
                  autoComplete="one-time-code"
                />
              </div>
            </label>
          ) : null}

          {resetStep === "password" ? (
            <>
              <label>
                <span>New Password</span>
                <div className="input-wrap">
                  <Lock size={19} />
                  <input
                    name="newPassword"
                    type="password"
                    value={resetForm.newPassword}
                    onChange={updateResetField}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                  />
                </div>
              </label>

              <label>
                <span>Confirm Password</span>
                <div className="input-wrap">
                  <Lock size={19} />
                  <input
                    name="confirmPassword"
                    type="password"
                    value={resetForm.confirmPassword}
                    onChange={updateResetField}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                  />
                </div>
              </label>
            </>
          ) : null}

          <button type="submit" disabled={loading}>
            <LogIn size={19} />
            {loading
              ? "Please wait..."
              : resetStep === "request"
                ? "Send OTP"
                : resetStep === "verify"
                  ? "Verify OTP"
                  : "Save Password"}
          </button>

          {resetStep !== "request" ? (
            <button className="forgot-password-link" type="button" onClick={sendOtp} disabled={loading}>
              Resend OTP
            </button>
          ) : null}

          <button
            className="forgot-password-link"
            type="button"
            onClick={() => {
              setResetMode(false);
              setResetStep("request");
              setResetForm({ usernameOrEmail: "admin", otp: "", resetToken: "", newPassword: "", confirmPassword: "" });
              setStatus({ type: "", message: "" });
            }}
          >
            Back to login
          </button>

          {status.message ? (
            <p className={`status-message ${status.type}`}>{status.message}</p>
          ) : null}
        </form>
        )}
      </section>
    </main>
  );
}
