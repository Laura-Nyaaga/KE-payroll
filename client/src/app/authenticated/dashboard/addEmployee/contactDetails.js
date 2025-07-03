"use client";
import React from "react";
import { useFormContext } from "react-hook-form";

const ContactDetailsForm = () => {
  const {
    register,
    formState: { errors },
    trigger,
  } = useFormContext();

  // Common field props
  const textFieldProps = (name, required = false, pattern = null) => ({
    ...register(name, {
      required: required && `${name.split(/(?=[A-Z])/).join(" ")} is required`,
      pattern,
      onBlur: () => trigger(name),
    }),
    className:
      "w-full border p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500",
  });

  const textareaProps = (name, required = false) => ({
    ...register(name, {
      required: required && `${name.split(/(?=[A-Z])/).join(" ")} is required`,
      onBlur: () => trigger(name),
    }),
    className:
      "w-full border p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500",
    rows: 2,
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Personal Email
            </label>
            <input
              {...textFieldProps("personalEmail", false, {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Please enter a valid email address",
              })}
              placeholder="Enter personal email (optional)"
            />
            {errors?.personalEmail && (
              <p className="text-red-500 text-xs mt-1">
                {errors.personalEmail.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">
              Work Phone Number
            </label>
            <input
              {...textFieldProps("workPhone", false, {
                value: /^\+?[1-9]\d{8,14}$/,
                message:
                  "Enter a valid phone number (9-15 digits, no leading zero)",
              })}
              placeholder="Enter work phone (optional)"
              type="tel"
              onKeyDown={(e) => {
                const allowedKeys = [
                  "Backspace",
                  "Delete",
                  "Tab",
                  "ArrowLeft",
                  "ArrowRight",
                  "Home",
                  "End",
                  "+",
                ];
                const isNumber =
                  (e.key >= "0" && e.key <= "9") ||
                  (e.key >= "0" && e.key <= "9" && e.location === 3);

                const isPlus =
                  e.key === "+" &&
                  e.target.selectionStart === 0 &&
                  !e.target.value.includes("+");

                if (!isNumber && !isPlus && !allowedKeys.includes(e.key)) {
                  e.preventDefault();
                }
              }}
              onInput={(e) => {
                let value = e.target.value.replace(/[^0-9+]/g, "");
                if (value.includes("+")) {
                  value = "+" + value.replace(/\+/g, "");
                }
                if (!value.startsWith("+") && value.length > 1) {
                  value = value.replace(/^0+/, "");
                }
                e.target.value = value;
              }}
              maxLength={16}
            />
            {errors?.workPhone && (
              <p className="text-red-500 text-xs mt-1">
                {errors.workPhone.message}
              </p>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2">
              Personal Phone Number
            </label>
             <input
              {...textFieldProps("personalPhone", false, {
                value: /^\+?[1-9]\d{8,14}$/,
                message:
                  "Enter a valid phone number (9-15 digits, no leading zero)",
              })}
              placeholder="Enter personal phone number (optional)"
              type="tel"
              onKeyDown={(e) => {
                const allowedKeys = [
                  "Backspace",
                  "Delete",
                  "Tab",
                  "ArrowLeft",
                  "ArrowRight",
                  "Home",
                  "End",
                  "+",
                ];
                const isNumber =
                  (e.key >= "0" && e.key <= "9") ||
                  (e.key >= "0" && e.key <= "9" && e.location === 3);

                const isPlus =
                  e.key === "+" &&
                  e.target.selectionStart === 0 &&
                  !e.target.value.includes("+");

                if (!isNumber && !isPlus && !allowedKeys.includes(e.key)) {
                  e.preventDefault();
                }
              }}
              onInput={(e) => {
                let value = e.target.value.replace(/[^0-9+]/g, "");
                if (value.includes("+")) {
                  value = "+" + value.replace(/\+/g, "");
                }
                if (!value.startsWith("+") && value.length > 1) {
                  value = value.replace(/^0+/, "");
                }
                e.target.value = value;
              }}
              maxLength={16}
            />
            {errors?.personalPhone && (
              <p className="text-red-500 text-xs mt-1">
                {errors.personalPhone.message}
              </p>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-semibold mb-2">
              Physical Address*
            </label>
            <textarea
              {...textareaProps("physicalAddress", true)}
              placeholder="Enter physical address"
              onInput={(e) => {
                const start = e.target.selectionStart;
                const end = e.target.selectionEnd;
                e.target.value = e.target.value.toUpperCase();
                e.target.setSelectionRange(start, end);
              }}
              onKeyDown={(e) => {
                if (e.key >= "a" && e.key <= "z") {
                  e.preventDefault();
                  const start = e.target.selectionStart;
                  const end = e.target.selectionEnd;
                  const value = e.target.value;
                  e.target.value =
                    value.substring(0, start) +
                    e.key.toUpperCase() +
                    value.substring(end);
                  e.target.setSelectionRange(start + 1, start + 1);
                }
              }}
            />
            {errors?.physicalAddress && (
              <p className="text-red-500 text-xs mt-1">
                {errors.physicalAddress.message}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactDetailsForm;
