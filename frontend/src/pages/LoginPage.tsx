import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SiGithub, SiX } from 'react-icons/si';

const API_URL = import.meta.env.VITE_API_URL;

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Handle OAuth callback
    const token = searchParams.get('token');
    if (token) {
      login(token);
      navigate('/dashboard');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="card max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🚀 X Poster</h1>
          <p className="text-gray-600">
            Automated posting with AI-powered tone enforcement
          </p>
        </div>

        <div className="space-y-4">
          <a
            href={`${API_URL}/auth/github`}
            className="btn btn-primary w-full flex items-center justify-center gap-2"
          >
            <SiGithub size={20} />
            Continue with GitHub
          </a>

          <a
            href={`${API_URL}/auth/twitter`}
            className="btn w-full flex items-center justify-center gap-2 bg-[#1DA1F2] text-white hover:bg-[#1a8cd8]"
          >
            <SiX size={20} />
            Continue with Twitter
          </a>
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>By continuing, you agree to our Terms of Service</p>
        </div>
      </div>
    </div>
  );
}