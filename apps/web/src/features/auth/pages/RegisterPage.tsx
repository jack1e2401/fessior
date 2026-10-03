import AuthLayout from "../components/AuthLayout";
import AuthLeftPanel from "../components/AuthLeftPanel-Register";
import RegisterForm from "../components/RegisterForm";

const RegisterPage = () => {
  return (
    <AuthLayout>
      <AuthLeftPanel />
      <RegisterForm />
    </AuthLayout>
  );
};

export default RegisterPage;