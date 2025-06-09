// pages/api/protected-route.js
import { getSession } from 'next-auth/react';

export default async function handler(req, res) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  // Handle protected route logic
  res.status(200).json({ data: 'Protected data' });
}