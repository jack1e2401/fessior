import SocialLogin from "./SocialLogin";
import AuthDivider from "./AuthDivider";

const RegisterForm = () => {
  return (
    <div className="auth-right">
      <h2 className="auth-title">
        Sign Up Account
      </h2>

      <p className="auth-subtitle">
        Enter your personal data to create your account.
      </p>

      <SocialLogin />

      <AuthDivider />

      <div className="auth-form">
        <div className="auth-row">
          <div className="auth-field">
            <label>First Name</label>

            <input
              type="text"
              placeholder="eg. Khoi"
            />
          </div>

          <div className="auth-field">
            <label>Last Name</label>

            <input
              type="text"
              placeholder="eg. Anh"
            />
          </div>
        </div>

        <div className="auth-field">
          <label>Email</label>

          <input
            type="email"
            placeholder="khoicoder1@gmail.com"
          />
        </div>

        <div className="auth-field">
          <label>Password</label>

          <input
            type="password"
            placeholder="Enter your password"
          />

          <small>
            Must be at least 8 characters.
          </small>
        </div>

        <button className="auth-submit">
          Sign Up
        </button>

        <p className="auth-switch">
          Already have an account?
          <a href="/login"> Log in</a>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;