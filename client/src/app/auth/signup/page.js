'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../config/api'; 

export default function SignUp() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');
  const [formData, setFormData] = useState({
    name: '', // Changed to 'name' to match DB field
    companyLogo: null,
    registrationNo: '',
    currency: '',
    industry: '',
    address: '',
    phone: '',
    email: '',
    kraPin: '',
    bankName: '',
    branchName: '',
    accountNumber: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    // Validate required fields
    Object.keys(formData).forEach(field => {
      if (field === 'companyLogo') {
        // Company logo is not strictly required, but we can validate file size if uploaded
        if (formData.companyLogo && formData.companyLogo.size > 5 * 1024 * 1024) { // 5MB limit
          newErrors.companyLogo = 'Logo file size must be less than 5MB';
          isValid = false;
        }
      } else if (!formData[field] && field !== 'confirmPassword') {
        newErrors[field] = `${field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1')} is required`;
        isValid = false;
      }
    });

    // Validate password length (minimum 8 characters)
    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
      isValid = false;
    }

    // Validate password match
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    // Validate email format
    if (formData.email && !/^\S+@\S+\.\S+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Reset errors
    setServerError('');
    setShowTermsError(false);
    
    // Check terms agreement
    if (!agreed) {
      setShowTermsError(true);
      return;
    }
    
    // Validate form
    const isValid = validateForm();
    
    if (isValid) {
      setIsSubmitting(true);
      
      try {
        // Create data object to send - name is already correct in formData
        const dataToSubmit = {
          name: formData.name, // This now matches both the form state and the DB field
          registrationNo: formData.registrationNo,
          currency: formData.currency,
          industry: formData.industry, 
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          kraPin: formData.kraPin,
          bankName: formData.bankName,
          branchName: formData.branchName,
          accountNumber: formData.accountNumber,
          password: formData.password
        };
        
        console.log('Registration data being submitted:', dataToSubmit);
        
        // Send data to your backend as JSON
        const response = await api.post('/companies/register', dataToSubmit);
        
        console.log('Registration successful:', response.data);
        
        // Handle logo upload separately if needed
        if (formData.companyLogo) {
          const logoFormData = new FormData();
          logoFormData.append('companyLogo', formData.companyLogo);
          logoFormData.append('companyId', response.data.company.id); // Assuming the API returns company ID
          
          try {
            await api.post('/companies/upload-logo', logoFormData, {
              headers: {
                'Content-Type': 'multipart/form-data',
              },
            });
            console.log('Logo uploaded successfully');
          } catch (logoError) {
            console.error('Logo upload failed, but company was registered:', logoError);
          }
        }
        
        // Save company name to localStorage for header display
        if (response.data && response.data.company && response.data.company.name) {
          localStorage.setItem('companyName', response.data.company.name);
        } else {
          localStorage.setItem('companyName', formData.name);
        }
        
        // Show success message and redirect to login
        alert('Registration successful! Please log in with your credentials.');
        router.push('/auth/login');
        
      } catch (error) {
        console.error('Registration error:', error);
        
        // Enhance error logging to see exact server response
        if (error.response) {
          console.error('Server response:', error.response.data);
          console.error('Status code:', error.response.status);
          
          // Handle different types of errors
          if (error.response.data && error.response.data.message) {
            setServerError(error.response.data.message);
          } else if (error.response.status === 409) {
            setServerError('Email already exists. Please use a different email.');
          } else if (error.response.status === 400) {
            // For 400 errors, try to extract validation details
            if (error.response.data && error.response.data.errors) {
              const errorMessages = Object.values(error.response.data.errors).join(', ');
              setServerError(`Validation error: ${errorMessages}`);
            } else {
              setServerError('Invalid data submitted. Please check all fields.');
            }
          } else {
            setServerError('Registration failed. Please try again.');
          }
        } else if (error.request) {
          // No response received from the server
          setServerError('No response from server. Please check your connection.');
        } else {
          // Error in request setup
          setServerError('An error occurred. Please try again.');
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <div className="h-full flex items-center justify-center bg-white p-0">
      <div className="w-full max-w-6xl h-auto overflow-hidden">
        <form 
          onSubmit={handleSubmit}
          className="bg-gray-200 shadow-md rounded-lg p-5 border border-gray-200 h-full overflow-auto"
        >
          <h1 className="text-2xl font-bold text-black text-center mb-6">Sign Up</h1>
          
          {serverError && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{serverError}</span>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {/* Left Column */}
            <div className="space-y-4">
              {/* 1. Company Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name
                </label>
                <input
                  id="name"
                  name="name" // Changed to match state property and DB field
                  type="text"
                  required
                  className={`appearance-none block w-full px-3 py-1.5 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm bg-white text-black`}
                  value={formData.name}
                  onChange={handleChange}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* 2. Registration No. */}
              <div>
                <label htmlFor="registrationNo" className="block text-sm font-medium text-gray-700 mb-1">
                  Registration No.
                </label>
                <input
                  id="registrationNo"
                  name="registrationNo"
                  type="text"
                  required
                  className={`appearance-none block w-full px-3 py-2 border ${errors.registrationNo ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm bg-white text-black`}
                  value={formData.registrationNo}
                  onChange={handleChange}
                />
                {errors.registrationNo && (
                  <p className="mt-1 text-sm text-red-600">{errors.registrationNo}</p>
                )}
              </div>

              {/* 3. Address */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  id="address"
                  name="address"
                  type="text"
                  required
                  className={`appearance-none block w-full px-3 py-2 border ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm bg-white text-black`}
                  value={formData.address}
                  onChange={handleChange}
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address}</p>
                )}
              </div>

              {/* 4. Email Address */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className={`appearance-none block w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm bg-white text-black`}
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* 5. Bank Name */}
              <div>
                <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Name
                </label>
                <input
                  id="bankName"
                  name="bankName"
                  type="text"
                  required
                  className={`appearance-none block w-full px-3 py-2 border ${errors.bankName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm bg-white text-black`}
                  value={formData.bankName}
                  onChange={handleChange}
                />
                {errors.bankName && (
                  <p className="mt-1 text-sm text-red-600">{errors.bankName}</p>
                )}
              </div>

              {/* 6. Account Number */}
              <div>
                <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number
                </label>
                <input
                  id="accountNumber"
                  name="accountNumber"
                  type="text"
                  required
                  className={`appearance-none block w-full px-3 py-2 border ${errors.accountNumber ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm bg-white text-black`}
                  value={formData.accountNumber}
                  onChange={handleChange}
                />
                {errors.accountNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.accountNumber}</p>
                )}
              </div>

              {/* 7. Create Password */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Create Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className={`appearance-none block w-full px-3 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm bg-white text-black`}
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              {/* 1. Company Logo */}
              <div>
                <label htmlFor="companyLogo" className="block text-sm font-medium text-gray-700 mb-1">
                  Company Logo
                </label>
                <div className="flex items-center">
                  <label className="cursor-pointer w-full">
                    <div className={`border ${errors.companyLogo ? 'border-red-500' : 'border-gray-300'} rounded-md px-3 py-2 bg-white flex items-center justify-between`}>
                      <span className="text-sm text-gray-500 truncate">
                        {formData.companyLogo ? formData.companyLogo.name : 'Upload logo (PDF, JPG, PNG)'}
                      </span>
                      <span className="bg-gray-100 px-3 py-1 rounded text-sm text-gray-700">Browse</span>
                    </div>
                    <input
                      id="companyLogo"
                      name="companyLogo"
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setFormData(prev => ({
                            ...prev,
                            companyLogo: e.target.files[0]
                          }));
                          if (errors.companyLogo) {
                            setErrors(prev => ({ ...prev, companyLogo: '' }));
                          }
                        }
                      }}
                    />
                  </label>
                </div>
                {errors.companyLogo && (
                  <p className="mt-1 text-sm text-red-600">{errors.companyLogo}</p>
                )}
              </div>

              {/* 2. Currency */}
              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
                  Currency
                </label>
                <select
                  id="currency"
                  name="currency"
                  required
                  className={`appearance-none block w-full px-3 py-2 border ${errors.currency ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm bg-white text-black`}
                  value={formData.currency}
                  onChange={handleChange}
                >
                  <option value="" disabled>Select Currency</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="KES">KES - Kenyan Shilling</option>
                </select>
                {errors.currency && (
                  <p className="mt-1 text-sm text-red-600">{errors.currency}</p>
                )}
              </div>

              {/* 3. Industry */}
              <div>
                <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
                  Industry
                </label>
                <select
                  id="industry"
                  name="industry"
                  required
                  className={`appearance-none block w-full px-3 py-2 border ${errors.industry ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm bg-white text-black`}
                  value={formData.industry}
                  onChange={handleChange}
                >
                  <option value="" disabled>Select Industry</option>
                  <option value="technology">Technology</option>
                  <option value="healthcare">Healthcare</option>
                  <option value="finance">Finance</option>
                  <option value="education">Education</option>
                  <option value="manufacturing">Manufacturing</option>
                </select>
                {errors.industry && (
                  <p className="mt-1 text-sm text-red-600">{errors.industry}</p>
                )}
              </div>

              {/* 4. Phone Number */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  required
                  className={`appearance-none block w-full px-3 py-2 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm bg-white text-black`}
                  value={formData.phone}
                  onChange={handleChange}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>

              {/* 5. KRA PIN */}
              <div>
                <label htmlFor="kraPin" className="block text-sm font-medium text-gray-700 mb-1">
                  KRA PIN
                </label>
                <input
                  id="kraPin"
                  name="kraPin"
                  type="text"
                  required
                  className={`appearance-none block w-full px-3 py-2 border ${errors.kraPin ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm bg-white text-black`}
                  value={formData.kraPin}
                  onChange={handleChange}
                />
                {errors.kraPin && (
                  <p className="mt-1 text-sm text-red-600">{errors.kraPin}</p>
                )}
              </div>

              {/* 6. Branch Name */}
              <div>
                <label htmlFor="branchName" className="block text-sm font-medium text-gray-700 mb-1">
                  Branch Name
                </label>
                <input
                  id="branchName"
                  name="branchName"
                  type="text"
                  required
                  className={`appearance-none block w-full px-3 py-2 border ${errors.branchName ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm bg-white text-black`}
                  value={formData.branchName}
                  onChange={handleChange}
                />
                {errors.branchName && (
                  <p className="mt-1 text-sm text-red-600">{errors.branchName}</p>
                )}
              </div>

              {/* 7. Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    className={`appearance-none block w-full px-3 py-2 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm bg-white text-black`}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Terms and Conditions */}
          <div className="flex items-start mt-4 mb-4">
            <div className="flex items-center h-5">
              <input
                id="terms"
                name="terms"
                type="checkbox"
                required
                className="h-4 w-4 text-cyan-600 focus:ring-cyan-500 border-gray-300 rounded"
                checked={agreed}
                onChange={() => {
                  setAgreed(!agreed);
                  if (showTermsError) setShowTermsError(false);
                }}
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="terms" className={`font-medium ${showTermsError ? 'text-red-600' : 'text-gray-900'}`}>
                I Agree To The Terms And Conditions
              </label>
              {showTermsError && (
                <p className="text-red-600">You must agree to the terms and conditions to proceed</p>
              )}
            </div>
          </div>
          
          {/* Submit Button */}
          <div className="flex flex-col items-center gap-3 mt-4">
            <button 
              type="submit" 
              className={`bg-cyan-500 hover:bg-cyan-600 text-white font -medium py-1.5 px-6 rounded-full font-medium ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing Up...' : 'Sign Up'}
            </button>
            
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/auth/login" className="font-medium text-cyan-600 hover:text-cyan-500">
                Login
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}