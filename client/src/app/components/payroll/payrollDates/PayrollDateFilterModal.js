"use client";

import React, { useState, useEffect, useCallback } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import api, { BASE_URL } from "@/app/config/api"; // Ensure BASE_URL is imported here
import { usePayrollContext } from "../context/PayrollContext";
import { Button } from '../../ui/button';
import { Input } from "../../ui/input"
import { Label } from '../../ui/label' // Ensure Label is imported if not from ui/label
import { Popover, PopoverTrigger, PopoverContent } from '../../ui/popover'
import { toast } from 'react-hot-toast';
import { CalendarIcon } from '@radix-ui/react-icons';

export default function PayrollDateFilter() {
  const {
    payrollDates,
    setPayrollDates,
    paymentDate,
    setPaymentDate,
    fetchReadOnlyStatus,
    setPayrollId,
    selectedStatus,
    generatePreview,
    loading // Overall loading state from context
  } = usePayrollContext();

  const [showModal, setShowModal] = useState(false);
  const [payrollDateModal, setPayrollDateModal] = useState({
    from: null,
    to: null,
    paymentDate: null,
    totalDays: 0
  });
  const [existingRanges, setExistingRanges] = useState([]);
  const [loadingRanges, setLoadingRanges] = useState(false); // Loading state for fetching existing ranges
  const [isSubmitting, setIsSubmitting] = useState(false); // Loading state for preview generation
  const [isOpen, setIsOpen] = useState(false); // State for the main popover dropdown
  const [selectedRangeText, setSelectedRangeText] = useState("Select Payroll Date Range");
  const [selectedPayrollId, setSelectedPayrollId] = useState(null);

  // Constants for date range logic
  const MIN_PAY_PERIOD_DAYS = 25;
  const MAX_PAY_PERIOD_DAYS = 30;
  const MAX_PAYMENT_DAYS_AHEAD = 7; // Payment date not more than 7 days from end pay period

  const formatDateDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const fetchPayrollDateRanges = useCallback(async () => {
    setLoadingRanges(true);
    const companyId = localStorage.getItem('companyId'); // Get companyId dynamically

    if (!companyId) {
      setLoadingRanges(false);
      toast.error("Company ID not found. Please log in to fetch payroll ranges.");
      setExistingRanges([]);
      return;
    }

    try {
      // Use the 'api' instance for authenticated requests
      const response = await api.get(`${BASE_URL}/payrolls/company/${companyId}/date/details`);
      if (response.data?.success) {
        setExistingRanges(response.data.data);
      } else {
        setExistingRanges([]);
      }
    } catch (error) {
      console.error("Error fetching payroll date ranges:", error);
      setExistingRanges([]);
      toast.error(error.response?.data?.message || "Failed to fetch payroll date ranges");
    } finally {
      setLoadingRanges(false);
    }
  }, []); // No dependencies needed as companyId is fetched internally

  useEffect(() => {
    fetchPayrollDateRanges();
  }, [fetchPayrollDateRanges]);

  const calculateDays = (from, to) => {
    if (!from || !to) return 0;
    const msPerDay = 1000 * 60 * 60 * 24;
    // +1 to include both start and end days
    return Math.ceil((to.getTime() - from.getTime()) / msPerDay) + 1;
  };

  const handleDateChange = (dateType, date) => {
    let from = payrollDateModal.from;
    let to = payrollDateModal.to;
    let paymentDate = payrollDateModal.paymentDate;

    if (dateType === 'from') {
      from = date;
      // If new 'from' date invalidates 'to' date, reset 'to' and 'paymentDate'
      if (to && from && (from > to || calculateDays(from, to) > MAX_PAY_PERIOD_DAYS || calculateDays(from, to) < MIN_PAY_PERIOD_DAYS)) {
        to = null;
        paymentDate = null;
      }
      // If payment date is before new 'from' date, reset it
      if (paymentDate && from && paymentDate < from) {
        paymentDate = null;
      }
    } else if (dateType === 'to') {
      to = date;
      // If new 'to' date invalidates 'paymentDate', reset 'paymentDate'
      if (paymentDate && to && (paymentDate < to || calculateDays(to, paymentDate) > MAX_PAYMENT_DAYS_AHEAD)) {
        paymentDate = null;
      }
    } else if (dateType === 'paymentDate') {
      paymentDate = date;
    }

    const days = calculateDays(from, to);
    setPayrollDateModal(prev => ({
      ...prev,
      [dateType]: date,
      totalDays: days > 0 ? days : 0,
      from: from,
      to: to,
      paymentDate: paymentDate,
    }));
  };

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (e && e.stopPropagation) e.stopPropagation();

    // Frontend validation
    if (!payrollDateModal.from || !payrollDateModal.to || !payrollDateModal.paymentDate) {
      toast.error('Please select start, end, and payment dates.');
      return;
    }

    const daysRange = calculateDays(payrollDateModal.from, payrollDateModal.to);
    if (payrollDateModal.from > payrollDateModal.to || daysRange < MIN_PAY_PERIOD_DAYS || daysRange > MAX_PAY_PERIOD_DAYS) {
      toast.error(`Payroll period must be between ${MIN_PAY_PERIOD_DAYS} and ${MAX_PAY_PERIOD_DAYS} days.`);
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    // Check if the 'to' date is in a future month relative to the current month
    // This simple check prevents generating payroll for months beyond the current one.
    if (payrollDateModal.to > currentMonthEnd) {
      toast.error('You cannot generate payroll for future months. Please select dates within the current or past month.');
      return;
    }

    const paymentDaysDiff = calculateDays(payrollDateModal.to, payrollDateModal.paymentDate);
    if (payrollDateModal.paymentDate < payrollDateModal.to || paymentDaysDiff > MAX_PAYMENT_DAYS_AHEAD) {
      toast.error(`Payment date must be within ${MAX_PAYMENT_DAYS_AHEAD} days of the pay period end date, and not before the end date.`);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await generatePreview({
        payPeriodStartDate: payrollDateModal.from,
        payPeriodEndDate: payrollDateModal.to,
        paymentDate: payrollDateModal.paymentDate,
      });

      if (result && result.success) {
        const rangeText = `${formatDateDisplay(payrollDateModal.from)} - ${formatDateDisplay(payrollDateModal.to)}`;
        setSelectedRangeText(rangeText);
        setPayrollDates({
          from: payrollDateModal.from,
          to: payrollDateModal.to,
          totalDays: payrollDateModal.totalDays
        });
        setPaymentDate(payrollDateModal.paymentDate);
        await fetchPayrollDateRanges(); // Refresh existing ranges
        toast.success("Payroll dates set successfully and preview generated.");
        setShowModal(false);
        setIsOpen(false);
      } else {
        // If generatePreview failed but didn't throw, it returned success: false
        // The error toast is handled by generatePreview itself, no need for another here.
        // Keep modal open or close based on desired UX for non-throwing errors.
        // For now, it will stay open as `generatePreview` is expected to throw on failure.
      }
    } catch (error) {
      // Error toast is already handled by generatePreview's catch block.
      // This catch is for any unexpected errors during the process.
      console.error("Error during payroll generation process (caught in PayrollDateFilter):", error);
      toast.error(error.message || "An unexpected error occurred during payroll generation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectExistingRange = (payrollIdFromSelection) => {
    if (payrollIdFromSelection === 'new') {
      setPayrollDateModal({
        from: null,
        to: null,
        paymentDate: null,
        totalDays: 0
      });
      setShowModal(true); // Open the modal for new range
      setIsOpen(false); // Close the popover
      setSelectedPayrollId(null);
      setSelectedRangeText("Select Payroll Date Range");
      return;
    }

    const selectedRange = existingRanges.find(range => range.payrollId === payrollIdFromSelection);
    if (selectedRange) {
      const fromDate = new Date(selectedRange.payPeriodStartDate);
      const toDate = new Date(selectedRange.payPeriodEndDate);
      const paymentDate = new Date(selectedRange.paymentDate);

      const rangeText = `${formatDateDisplay(selectedRange.payPeriodStartDate)} - ${formatDateDisplay(selectedRange.payPeriodEndDate)}`;

      setSelectedRangeText(rangeText);
      setSelectedPayrollId(payrollIdFromSelection); // Set the selected payroll ID

      setPayrollDates({
        from: fromDate,
        to: toDate,
        totalDays: calculateDays(fromDate, toDate)
      });
      setPaymentDate(paymentDate);
      setPayrollId(payrollIdFromSelection); // Update payrollId in context

      setIsOpen(false); // Close the popover
      // fetchReadOnlyStatus now internally gets companyId from localStorage
      fetchReadOnlyStatus(selectedStatus, payrollIdFromSelection);
    }
  };

  // Helper function to get today's date for highlighting
  const today = new Date();
  today.setHours(0,0,0,0); // Normalize to start of day

  // --- Datepicker filter functions ---

  // Filter for "To" DatePicker
  const filterToDate = (date) => {
    if (!payrollDateModal.from) {
      // If 'from' date is not selected, only allow dates in the current month or future (up to MAX_PAY_PERIOD_DAYS from current date)
      const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0); // End of current month
      const maxPossibleToDate = new Date(today.getTime());
      maxPossibleToDate.setDate(today.getDate() + MAX_PAY_PERIOD_DAYS -1);

      return date >= currentMonthStart && date <= currentMonthEnd && date <= maxPossibleToDate;
    }

    const maxEndDate = new Date(payrollDateModal.from.getTime());
    maxEndDate.setDate(payrollDateModal.from.getDate() + MAX_PAY_PERIOD_DAYS -1 ); // -1 because calculateDays adds 1

    const minEndDate = new Date(payrollDateModal.from.getTime());
    minEndDate.setDate(payrollDateModal.from.getDate() + MIN_PAY_PERIOD_DAYS -1 ); // -1 because calculateDays adds 1

    const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Date must be:
    // 1. On or after 'from' date
    // 2. Within MIN_PAY_PERIOD_DAYS and MAX_PAY_PERIOD_DAYS from 'from' date
    // 3. Not after the end of the current month
    return date >= payrollDateModal.from &&
           date >= minEndDate && // Ensure at least min days
           date <= maxEndDate && // Ensure not more than max days
           date <= currentMonthEnd; // Ensure not in future month
  };

  // Filter for "Payment Date" DatePicker
  const filterPaymentDate = (date) => {
    if (!payrollDateModal.to) {
      // If 'to' date is not selected, restrict to current month and not in past
      const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      return date >= currentMonthStart;
    }

    const minPaymentDate = new Date(payrollDateModal.to.getTime());
    const maxPaymentDate = new Date(payrollDateModal.to.getTime());
    maxPaymentDate.setDate(payrollDateModal.to.getDate() + MAX_PAYMENT_DAYS_AHEAD);

    // Payment date must be:
    // 1. On or after 'to' date
    // 2. Not more than MAX_PAYMENT_DAYS_AHEAD from 'to' date
    return date >= minPaymentDate && date <= maxPaymentDate;
  };


  return (
    <div className="flex gap-4 items-center">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-[280px] justify-start text-left font-normal"
            onClick={() => setIsOpen(!isOpen)}
            disabled={loading || isSubmitting || loadingRanges} // Disable if any loading is happening
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedRangeText}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-2">
            {loadingRanges ? (
              <div className="p-2 text-sm text-gray-600">Loading payroll ranges...</div>
            ) : (
              <div className="space-y-2">
                {existingRanges.length > 0 ? (
                  existingRanges.map(range => (
                    <div
                      key={range.payrollId}
                      className={`p-2 text-sm rounded hover:bg-gray-100 cursor-pointer ${selectedPayrollId === range.payrollId ? 'bg-blue-50 font-medium text-blue-700' : 'text-gray-800'}`}
                      onClick={() => handleSelectExistingRange(range.payrollId)}
                    >
                      {formatDateDisplay(range.payPeriodStartDate)} - {formatDateDisplay(range.payPeriodEndDate)}
                    </div>
                  ))
                ) : (
                  <div className="p-2 text-sm text-gray-500">No existing payroll ranges found.</div>
                )}
                <div
                  className="p-2 text-sm rounded hover:bg-gray-100 cursor-pointer font-medium text-blue-600 border-t border-gray-200 mt-2 pt-2"
                  onClick={() => handleSelectExistingRange('new')}
                >
                  + Set New Payroll Date Range
                </div>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* MODAL IMPLEMENTATION: Conditional rendering for the modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => {
              if (!isSubmitting) setShowModal(false);
              else toast.error("Please wait until submission completes.");
            }}
          />

          {/* Modal Content */}
          <div className="bg-white rounded-md shadow-lg p-6 max-w-md w-full relative">
            {/* Close button */}
            <button
              onClick={() => {
                if (!isSubmitting) setShowModal(false);
                else toast.error("Please wait until submission completes.");
              }}
              className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl"
              disabled={isSubmitting}
            >
              &times;
            </button>

            {/* Modal Header */}
            <h2 className="text-xl font-semibold mb-2 text-gray-800">Set Payroll Date Range</h2>
            <p className="text-sm text-gray-500 mb-4">
              Select the start, end, and payment dates for this payroll period.
            </p>

            {/* Modal Body (your form content) */}
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="from" className="text-right text-gray-700">
                  From
                </Label>
                <DatePicker
                  selected={payrollDateModal.from}
                  onChange={(date) => handleDateChange('from', date)}
                  selectsStart
                  startDate={payrollDateModal.from}
                  endDate={payrollDateModal.to}
                  className="col-span-3 border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-blue-500 focus:border-blue-500 text-black"
                  dateFormat="yyyy-MM-dd"
                  placeholderText="YYYY-MM-DD"
                  required
                  // Max date for 'from' can be 'to' date, or if 'to' is not set, end of current month
                  maxDate={payrollDateModal.to ? new Date(payrollDateModal.to.getTime()) : new Date(today.getFullYear(), today.getMonth() + 1, 0)}
                  // Allow selecting dates up to the end of the current month (for 'from')
                  filterDate={(date) => date <= new Date(today.getFullYear(), today.getMonth() + 1, 0)}
                  highlightDates={[today]}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="to" className="text-right text-gray-700">
                  To
                </Label>
                <DatePicker
                  selected={payrollDateModal.to}
                  onChange={(date) => handleDateChange('to', date)}
                  selectsEnd
                  startDate={payrollDateModal.from}
                  endDate={payrollDateModal.to}
                  minDate={payrollDateModal.from} // Must be after or same as 'from' date
                  className="col-span-3 border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-blue-500 focus:border-blue-500 text-black"
                  dateFormat="yyyy-MM-dd"
                  placeholderText="YYYY-MM-DD"
                  required
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  filterDate={filterToDate} // Apply custom filter
                  highlightDates={[today]}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="paymentDate" className="text-right text-gray-700">
                  Payment Date
                </Label>
                <DatePicker
                  selected={payrollDateModal.paymentDate}
                  onChange={(date) => handleDateChange('paymentDate', date)}
                  minDate={payrollDateModal.to || new Date()} // Cannot be before 'to' date, or current date if 'to' is not set
                  className="col-span-3 border border-gray-300 rounded-md px-3 py-2 w-full focus:ring-blue-500 focus:border-blue-500 text-black"
                  dateFormat="yyyy-MM-dd"
                  placeholderText="YYYY-MM-DD"
                  required
                  filterDate={filterPaymentDate} // Apply custom filter
                  highlightDates={[today]}
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right text-gray-700">
                  Total Days
                </Label>
                <Input
                  readOnly
                  value={payrollDateModal.totalDays}
                  className="col-span-3 bg-gray-100 border border-gray-300 text-black"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-2 mt-6">
              <Button
                type="button"
                className="bg-green-600 text-white hover:bg-green-700 px-4 py-2 rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                disabled={isSubmitting || !payrollDateModal.from || !payrollDateModal.to || !payrollDateModal.paymentDate || payrollDateModal.totalDays < MIN_PAY_PERIOD_DAYS || payrollDateModal.totalDays > MAX_PAY_PERIOD_DAYS || calculateDays(payrollDateModal.to, payrollDateModal.paymentDate) > MAX_PAYMENT_DAYS_AHEAD || payrollDateModal.paymentDate < payrollDateModal.to}
                onClick={handleSubmit}
              >
                {isSubmitting ? "Generating..." : "Generate Preview"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

















