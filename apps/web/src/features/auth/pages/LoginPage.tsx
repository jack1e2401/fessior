import AuthLayout from "../components/AuthLayout";
import AuthLeftPanel from "../components/AuthLeftPanel-Login";
import LoginForm from "../components/LoginForm";

const LoginPage = () => {
  return (
    <AuthLayout>
      <AuthLeftPanel />
      <LoginForm />
    </AuthLayout>
  );
};

export default LoginPage;