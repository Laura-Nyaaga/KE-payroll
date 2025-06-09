'use client';
import { useState } from 'react';
import EditDepartment from './editDepartment';

export default function DepartmentTable({ departments, setDepartments }) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentDepartment, setCurrentDepartment] = useState(null);

  const handleEditDepartment = (updatedDepartment) => {
    setDepartments(departments.map(dept => 
      dept.id === updatedDepartment.id ? updatedDepartment : dept
    ));
    setShowEditModal(false);
  };

  const handleDeleteDepartment = (id) => {
    setDepartments(departments.filter(dept => dept.id !== id));
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-4 py-2 text-left w-16">No.</th>
              <th className="border px-4 py-2 text-left">Department Code</th>
              <th className="border px-4 py-2 text-left">Department Title</th>
              <th className="border px-4 py-2 text-left">Department Description</th>
              <th className="border px-4 py-2 text-left">Parent Dept</th>
              <th className="border px-4 py-2 text-center w-16">Actions</th>
            </tr>
          </thead>
          <tbody>
            {departments.map((department) => (
              <tr key={department.id} className="hover:bg-gray-50">
                <td className="border px-4 py-2">{department.departmentCode}</td>
                <td className="border px-4 py-2">{department.title}</td>
                <td className="border px-4 py-2">{department.description}</td>
                <td className="border px-4 py-2">
                  <span className="text-green-500 font-medium">
                    {department.parent}
                  </span>
                </td>
                <td className="border px-4 py-2 text-center">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentDepartment(department);
                      setShowEditModal(true);
                    }}
                    className="text-red-500"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"></path>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showEditModal && currentDepartment && (
        <EditDepartment
          department={currentDepartment}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleEditDepartment}
          onDelete={() => {
            handleDeleteDepartment(currentDepartment.id);
            setShowEditModal(false);
          }}
        />
      )}
    </>
  );
}