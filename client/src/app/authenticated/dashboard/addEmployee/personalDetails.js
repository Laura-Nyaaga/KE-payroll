// import React, { useState, useEffect } from 'react';

// import { useFormContext } from 'react-hook-form';
// import DatePickerField from './datePicker';
// import axios from 'axios';


// const PersonalDetailsForm = ({ onSubmit, handleNext }) => {
//   // Get all form methods from context
//   // const { 
//   //   register, 
//   //   handleSubmit,
//   //   formState: { errors }
//   // } = useFormContext();

//   const {
//     register,
//     handleSubmit,
//     setValue,
//     watch,
//     formState: { errors }
//   } = useFormContext();

  
//   // State for dropdown options
//   const [genderOptions, setGenderOptions] = useState([]);
//   const [maritalStatusOptions, setMaritalStatusOptions] = useState([]);
//   const [residentialStatusOptions, setResidentialStatusOptions] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [uploading, setUploading] = useState(false);
//   const passportPhotoFile = watch("passportPhoto");


//   // Set hardcoded dropdown options
//   useEffect(() => {
//     setGenderOptions([
//       { id: 'Male', name: 'Male' },
//       { id: 'Female', name: 'Female' },
//       { id: 'Other', name: 'Other' },
//       { id: 'Prefer not to say', name: 'Prefer not to say' }
//     ]);

//     setMaritalStatusOptions([
//       { id: 'Single', name: 'Single' },
//       { id: 'Married', name: 'Married' },
//       { id: 'Divorced', name: 'Divorced' },
//       { id: 'Widowed', name: 'Widowed' },
//       { id: 'Separated', name: 'Separated' }
//     ]);

//     setResidentialStatusOptions([
//       { id: 'Resident', name: 'Resident' },
//       { id: 'Non-Resident', name: 'Non-Resident' }
//     ]);

//     setLoading(false);
//   }, []);



    
//   // Upload file when selected
//   useEffect(() => {
//     const uploadFile = async () => {
//       const file = passportPhotoFile?.[0];
//       if (!file) return;

//       const formData = new FormData();
//       formData.append('file', file);

//       try {
//         setUploading(true);
//         const res = await axios.post('/api/upload/passport-photo', formData);
//         const photoUrl = res.data.url;

//         // Set the URL in place of the File object
//         setValue('passportPhoto', photoUrl, { shouldValidate: true });
//       } catch (error) {
//         console.error("Upload failed:", error);
//       } finally {
//         setUploading(false);
//       }
//     };

//     uploadFile();
//   }, [passportPhotoFile, setValue]);



//   // Handle form submission
//   const onFormSubmit = (data) => {

//     if (typeof data.passportPhoto !== 'string') {
//       alert("Passport photo not uploaded yet.");
//       return;
//     }

//     if (onSubmit) {
//       onSubmit(data);
//     }
    
//     // Navigate to next tab
//     if (handleNext) {
//       handleNext();
//     }
//   };

//   // Common input styles
//   const inputClass = "w-full border p-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500" + 
//     " bg-[var(--input-background)] text-[var(--primary-text)] border-[var(--input-border)]";
  
//   const selectClass = "w-full border p-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none" +
//     " bg-[var(--input-background)] text-[var(--primary-text)] border-[var(--input-border)]";
  
//   const fileInputClass = "w-full border p-2 rounded shadow-sm file:mr-4 file:py-2 file:px-4 " +
//     "file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" +
//     " bg-[var(--input-background)] text-[var(--primary-text)] border-[var(--input-border)]";

//   const buttonClass = "md:col-span-2 bg-blue-500 hover:bg-green-600 text-white py-3 rounded font-medium transition duration-200 mt-4 cursor-pointer";
  
//   const labelClass = "block text-sm font-medium mb-1 text-[var(--secondary-text)]";
  
//   const errorClass = "text-red-500 text-sm mt-1";

//   return (
//     // use a div instead since the parent already has a form
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
//       {/* First Name */}
//       <div className="relative">
//         <label className={labelClass}>First Name*</label>
//         <input 
//           {...register("firstName", { required: "First name is required" })} 
//           className={inputClass}
//         />
//         {errors?.firstName && <p className={errorClass}>{errors.firstName.message}</p>}
//       </div>
      
