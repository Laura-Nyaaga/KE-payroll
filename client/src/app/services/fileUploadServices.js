// services/fileUploadService.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance with default config for file uploads
const fileUploadClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

// Add request interceptor to include auth token
fileUploadClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const fileUploadService = {
  // Upload employee document (passport photo, certificate, etc.)
  uploadEmployeeDocument: async (file, documentType) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType); // e.g., 'passportPhoto', 'certificatePhoto'
      pend('file', file);
      formData.a
      const response = await fileUploadClient.post('/uploads/employee-documents', formData);
      return response.data;
    } catch (error) {
      throw error.response ? error.response.data : error;
    }
  }
};

export default fileUploadService;

// Example component for file upload (FileUpload.jsx)
import React, { useState } from 'react';
import fileUploadService from '../services/fileUploadService';

const FileUpload = ({ onUploadSuccess, documentType, label }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState(0);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    try {
      setUploading(true);
      setProgress(0);
      
      // Create custom axios instance with progress tracking
      const uploadInstance = axios.create({
        baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setProgress(percentCompleted);
        }
      });
      
      const formData = new FormData();
      formData.append('file', file);
      formData.append('documentType', documentType);
      
      const response = await uploadInstance.post('/uploads/employee-documents', formData);
      
      if (onUploadSuccess) {
        onUploadSuccess(response.data.fileUrl);
      }
      
      setFile(null);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="file-upload-container">
      <label className="upload-label">{label || 'Upload File'}</label>
      
      <div className="file-input-group">
        <input
          type="file"
          onChange={handleFileChange}
          disabled={uploading}
          className="file-input"
        />
        
        <button
          type="button"
          onClick={handleUpload}
          disabled={!file || uploading}
          className="upload-btn"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>
      
      {uploading && (
        <div className="progress-container">
          <div 
            className="progress-bar" 
            style={{ width: `${progress}%` }}
          ></div>
          <span className="progress-text">{progress}%</span>
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}
      
      {file && (
        <div className="selected-file">
          Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
        </div>
      )}
    </div>
  );
};
