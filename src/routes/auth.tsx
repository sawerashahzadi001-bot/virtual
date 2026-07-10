// ============================
// MetaDress — Auth page (Sign In / Create Account)
// ============================

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { API } from "@/lib/luxe/data";
import "../styles-luxe/luxe-auth.css";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "MetaDress — Sign In" },
      { name: "description", content: "Sign in to your MetaDress account or create a free account to shop women’s fashion with AR try-on and AI styling." },
    ],
  }),
  component: AuthPage,
});

type Tab = "login" | "signup";
type BtnState = "idle" | "loading" | "success";

function AuthPage() {
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>("login");

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showLoginPw, setShowLoginPw] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginBtn, setLoginBtn] = useState<BtnState>("idle");
  const [loginSuccessMsg, setLoginSuccessMsg] = useState("");

  // Signup state
  const [signupName, setSignupName] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirm, setSignupConfirm] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showSignupPw, setShowSignupPw] = useState(false);
  const [signupError, setSignupError] = useState("");
  const [signupBtn, setSignupBtn] = useState<BtnState>("idle");
  const [signupSuccessMsg, setSignupSuccessMsg] = useState("");

  // ===== PRE-FILL EMAIL =====
  useEffect(() => {
    const savedEmail = localStorage.getItem("metadress_email");
    if (savedEmail) {
      setLoginEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const goHome = (delay: number) => setTimeout(() => navigate({ to: "/" }), delay);

  // ===== LOGIN =====
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoginError("");

    const email = loginEmail.trim();
    const password = loginPassword;

    if (!email || !password) {
      setLoginError("Please fill in all fields.");
      return;
    }

    setLoginBtn("loading");

    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setLoginError(data.message || "Login failed. Check your credentials.");
        setLoginBtn("idle");
        return;
      }

      // Store token and user
      localStorage.setItem("metadress_token", data.token);
      localStorage.setItem("metadress_user", JSON.stringify(data.user));

      setLoginSuccessMsg("Welcome back!");
      setLoginBtn("success");

      // Remember me
      if (rememberMe) {
        localStorage.setItem("metadress_email", email);
      }

      goHome(1000);
    } catch {
      // Fallback: demo login without backend
      if (email && password.length >= 6) {
        const demoUser = { id: "demo", name: email.split("@")[0], email };
        localStorage.setItem("metadress_token", "demo_token");
        localStorage.setItem("metadress_user", JSON.stringify(demoUser));
        setLoginSuccessMsg("Signed in (demo)!");
        setLoginBtn("success");
        goHome(1000);
      } else {
        setLoginError("Cannot connect to server. Make sure backend is running.");
        setLoginBtn("idle");
      }
    }
  };

  // ===== SIGNUP =====
  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setSignupError("");

    const name = signupName.trim();
    const email = signupEmail.trim();
    const password = signupPassword;
    const confirm = signupConfirm;

    if (!name || !email || !password || !confirm) {
      setSignupError("Please fill in all fields.");
      return;
    }

    if (password !== confirm) {
      setSignupError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setSignupError("Password must be at least 6 characters.");
      return;
    }

    if (!agreeTerms) {
      setSignupError("Please agree to the Terms & Privacy Policy.");
      return;
    }

    setSignupBtn("loading");

    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.errors ? data.errors[0].msg : data.message;
        setSignupError(msg || "Registration failed.");
        setSignupBtn("idle");
        return;
      }

      localStorage.setItem("metadress_token", data.token);
      localStorage.setItem("metadress_user", JSON.stringify(data.user));

      setSignupSuccessMsg("Account created!");
      setSignupBtn("success");
      goHome(1200);
    } catch {
      // Demo fallback
      const demoUser = { id: "demo_" + Date.now(), name, email };
      localStorage.setItem("metadress_token", "demo_token");
      localStorage.setItem("metadress_user", JSON.stringify(demoUser));
      setSignupSuccessMsg("Welcome to MetaDress!");
      setSignupBtn("success");
      goHome(1200);
    }
  };

  const successStyle = { background: "linear-gradient(135deg, #5cb85c, #4a9e4a)" };

  return (
    <div className="auth-layout">
      {/* Left Visual Panel */}
      <div className="auth-visual">
        <div className="auth-visual-inner">
          <Link to="/" className="auth-logo">
            <span className="logo-text">MetaDress</span>
            <span className="logo-sub">Virtual Style Studio</span>
          </Link>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="auth-form-panel">
        <div className="auth-form-inner">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${tab === "login" ? "active" : ""}`}
              id="loginTab"
              onClick={() => setTab("login")}
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${tab === "signup" ? "active" : ""}`}
              id="signupTab"
              onClick={() => setTab("signup")}
            >
              Create Account
            </button>
          </div>

          {/* Login Form */}
          <form className={`auth-form ${tab !== "login" ? "hidden" : ""}`} id="loginForm" onSubmit={handleLogin}>
            <h2>Welcome Back</h2>
            <p className="form-sub">Sign in to your MetaDress account</p>

            <div className="form-group">
              <label>Email Address</label>
              <div className="input-wrap">
                <i className="fas fa-envelope"></i>
                <input
                  type="email"
                  id="loginEmail"
                  placeholder="you@example.com"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-wrap">
                <i className="fas fa-lock"></i>
                <input
                  type={showLoginPw ? "text" : "password"}
                  id="loginPassword"
                  placeholder="Your password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="toggle-pw"
                  id="toggleLoginPw"
                  onClick={() => setShowLoginPw((s) => !s)}
                >
                  <i className={`fas ${showLoginPw ? "fa-eye-slash" : "fa-eye"}`}></i>
                </button>
              </div>
            </div>

            <div className="form-row">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  id="rememberMe"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />{" "}
                Remember me
              </label>
              <a href="#" className="forgot-link">Forgot password?</a>
            </div>

            <button
              type="submit"
              className="btn-auth"
              id="loginBtn"
              disabled={loginBtn !== "idle"}
              style={loginBtn === "success" ? successStyle : undefined}
            >
              {loginBtn === "loading" ? (
                <><i className="fas fa-circle-notch fa-spin"></i> Please wait...</>
              ) : loginBtn === "success" ? (
                <><i className="fas fa-check"></i> {loginSuccessMsg}</>
              ) : (
                <><span>Sign In</span><i className="fas fa-arrow-right"></i></>
              )}
            </button>

            <div className="auth-error" id="loginError">{loginError}</div>

            <div className="auth-divider"><span>or continue with</span></div>

            <div className="social-btns">
              <button type="button" className="social-btn google-btn">
                <i className="fab fa-google"></i> Google
              </button>
              <button type="button" className="social-btn facebook-btn">
                <i className="fab fa-facebook-f"></i> Facebook
              </button>
            </div>
          </form>

          {/* Signup Form */}
          <form className={`auth-form ${tab !== "signup" ? "hidden" : ""}`} id="signupForm" onSubmit={handleSignup}>
            <h2>Join MetaDress</h2>
            <p className="form-sub">Create your free account today</p>

            <div className="form-group">
              <label>Full Name</label>
              <div className="input-wrap">
                <i className="fas fa-user"></i>
                <input
                  type="text"
                  id="signupName"
                  placeholder="Your full name"
                  required
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <div className="input-wrap">
                <i className="fas fa-envelope"></i>
                <input
                  type="email"
                  id="signupEmail"
                  placeholder="you@example.com"
                  required
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Password</label>
              <div className="input-wrap">
                <i className="fas fa-lock"></i>
                <input
                  type={showSignupPw ? "text" : "password"}
                  id="signupPassword"
                  placeholder="Min. 6 characters"
                  required
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="toggle-pw"
                  id="toggleSignupPw"
                  onClick={() => setShowSignupPw((s) => !s)}
                >
                  <i className={`fas ${showSignupPw ? "fa-eye-slash" : "fa-eye"}`}></i>
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>Confirm Password</label>
              <div className="input-wrap">
                <i className="fas fa-lock"></i>
                <input
                  type="password"
                  id="signupConfirm"
                  placeholder="Repeat password"
                  required
                  value={signupConfirm}
                  onChange={(e) => setSignupConfirm(e.target.value)}
                />
              </div>
            </div>

            <label className="checkbox-label terms-check">
              <input
                type="checkbox"
                id="agreeTerms"
                required
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
              />
              I agree to the <a href="#">Terms</a> & <a href="#">Privacy Policy</a>
            </label>

            <button
              type="submit"
              className="btn-auth"
              id="signupBtn"
              disabled={signupBtn !== "idle"}
              style={signupBtn === "success" ? successStyle : undefined}
            >
              {signupBtn === "loading" ? (
                <><i className="fas fa-circle-notch fa-spin"></i> Please wait...</>
              ) : signupBtn === "success" ? (
                <><i className="fas fa-check"></i> {signupSuccessMsg}</>
              ) : (
                <><span>Create Account</span><i className="fas fa-arrow-right"></i></>
              )}
            </button>

            <div className="auth-error" id="signupError">{signupError}</div>
          </form>

          <p className="auth-back">
            <Link to="/"><i className="fas fa-arrow-left"></i> Back to Shop</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
