'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();
  
  useEffect(() => {
    // Check if user is logged in (using localStorage for simplicity)
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    
    // Redirect to dashboard if logged in, otherwise to signup
    if (isLoggedIn === 'true') {
      router.push('/dashboard');
    } else {
      router.push('/auth/signup');
    }
  }, [router]);
  
  // Show a loading spinner while redirecting
  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-pink-500"></div>
    </div>
  );
}
