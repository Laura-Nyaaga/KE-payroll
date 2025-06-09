'use client';

import React, { useState, useEffect } from 'react';
import api, { BASE_URL } from '@/app/config/api';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

// Eye icon for password toggle (open)
const EyeOpenIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-5 h-5 text-gray-500 cursor-pointer hover:text-gray-700"
  >
    <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
    <path
      fillRule="evenodd"
      d="M1.323 11.447C2.811 6.976 7.027 3.75 12 3.75c4.973 0 9.189 3.226 10.677 7.697a1.125 1.125 0 010 .556c-1.488 4.471-5.703 7.697-10.677 7.697-4.973 0-9.189-3.226-10.677-7.697a1.125 1.125 0 010-.556zM12 17.25a5.25 5.25 0 100-10.5 5.25 5.25 0 000 10.5z"
      clipRule="evenodd"
    />
  </svg>
);

// Eye icon for password toggle (closed)
const EyeClosedIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="w-5 h-5 text-gray-500 cursor-pointer hover:text-gray-700"
  >
    <path
      d="M3.53 2.47a.75.75 0 00-1.06 1.06l18 18a.75.75 0 101.06-1.06l-18-18zM22.28 12.822a1.125 1.125 0 010 1.056c-1.488 4.471-5.703 7.697-10.677 7.697-4.973 0-9.189-3.226-10.677-7.697a1.125 1.125 0 010-1.056c.94-2.825 2.617-5.241 4.673-7.147a.75.75 0 00.1-.912l.145-.163a.75.75 0 00.007-.959 2.25 2.25 0 013.118-2.45c.189.04.375.085.558.134a.75.75 0 00.203-.006l.305-.082c.15-.04.298-.074.448-.093a.75.75 0 00-.087-1.493 8.25 8.25 0 00-2.883-.342 6.75 6.75 0 00-3.35 1.164.75.75 0 00-.317.07l-1.394.39a.75.75 0 00-.598.665c-.742 2.766-1.573 5.337-2.029 7.425a.75.75 0 00.598.908 1.125 1.125 0 01-.137.94c-1.065 1.066-1.897 2.296-2.502 3.659a.75.75 0 00.999.074 9.75 9.75 0 008.06-7.854c.243-.911.383-1.86.426-2.837a.75.75 0 00-.006-.239c0-.026-.002-.052-.006-.077a.75.75 0 00-.097-.282l-.082-.143a.75.75 0 00-.333-.217 2.25 2.25 0 01-2.434-2.434.75.75 0 00-.097-.333L7.5 11.25a.75.75 0 00-.097-.183 2.25 2.25 0 01-1.385-2.093c-.018-.118-.035-.238-.05-.357a.75.75 0 00-.92-.562c-.312.062-.622.128-.929.199a.75.75 0 00-.583.567A8.25 8.25 0 004.25 12a.75.75 0 00.007-.07c.306-1.282 1.047-2.383 1.96-3.235a.75.75 0 00.334-.736c-.03-.1-.06-.201-.09-.302a.75.75 0 00-.56-.911L4.85 6.75a.75.75 0 00-.598-.665A8.25 8.25 0 002.25 12c0 .026.002.052.006.077a.75.75 0 00.097.282l.082.143a.75.75 0 00.333.217 2.25 2.25 0 012.434 2.434.75.75 0 00.097.333L7.5 11.25z"
      clipRule="evenodd"
    />
  </svg>
);

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.email) {
          setEmail(user.email);
        }
      } catch (e) {
        console.error("Failed to parse user data from local storage:", e);
      }
    }
  }, []);

const handleSubmit = async (e) => {
  e.preventDefault();
  setIsResetting(true);
  setError(null);

 

  try {
    const response = await api.post(`${BASE_URL}/auth/reset-password`, {
      email,
      newPassword,
      confirmPassword,
    });

    console.log('API Response:', response); 
    if (response.data?.success || response.data?.includes('success')) {
      toast.success('Password reset successfully! Redirecting to login...', {
        id: 'reset-success',
        duration: 2000,
      });

      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        router.replace('/auth/login');
      }, 2000);
      return; 
    }

    throw new Error(response.data?.message || 'Password reset failed without error');

  } catch (err) {
    console.error('Error:', err);
    
    if (err.message.includes('success')) {
      toast.success('Password reset successful! Redirecting to login...', {
        id: 'reset-success',
        duration: 2000,
      });
      setTimeout(() => {
        router.replace('/auth/login');
      }, 2000);
    } else {
      setError(err.message);
      toast.error(err.message, { id: 'reset-error' });
    }
  } finally {
    setIsResetting(false);
  }
};

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md border border-gray-200">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Reset Your Password</h2>
        <p className="text-center text-gray-600 mb-8">Enter your email and new password to reset it.</p>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-5">
          <div>
            <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              id="reset-email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base"
              required
              readOnly
            />
          </div>
          
          <div className="relative">
            <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type={showNewPassword ? 'text' : 'password'}
              id="newPassword"
              name="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full pr-10 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base"
              required
            />
            <span
              className="absolute inset-y-0 right-0 top-7 pr-3 flex items-center"
              onClick={() => setShowNewPassword(!showNewPassword)}
            >
              {showNewPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
            </span>
          </div>
          
          <div className="relative">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm New Password
            </label>
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              name="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full pr-10 px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-base"
              required
            />
            <span
              className="absolute inset-y-0 right-0 top-7 pr-3 flex items-center"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeClosedIcon /> : <EyeOpenIcon />}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors duration-200 font-semibold text-lg disabled:opacity-50"
              disabled={isResetting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isResetting}
            >
              {isResetting ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

