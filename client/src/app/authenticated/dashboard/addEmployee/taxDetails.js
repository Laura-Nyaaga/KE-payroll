'use client';
import React from 'react';
import { useFormContext } from 'react-hook-form';

const TaxDetailsForm = () => {
  // Get form methods from FormProvider context
  const { register, formState: { errors } } = useFormContext();

  const inputClass = "w-full border p-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-white text-black border-gray-200";

  const selectClass = "w-full border p-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 appearance-none bg-white text-black border-gray-200";

  const errorClass = "text-red-500 text-sm mt-1";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      {/* KRA PIN */}
      <div className="relative">
        <input
          {...register("kraPin", {
            required: "KRA PIN is required",
            pattern: {
              value: /^[A-Z0-9]{11}$/,
              message: "Please enter a valid KRA PIN (11 characters)"
            }
          })}
          placeholder="KRA PIN"
          className={inputClass}
        />
        {errors?.kraPin && <p className={errorClass}>{errors.kraPin.message}</p>}
      </div>

      {/* NSSF No */}
      <div className="relative">
        <input
          {...register("nssfNo", {
            required: "NSSF No is required"
          })}
          placeholder="NSSF No"
          className={inputClass}
        />
        {errors?.nssfNo && <p className={errorClass}>{errors.nssfNo.message}</p>}
      </div>

      {/* NHIF No */}
      <div className="relative">
        <input
          {...register("nhifNo", {
            required: "NHIF No is required"
          })}
          placeholder="NHIF No"
          className={inputClass}
        />
        {errors?.nhifNo && <p className={errorClass}>{errors.nhifNo.message}</p>}
      </div>

      {/* SHA No */}
      <div className="relative">
        <input
          {...register("shaNo", {
            required: "SHA No is required"
          })}
          placeholder="SHA No"
          className={inputClass}
        />
        {errors?.shaNo && <p className={errorClass}>{errors.shaNo.message}</p>}
      </div>

      {/* Tax Exemption Boolean Select with Label */}
      <div className="relative md:col-span-2">
        <label className="block mb-1 text-gray-500 font-medium">
          Do you have a tax exemption?
        </label>
        <select
          {...register("taxExemption", { required: "Please select an option" })}
          className={selectClass}
          defaultValue=""
        >
          <option value="" disabled className="text-gray-400">Select one</option>
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
        {errors?.taxExemption && <p className={errorClass}>{errors.taxExemption.message}</p>}
      </div>
    </div>
  );
};

export default TaxDetailsForm;