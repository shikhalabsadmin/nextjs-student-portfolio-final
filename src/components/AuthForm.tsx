import { useState } from "react";
import { SignUp } from "@/components/auth/SignUp";
import { SignIn } from "@/components/auth/SignIn";
import { ResetPassword } from "@/components/auth/ResetPassword";

type AuthMode = "signin" | "signup" | "reset";

export function AuthForm() {
  const [authMode, setAuthMode] = useState<AuthMode>("signin");

  const toggleAuthMode = (e: React.MouseEvent, mode: AuthMode) => {
    e.preventDefault();
    console.log(
      "[AuthForm] Toggling auth mode from",
      authMode,
      "to",
      mode
    );
    setAuthMode(mode);
  };

  switch (authMode) {
    case "signup":
      return <SignUp onToggleMode={(e) => toggleAuthMode(e, "signin")} />;
    case "reset":
      return <ResetPassword onToggleMode={(e) => toggleAuthMode(e, "signin")} />;
    default:
      return (
        <SignIn 
          onToggleMode={(e) => toggleAuthMode(e, "signup")}
          onResetPassword={(e) => toggleAuthMode(e, "reset")}
        />
      );
  }
}
