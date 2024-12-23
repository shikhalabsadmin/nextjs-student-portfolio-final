import { useRouteError } from "react-router-dom";

export default function ErrorPage() {
  const error = useRouteError();
  console.error(error);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">Oops!</h1>
        <p className="text-lg text-gray-600 mb-8">Sorry, an unexpected error has occurred.</p>
        <p className="text-gray-500">
          {(error as Error)?.message || 'Unknown error occurred'}
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="mt-6 text-[#62C59F] hover:underline"
        >
          Go back home
        </button>
      </div>
    </div>
  );
} 