'use client';
import { useState } from 'react';
import EditJobTitle from './EditJobTitle';

export default function JobTitleTable({ jobTitles, setJobTitles }) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentJob, setCurrentJob] = useState(null);

  const handleEditJob = (updatedJob) => {
    setJobTitles(jobTitles.map(job => job.id === updatedJob.id ? updatedJob : job));
    setShowEditModal(false);
  };

  const handleStatusChange = (id) => {
    setJobTitles(jobTitles.map(job => {
      if (job.id === id) {
        const newStatus = job.status === 'Active' ? 'Inactive' : 'Active';
        return { ...job, status: newStatus };
      }
      return job;
    }));
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-4 py-2 text-left w-16">No.</th>
              <th className="border px-4 py-2 text-left">Title</th>
              <th className="border px-4 py-2 text-left">Description</th>
              <th className="border px-4 py-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {jobTitles.map((job) => (
              <tr key={job.id} onClick={() => {
                setCurrentJob(job);
                setShowEditModal(true);
              }} className="cursor-pointer hover:bg-gray-50">
                <td className="border px-4 py-2">{job.id}.</td>
                <td className="border px-4 py-2">{job.name}</td>
                <td className="border px-4 py-2">{job.description}</td>
                <td className="border px-4 py-2">
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    job.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {job.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showEditModal && currentJob && (
        <EditJobTitle
          job={currentJob}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleEditJob}
          onStatusChange={() => handleStatusChange(currentJob.id)}
        />
      )}
    </>
  );
}