'use client'

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import api, { BASE_URL } from '../../config/api';
import { useAuth } from "../../hooks/useAuth"; 

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login: authLogin } = useAuth(); 

  const handleLoginClick = async () => {
    setError(""); 
    setIsLoading(true);

    try {
      const response = await api.post(`${BASE_URL}/auth/login`, { email, password });

      // Extract user and company data from the response
      const userData = response.data.user;
      const companyData = response.data.company || null; 

      authLogin(userData, companyData);

      router.push('/authenticated/dashboard');
    } catch (err) {
      console.error("Login error:", err);
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-gray-200 p-10 rounded-lg shadow-lg w-150">
        <h3 className="text-lg font-semibold text-center mb-4">Log In</h3>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block font-medium mb-1">Email</label>
            <input
              type="email"
              className="w-full p-2 border border-gray-300 rounded-md bg-white shadow-md focus:ring-2 focus:ring-blue-400 focus:outline-none text-black"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full p-2 border border-gray-300 rounded-md bg-white shadow-md focus:ring-2 focus:ring-blue-400 focus:outline-none text-black"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Link href="/auth/forgot-password" passHref className="text-blue-600 hover:underline text-sm">
              Forgot Paasword?
          </Link>
            <div className="flex items-center">
              <input type="checkbox" id="remember" className="mr-2" />
              <label htmlFor="remember" className="text-sm">Remember Me</label>
            </div>
          </div>
          <button
            type="button"
            className={`w-full bg-blue-400 text-white font-semibold py-2 rounded-md hover:bg-blue-500 transition ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            onClick={handleLoginClick}
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
        <p className="text-center text-sm mt-4">
          Don't have an account?{" "}
          <Link href="/auth/signup" className="text-blue-600 hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}





