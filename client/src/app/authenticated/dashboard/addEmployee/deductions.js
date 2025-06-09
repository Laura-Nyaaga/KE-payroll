// import React, { useState, useEffect } from 'react';
// import api, { BASE_URL } from '../../../config/api';

// const DeductionComponent = ({ 
//   deductions, 
//   handleDeductionChange, 
//   handleRemoveDeduction, 
//   handleAddDeduction 
// }) => {
//   const [deductionTypes, setDeductionTypes] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   useEffect(() => {
//     const fetchDeductionTypes = async () => {
//       setLoading(true);
//       try {
//         const response = await fetch(`${BASE_URL}/deductions/company/${localStorage.getItem('companyId')}`);
//         setDeductionTypes(response.data);
//         setError(null);
//       } catch (err) {
//         console.error('Error fetching deduction types:', err);
//         setError('Failed to load deduction types. Using default options instead.');
//         // Fallback to default options if API fails
//         setDeductionTypes([
//           { id: 'loan', name: 'Loan Deduction' },
//           { id: 'pension', name: 'Pension Deduction' },
//           { id: 'insurance', name: 'Insurance Deduction' },
//           { id: 'savings', name: 'Savings Scheme' },
//           { id: 'advance', name: 'Salary Advance' }
//         ]);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchDeductionTypes();
//   }, []);

//   return (
//     <div className="md:col-span-2 mb-4">
//       <h4 className="font-medium mb-2">Added Deductions</h4>
      
//       {error && (
//         <div className="text-amber-600 bg-amber-50 p-2 mb-3 rounded-md border border-amber-200 text-sm">
//           {error}
//         </div>
//       )}
      
//       {deductions.map((deduction, index) => (
//         <div key={index} className="flex flex-col md:flex-row gap-2 mb-3 p-3 border border-gray-200 rounded-md bg-white">
//           <div className="flex-1">
//             <select
//               value={deduction.name}
//               onChange={(e) => handleDeductionChange(index, 'name', e.target.value)}
//               className="w-full border border-gray-200 p-2 rounded text-black shadow-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none"
//               disabled={loading}
//             >
//               <option value="" disabled>Select Deduction Type</option>
//               {deductionTypes.map(type => (
//                 <option key={type.id} value={type.id}>
//                   {type.name}
//                 </option>
//               ))}
//             </select>
//           </div>
          
//           <div className="flex-1">
//             <input
//               type="number"
//               value={deduction.amount}
//               onChange={(e) => handleDeductionChange(index, 'amount', e.target.value)}
//               placeholder="Amount"
//               className="w-full border border-gray-200 p-2 rounded text-black shadow-sm bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500"
//             />
//           </div>
          
//           <button
//             type="button"
//             onClick={() => handleRemoveDeduction(index)}
//             className="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition duration-200"
//             aria-label="Delete deduction"
//           >
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//               <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
//             </svg>
//           </button>
//         </div>
//       ))}
      
//       <button 
//         type="button" 
//         onClick={handleAddDeduction} 
//         className="mt-2 bg-teal-100 hover:bg-teal-200 text-teal-700 py-2 px-4 rounded flex items-center justify-center transition duration-200"
//         disabled={loading}
//       >
//         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
//           <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
//         </svg>
//         Add Another Deduction
//       </button>
//     </div>
//   );
// };

// export default DeductionComponent;