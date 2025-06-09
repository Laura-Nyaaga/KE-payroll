"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

export default function EditEarningModal({ earning, onClose, onSave }) {
  const [formData, setFormData] = useState({
    customMonthlyAmount: "",
    customPercentage: "",
    customNumberOfHours: "",
    customHourlyRate: "",
    customNumberOfDays: "",
    customDailyRate: "",
    customNumberOfWeeks: "",
    customWeeklyRate: "",
    status: "active",
    effectiveDate: "",
    endDate: "",
  });

  useEffect(() => {
    if (earning) {
      setFormData({
        customMonthlyAmount: earning.customMonthlyAmount || "",
        customPercentage: earning.customPercentage || "",
        customNumberOfHours: earning.customNumberOfHours || "",
        customHourlyRate: earning.customHourlyRate || "",
        customNumberOfDays: earning.customNumberOfDays || "",
        customDailyRate: earning.customDailyRate || "",
        customNumberOfWeeks: earning.customNumberOfWeeks || "",
        customWeeklyRate: earning.customWeeklyRate || "",
        status: earning.status || "active",
        effectiveDate: earning.effectiveDate || "",
        endDate: earning.endDate || "",
      });
    }
  }, [earning]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!earning) return;

    const updateData = {};

    if (earning.earnings?.calculationMethod === "percentage") {
      if (formData.customPercentage !== "") {
        updateData.customPercentage = parseFloat(formData.customPercentage);
      }
    } else {
      // fixed_amount
      switch (earning.earnings?.mode) {
        case "monthly":
          if (formData.customMonthlyAmount !== "") {
            updateData.customMonthlyAmount = parseFloat(
              formData.customMonthlyAmount
            );
          }
          break;
        case "hourly":
          if (formData.customNumberOfHours !== "") {
            updateData.customNumberOfHours = parseFloat(
              formData.customNumberOfHours
            );
          }
          if (formData.customHourlyRate !== "") {
            updateData.customHourlyRate = parseFloat(formData.customHourlyRate);
          }
          break;
        case "daily":
          if (formData.customNumberOfDays !== "") {
            updateData.customNumberOfDays = parseFloat(
              formData.customNumberOfDays
            );
          }
          if (formData.customDailyRate !== "") {
            updateData.customDailyRate = parseFloat(formData.customDailyRate);
          }
          break;
        case "weekly":
          if (formData.customNumberOfWeeks !== "") {
            updateData.customNumberOfWeeks = parseFloat(
              formData.customNumberOfWeeks
            );
          }
          if (formData.customWeeklyRate !== "") {
            updateData.customWeeklyRate = parseFloat(formData.customWeeklyRate);
          }
          break;
      }
    }

    if (formData.status !== earning.status) updateData.status = formData.status;
    if (formData.effectiveDate !== earning.effectiveDate)
      updateData.effectiveDate = formData.effectiveDate;
    if (formData.endDate !== earning.endDate)
      updateData.endDate = formData.endDate || null;

    onSave(earning.id, updateData);
  };

  const renderCalculationFields = () => {
    if (!earning?.earnings) return null;

    if (earning.earnings.calculationMethod === "percentage") {
      return (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Percentage (%)
          </label>
          <input
            type="number"
            name="customPercentage"
            className="w-full px-3 py-2 border rounded-md"
            value={formData.customPercentage}
            onChange={handleChange}
            step="0.01"
            min="0"
            max="100"
          />
        </div>
      );
    } else {
      // fixed_amount
      switch (earning.earnings.mode) {
        case "monthly":
          return (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Monthly Amount
              </label>
              <input
                type="number"
                name="customMonthlyAmount"
                className="w-full px-3 py-2 border rounded-md"
                value={formData.customMonthlyAmount}
                onChange={handleChange}
                step="0.01"
                min="0"
              />
            </div>
          );
        case "hourly":
          return (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Hours
                </label>
                <input
                  type="number"
                  name="customNumberOfHours"
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.customNumberOfHours}
                  onChange={handleChange}
                  step="0.1"
                  min="0"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hourly Rate
                </label>
                <input
                  type="number"
                  name="customHourlyRate"
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.customHourlyRate}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                />
              </div>
            </>
          );
        case "daily":
          return (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Days
                </label>
                <input
                  type="number"
                  name="customNumberOfDays"
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.customNumberOfDays}
                  onChange={handleChange}
                  step="0.1"
                  min="0"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Daily Rate
                </label>
                <input
                  type="number"
                  name="customDailyRate"
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.customDailyRate}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                />
              </div>
            </>
          );
        case "weekly":
          return (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Weeks
                </label>
                <input
                  type="number"
                  name="customNumberOfWeeks"
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.customNumberOfWeeks}
                  onChange={handleChange}
                  step="0.1"
                  min="0"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Weekly Rate
                </label>
                <input
                  type="number"
                  name="customWeeklyRate"
                  className="w-full px-3 py-2 border rounded-md"
                  value={formData.customWeeklyRate}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                />
              </div>
            </>
          );
        default:
          return null;
      }
    }
  };

  if (!earning) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-medium mb-4">Edit Earnings</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Earning Type
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md"
              value={earning.earnings.earningsType}
              readOnly
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Calculation Method
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md"
              value={
                earning.earnings
                  ? `${earning.earnings.calculationMethod || ""} (${
                      earning.earnings.mode || ""
                    })`
                  : ""
              }
              readOnly
            />
          </div>

          {renderCalculationFields()}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Amount
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-md bg-gray-100"
              value={
                earning.calculatedAmount?.toLocaleString("en-US", {
                  style: "decimal",
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }) || "0.00"
              }
              readOnly
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              className="w-full px-3 py-2 border rounded-md"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Effective Date
            </label>
            <input
              type="date"
              name="effectiveDate"
              className="w-full px-3 py-2 border rounded-md"
              value={formData.effectiveDate}
              onChange={handleChange}
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date (optional)
            </label>
            <input
              type="date"
              name="endDate"
              className="w-full px-3 py-2 border rounded-md"
              value={formData.endDate || ""}
              onChange={handleChange}
            />
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
