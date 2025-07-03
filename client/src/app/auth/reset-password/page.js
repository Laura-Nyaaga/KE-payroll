'use client';
export const dynamic = 'force-dynamic';

import { Suspense } from 'react';
import ResetPasswordPage from './ResetPasswordPage';

export default function Page() {
  return (
    <Suspense fallback={<div>Loading reset page...</div>}>
      <ResetPasswordPage />
    </Suspense>
  );
}
