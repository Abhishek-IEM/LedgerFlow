import { useState, useEffect, useRef, type FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authApi } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { BarChart3, Shield, Sun, Moon, Users } from "lucide-react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    initGoogleButton();
  }, [theme]);

  const initGoogleButton = () => {
    if (!GOOGLE_CLIENT_ID) {
      setError("Google sign-up is not configured.");
      return;
    }

    if (!window.google || !googleBtnRef.current) {
      const timer = setTimeout(initGoogleButton, 200);
      return () => clearTimeout(timer);
    }

    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse,
    });

    googleBtnRef.current.innerHTML = "";

    window.google.accounts.id.renderButton(googleBtnRef.current, {
      type: "standard",
      theme: theme === "dark" ? "filled_black" : "outline",
      size: "large",
      text: "signup_with",
      shape: "rectangular",
      width: "380",
      logo_alignment: "left",
    });
  };

  const handleGoogleResponse = async (response: GoogleCredentialResponse) => {
    setError("");
    setLoading(true);
    try {
      const res = await authApi.googleLogin(response.credential);
      const { token, user } = res.data.data;
      login(token, user);

      if (user.role === "VIEWER") {
        navigate("/records");
      } else {
        navigate("/dashboard");
      }
    } catch (err: any) {
      const msg =
        err.response?.data?.message ||
        "Google sign-up failed. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await authApi.register({ name, email, password });
      const { token, user } = res.data.data;
      login(token, user);
      navigate("/records");
    } catch (err: any) {
      const msg =
        err.response?.data?.message || "Registration failed. Try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <button
        className="auth-theme-toggle"
        onClick={toggleTheme}
        title="Toggle theme"
      >
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <div className="auth-left">
        <div className="auth-card">
          <div className="auth-header">
            <div className="auth-brand">
              <div className="auth-brand-icon">
                <svg width="22" height="22" viewBox="0 0 64 64" fill="none">
                  <rect
                    x="15"
                    y="12"
                    width="34"
                    height="40"
                    rx="3"
                    fill="rgba(255,255,255,0.2)"
                  />
                  <rect
                    x="15"
                    y="12"
                    width="5"
                    height="40"
                    rx="2"
                    fill="rgba(255,255,255,0.3)"
                  />
                  <rect
                    x="24"
                    y="19"
                    width="18"
                    height="2"
                    rx="1"
                    fill="rgba(255,255,255,0.6)"
                  />
                  <rect
                    x="24"
                    y="26"
                    width="14"
                    height="2"
                    rx="1"
                    fill="rgba(255,255,255,0.4)"
                  />
                  <path
                    d="M24 42 C28 38, 33 33, 38 28 Q41 25, 44 22"
                    stroke="#fff"
                    strokeWidth="3"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M39 20 L44 22 L42 27"
                    stroke="#fff"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    fill="none"
                  />
                  <circle cx="24" cy="42" r="2.2" fill="#a5f3fc" />
                </svg>
              </div>
              <span>LedgerFlow</span>
            </div>
            <h1>Create your account</h1>
            <p>Get started with LedgerFlow in seconds</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          {/* Google Sign-Up button */}
          <div ref={googleBtnRef} className="google-btn-wrapper" />

          <div className="auth-divider">
            <span>or register with email</span>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 6 characters"
                minLength={6}
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={loading}
            >
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-promo">
          <h2>Your financial data, organized and secure</h2>
          <p>
            Join teams that trust LedgerFlow to track, analyze, and manage their
            financial operations.
          </p>
          <ul className="auth-features">
            <li>
              <span className="feat-icon">
                <BarChart3 size={14} />
              </span>
              Category-wise expense breakdowns
            </li>
            <li>
              <span className="feat-icon">
                <Shield size={14} />
              </span>
              Secure, role-based data access
            </li>
            <li>
              <span className="feat-icon">
                <Users size={14} />
              </span>
              Admin, Analyst, and Viewer roles
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
