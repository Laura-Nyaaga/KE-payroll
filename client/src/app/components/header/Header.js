// 'use client';

// import { useEffect, useState } from 'react';
// import Link from 'next/link';

// export default function Header() {
//   const [companyName, setCompanyName] = useState('');
  
//   useEffect(() => {
//     const storedCompanyName = localStorage.getItem('companyName');
//     if (storedCompanyName) {
//       setCompanyName(storedCompanyName);
//     }
//   }, []);

//   return (
//     <header className="bg-white shadow-sm">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex justify-between h-16 items-center">
//           <div className="flex items-center">
//             <Link href="/dashboard" className="flex-shrink-0">
//               <img
//                 className="h-8 w-auto"
//                 src="/logo-placeholder.svg"  
//               />
//             </Link>
            
//             {companyName && (
//               <div className="ml-4 font-semibold text-lg text-gray-800">
//                 {companyName}
//               </div>
//             )}
//           </div>
          
//           <div className="flex items-center">
//             <nav className="flex space-x-4">
//               <Link href="/dashboard" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
//                 Dashboard
//               </Link>
//               <Link href="/settings" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50">
//                 Settings
//               </Link>
//               <button 
//                 onClick={() => {
//                   // Handle logout - clear storage and redirect
//                   localStorage.removeItem('companyName');
//                   window.location.href = '/login';
//                 }}
//                 className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50"
//               >
//                 Logout
//               </button>
//             </nav>
//           </div>
//         </div>
//       </div>
//     </header>
//   );
// }