//       {/* Work Email */}
//       <div className="relative">
//         <label className={labelClass}>Work Email*</label>
//         <input 
//           {...register("workEmail", { 
//             required: "Work email is required",
//             pattern: {
//               value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
//               message: "Invalid email address"
//             }
//           })} 
//           className={inputClass}
//         />
//         {errors?.workEmail && <p className={errorClass}>{errors.workEmail.message}</p>}
//       </div>
      
//       {/* Middle Name */}
//       <div className="relative">
//         <label className={labelClass}>Middle Name</label>
//         <input 
//           {...register("middleName")} 
//           className={inputClass}
//         />
//       </div>
      
//       {/* National ID */}
// <div className="relative">
//   <label className={labelClass}>National ID*</label>
//   <input
//     {...register("nationalId", {
//       required: "National ID is required",
//       pattern: {
//         value: /^[0-9]{7,9}$/,  // Ensures it's 7-9 digits long and only numeric
//         message: "National ID must be 7-9 digits long and contain only numbers",
//       }
//     })}
//     className={inputClass}
//   />
//   {errors?.nationalId && <p className={errorClass}>{errors.nationalId.message}</p>}
// </div>

      
//       {/* Last Name */}
//       <div className="relative">
//         <label className={labelClass}>Last Name*</label>
//         <input 
//           {...register("lastName", { required: "Last name is required" })} 
//           className={inputClass}
//         />
//         {errors?.lastName && <p className={errorClass}>{errors.lastName.message}</p>}
//       </div>
      
//       {/* Passport No */}
// <div className="relative">
//   <label className={labelClass}>Passport No*</label>
//   <input 
//     {...register("passportNo", {
//       required: "Passport No is required",  // Makes the field required
//       minLength: {
//         value: 7,
//         message: "Passport number must be at least 7 characters"
//       },
//       maxLength: {
//         value: 15,
//         message: "Passport number must not exceed 15 characters"
//       }
//     })}
//     className={inputClass}
//   />
//   {errors?.passportNo && <p className={errorClass}>{errors.passportNo.message}</p>}
// </div>

      
//       {/* Gender */}
//       <div className="relative">
//         <label className={labelClass}>Gender*</label>
//         <select 
//           {...register("gender", { required: "Gender is required" })} 
//           className={selectClass}
//           disabled={loading}
//         >
//           <option value="" disabled>Select Gender</option>
//           {genderOptions.map(option => (
//             <option key={option.id} value={option.id}>
//               {option.name}
//             </option>
//           ))}
//         </select>
//         {errors?.gender && <p className={errorClass}>{errors.gender.message}</p>}
//       </div>
      
//       {/* Marital Status */}
//       <div className="relative">
//         <label className={labelClass}>Marital Status*</label>
//         <select 
//           {...register("maritalStatus", { required: "Marital status is required" })} 
//           className={selectClass}
//           disabled={loading}
//         >
//           <option value="" disabled>Select Marital Status</option>
//           {maritalStatusOptions.map(option => (
//             <option key={option.id} value={option.id}>
//               {option.name}
//             </option>
//           ))}
//         </select>
//         {errors?.maritalStatus && <p className={errorClass}>{errors.maritalStatus.message}</p>}
//       </div>
      
//       {/* Date of Birth */}
//       <DatePickerField
//         name="dob"
//         label="Date of Birth*"
//         required={true}
//       />
      
//       {/* Residential Status */}
//       <div className="relative">
//         <label className={labelClass}>Residential Status*</label>
//         <select 
//           {...register("residentialStatus", { required: "Residential status is required" })} 
//           className={selectClass}
//           disabled={loading}
//         >
//           <option value="" disabled>Select Residential Status</option>
//           {residentialStatusOptions.map(option => (
//             <option key={option.id} value={option.id}>
//               {option.name}
//             </option>
//           ))}
//         </select>
//         {errors?.residentialStatus && <p className={errorClass}>{errors.residentialStatus.message}</p>}
//       </div>
      
