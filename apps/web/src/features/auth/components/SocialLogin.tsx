const SocialLogin = () => {
  return (
    <div className="auth-social">
      <button className="auth-social-btn">
        <img
          src="https://www.google.com/favicon.ico"
          alt="Google"
          width={18}
        />
        Google
      </button>

      <button className="auth-social-btn">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385..." />
        </svg>
        Github
      </button>
    </div>
  );
};

export default SocialLogin;