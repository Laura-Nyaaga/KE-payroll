// 'use client';

// import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import apiClient from '../../../../../lib/apiClient';

// export default function EditEmployee({ params }) {
//   const router = useRouter();
//   const employeeId = params.id;
  
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [employee, setEmployee] = useState({
//     firstName: '',
//     lastName: '',
//     workEmail: '',
//     department: { id: '', title: '' },
//     employmentType: '',
//     basicSalary: ''
//   });
//   const [departments, setDepartments] = useState([]);
//   const [employmentTypes] = useState(['Full-time', 'Part-time', 'Contract', 'Intern']);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setIsLoading(true);
//         // Fetch employee data
//         const employeeData = await apiClient.employees?.getById?.(employeeId) || 
//                              await apiClient.getById(employeeId);
        
//         // Fetch departments for dropdown
//         const departmentsData = await apiClient.departments?.getAll?.() || 
//                                 await apiClient.departments.getAll();
        
//         setEmployee(employeeData);
//         setDepartments(departmentsData);
//       } catch (err) {
//         console.error('Error fetching data:', err);
//         setError('Failed to load employee data');
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     if (employeeId) {
//       fetchData();
//     }
//   }, [employeeId]);

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
    
//     if (name === 'departmentId') {
//       // Handle department selection
//       const selectedDept = departments.find(dept => dept.id === value);
//       setEmployee({
//         ...employee,
//         department: {
//           id: value,
//           title: selectedDept?.title || ''
//         }
//       });
//     } else if (name === 'basicSalary') {
//       // Handle salary as number input
//       setEmployee({
//         ...employee,
//         [name]: value === '' ? '' : parseFloat(value)
//       });
//     } else {
//       // Handle other inputs
//       setEmployee({
//         ...employee,
//         [name]: value
//       });
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     try {
//       setIsLoading(true);
      
//       // Update employee
//       await apiClient.employees?.update?.(employeeId, employee) || 
//             await apiClient.update(employeeId, employee);
      
//       alert('Employee updated successfully');
//       router.push('/authenticated/dashboard'); // Redirect back to employee list
//     } catch (err) {
//       console.error('Error updating employee:', err);
//       setError('Failed to update employee');
//       setIsLoading(false);
//     }
//   };

//   const handleCancel = () => {
//     router.push('/authenticated/dashboard');
//   };

//   if (isLoading) {
//     return (
//       <div className="flex justify-center items-center h-screen">
//         <div className="w-6 h-6 border-t-2 border-blue-500 rounded-full animate-spin"></div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="flex flex-col items-center justify-center h-screen">
//         <div className="text-red-500 mb-4">{error}</div>
//         <button 
//           onClick={handleCancel}
//           className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//         >
//           Go Back
//         </button>
//       </div>
//     );
//   }

//   return (
//     <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4">
//       <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
//         <div className="border-b px-6 py-3 flex justify-between items-center">
//           <h2 className="text-xl font-semibold text-gray-800">Edit Employee</h2>
//           <button 
//             onClick={handleCancel}
//             className="text-gray-500 hover:text-gray-700"
//           >
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//             </svg>
//           </button>
//         </div>
        
//         <form onSubmit={handleSubmit} className="p-6">
//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
//               <input
//                 type="text"
//                 name="firstName"
//                 value={employee.firstName || ''}
//                 onChange={handleInputChange}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 required
//               />
//             </div>
            
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
//               <input
//                 type="text"
//                 name="lastName"
//                 value={employee.lastName || ''}
//                 onChange={handleInputChange}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 required
//               />
//             </div>
            
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Work Email</label>
//               <input
//                 type="email"
//                 name="workEmail"
//                 value={employee.workEmail || ''}
//                 onChange={handleInputChange}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 required
//               />
//             </div>
            
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
//               <select
//                 name="departmentId"
//                 value={employee.department?.id || ''}
//                 onChange={handleInputChange}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="">Select Department</option>
//                 {departments.map(dept => (
//                   <option key={dept.id} value={dept.id}>
//                     {dept.title}
//                   </option>
//                 ))}
//               </select>
//             </div>
            
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
//               <select
//                 name="employmentType"
//                 value={employee.employmentType || ''}
//                 onChange={handleInputChange}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//               >
//                 <option value="">Select Type</option>
//                 {employmentTypes.map(type => (
//                   <option key={type} value={type}>
//                     {type}
//                   </option>
//                 ))}
//               </select>
//             </div>
            
//             <div>
//               <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary (KES)</label>
//               <input
//                 type="number"
//                 name="basicSalary"
//                 value={employee.basicSalary || ''}
//                 onChange={handleInputChange}
//                 className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 step="0.01"
//                 min="0"
//               />
//             </div>
//           </div>
          
//           <div className="flex justify-end space-x-3 mt-6">
//             <button
//               type="button"
//               onClick={handleCancel}
//               className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
//               disabled={isLoading}
//             >
//               {isLoading ? 'Saving...' : 'Save Changes'}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// }