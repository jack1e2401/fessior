import { useNavigate } from "react-router-dom";
import SocialLogin from "./SocialLogin";
import AuthDivider from "./AuthDivider";

const LoginForm = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    // TODO: thay bằng call API thật sau, lưu token thực vào đây
    localStorage.setItem("isLoggedIn", "true");
    navigate("/home");
  };

  return (
    <div className="auth-right">
      <h2 className="auth-title">Log In Account</h2>

      <p className="auth-subtitle">
        Enter your personal data to create your account.
      </p>

      <SocialLogin />

      <AuthDivider />

      <div className="auth-form">
        <div className="auth-field">
          <label>Email</label>
          <input type="email" placeholder="khoicoder1@gmail.com" />
        </div>

        <div className="auth-field">
          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
          />

          <small
            style={{
              textAlign: "right",
              color: "#142D55",
              cursor: "pointer",
            }}
          >
            Forgot your password?
          </small>
        </div>

        <button className="auth-submit" onClick={handleLogin}>
          Log In
        </button>

        <p className="auth-switch">
          Don't have an account?
          <a href="/register"> Sign Up</a>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;