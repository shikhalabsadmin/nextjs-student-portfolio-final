import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center">
      <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
      <h2 className="text-2xl font-semibold text-gray-800 mb-6">Page Not Found</h2>
      <p className="text-gray-600 max-w-md mb-8">
        The page you are looking for doesn't exist or you don't have permission to access it.
      </p>
      <div className="flex gap-4">
        <Button 
          onClick={() => navigate(-1)} 
          variant="outline"
        >
          Go Back
        </Button>
        <Button 
          onClick={() => navigate("/")}
        >
          Go Home
        </Button>
      </div>
    </div>
  );
} 