import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import DatePickerField from './datePicker';
import api, { BASE_URL } from '../../../config/api';

const HRDetailsForm = () => {
  const { register, watch, formState: { errors } } = useFormContext();

  const [jobTitleOptions, setJobTitleOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [supervisors, setSupervisors] = useState([]);

  const employmentType = watch("employmentType") || "";
  const isTemporary = employmentType === 'casual' || employmentType === 'contract' || employmentType === 'internship';

  const fetchDropdownData = async () => {
    setLoading(true);

    try {
      const jobTitleResponse = await api.get(`${BASE_URL}/job-titles`);
      setJobTitleOptions(jobTitleResponse.data);

      const departmentResponse = await api.get(`${BASE_URL}/departments`);
      setDepartmentOptions(departmentResponse.data);

      const projectResponse = await api.get(`${BASE_URL}/projects`);
      setProjectOptions(projectResponse.data);

      const supervisorResponse = await api.get(`${BASE_URL}/employees`);
      setSupervisors(supervisorResponse.data); 

    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdownData();
  }, []);

  const employmentTypeOptions = [
    { id: 'full-time', name: 'Full-time' },
    { id: 'part-time', name: 'Part-time' },
    { id: 'casual', name: 'Casual' },
    { id: 'contract', name: 'Contract' },
    { id: 'internship', name: 'Internship' },
  ];

  const inputClass = "w-full border p-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-[var(--input-background)] text-[var(--primary-text)] border-[var(--input-border)]";
  const labelClass = "block text-sm font-medium mb-1 text-[var(--secondary-text)]";
  const errorClass = "text-red-500 text-sm mt-1";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-black">
      {/* Staff Number */}
      <div className="relative">
        <label htmlFor="staffNo" className={labelClass}>Staff Number*</label>
        <input
          type="text"
          id="staffNo"
          {...register("staffNo", { 
            required: "Staff number is required" 
          })}
          className={inputClass}
          placeholder="Enter staff number"
        />
        {errors?.staffNo && <p className={errorClass}>{errors.staffNo.message}</p>}
      </div>

      {/* Job Title */}
      <div className="relative">
        <label htmlFor="jobTitleId" className={labelClass}>Job Title*</label>
        <select
          id="jobTitleId"
          {...register("jobTitleId", { required: "Job Title is required" })}
          className={inputClass}
        >
          <option value="" disabled>Select Job Title</option>
          {jobTitleOptions.map((title) => (
            <option key={title.id} value={title.id}>{title.name}</option>
          ))}
        </select>
        {errors?.jobTitleId && <p className={errorClass}>{errors.jobTitleId.message}</p>}
      </div>

      {/* Employee Type */}
      <div className="relative">
        <label htmlFor="employmentType" className={labelClass}>Employment Type*</label>
        <select
          id="employmentType"
          {...register("employmentType", { required: "Employment Type is required" })}
          className={inputClass}
        >
          <option value="" disabled>Select Employment Type</option>
          {employmentTypeOptions.map((type) => (
            <option key={type.id} value={type.id}>{type.name}</option>
          ))}
        </select>
        {errors?.employmentType && <p className={errorClass}>{errors.employmentType.message}</p>}
      </div>

      {/* Supervisor (Reports To) */}
      <div className="relative">
        <label htmlFor="reportingToId" className={labelClass}>Supervisor (Reports To)</label>
        <select
  id="reportingToId"
  {...register("reportingToId")}
  className={inputClass}
>
  <option value={null}>No Supervisor</option> {/* Explicitly set to null */}
  {loading ? (
    <option disabled>Loading supervisors...</option>
  ) : (
    supervisors.map((employee) => (
      <option key={employee.id} value={employee.id}>
        {employee.firstName} {employee.lastName} 
      </option>
    ))
  )}
</select>
        {errors?.reportingToId && <p className={errorClass}>{errors.reportingToId.message}</p>}
      </div>

      {/* Department */}
      <div className="relative">
        <label htmlFor="departmentId" className={labelClass}>Department*</label>
        <select
          id="departmentId"
          {...register("departmentId", { required: "Department is required" })}
          className={inputClass}
        >
          <option value="" disabled>Select Department</option>
          {departmentOptions.map((department) => (
            <option key={department.id} value={department.id}>{department.title}</option>
          ))}
        </select>
        {errors?.departmentId && <p className={errorClass}>{errors.departmentId.message}</p>}
      </div>

      {/* Project */}
      <div className="relative">
        <label htmlFor="projectId" className={labelClass}>Project</label>
        <select
          id="projectId"
          {...register("projectId")}
          className={inputClass}
        >
          <option value="" disabled>Select Project</option>
          {projectOptions.map((project) => (
            <option key={project.id} value={project.id}>{project.name}</option>
          ))}
        </select>
        {errors?.projectId && <p className={errorClass}>{errors.projectId.message}</p>}
      </div>

      {/* Employment Date */}
      <div className="relative">
        <DatePickerField 
          name="employmentDate" 
          label="Employment Date*" 
          required={true}
        />
        {errors?.employmentDate && <p className={errorClass}>{errors.employmentDate.message}</p>}
      </div>

      {/* End Date */}
      <div className="relative">
        <DatePickerField 
          name="endDate" 
          label="End Date (if applicable)" 
          required={isTemporary}
        />
        {isTemporary && errors?.endDate && <p className={errorClass}>{errors.endDate.message}</p>}
      </div>

      {/* Loading State */}
      {loading && <div className="col-span-2 text-center text-blue-500">Loading data...</div>}
    </div>
  );
};

export default HRDetailsForm;