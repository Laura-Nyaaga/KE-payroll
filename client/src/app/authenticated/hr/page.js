'use client';
import { useRouter } from 'next/navigation';

export default function HRSettingsPage() {
  const router = useRouter();
  
  // HR Settings options
  const hrSettingsOptions = [
    { id: 'job-title', name: 'Job Title', path: '/settings/hr/job-title' },
    { id: 'departments', name: 'Departments', path: '/settings/hr/departments' },
    { id: 'projects', name: 'Projects', path: '/settings/hr/projects' },
    { id: 'region-branch', name: 'Region/Branch', path: '/settings/hr/region-branch' }
  ];
  
  const navigateTo = (path) => {
    router.push(path);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">HR Settings</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hrSettingsOptions.map((option) => (
          <div 
            key={option.id}
            className="bg-white shadow-md rounded-lg p-6 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigateTo(option.path)}
          >
            <h3 className="text-lg font-semibold mb-2">{option.name}</h3>
            <p className="text-gray-600">Manage {option.name.toLowerCase()} settings</p>
          </div>
        ))}
      </div>
    </div>
  );
}