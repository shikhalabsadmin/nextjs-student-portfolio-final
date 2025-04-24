import { useState, lazy, Suspense } from "react";
import { Loading } from "@/components/ui/loading";

const SignUp = lazy(() =>
  import("@/components/auth/SignUp").then((module) => ({
    default: module.SignUp,
  }))
);
const SignIn = lazy(() =>
  import("@/components/auth/SignIn").then((module) => ({
    default: module.SignIn,
  }))
);
const ResetPassword = lazy(() =>
  import("@/components/auth/ResetPassword").then((module) => ({
    default: module.ResetPassword,
  }))
);

type AuthMode = "signin" | "signup" | "reset";

export function AuthForm() {
  const [authMode, setAuthMode] = useState<AuthMode>("signin");

  const toggleAuthMode = (e: React.MouseEvent, mode: AuthMode) => {
    e.preventDefault();
    console.log("[AuthForm] Toggling auth mode from", authMode, "to", mode);
    setAuthMode(mode);
  };

  return (
    <Suspense
      fallback={
        <div className="flex flex-1 justify-center items-center">
          <Loading />
        </div>
      }
    >
      {(() => {
        switch (authMode) {
          case "signup":
            return <SignUp onToggleMode={(e) => toggleAuthMode(e, "signin")} />;
          case "reset":
            return (
              <ResetPassword
                onToggleMode={(e) => toggleAuthMode(e, "signin")}
              />
            );
          default:
            return (
              <SignIn
                onToggleMode={(e) => toggleAuthMode(e, "signup")}
                onResetPassword={(e) => toggleAuthMode(e, "reset")}
              />
            );
        }
      })()}
    </Suspense>
  );
}
