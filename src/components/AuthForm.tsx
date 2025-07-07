import { useState, lazy, Suspense, useEffect } from "react";
import { Loading } from "@/components/ui/loading";
import { cn } from "@/lib/utils";
import { ArrowLeft, Sparkles } from "lucide-react";

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
  const [authMode, setAuthMode] = useState<AuthMode>("signup");
  const [prevAuthMode, setPrevAuthMode] = useState<AuthMode>("signup");
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Direction of animation (left or right)
  const [direction, setDirection] = useState<'left' | 'right'>('left');

  // Track previous mode for animation direction
  useEffect(() => {
    if (authMode !== prevAuthMode) {
      setPrevAuthMode(authMode);
    }
  }, [authMode, prevAuthMode]);

  const toggleAuthMode = (e: React.MouseEvent, mode: AuthMode) => {
    e.preventDefault();
    
    if (authMode === mode) return;
    
    // Set animation direction
    if (mode === 'signin' && authMode === 'signup') {
      setDirection('left');
    } else if (mode === 'signup' && authMode === 'signin') {
      setDirection('right');
    } else if (mode === 'reset') {
      setDirection('right');
    } else if (authMode === 'reset') {
      setDirection('left');
    }
    
    setIsTransitioning(true);
    console.log("[AuthForm] Toggling auth mode from", authMode, "to", mode);
    
    // Small delay for smooth transition
    setTimeout(() => {
      setAuthMode(mode);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 150);
  };

  // Fixed height for container to prevent jumping - increased for signup form
  const containerHeight = authMode === "signup" ? "520px" : "420px";

  // Vibrant colors for kids
  const activeTabBg = "bg-blue-500";
  const activeTabText = "text-white";
  const inactiveTabHover = "hover:bg-blue-100";
  const borderColor = "border-blue-300";
  const iconColor = "text-blue-500";

  return (
    <div className="w-full">
      {/* Form selection tabs - fixed height to prevent jumping */}
      <div className={`flex rounded-xl overflow-hidden border-2 ${borderColor} shadow-sm bg-white mb-5 h-12`}>
        <button
          onClick={(e) => toggleAuthMode(e, "signup")}
          className={cn(
            "flex-1 py-3 px-4 text-center font-medium transition-all relative",
            authMode === "signup"
              ? `${activeTabBg} ${activeTabText}`
              : `text-gray-600 ${inactiveTabHover} hover:text-gray-900`
          )}
          aria-selected={authMode === "signup"}
          role="tab"
        >
          <span className="flex items-center justify-center">
            {authMode === "signup" && (
              <Sparkles className="w-4 h-4 mr-1.5 text-yellow-400" />
            )}
            Sign Up
          </span>
          {authMode === "signup" && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-yellow-400" />
          )}
        </button>
        <button
          onClick={(e) => toggleAuthMode(e, "signin")}
          className={cn(
            "flex-1 py-3 px-4 text-center font-medium transition-all relative",
            authMode === "signin"
              ? `${activeTabBg} ${activeTabText}` 
              : `text-gray-600 ${inactiveTabHover} hover:text-gray-900`
          )}
          aria-selected={authMode === "signin"}
          role="tab"
        >
          <span className="flex items-center justify-center">
            {authMode === "signin" && (
              <Sparkles className="w-4 h-4 mr-1.5 text-yellow-400" />
            )}
            Sign In
          </span>
          {authMode === "signin" && (
            <div className="absolute bottom-0 left-0 w-full h-1 bg-yellow-400" />
          )}
        </button>
      </div>

      {/* Fixed height container */}
      <div 
        className={`relative overflow-hidden w-full rounded-xl border-2 ${borderColor} bg-white shadow-md transition-all duration-300`}
        style={{ height: containerHeight }}
      >
        <div 
          className={cn(
            "w-full h-full absolute top-0 p-5 transition-all duration-300 ease-in-out",
            isTransitioning 
              ? direction === 'left' 
                ? '-translate-x-full opacity-0' 
                : 'translate-x-full opacity-0'
              : 'translate-x-0 opacity-100'
          )}
        >
          <Suspense
            fallback={
              <div className="flex flex-1 justify-center items-center h-full">
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
                    <div>
                      <button
                        onClick={(e) => toggleAuthMode(e, "signin")}
                        className="group flex items-center text-blue-500 hover:text-blue-600 transition-colors mb-4"
                        aria-label="Back to sign in"
                      >
                        <ArrowLeft className="mr-1.5 h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                        <span className="text-sm font-medium">Back to Sign In</span>
                      </button>
                      <ResetPassword onToggleMode={(e) => toggleAuthMode(e, "signin")} />
                    </div>
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
        </div>
      </div>
    </div>
  );
}
