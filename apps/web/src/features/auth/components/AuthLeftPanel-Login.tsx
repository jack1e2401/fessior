const AuthLeftPanel = () => {
  return (
    <div className="auth-left">
      <img src="/Frame 1.png" alt="" className="auth-bg" />

      <div className="auth-left-content">
        <img src="/Logo.png" alt="QUEU" className="auth-logo" />

        <h2 className="auth-tagline">Get Started with Us</h2>

        <p className="auth-tagline-sub">
          Complete these easy steps to register your account.
        </p>

        <div className="auth-steps">
          <div className="auth-step auth-step--active">
            <span className="auth-step-num">1</span>
            Sign up your account
          </div>

          <div className="auth-step">
            <span className="auth-step-num">2</span>
            Set up your information
          </div>

          <div className="auth-step">
            <span className="auth-step-num">3</span>
            Set up your profile
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLeftPanel;