import { AuthForm } from "@/components/AuthForm";
import { Sparkles } from "lucide-react";

export default function Index() {
  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center py-12 px-4">
      <div className="max-w-4xl w-full">
        <div className="text-center space-y-6 mb-8">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-[#62C59F]/10 rounded-full text-[#62C59F] text-sm font-medium">
            <Sparkles className="w-4 h-4 mr-2" />
            Your academic journey starts here
          </div>

          {/* Heading */}
          <h1 className="text-5xl font-bold text-gray-900">
            Document Your Academic Growth
            <span className="block mt-2">with</span>
            <span className="text-[#62C59F] block mt-2">Portfolio Analyzer</span>
          </h1>

          {/* Description */}
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A comprehensive platform for students to document, reflect, and 
            showcase their academic work.
          </p>
        </div>

        {/* Auth Form */}
        <div id="auth-form" className="max-w-md mx-auto">
          <AuthForm />
        </div>
      </div>
    </div>
  );
}