//       {/* Passport Photo */}
//       <div className="relative md:col-span-2">
//         <label className={labelClass}>Passport Photo*</label>
//         <input 
//           type="file" 
//           {...register("passportPhoto", { 
//             required: "Passport photo is required" 
//           })} 
//           className={fileInputClass}
//           accept="image/*,.pdf"
//         />
//         {errors?.passportPhoto && <p className={errorClass}>{errors.passportPhoto.message}</p>}
//       </div>
      
      
//     </div>
//   );
// };

// export default PersonalDetailsForm;











































// import React, { useState, useEffect } from 'react';
// import { useFormContext } from 'react-hook-form';
// import DatePickerField from './datePicker';

// const PersonalDetailsForm = () => {
//   // Get all form methods from context
//   const { 
//     register, 
//     formState: { errors }
//   } = useFormContext();
  
//   // State for dropdown options
//   const [genderOptions, setGenderOptions] = useState([]);
//   const [maritalStatusOptions, setMaritalStatusOptions] = useState([]);
//   const [residentialStatusOptions, setResidentialStatusOptions] = useState([]);
//   const [loading, setLoading] = useState(true);

//   // Set hardcoded dropdown options
//   useEffect(() => {
//     setGenderOptions([
//       { id: 'Male', name: 'Male' },
//       { id: 'Female', name: 'Female' },
//       { id: 'Other', name: 'Other' },
//       { id: 'Prefer not to say', name: 'Prefer not to say' }
//     ]);

//     setMaritalStatusOptions([
//       { id: 'Single', name: 'Single' },
//       { id: 'Married', name: 'Married' },
//       { id: 'Divorced', name: 'Divorced' },
//       { id: 'Widowed', name: 'Widowed' },
//       { id: 'Separated', name: 'Separated' }
//     ]);

//     setResidentialStatusOptions([
//       { id: 'Resident', name: 'Resident' },
//       { id: 'Non-Resident', name: 'Non-Resident' }
//     ]);

//     setLoading(false);
//   }, []);

//   // Common input styles
//   const inputClass = "w-full border p-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500" + 
//     " bg-[var(--input-background)] text-[var(--primary-text)] border-[var(--input-border)]";
  
//   const selectClass = "w-full border p-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none" +
//     " bg-[var(--input-background)] text-[var(--primary-text)] border-[var(--input-border)]";
  
//   const fileInputClass = "w-full border p-2 rounded shadow-sm file:mr-4 file:py-2 file:px-4 " +
//     "file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" +
//     " bg-[var(--input-background)] text-[var(--primary-text)] border-[var(--input-border)]";
  
//   const labelClass = "block text-sm font-medium mb-1 text-[var(--secondary-text)]";
  
//   const errorClass = "text-red-500 text-sm mt-1";

//   return (
//     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
//       {/* First Name */}
//       <div className="relative">
//         <label className={labelClass}>First Name*</label>
//         <input 
//           {...register("firstName", { required: "First name is required" })} 
//           className={inputClass}
//         />
//         {errors?.firstName && <p className={errorClass}>{errors.firstName.message}</p>}
//       </div>
      
//       {/* Middle Name */}
//       <div className="relative">
//         <label className={labelClass}>Middle Name</label>
//         <input 
//           {...register("middleName")} 
//           className={inputClass}
//         />
//       </div>
      
//       {/* Last Name */}
//       <div className="relative">
//         <label className={labelClass}>Last Name*</label>
//         <input 
//           {...register("lastName", { required: "Last name is required" })} 
//           className={inputClass}
//         />
//         {errors?.lastName && <p className={errorClass}>{errors.lastName.message}</p>}
//       </div>
      
//       {/* Work Email */}
//       <div className="relative">
//         <label className={labelClass}>Work Email*</label>
//         <input 
//           {...register("workEmail", { 
//             required: "Work email is required",
//             pattern: {
//               value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
//               message: "Invalid email address"
//             }
//           })} 
//           className={inputClass}
//         />
//         {errors?.workEmail && <p className={errorClass}>{errors.workEmail.message}</p>}
//       </div>
      
