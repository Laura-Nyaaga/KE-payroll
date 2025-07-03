"use client";
import React, { useState, useEffect } from "react"; // Import useEffect
import { useFormContext } from "react-hook-form";

const TaxDetailsForm = () => {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
    trigger,
  } = useFormContext();
  const [shaNoLength, setShaNoLength] = useState(0);
  const [kraPinLength, setKraPinLength] = useState(0);
  const [nssfNoLength, setNssfNoLength] = useState(0);
  const shaNoValue = watch("shaNo");
  const kraPinValue = watch("kraPin");
  const nssfNoValue = watch("nssfNo");

  // Update character counter
  useEffect(() => {
    setShaNoLength(shaNoValue ? shaNoValue.length : 0);
    setKraPinLength(kraPinValue ? kraPinValue.length : 0);
    setNssfNoLength(nssfNoValue ? nssfNoValue.length : 0);
  }, [shaNoValue, kraPinValue, nssfNoValue]);

  // Common field props
  const inputProps = (
    name,
    required = false,
    pattern = null,
    maxLength = null
  ) => ({
    ...register(name, {
      required: required && `${name.split(/(?=[A-Z])/).join(" ")} is required`,
      pattern,
      onBlur: () => trigger(name),
      ...(maxLength && { maxLength }),
    }),
    className:
      "w-full border p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500",
    onChange: (e) => {
      setValue(name, e.target.value, { shouldValidate: true });
      if (name === "shaNo") setShaNoLength(e.target.value.length);
    },
    onBlur: () => {
      trigger(name);
    },
  });

  const selectProps = (name, required = false) => ({
    ...register(name, {
      required: required && `${name.split(/(?=[A-Z])/).join(" ")} is required`,
      // onBlur: () => trigger(name) // This is fine as trigger is now defined
    }),
    className:
      "w-full border p-3 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500",

    onChange: (e) => {
      setValue(name, e.target.value, { shouldValidate: true });
    },
    onBlur: () => {
      trigger(name);
    },
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* KRA PIN */}
        <div>
          <label className="block text-sm font-semibold mb-2">KRA PIN*</label>
          <input
            {...inputProps(
              "kraPin",
              true,
              {
                value: /^[A-Z][0-9]{9}[A-Z]$/,
                message: "Enter a valid KRA PIN (e.g., A123456789Z)",
              },
              11
            )}
            placeholder="Enter KRA PIN (e.g., A123456789Z)"
            onKeyDown={(e) => {
              const position = e.target.selectionStart;
              const value = e.target.value;
              const length = value.length;

              // Allow control keys
              if (
                [
                  "Backspace",
                  "Delete",
                  "Tab",
                  "ArrowLeft",
                  "ArrowRight",
                  "Home",
                  "End",
                ].includes(e.key)
              ) {
                return;
              }

              // First character must be letter
              if (position === 0 && !/[a-zA-Z]/.test(e.key)) {
                e.preventDefault();
                return;
              }

              // Last character must be letter
              if (position >= 10 && !/[a-zA-Z]/.test(e.key)) {
                e.preventDefault();
                return;
              }

              // Middle characters must be numbers
              if (position > 0 && position < 10 && !/[0-9]/.test(e.key)) {
                e.preventDefault();
              }
            }}
            onInput={(e) => {
              let value = e.target.value
                .toUpperCase()
                .replace(/[^A-Z0-9]/g, "");

              // Enforce structure:
              if (value.length > 0) {
                const firstChar = value.charAt(0).replace(/[^A-Z]/g, "");
                const middleChars = value.slice(1, 10).replace(/[^0-9]/g, "");
                const lastChar =
                  value.length > 10
                    ? value.charAt(10).replace(/[^A-Z]/g, "")
                    : "";

                e.target.value = firstChar + middleChars + lastChar;
              }
            }}
            maxLength={11}
          />
          <p className="text-gray-500 text-xs mt-1">
            {kraPinLength}/11 characters
          </p>
          {errors?.kraPin && (
            <p className="text-red-500 text-xs mt-1">{errors.kraPin.message}</p>
          )}
        </div>

        {/* NSSF No */}
        <div>
          <label className="block text-sm font-semibold mb-2">NSSF No*</label>
          <input
            {...inputProps(
              "nssfNo",
              true,
              {
                value: /^\d{10,12}$/,
                message: "NSSF No must be 10-12 digits",
              },
              12
            )}
            placeholder="Enter NSSF No (e.g., 1234567891)"
            type="tel"
            onKeyDown={(e) => {
              // Allow: digits (0-9), backspace, delete, tab, arrows, home, end
              if (
                !/[0-9]/.test(e.key) &&
                ![
                  "Backspace",
                  "Delete",
                  "Tab",
                  "ArrowLeft",
                  "ArrowRight",
                  "Home",
                  "End",
                ].includes(e.key)
              ) {
                e.preventDefault();
              }
            }}
            onInput={(e) => {
              e.target.value = e.target.value.replace(/\D/g, "");
            }}
            maxLength={12}
          />
          <p className="text-gray-500 text-xs mt-1">
            {nssfNoLength}/12 characters
          </p>
          {errors?.nssfNo && (
            <p className="text-red-500 text-xs mt-1">{errors.nssfNo.message}</p>
          )}
        </div>
      </div>

      {/* Right Column */}
      <div className="bg-white p-6 rounded-lg shadow-md grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SHIF No */}
        <div>
          <label className="block text-sm font-semibold mb-2">SHIF No*</label>
          <input
            {...inputProps(
              "shaNo",
              true,
              {
                value: /^CR\d{7,15}-\d$/,
                message:
                  "Enter SHIF No in format CR1234567-8 to CR123456789012345-8",
              },
              20
            )}
            placeholder="Enter SHIF No (e.g., CR647378735-8)"
            onKeyDown={(e) => {
              const { value, selectionStart } = e.target;
              const length = value.length;

              // Allow control keys
              const allowedKeys = [
                "Backspace",
                "Delete",
                "Tab",
                "ArrowLeft",
                "ArrowRight",
                "Home",
                "End",
              ];
              if (allowedKeys.includes(e.key)) return;

              // First character must be 'C'
              if (selectionStart === 0 && e.key.toUpperCase() !== "C") {
                e.preventDefault();
                return;
              }

              // Second character must be 'R' (only if first is 'C')
              if (
                selectionStart === 1 &&
                value[0] === "C" &&
                e.key.toUpperCase() !== "R"
              ) {
                e.preventDefault();
                return;
              }

              // After CR, allow only numbers until hyphen
              if (selectionStart >= 2 && !value.includes("-")) {
                if (!/[0-9]/.test(e.key)) {
                  e.preventDefault();
                  return;
                }
                // Auto-insert hyphen after 7-15 digits (CR + 7-15 digits)
                if (length >= 9 && length <= 17 && /^CR\d{7,15}$/.test(value)) {
                  e.target.value = `${value}-`;
                  e.target.setSelectionRange(length + 1, length + 1);
                }
              }

              // After hyphen, allow only one digit
              if (value.includes("-")) {
                const parts = value.split("-");
                if (parts[1].length >= 1 || !/[0-9]/.test(e.key)) {
                  e.preventDefault();
                }
              }
            }}
            onInput={(e) => {
              let value = e.target.value.toUpperCase();
              const cursorPos = e.target.selectionStart;

              // Allow natural typing of CR first
              if (value.length <= 2) {
                if (value.length === 1 && value !== "C") value = "C";
                if (value.length === 2 && !value.startsWith("CR")) value = "CR";
                e.target.value = value;
                e.target.setSelectionRange(cursorPos, cursorPos);
                return;
              }

              // After CR is entered, enforce format strictly
              value = value.replace(/[^CR0-9-]/g, "");

              // Split into parts
              const hasHyphen = value.includes("-");
              let beforeHyphen = hasHyphen
                ? value.split("-")[0].replace(/[^0-9]/g, "")
                : value.replace(/[^0-9]/g, "");
              let afterHyphen = hasHyphen
                ? value.split("-")[1].replace(/[^0-9]/g, "")
                : "";

              // Enforce lengths
              beforeHyphen = beforeHyphen.slice(0, 15); // Max 15 digits after CR
              afterHyphen = afterHyphen.slice(0, 1); // Exactly 1 digit after hyphen

              // Reconstruct value
              value = `CR${beforeHyphen}${
                hasHyphen || beforeHyphen.length >= 7 ? "-" : ""
              }${afterHyphen}`;

              // Ensure hyphen appears only when appropriate
              if (
                !hasHyphen &&
                beforeHyphen.length >= 7 &&
                beforeHyphen.length <= 15
              ) {
                value = `CR${beforeHyphen}-${afterHyphen}`;
              }

              e.target.value = value;
              e.target.setSelectionRange(cursorPos, cursorPos);
            }}
            minLength={11} // CR + 7 digits + hyphen + 1 digit
            maxLength={20} // CR + 15 digits + hyphen + 1 digit
            style={{ textTransform: "uppercase" }}
          />
          <p className="text-gray-500 text-xs mt-1">
            {shaNoLength}/20 characters
          </p>
          {errors?.shaNo && (
            <p className="text-red-500 text-xs mt-1">{errors.shaNo.message}</p>
          )}
        </div>

        {/* Tax Exemption */}
        {/* <div>
          <label className="block text-sm font-semibold mb-2">
            Tax Exemption*
          </label>
          <select {...selectProps("taxExemption", true)}>
            <option value="" disabled>
              Select an option
            </option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
          {errors?.taxExemption && (
            <p className="text-red-500 text-xs mt-1">
              {errors.taxExemption.message}
            </p>
          )}
        </div> */}
      </div>
    </div>
  );
};

export default TaxDetailsForm;
