import { LoadingSpinner } from "@/components/loading-spinner";

export default function AuthLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Authenticating...</p>
      </div>
    </div>
  );
}