//       {/* National ID */}
//       <div className="relative">
//         <label className={labelClass}>National ID*</label>
//         <input
//           {...register("nationalId", {
//             required: "National ID is required",
//             pattern: {
//               value: /^[0-9]{7,9}$/,
//               message: "National ID must be 7-9 digits long and contain only numbers",
//             }
//           })}
//           className={inputClass}
//         />
//         {errors?.nationalId && <p className={errorClass}>{errors.nationalId.message}</p>}
//       </div>
      
//       {/* Passport No */}
//       <div className="relative">
//         <label className={labelClass}>Passport No</label>
//         <input 
//           {...register("passportNo", {
//             minLength: {
//               value: 7,
//               message: "Passport number must be at least 7 characters"
//             },
//             maxLength: {
//               value: 15,
//               message: "Passport number must not exceed 15 characters"
//             }
//           })}
//           className={inputClass}
//         />
//         {errors?.passportNo && <p className={errorClass}>{errors.passportNo.message}</p>}
//       </div>
      
//       {/* Gender */}
//       <div className="relative">
//         <label className={labelClass}>Gender*</label>
//         <select 
//           {...register("gender", { required: "Gender is required" })} 
//           className={selectClass}
//           disabled={loading}
//         >
//           <option value="" disabled>Select Gender</option>
//           {genderOptions.map(option => (
//             <option key={option.id} value={option.id}>
//               {option.name}
//             </option>
//           ))}
//         </select>
//         {errors?.gender && <p className={errorClass}>{errors.gender.message}</p>}
//       </div>
      
//       {/* Marital Status */}
//       <div className="relative">
//         <label className={labelClass}>Marital Status*</label>
//         <select 
//           {...register("maritalStatus", { required: "Marital status is required" })} 
//           className={selectClass}
//           disabled={loading}
//         >
//           <option value="" disabled>Select Marital Status</option>
//           {maritalStatusOptions.map(option => (
//             <option key={option.id} value={option.id}>
//               {option.name}
//             </option>
//           ))}
//         </select>
//         {errors?.maritalStatus && <p className={errorClass}>{errors.maritalStatus.message}</p>}
//       </div>
      
//       {/* Date of Birth */}
//       <DatePickerField
//         name="dob"
//         label="Date of Birth*"
//         required={true}
//       />
      
//       {/* Residential Status */}
//       <div className="relative">
//         <label className={labelClass}>Residential Status*</label>
//         <select 
//           {...register("residentialStatus", { required: "Residential status is required" })} 
//           className={selectClass}
//           disabled={loading}
//         >
//           <option value="" disabled>Select Residential Status</option>
//           {residentialStatusOptions.map(option => (
//             <option key={option.id} value={option.id}>
//               {option.name}
//             </option>
//           ))}
//         </select>
//         {errors?.residentialStatus && <p className={errorClass}>{errors.residentialStatus.message}</p>}
//       </div>
      
//       {/* Passport Photo */}
//       <div className="relative md:col-span-2">
//         <label className={labelClass}>Passport Photo*</label>
//         <input 
//           type="file" 
//           {...register("passportPhoto", { 
//             required: "Passport photo is required" 
//           })} 
//           className={fileInputClass}
//           accept="image/*,.pdf"
//         />
//         {errors?.passportPhoto && <p className={errorClass}>{errors.passportPhoto.message}</p>}
//       </div>
//     </div>
//   );
// };

// export default PersonalDetailsForm;


import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import DatePickerField from './datePicker';
import { BASE_URL } from '../../../config/api';


