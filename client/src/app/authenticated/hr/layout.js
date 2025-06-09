'use client';
import Sidebar from "../Sidebar";
export default function HRSettingsLayout({ children }) {
  return (
    <div className="flex">
     
      <main className="flex-1 min-h-screen">
        {children}
      </main>
    </div>
  );
}