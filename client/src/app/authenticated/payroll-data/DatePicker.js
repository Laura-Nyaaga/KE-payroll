"use client";

import { useState, useEffect, useRef } from "react";
import { FiCalendar } from "react-icons/fi";

const DatePicker = ({
  selected,
  onChange,
  placeholder = "Select date",
  minDate = null,
  maxDate = null,
  className = "",
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [displayDate, setDisplayDate] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const dateInputRef = useRef(null);

  useEffect(() => {
    if (selected) {
      setDisplayDate(selected.toLocaleDateString());
      setCurrentMonth(selected.getMonth());
      setCurrentYear(selected.getFullYear());
    } else {
      setDisplayDate("");
    }
  }, [selected]);

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const renderDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDayOfMonth = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
    }

    // Add cells for each day of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isSelected = selected && selected.toDateString() === date.toDateString();
      const isDisabled =
        (minDate && date < minDate) || (maxDate && date > maxDate);

      days.push(
        <button
          key={`day-${day}`}
          className={`w-8 h-8 rounded-full flex items-center justify-center 
            ${isSelected ? "bg-blue-500 text-white" : "hover:bg-gray-100"}
            ${isDisabled ? "text-gray-400 cursor-not-allowed" : "cursor-pointer"}`}
          onClick={() => {
            if (!isDisabled) {
              onChange(date);
              setIsOpen(false);
            }
          }}
          disabled={isDisabled}
        >
          {day}
        </button>
      );
    }

    return days;
  };

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const handleClickOutside = (event) => {
    if (dateInputRef.current && !dateInputRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className={`relative ${className}`} ref={dateInputRef}>
      <div
        className={`flex items-center border rounded-md p-2 ${disabled ? "bg-gray-100" : "bg-white"} cursor-pointer`}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        <input
          type="text"
          readOnly
          value={displayDate}
          placeholder={placeholder}
          className="flex-grow outline-none bg-transparent cursor-pointer"
          disabled={disabled}
        />
        <FiCalendar className="text-gray-500 ml-2" />
      </div>

      {isOpen && !disabled && (
        <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-4 w-64">
          <div className="flex justify-between items-center mb-4">
            <button
              onClick={goToPreviousMonth}
              className="p-1 rounded hover:bg-gray-100"
            >
              &lt;
            </button>
            <div className="font-medium">
              {months[currentMonth]} {currentYear}
            </div>
            <button
              onClick={goToNextMonth}
              className="p-1 rounded hover:bg-gray-100"
            >
              &gt;
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-sm text-gray-500 mb-2">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {renderDays()}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;