const PersonalDetailsForm = ({ onSubmit, handleNext}) => {
  // Get all form methods from context
  const { 
    register, 
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useFormContext();
  
  // State for dropdown options and UI state
  const [genderOptions, setGenderOptions] = useState([]);
  const [maritalStatusOptions, setMaritalStatusOptions] = useState([]);
  const [residentialStatusOptions, setResidentialStatusOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [photoPreview, setPhotoPreview] = useState('');
  const [uploadStatus, setUploadStatus] = useState({ loading: false, error: null });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [passportPhotoUrl, setPassportPhotoUrl] = useState('');

  
  // Watch the file input to update preview
  const passportPhotoFile = watch('passportPhotoFile');

  // Set hardcoded dropdown options
  useEffect(() => {
    setGenderOptions([
      { id: 'Male', name: 'Male' },
      { id: 'Female', name: 'Female' },
      { id: 'Other', name: 'Other' },
      { id: 'Prefer not to say', name: 'Prefer not to say' }
    ]);

    setMaritalStatusOptions([
      { id: 'Single', name: 'Single' },
      { id: 'Married', name: 'Married' },
      { id: 'Divorced', name: 'Divorced' },
      { id: 'Widowed', name: 'Widowed' },
      { id: 'Separated', name: 'Separated' }
    ]);

    setResidentialStatusOptions([
      { id: 'Resident', name: 'Resident' },
      { id: 'Non-Resident', name: 'Non-Resident' }
    ]);

    setLoading(false);
  }, []);




  useEffect(() => {
    if (passportPhotoFile && passportPhotoFile[0]) {
      const file = passportPhotoFile[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
      
      const uploadFile = async () => {
        setIsUploading(true);
        setUploadError(null);
        if (setUploadStatus) {
          // setUploadStatus({ loading: true, error: null });
          setUploadStatus({ loading: false, error: null, success: true });


        }
        
        try {
          const formData = new FormData();
          formData.append('file', file);
          
          const response = await fetch(`${BASE_URL}/upload/passport-photo`, {
            method: 'POST',
            body: formData,
          });
          
          if (!response.ok) {
            throw new Error('Upload failed');
          }
          
          const data = await response.json();
          console.log("Upload response:", data); // Log the complete response

          console.log("Setting passport photo URL:", data.fileUrl);
          setValue('passportPhoto', data.fileUrl, { shouldValidate: true });

          const photoUrl = data.url;
          console.log("Photo URL from response:", photoUrl);
          
          if (!photoUrl) {
            throw new Error('No URL in response');
          }
          
          // Set the value in the form
          setValue('passportPhoto', photoUrl, { shouldValidate: true });
          
          if (setUploadStatus) {
            setUploadStatus({ loading: false, error: null, success: true });
          }

          console.log("Form value after setting:", watch('passportPhoto'));



          if (setUploadStatus) {
            setUploadStatus({ loading: false, error: null, success: true });
          }
        } catch (err) {
          console.error('Upload error:', err);
          setUploadError(err.message);
          setValue('passportPhotoFile', null, { shouldValidate: true });
          
          if (setUploadStatus) {
            setUploadStatus({ loading: false, error: err.message, success: false });
          }
        } finally {
          setIsUploading(false);
        }
      };
      
      uploadFile();
    }
  }, [passportPhotoFile, setValue, setUploadStatus]);


  // Handle form submission
  const onFormSubmit = (data) => {
    // Remove the file object before submission as we've already processed it
    const submissionData = { ...data };
    delete submissionData.passportPhotoFile;
    
    if (onSubmit) {
      onSubmit(submissionData);
    }
    
    // Navigate to next tab
    if (handleNext) {
      handleNext();
    }
  };

  // Common input styles
  const inputClass = "w-full border p-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500" + 
    " bg-[var(--input-background)] text-[var(--primary-text)] border-[var(--input-border)]";
  
  const selectClass = "w-full border p-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none" +
    " bg-[var(--input-background)] text-[var(--primary-text)] border-[var(--input-border)]";
  
  const fileInputClass = "w-full border p-2 rounded shadow-sm file:mr-4 file:py-2 file:px-4 " +
    "file:rounded file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100" +
    " bg-[var(--input-background)] text-[var(--primary-text)] border-[var(--input-border)]";
  
  const labelClass = "block text-sm font-medium mb-1 text-[var(--secondary-text)]";
  
  const errorClass = "text-red-500 text-sm mt-1";

    console.log("Upload status:", uploadStatus);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      {/* First Name */}
      <div className="relative">
        <label className={labelClass}>First Name*</label>
        <input 
          {...register("firstName", { required: "First name is required" })} 
          className={inputClass}
        />
        {errors?.firstName && <p className={errorClass}>{errors.firstName.message}</p>}
      </div>
      
      {/* Work Email */}
      <div className="relative">
        <label className={labelClass}>Work Email*</label>
        <input 
          {...register("workEmail", { 
            required: "Work email is required",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Invalid email address"
            }
          })} 
          className={inputClass}
        />
        {errors?.workEmail && <p className={errorClass}>{errors.workEmail.message}</p>}
      </div>
      
      {/* Middle Name */}
      <div className="relative">
        <label className={labelClass}>Middle Name</label>
        <input 
          {...register("middleName")} 
          className={inputClass}
        />
      </div>
      
      {/* National ID */}
      <div className="relative">
        <label className={labelClass}>National ID*</label>
        <input
          {...register("nationalId", {
            required: "National ID is required",
            pattern: {
              value: /^[0-9]{7,9}$/,
              message: "National ID must be 7-9 digits long and contain only numbers",
            }
          })}
          className={inputClass}
        />
        {errors?.nationalId && <p className={errorClass}>{errors.nationalId.message}</p>}
      </div>
      
      {/* Last Name */}
      <div className="relative">
        <label className={labelClass}>Last Name*</label>
        <input 
          {...register("lastName", { required: "Last name is required" })} 
          className={inputClass}
        />
        {errors?.lastName && <p className={errorClass}>{errors.lastName.message}</p>}
      </div>
      
      {/* Passport No */}
      <div className="relative">
        <label className={labelClass}>Passport No*</label>
        <input 
          {...register("passportNo", {
            required: "Passport No is required",
            minLength: {
              value: 7,
              message: "Passport number must be at least 7 characters"
            },
            maxLength: {
              value: 15,
              message: "Passport number must not exceed 15 characters"
            }
          })}
          className={inputClass}
        />
        {errors?.passportNo && <p className={errorClass}>{errors.passportNo.message}</p>}
      </div>
      
      {/* Gender */}
      <div className="relative">
        <label className={labelClass}>Gender*</label>
        <select 
          {...register("gender", { required: "Gender is required" })} 
          className={selectClass}
          disabled={loading}
        >
          <option value="" disabled>Select Gender</option>
          {genderOptions.map(option => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        {errors?.gender && <p className={errorClass}>{errors.gender.message}</p>}
      </div>
      
      {/* Marital Status */}
      <div className="relative">
        <label className={labelClass}>Marital Status*</label>
        <select 
          {...register("maritalStatus", { required: "Marital status is required" })} 
          className={selectClass}
          disabled={loading}
        >
          <option value="" disabled>Select Marital Status</option>
          {maritalStatusOptions.map(option => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        {errors?.maritalStatus && <p className={errorClass}>{errors.maritalStatus.message}</p>}
      </div>
      
      {/* Date of Birth */}
      <DatePickerField
        name="dob"
        label="Date of Birth*"
        required={true}
      />
      
      {/* Residential Status */}
      <div className="relative">
        <label className={labelClass}>Residential Status*</label>
        <select 
          {...register("residentialStatus", { required: "Residential status is required" })} 
          className={selectClass}
          disabled={loading}
        >
          <option value="" disabled>Select Residential Status</option>
          {residentialStatusOptions.map(option => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
        {errors?.residentialStatus && <p className={errorClass}>{errors.residentialStatus.message}</p>}
      </div>
      
      {/* Hidden field for the passport photo URL */}
      <input 
        type="hidden" 
        {...register("passportPhoto")} 
      />


      <div className="relative md:col-span-2">
        <label className={labelClass}>Passport Photo*</label>
        <input
          type="file"
          {...register("passportPhotoFile", {
            required: "Passport photo is required",
          })}
          className={fileInputClass}
          accept="image/*"
          disabled={isUploading}
        />
        
        {isUploading && <p className="text-blue-500 text-sm mt-1">Uploading...</p>}
        {uploadError && <p className="text-red-500 text-sm mt-1">{uploadError}</p>}
        {photoPreview && !isUploading && !uploadError && (
          <div className="mt-2">
            <p className="text-sm text-green-600 mb-1">Upload successful!</p>
            <img 
              src={photoPreview} 
              alt="Passport preview" 
              className="h-24 w-auto object-cover rounded border border-gray-300" 
            />
          </div>
        )}
      </div>

    </div>
  );
};

export default PersonalDetailsForm;