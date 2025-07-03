"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import Image from "next/image";
import api from "../../../config/api";

const CompanyDetails = () => {
  const { companyId: paramCompanyId } = useParams();
  const router = useRouter();
  const [company, setCompany] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  const [effectiveCompanyId, setEffectiveCompanyId] = useState(null);

  // const storedCompanyId = localStorage.getItem("companyId");
  // const effectiveCompanyId = paramCompanyId || storedCompanyId;

useEffect(() => {
  const storedCompanyId = typeof window !== 'undefined' ? localStorage.getItem('companyId') : null;
  setEffectiveCompanyId(paramCompanyId || storedCompanyId);
}, [paramCompanyId]);

  useEffect(() => {
     if (!effectiveCompanyId) return;
     
    const checkAuthAndAccess = () => {
      const userData = JSON.parse(localStorage.getItem("user"));

      if (!userData) {
        toast.error("Please log in");
        router.push("/auth/login");
        return false;
      }

      if (userData.role !== "SuperAdmin") {
        toast.error("Access denied. Only SuperAdmin can view this page.");
        router.push("/authenticated/dashboard");
        return false;
      }

      return true;
    };

    if (checkAuthAndAccess()) {
      fetchCompanyDetails();
    }
  }, [effectiveCompanyId, router]);

  const fetchCompanyDetails = async () => {
    try {
      const response = await api.get(`/companies/${effectiveCompanyId}`);
      setCompany(response.data);
      setFormData(response.data);
      setLoading(false);
    } catch (error) {
      toast.error("Failed to fetch company details");
      if (error.response?.status === 403) {
        toast.error("Access denied");
        router.push("/dashboard");
      }
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowedTypes.includes(file.type)) {
      setErrors((prev) => ({
        ...prev,
        companyLogo: "Only JPG, JPEG, or PNG formats allowed",
      }));
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        companyLogo: "File must be less than 5MB",
      }));
      return;
    }

    const formDataObj = new FormData();
    formDataObj.append("file", file);

    try {
      const response = await api.post(
        "/upload/companies/upload-logo",
        formDataObj,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      setFormData((prev) => ({ ...prev, companyLogo: response.data.url }));
      toast.success("Logo uploaded successfully");
      setErrors((prev) => ({ ...prev, companyLogo: "" }));
    } catch (error) {
      toast.error("Failed to upload logo");
      setErrors((prev) => ({ ...prev, companyLogo: "Upload failed" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (
      !formData.name ||
      formData.name.length < 2 ||
      formData.name.length > 100
    ) {
      newErrors.name = "Company name must be between 2 and 100 characters";
    }
    if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please provide a valid email address";
    }
    if (!formData.registrationNo) {
      newErrors.registrationNo = "Registration number cannot be empty";
    }
    if (formData.phoneNumber && !/^\+?[\d\s-]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Please provide a valid phone number";
    }
    if (!formData.address) {
      newErrors.address = "Address cannot be empty";
    }
    if (!formData.industryCategory) {
      newErrors.industryCategory = "Industry category cannot be empty";
    }
    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = "Please provide a valid website URL";
    }
    if (
      !formData.currency ||
      !["KES", "USD", "EUR", "GBP"].includes(formData.currency)
    ) {
      newErrors.currency = "Please select a valid currency";
    }
    if (!formData.kraPin || !/^[A-Z][0-9]{9}[A-Z]$/.test(formData.kraPin)) {
      newErrors.kraPin =
        "KRA PIN must be 11 characters: first and last uppercase letters, 9 digits in between";
    }
    if (!formData.bankName) {
      newErrors.bankName = "Bank name cannot be empty";
    }
    if (!formData.branchName) {
      newErrors.branchName = "Branch name cannot be empty";
    }
    if (!formData.accountNumber) {
      newErrors.accountNumber = "Account number cannot be empty";
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    try {
      await api.put(`/companies/${effectiveCompanyId}`, formData);
      toast.success("Company details updated successfully");
      setCompany(formData);
      setIsEditing(false);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to update company details"
      );
      if (error.response?.status === 403) {
        toast.error("Access denied");
      }
    }
  };

  const toggleEdit = () => {
    setIsEditing(!isEditing);
    setErrors({});
    if (!isEditing) {
      setFormData(company);
    }
  };

  const renderCompanyLogo = () => {
    if (company.companyLogo) {
      return (
        <div className="h-20 w-20 relative rounded shadow overflow-hidden bg-gray-100">
          <Image
            src={`https://mobilitysolutionske.com/uploads/${company.companyLogo}`}
            alt="Company Logo"
            layout="fill"
            objectFit="contain"
            className="rounded"
          />
        </div>
      );
    } else {
      const initials = company.name
        ?.split(" ")
        .slice(0, 2)
        .map((word) => word[0])
        .join("")
        .toUpperCase();

      return (
        <div className="h-20 w-20 flex items-center justify-center bg-pink-600 text-white font-bold rounded text-xl">
          {initials || "NA"}
        </div>
      );
    }
  };

  if (loading) return <div className="text-center p-4">Loading...</div>;

  if (!company)
    return (
      <div className="text-center p-4 text-red-600">Company not found</div>
    );

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white shadow-md rounded-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          {renderCompanyLogo()}
          <h2 className="text-2xl font-bold text-gray-800">{company.name}</h2>
        </div>
        <button
          onClick={toggleEdit}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          {isEditing ? "Cancel" : "Edit"}
        </button>
      </div>

      {isEditing ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Company Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name || ""}
                onChange={handleInputChange}
                className={`mt-1 block w-full p-2 border rounded-md ${
                  errors.name ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.name && (
                <p className="text-red-500 text-sm">{errors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={formData.email || ""}
                onChange={handleInputChange}
                className={`mt-1 block w-full p-2 border rounded-md ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Registration Number
              </label>
              <input
                type="text"
                name="registrationNo"
                value={formData.registrationNo || ""}
                onChange={handleInputChange}
                className={`mt-1 block w-full p-2 border rounded-md ${
                  errors.registrationNo ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.registrationNo && (
                <p className="text-red-500 text-sm">{errors.registrationNo}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber || ""}
                onChange={handleInputChange}
                className={`mt-1 block w-full p-2 border rounded-md ${
                  errors.phoneNumber ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.phoneNumber && (
                <p className="text-red-500 text-sm">{errors.phoneNumber}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address || ""}
                onChange={handleInputChange}
                className={`mt-1 block w-full p-2 border rounded-md ${
                  errors.address ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.address && (
                <p className="text-red-500 text-sm">{errors.address}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Industry Category
              </label>
              <input
                type="text"
                name="industryCategory"
                value={formData.industryCategory || ""}
                onChange={handleInputChange}
                className={`mt-1 block w-full p-2 border rounded-md ${
                  errors.industryCategory ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.industryCategory && (
                <p className="text-red-500 text-sm">
                  {errors.industryCategory}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Website
              </label>
              <input
                type="url"
                name="website"
                value={formData.website || ""}
                onChange={handleInputChange}
                className={`mt-1 block w-full p-2 border rounded-md ${
                  errors.website ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.website && (
                <p className="text-red-500 text-sm">{errors.website}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                className={`mt-1 block w-full p-2 border rounded-md ${
                  errors.currency ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="KES">KES</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="GBP">GBP</option>
              </select>
              {errors.currency && (
                <p className="text-red-500 text-sm">{errors.currency}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                KRA PIN
              </label>
              <input
                type="text"
                name="kraPin"
                value={formData.kraPin || ""}
                onChange={handleInputChange}
                className={`mt-1 block w-full p-2 border rounded-md ${
                  errors.kraPin ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.kraPin && (
                <p className="text-red-500 text-sm">{errors.kraPin}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Bank Name
              </label>
              <input
                type="text"
                name="bankName"
                value={formData.bankName || ""}
                onChange={handleInputChange}
                className={`mt-1 block w-full p-2 border rounded-md ${
                  errors.bankName ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.bankName && (
                <p className="text-red-500 text-sm">{errors.bankName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Branch Name
              </label>
              <input
                type="text"
                name="branchName"
                value={formData.branchName || ""}
                onChange={handleInputChange}
                className={`mt-1 block w-full p-2 border rounded-md ${
                  errors.branchName ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.branchName && (
                <p className="text-red-500 text-sm">{errors.branchName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Account Number
              </label>
              <input
                type="text"
                name="accountNumber"
                value={formData.accountNumber || ""}
                onChange={handleInputChange}
                className={`mt-1 block w-full p-2 border rounded-md ${
                  errors.accountNumber ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.accountNumber && (
                <p className="text-red-500 text-sm">{errors.accountNumber}</p>
              )}
            </div>
           
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Company Logo
              </label>
              <input
                name="companyLogo"
                type="file"
                accept=".jpg,.jpeg,.png"
                onChange={handleLogoUpload}
                className={`mt-1 block w-full p-2 border  rounded-md ${
                  errors.companyLogo ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.companyLogo && (
                <p className="text-red-500 text-sm">{errors.companyLogo}</p>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-4">
            {/* <button
              type="button"
              onClick={toggleEdit}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
            >
              Cancel
            </button> */}
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition"
            >
              Save
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Email</p>
              <p className="text-gray-900">{company.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                Registration Number
              </p>
              <p className="text-gray-900">{company.registrationNo}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Phone Number</p>
              <p className="text-gray-900">{company.phoneNumber || "N/A"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Address</p>
              <p className="text-gray-900">{company.address}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                Industry Category
              </p>
              <p className="text-gray-900">
                {company.industryCategory || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Website</p>
              <p className="text-gray-900">
                {company.website ? (
                  <a
                    href={company.website}
                    className="text-blue-600 hover:underline"
                  >
                    {company.website}
                  </a>
                ) : (
                  "N/A"
                )}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Currency</p>
              <p className="text-gray-900">{company.currency}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">KRA PIN</p>
              <p className="text-gray-900">{company.kraPin}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Bank Name</p>
              <p className="text-gray-900">{company.bankName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Branch Name</p>
              <p className="text-gray-900">{company.branchName}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">
                Account Number
              </p>
              <p className="text-gray-900">{company.accountNumber}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyDetails;

