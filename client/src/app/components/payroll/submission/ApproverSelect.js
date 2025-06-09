"use client";

import { useEffect, useState } from 'react';
import api, { BASE_URL } from '@/app/config/api';
import { usePayrollContext } from '../context/PayrollContext'; // Import usePayrollContext

export default function ApproverSelect({ onApproverChange }) { // Removed 'status' prop from here
  const { selectedStatus } = usePayrollContext(); // Get selectedStatus from context
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [errorUsers, setErrorUsers] = useState(null);

  // Determine the label based on the selectedStatus from context
  const selectLabel = selectedStatus === 'draft' ? 'Select Approver' : 'Select Processor';

  useEffect(() => {
    async function fetchUsers() {
      setLoadingUsers(true);
      setErrorUsers(null);
      const companyId = localStorage.getItem('companyId');

      if (!companyId) {
        setErrorUsers('Company ID not found. Cannot fetch users.');
        setLoadingUsers(false);
        return;
      }

      try {
        const response = await api.get(`${BASE_URL}/users/company/${companyId}`);
        // Filter users to only include those with roles 'SuperAdmin', 'HRAdmin', 'HR', 'Accountant', 'Manager'
        // This is if only specific roles can be 'approvers' or 'processors' for submission.
        // If all users can be selected, remove this filter.
        const filterableRoles = ['SuperAdmin', 'HrAdmin', 'Hr', 'Accountant', 'Manager'];
        const selectableUsers = (response.data || []).filter(user =>
          filterableRoles.includes(user.role)
        );
        setUsers(selectableUsers);
      } catch (error) {
        console.error('Failed to load users:', error);
        setErrorUsers(error.response?.data?.message || 'Failed to load users.');
      } finally {
        setLoadingUsers(false);
      }
    }
    fetchUsers();
  }, []); 

  const handleChange = (e) => {
    const userId = e.target.value === "" ? "" : Number(e.target.value); // Convert to Number, handle empty string
    setSelectedUser(userId);
    onApproverChange(userId); 
  };

  // Only render the ApproverSelect if the status is 'draft'
  if (selectedStatus !== 'draft') {
    return null; // Don't render for other statuses as processedBy is now automatic
  }

  return (
    <div className="flex items-center gap-4 mt-4">
      {loadingUsers ? (
        <div className="text-gray-600 text-sm">Loading users...</div>
      ) : errorUsers ? (
        <div className="text-red-500 text-sm">{errorUsers}</div>
      ) : (
        <select
          value={selectedUser}
          onChange={handleChange}
          className="border rounded px-3 py-2 text-sm w-[200px] focus:ring-blue-500 focus:border-blue-500"
          disabled={loadingUsers}
        >
          <option value="">{selectLabel}</option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.firstName} {user.lastName}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
