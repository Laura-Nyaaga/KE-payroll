'use client';
import { useState, useEffect } from 'react';
import EditRegion from './editRegion';
import api, { BASE_URL } from '../../../config/api';

export default function RegionTable() {
  const [regions, setRegions] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentRegion, setCurrentRegion] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch regions from API
  const fetchRegions = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`${BASE_URL}/regions`, {
        // withCredentials: true
      });

      console.log('Response Status:', response.status);
      setRegions(response.data);  // This is correct for Axios-style API client
      setError(null); // Clear any previous errors
    } catch (error) {
      console.error('Error fetching regions:', error);
      setError(error.response?.data?.message || 'Failed to fetch regions. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch regions on component mount
  useEffect(() => {
    fetchRegions();  // Now fetchRegions is defined and can be called here
  }, []);

  // Handle region update
  const handleEditRegion = async (updatedRegion) => {
    try {
      const response = await fetch(`/api/regions/${updatedRegion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          // Add any authentication headers if required
        },
        body: JSON.stringify(updatedRegion)
      });

      if (!response.ok) {
        throw new Error('Failed to update region');
      }

      const returnedRegion = await response.json();

      // Optimistically update the local state
      setRegions(regions.map(region => 
        region.id === returnedRegion.id ? returnedRegion : region
      ));
      setShowEditModal(false);
    } catch (err) {
      setError(err.message);
      console.error('Error updating region:', err);
    }
  };

  // Toggle region status
  const handleToggleStatus = async (regionId) => {
    try {
      const regionToToggle = regions.find(region => region.id === regionId);
      if (!regionToToggle) {
        throw new Error('Region not found');
      }

      const newStatus = regionToToggle.status === 'Active' ? 'Inactive' : 'Active';

      const response = await fetch(`/api/regions/${regionId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          // Add any authentication headers if required
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Failed to update region status');
      }

      // Optimistically update the local state
      setRegions(regions.map(region => 
        region.id === regionId 
          ? { ...region, status: newStatus }
          : region
      ));
    } catch (err) {
      setError(err.message);
      console.error('Error toggling region status:', err);
    }
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-blue-500"></div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="p-6 bg-red-50 text-red-600">
        <h2 className="text-xl font-bold mb-4">Error</h2>
        <p>{error}</p>
        <button 
          onClick={fetchRegions} 
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border px-4 py-2 text-left w-16">No.</th>
              <th className="border px-4 py-2 text-left">Name</th>
              <th className="border px-4 py-2 text-left">Status</th>
              {/* <th className="border px-4 py-2 text-center w-16">Status</th> */}
            </tr>
          </thead>
          <tbody>
            {regions.map((region) => (
              <tr key={region.id} className="hover:bg-gray-50">
                <td className="border px-4 py-2">{region.id}.</td>
                <td className="border px-4 py-2">{region.name}</td>
                {/* <td className="border px-4 py-2">{region.status}</td> */}

                <td className="border px-4 py-2">
                  <span className="text-green-500 font-medium">
                    {region.parent}
                  </span>
                </td>

                <td className="border px-4 py-2">
                  <span 
                    className={`px-2 py-1 rounded text-xs ${
                      region.status === 'Active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {region.status}
                  </span>
                </td>

                <td className="border px-4 py-2 text-center">
                  <div className="flex justify-center items-center space-x-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentRegion(region);
                        setShowEditModal(true);
                      }}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                      </svg>
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleStatus(region.id);
                      }}
                      className={`${
                        region.status === 'Active' 
                          ? 'text-red-500 hover:text-red-700' 
                          : 'text-green-500 hover:text-green-700'
                      }`}
                    >
                      {region.status === 'Active' ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path>
                          <line x1="12" y1="2" x2="12" y2="12"></line>
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 8v4M12 16h.01"></path>
                        </svg>
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showEditModal && currentRegion && (
        <EditRegion
          region={currentRegion}
          onClose={() => setShowEditModal(false)}
          onUpdate={handleEditRegion}
          onToggleStatus={() => handleToggleStatus(currentRegion.id)}
        />
      )}
    </>
  );
}