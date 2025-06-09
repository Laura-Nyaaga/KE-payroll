'use client';
import React from 'react';
import { useFormContext } from 'react-hook-form';

const ContactDetailsForm = () => {
  // Get methods from FormProvider
  const { register, formState: { errors } } = useFormContext();
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-gray-200 rounded-md p-4 bg-gray-50">
        {/* Work Email */}
        <div className="relative">
          <input
            {...register("workEmail", { 
              required: "Work email is required",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Please enter a valid email address"
              }
            })}
            placeholder="Work Email"
            className="w-full border border-gray-200 p-2 rounded text-black shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {errors?.workEmail && <p className="text-red-500 text-sm mt-1">{errors.workEmail.message}</p>}
        </div>

        {/* Personal Email */}
        <div className="relative">
          <input
            {...register("personalEmail", { 
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Please enter a valid email address"
              }
            })}
            placeholder="Personal Email (Optional)"
            className="w-full border border-gray-200 p-2 rounded text-black shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {errors?.personalEmail && <p className="text-red-500 text-sm mt-1">{errors.personalEmail.message}</p>}
        </div>

        {/* Work Phone Number */}
        <div className="relative">
          <input
            {...register("workPhone", { 
              required: "Work phone number is required",
              pattern: {
                value: /^[0-9+\-\s()]*$/,
                message: "Please enter a valid phone number"
              }
            })}
            placeholder="Work Phone Number"
            className="w-full border border-gray-200 p-2 rounded text-black shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {errors?.workPhone && <p className="text-red-500 text-sm mt-1">{errors.workPhone.message}</p>}
        </div>

        {/* Personal Phone Number */}
        <div className="relative">
          <input
            {...register("personalPhone", { 
              pattern: {
                value: /^[0-9+\-\s()]*$/,
                message: "Please enter a valid phone number"
              }
            })}
            placeholder="Personal Phone Number (Optional)"
            className="w-full border border-gray-200 p-2 rounded text-black shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {errors?.personalPhone && <p className="text-red-500 text-sm mt-1">{errors.personalPhone.message}</p>}
        </div>

        {/* Physical Address */}
        <div className="relative md:col-span-2">
          <textarea
            {...register("physicalAddress", { required: "Physical address is required" })}
            placeholder="Physical Address"
            rows="2"
            className="w-full border border-gray-200 p-2 rounded text-black shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          {errors?.physicalAddress && <p className="text-red-500 text-sm mt-1">{errors.physicalAddress.message}</p>}
        </div>
      </div>
    </div>
  );
};

export default ContactDetailsForm;