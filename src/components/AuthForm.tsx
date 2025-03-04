import { useState } from "react";
import { SignUp } from "@/components/auth/SignUp";
import { SignIn } from "@/components/auth/SignIn";

export function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);

  const toggleAuthMode = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log(
      "[AuthForm] Toggling auth mode from",
      isSignUp ? "signup" : "signin",
      "to",
      !isSignUp ? "signup" : "signin"
    );
    setIsSignUp(!isSignUp);
  };

  return isSignUp ? (
    <SignUp onToggleMode={toggleAuthMode} />
  ) : (
    <SignIn onToggleMode={toggleAuthMode} />
  );
}
