"use client";
import React, { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import DatePickerField from "./datePicker";
import { BASE_URL } from "../../../config/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const PersonalDetailsForm = ({ setUploadStatus }) => {
  const {
    register,
    setValue,
    watch,
    trigger,
    formState: { errors },
  } = useFormContext();

  const [photoPreview, setPhotoPreview] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const passportPhotoFile = watch("passportPhotoFile");
  const [nationalIdLength, setNationalIdLength] = useState(0);
  const [passportNoLength, setPassportNoLength] = useState(0);
  const nationalIdValue = watch("nationalId");
  const passportNoValue = watch("passportNo");

  // Update character counters
  useEffect(() => {
    setNationalIdLength(nationalIdValue ? nationalIdValue.length : 0);
    setPassportNoLength(passportNoValue ? passportNoValue.length : 0);
  }, [nationalIdValue, passportNoValue]);

  // Static dropdown options
  const genderOptions = [
    { id: "Male", name: "Male" },
    { id: "Female", name: "Female" },
  ];

  const maritalStatusOptions = [
    { id: "Single", name: "Single" },
    { id: "Married", name: "Married" },
    { id: "Divorced", name: "Divorced" },
    { id: "Widowed", name: "Widowed" },
    { id: "Separated", name: "Separated" },
  ];

  const residentialStatusOptions = [
    { id: "Resident", name: "Resident" },
    { id: "Non-Resident", name: "Non-Resident" },
  ];

  // Handle file upload
  useEffect(() => {
    const handleFileUpload = async (file) => {
      // Validate file
      const validTypes = ["image/jpeg", "image/png", "image/gif"];
      if (!validTypes.includes(file.type)) {
        toast.error("Invalid file type. Please upload JPEG, PNG, or GIF.");
        return false;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size too large. Maximum size is 5MB.");
        return false;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);

      // Upload file
      setIsUploading(true);
      setUploadStatus({ loading: true, error: null });

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch(`${BASE_URL}/upload/passport-photo`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Failed to upload photo");

        const data = await response.json();
        const photoUrl = data.fileUrl || data.url;

        if (photoUrl && !/^https?:\/\/.+/i.test(photoUrl)) {
          throw new Error("Invalid photo URL format");
        }

        setValue("passportPhoto", photoUrl, { shouldValidate: true });
        toast.success("Photo uploaded successfully!");
        return true;
      } catch (err) {
        const errorMsg = err.message || "Failed to upload photo";
        toast.error(errorMsg);
        return false;
      } finally {
        setIsUploading(false);
        setUploadStatus({ loading: false, error: null });
      }
    };

    if (passportPhotoFile?.[0]) {
      handleFileUpload(passportPhotoFile[0]);
    }
  }, [passportPhotoFile, setValue, setUploadStatus]);

  // Common field props
  const textFieldProps = (name, required = true, pattern = null) => ({
    ...register(name, {
      required: required && `${name.split(/(?=[A-Z])/).join(" ")} is required`,
      pattern,
      onBlur: () => trigger(name),
    }),
    className:
      "w-full border p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500",
  });

  const selectFieldProps = (name, required = true) => ({
    ...register(name, {
      required: required && `${name.split(/(?=[A-Z])/).join(" ")} is required`,
      onBlur: () => trigger(name),
    }),
    className:
      "w-full border p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500",
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              First Name*
            </label>
            <input
              {...textFieldProps("firstName")}
              onChange={(e) => {
                const value =
                  e.target.value.charAt(0).toUpperCase() +
                  e.target.value.slice(1).toLowerCase();
                setValue("firstName", value);
              }}
            />
            {errors?.firstName && (
              <p className="text-red-500 text-xs mt-1">
                {errors.firstName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Middle Name
            </label>
            <input {...textFieldProps("middleName", false)} />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Last Name*
            </label>
            <input
              {...textFieldProps("lastName")}
              onChange={(e) => {
                const value =
                  e.target.value.charAt(0).toUpperCase() +
                  e.target.value.slice(1).toLowerCase();
                setValue("lastName", value);
              }}
            />
            {errors?.lastName && (
              <p className="text-red-500 text-xs mt-1">
                {errors.lastName.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Gender*</label>
            <select {...selectFieldProps("gender")}>
              <option value="">Select Gender</option>
              {genderOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            {errors?.gender && (
              <p className="text-red-500 text-xs mt-1">
                {errors.gender.message}
              </p>
            )}
          </div>

          <DatePickerField
            name="dob"
            label="Date of Birth*"
            required={true}
            onBlur={() => trigger("dob")}
          />
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Work Email*
            </label>
            <input
              {...textFieldProps("workEmail", true, {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Invalid email address",
              })}
            />
            {errors?.workEmail && (
              <p className="text-red-500 text-xs mt-1">
                {errors.workEmail.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              National ID
            </label>
            <input
              {...textFieldProps("nationalId", false, {
                value: /^[1-9][0-9]{6,8}$/,
                message: "Must be 7-9 digits and not start with zero",
              })}
              onKeyDown={(e) => {
                // Allow: backspace, delete, tab, escape, enter
                if (
                  [46, 8, 9, 27, 13].includes(e.keyCode) ||
                  (e.keyCode === 65 && e.ctrlKey === true) ||
                  (e.keyCode === 67 && e.ctrlKey === true) ||
                  (e.keyCode === 86 && e.ctrlKey === true) ||
                  (e.keyCode === 88 && e.ctrlKey === true) ||
                  (e.keyCode >= 35 && e.keyCode <= 39)
                ) {
                  return;
                }
                // Prevent if not a number
                if (
                  (e.shiftKey || e.keyCode < 48 || e.keyCode > 57) &&
                  (e.keyCode < 96 || e.keyCode > 105)
                ) {
                  e.preventDefault();
                }
              }}
              type="tel" 
            />
            <p className="text-gray-500 text-xs mt-1">
              {nationalIdLength}/9 characters
            </p>
            {errors?.nationalId && (
              <p className="text-red-500 text-xs mt-1">
                {errors.nationalId.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Passport No
            </label>
            <input
              {...textFieldProps("passportNo", false, {
                value: /^[A-Z0-9]{7,15}$/,
                message: "Must be 7-15 alphanumeric characters",
              })}
              onKeyDown={(e) => {
                // Allow: backspace, delete, tab, escape, enter
                if (
                  [46, 8, 9, 27, 13].includes(e.keyCode) ||
                  (e.keyCode === 65 && e.ctrlKey === true) ||
                  (e.keyCode === 67 && e.ctrlKey === true) ||
                  (e.keyCode === 86 && e.ctrlKey === true) ||
                  (e.keyCode === 88 && e.ctrlKey === true) ||
                  (e.keyCode >= 35 && e.keyCode <= 39)
                ) {
                  return;
                }
                // Prevent if not a number
                if (
                  (e.shiftKey || e.keyCode < 48 || e.keyCode > 57) &&
                  (e.keyCode < 96 || e.keyCode > 105)
                ) {
                  e.preventDefault();
                }
              }}
              type="tel"
            />
            <p className="text-gray-500 text-xs mt-1">
              {passportNoLength}/15 characters
            </p>
            {errors?.passportNo && (
              <p className="text-red-500 text-xs mt-1">
                {errors.passportNo.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Marital Status*
            </label>
            <select {...selectFieldProps("maritalStatus")}>
              <option value="">Select Marital Status</option>
              {maritalStatusOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            {errors?.maritalStatus && (
              <p className="text-red-500 text-xs mt-1">
                {errors.maritalStatus.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Residential Status*
            </label>
            <select {...selectFieldProps("residentialStatus")}>
              <option value="">Select Residential Status</option>
              {residentialStatusOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            {errors?.residentialStatus && (
              <p className="text-red-500 text-xs mt-1">
                {errors.residentialStatus.message}
              </p>
            )}
          </div>
        </div>

        {/* Passport Photo - Full Width */}
        <div className="md:col-span-2">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Passport Photo
            </label>
            <input
              type="file"
              {...register("passportPhotoFile")}
              className="w-full border p-3 rounded-lg shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
              accept="image/*"
              disabled={isUploading}
            />

            {isUploading && (
              <p className="text-blue-500 text-sm mt-2">Uploading...</p>
            )}
            {photoPreview && !isUploading && (
              <div className="mt-4">
                <img
                  src={photoPreview}
                  alt="Passport preview"
                  className="h-32 w-auto object-cover rounded-lg border border-gray-300"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonalDetailsForm;
