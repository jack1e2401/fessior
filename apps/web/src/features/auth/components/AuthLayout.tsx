import React from "react";

interface Props {
  children: React.ReactNode;
}

const AuthLayout: React.FC<Props> = ({ children }) => {
  return <div className="auth-layout">{children}</div>;
};

export default AuthLayout;