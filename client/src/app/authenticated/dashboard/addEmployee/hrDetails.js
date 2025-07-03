import React, { useState, useEffect } from "react";
import { useFormContext } from "react-hook-form";
import DatePickerField from "./datePicker";
import api, { BASE_URL } from "../../../config/api";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const HRDetailsForm = () => {
  const {
    register,
    watch,
    setValue, // <--- CRITICAL: setValue is available
    trigger,
    formState: { errors },
  } = useFormContext();

  const [jobTitleOptions, setJobTitleOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [projectOptions, setProjectOptions] = useState([]);
  const [supervisors, setSupervisors] = useState([]);
  const [loading, setLoading] = useState(true);

  const employmentType = watch("employmentType") || "";
  const isTemporary =
    employmentType === "casual" ||
    employmentType === "contract" ||
    employmentType === "internship";
  const companyId = localStorage.getItem("companyId");

  // Static dropdown options
  const employmentTypeOptions = [
    { id: "full-time", name: "Full-time" },
    { id: "part-time", name: "Part-time" },
    { id: "casual", name: "Casual" },
    { id: "contract", name: "Contract" },
    { id: "internship", name: "Internship" },
  ];

  // Common field props
  const textFieldProps = (name, required = true, pattern = null) => ({
    ...register(name, {
      required: required && `${name.split(/(?=[A-Z])/).join(" ")} is required`,
      pattern,
      // You don't usually need onBlur here if you're using mode: 'onChange' and also
      // manually calling trigger in onChange. RHF handles it.
      // But keeping it for consistency if desired.
      onBlur: () => trigger(name),
    }),
    className:
      "w-full border p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500",
    // --- CRITICAL ADDITION: Manually call setValue on change ---
    onChange: (e) => {
      setValue(name, e.target.value, { shouldValidate: true });
      trigger(name); // Trigger validation after setting value
    },
  });

  const selectFieldProps = (name, required = true) => ({
    ...register(name, {
      required: required && `${name.split(/(?=[A-Z])/).join(" ")} is required`,
      // You don't usually need onBlur here if you're using mode: 'onChange' and also
      // manually calling trigger in onChange. RHF handles it.
      // But keeping it for consistency if desired.
      onBlur: () => trigger(name),
    }),
    className:
      "w-full border p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500",
    // --- CRITICAL ADDITION: Manually call setValue on change ---
    onChange: (e) => {
      setValue(name, e.target.value, { shouldValidate: true });
      trigger(name); // Trigger validation after setting value
    },
  });

  // Fetch dropdown data
  useEffect(() => {
    const fetchDropdownData = async () => {
      setLoading(true);
      try {
        const [
          jobTitleResponse,
          departmentResponse,
          projectResponse,
          supervisorResponse,
        ] = await Promise.all([
          api.get(`${BASE_URL}/job-titles/companies/${companyId}`),
          api.get(`${BASE_URL}/departments/companies/${companyId}`),
          api.get(`${BASE_URL}/projects/companies/${companyId}`),
          api.get(`${BASE_URL}/employees/company/${companyId}`),
        ]);

        setJobTitleOptions(jobTitleResponse.data);
        setDepartmentOptions(departmentResponse.data);
        setProjectOptions(projectResponse.data);
        setSupervisors(supervisorResponse.data);
      } catch (err) {
        toast.error("Failed to load dropdown data");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDropdownData();
  }, [companyId]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Employment Number*
            </label>
            <input
              {...textFieldProps("staffNo", true, {
                value: /^[A-Z0-9]{4,10}$/,
                message: "Must be 4-10 alphanumeric characters",
              })}
              placeholder="Enter employment number"
              onInput={(e) => {
                e.target.value = e.target.value.toUpperCase();
              }}
            />
            {errors?.staffNo && (
              <p className="text-red-500 text-xs mt-1">
                {errors.staffNo.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Job Title*
            </label>
            <select
              {...selectFieldProps("jobTitleId")} // This will now correctly use the onChange from selectFieldProps
              disabled={loading}
            >
              <option value="">Select Job Title</option>
              {jobTitleOptions.map((title) => (
                <option key={title.id} value={title.id}>
                  {title.name}
                </option>
              ))}
            </select>
            {errors?.jobTitleId && (
              <p className="text-red-500 text-xs mt-1">
                {errors.jobTitleId.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Employment Type*
            </label>
            <select {...selectFieldProps("employmentType")}>
              {" "}
              {/* This will now correctly use the onChange */}
              <option value="">Select Employment Type</option>
              {employmentTypeOptions.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
            {errors?.employmentType && (
              <p className="text-red-500 text-xs mt-1">
                {errors.employmentType.message}
              </p>
            )}
          </div>

          <div>
            <DatePickerField
              name="employmentDate"
              label="Employment Date*"
              required={true}
              onBlur={() => trigger("employmentDate")}
            />
            {errors?.employmentDate && (
              <p className="text-red-500 text-xs mt-1">
                {errors.employmentDate.message}
              </p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Department*
            </label>
            <select
              {...selectFieldProps("departmentId")} // This will now correctly use the onChange
              disabled={loading}
            >
              <option value="">Select Department</option>
              {departmentOptions.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.title}
                </option>
              ))}
            </select>
            {errors?.departmentId && (
              <p className="text-red-500 text-xs mt-1">
                {errors.departmentId.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">Project</label>
            <select
              {...register("projectId", {
                onBlur: () => trigger("projectId"),
              })}
              onChange={(e) => {
                setValue("projectId", e.target.value, { shouldValidate: true });
                trigger("projectId");
              }}
              className="w-full border p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={loading}
            >
              <option value="">Select Project</option>
              {projectOptions.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
            {errors?.projectId && (
              <p className="text-red-500 text-xs mt-1">
                {errors.projectId.message}
              </p>
            )}{" "}
            {/* Add error display */}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Supervisor
            </label>
            <select
              {...register("reportingToId", {
                setValueAs: (value) => (value === "null" ? null : value),
                onBlur: () => trigger("reportingToId"),
              })}
              onChange={(e) => {
                const value = e.target.value === "null" ? null : e.target.value;
                setValue("reportingToId", value, { shouldValidate: true });
                trigger("reportingToId");
              }}
              className="w-full border p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              disabled={loading}
              defaultValue="null"
            >
              <option value="null">N/A</option>
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
            {errors?.reportingToId && (
              <p className="text-red-500 text-xs mt-1">
                {errors.reportingToId.message}
              </p>
            )}{" "}
            {/* Add error display */}
          </div>

          <div>
            <DatePickerField
              name="endDate"
              label={`End Date${employmentType === "contract" ? "*" : ""}`}
              required={false}
              disabled={!isTemporary}
              onBlur={() => trigger("endDate")}
            />
            {errors?.endDate && (
              <p className="text-red-500 text-xs mt-1">
                {errors.endDate.message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRDetailsForm;
