import { AuthForm } from "@/components/AuthForm";
import { Sparkles, BookOpen, Pencil, Star } from "lucide-react";

export default function Index() {
  return (
    <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-5 overflow-hidden">
      {/* Left column - Hero section (3/5 width on large screens) */}
      <div className="lg:col-span-3 flex flex-col justify-center px-6 py-8 lg:px-16 lg:py-12 bg-gradient-to-br from-white via-blue-50 to-blue-100">
        <div className="inline-flex items-center px-3 py-1 bg-blue-100 rounded-full text-xs font-medium self-start mb-6 text-blue-600">
          <Sparkles className="w-3 h-3 mr-1.5" />
          Your academic journey starts here
        </div>

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-800 mb-4 leading-tight">
          Document Your Academic Growth
          <span className="text-blue-600 block mt-2">with Portfolio Analyzer</span>
        </h1>

        <p className="text-base md:text-lg text-gray-600 max-w-md mb-6 lg:mb-8">
          A comprehensive platform for students to document, reflect, and
          showcase their academic work.
        </p>
        
        {/* Feature bullets */}
        <div className="hidden lg:flex flex-col space-y-4 mb-6">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
              <BookOpen className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-sm text-gray-700">Track your learning progress</span>
          </div>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center mr-3">
              <Pencil className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-sm text-gray-700">Reflect on your achievements</span>
          </div>
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center mr-3">
              <Star className="w-4 h-4 text-yellow-600" />
            </div>
            <span className="text-sm text-gray-700">Showcase your best work</span>
          </div>
        </div>
      </div>
      
      {/* Right column - Auth form (2/5 width on large screens) */}
      <div className="lg:col-span-2 flex items-center justify-center px-6 py-8 lg:px-12 lg:py-0 bg-white">
        <div className="w-full max-w-md">
          <AuthForm />
        </div>
      </div>
    </div>
  );
}
