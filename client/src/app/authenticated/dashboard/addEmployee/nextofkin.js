'use client';
import React, { useState } from 'react';

export default function NextOfKinForm() {
  const [nextOfKin, setNextOfKin] = useState({
    fullNames: '',
    relationship: '',
    phoneNumber: '',
    email: ''
  });

  const [nextOfKinList, setNextOfKinList] = useState([]);

  // Hardcoded relationship options
  const relationshipOptions = [
    { value: 'Spouse', label: 'Spouse' },
    { value: 'Parent', label: 'Parent' },
    { value: 'Sibling', label: 'Sibling' },
    { value: 'Child', label: 'Child' },
    { value: 'Other', label: 'Other' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNextOfKin(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddNextOfKin = () => {
    if (!nextOfKin.fullNames || !nextOfKin.relationship || !nextOfKin.phoneNumber) {
      alert('Please fill in required fields');
      return;
    }

    setNextOfKinList(prev => [...prev, nextOfKin]);

    setNextOfKin({
      fullNames: '',
      relationship: '',
      phoneNumber: '',
      email: ''
    });
  };

  const handleRemoveNextOfKin = (index) => {
    setNextOfKinList(prev => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="container mx-auto p-6 bg-gray-50 rounded-md shadow-md">
      <h2 className="text-2xl font-bold mb-6">Next Of Kin</h2>

      {/* Input Form */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <input
          type="text"
          name="fullNames"
          value={nextOfKin.fullNames}
          onChange={handleInputChange}
          placeholder="Full Names"
          className="border border-gray-200 shadow-md p-2 rounded"
        />
        <select
          name="relationship"
          value={nextOfKin.relationship}
          onChange={handleInputChange}
          className="border border-gray-200 shadow-md p-2 rounded"
        >
          <option value="" disabled>Select Relationship</option>
          {relationshipOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          type="tel"
          name="phoneNumber"
          value={nextOfKin.phoneNumber}
          onChange={handleInputChange}
          placeholder="Phone Number"
          className="border border-gray-200 shadow-md p-2 rounded"
        />
        <input
          type="email"
          name="email"
          value={nextOfKin.email}
          onChange={handleInputChange}
          placeholder="Email (Optional)"
          className="border border-gray-200 shadow-md p-2 rounded"
        />
      </div>

      {/* Add Next of Kin Button */}
      <button 
        onClick={handleAddNextOfKin}
        className="bg-teal-500 text-white px-4 py-2 rounded hover:bg-teal-600 mb-6"
      >
        Add Next Of Kin
      </button>

      {/* Next of Kin List */}
      {nextOfKinList.length > 0 && (
        <div className="mt-6 border border-gray-200 rounded shadow-md">
          <table className="w-full border-collapse border-gray-100 shadow-md">
            <thead>
              <tr className="bg-blue-500 text-black">
                <th className="border p-2 text-left">Full Names</th>
                <th className="border p-2 text-left">Relationship</th>
                <th className="border p-2 text-left">Phone Number</th>
                <th className="border p-2 text-left">Email</th>
                <th className="border p-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {nextOfKinList.map((kin, index) => (
                <tr key={index} className="hover:bg-gray-100">
                  <td className="border p-2">{kin.fullNames}</td>
                  <td className="border p-2">{kin.relationship}</td>
                  <td className="border p-2">{kin.phoneNumber}</td>
                  <td className="border p-2">{kin.email}</td>
                  <td className="border p-2 text-center">
                    <button 
                      onClick={() => handleRemoveNextOfKin(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}