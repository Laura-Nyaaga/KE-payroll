// /auth/forgot-password.tsx

"use client";
import { useState } from 'react';
import api, { BASE_URL } from '@/app/config/api';
import toast from 'react-hot-toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post(`${BASE_URL}/auth/request-password`, { email });
      toast.success('Check your email for a password reset link!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Forgot Password?</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Enter your email"
          className="w-full border p-2 mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
    </div>
  );
}
