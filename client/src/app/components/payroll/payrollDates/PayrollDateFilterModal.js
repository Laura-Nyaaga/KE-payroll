"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import api, { BASE_URL } from "@/app/config/api";
import { usePayrollContext } from "../context/PayrollContext";
import { Button } from "../../ui/button";
import { CalendarIcon } from "@radix-ui/react-icons";
import { Popover, PopoverTrigger, PopoverContent } from "../../ui/popover";
import { toast } from "react-hot-toast";
import { Label } from "../../ui/label";

export default function PayrollModal() {
  const {
    payrollDates,
    setPayrollDates,
    paymentDate,
    setPaymentDate,
    setPayrollId,
    selectedStatus,
    generatePreview,
    companyId,
    fetchPayrollData,
  } = usePayrollContext();

  const [showModal, setShowModal] = useState(false);
  const [payrollDateModal, setPayrollDateModal] = useState({
    from: null,
    to: null,
    paymentDate: null,
    totalDays: 0,
  });
  const [existingRanges, setExistingRanges] = useState([]);
  const [loadingRanges, setLoadingRanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRangeText, setSelectedRangeText] = useState("Select Payroll Date Range");
  const [selectedPayrollId, setSelectedPayrollId] = useState(null);

  // Stable references to prevent infinite loops
  const fetchPayrollDataRef = useRef(fetchPayrollData);
  const lastFetchedPayrollId = useRef(null);
  const isInitialized = useRef(false);

  const MIN_PAY_PERIOD_DAYS = 25;
  const MAX_PAY_PERIOD_DAYS = 30;
  const MAX_PAYMENT_DAYS_AHEAD = 7;

  // Update ref when fetchPayrollData changes
  useEffect(() => {
    fetchPayrollDataRef.current = fetchPayrollData;
  }, [fetchPayrollData]);

  // Initialize from localStorage
  useEffect(() => {
    if (isInitialized.current) return;

    const storedPayrollId = localStorage.getItem("payrollId");
    const storedRangeText = localStorage.getItem("selectedRangeText");

    if (storedPayrollId && storedPayrollId !== "null" && storedRangeText) {
      setSelectedPayrollId(storedPayrollId);
      setSelectedRangeText(storedRangeText);
    }

    isInitialized.current = true;
  }, []);

  const formatDateDisplay = useCallback((dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  const fetchPayrollDateRanges = useCallback(async () => {
    if (!companyId) return;

    setLoadingRanges(true);
    try {
      const response = await api.get(`${BASE_URL}/payrolls/company/${companyId}/date/details`);
      if (response.data?.success) {
        const data = response.data.data;
        setExistingRanges(data);

        // Validate stored selection
        const storedPayrollId = localStorage.getItem("payrollId");
        if (storedPayrollId && storedPayrollId !== "null") {
          const match = data.find((r) => r.payrollId === storedPayrollId);
          if (match) {
            const from = new Date(match.payPeriodStartDate);
            const to = new Date(match.payPeriodEndDate);
            const rangeText = `${formatDateDisplay(from)} - ${formatDateDisplay(to)}`;
            setSelectedRangeText(rangeText);
            setSelectedPayrollId(storedPayrollId);
            localStorage.setItem("selectedRangeText", rangeText);
          } else {
            localStorage.removeItem("payrollId");
            localStorage.removeItem("selectedRangeText");
            setSelectedRangeText("Select Payroll Date Range");
            setSelectedPayrollId(null);
          }
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Error fetching payroll ranges");
    } finally {
      setLoadingRanges(false);
    }
  }, [companyId, formatDateDisplay]);

  // Fetch ranges when companyId changes
  useEffect(() => {
    if (companyId) {
      fetchPayrollDateRanges();
    }
  }, [companyId, fetchPayrollDateRanges]);

  // Fetch payroll data when selectedPayrollId changes
  useEffect(() => {
    if (
      selectedPayrollId &&
      selectedPayrollId !== "null" &&
      selectedStatus &&
      companyId &&
      lastFetchedPayrollId.current !== selectedPayrollId
    ) {
      lastFetchedPayrollId.current = selectedPayrollId;
      fetchPayrollDataRef.current?.();
    }
  }, [selectedPayrollId, selectedStatus, companyId]);

  // Sync context with selected range
  useEffect(() => {
    if (selectedPayrollId && selectedPayrollId !== "null" && existingRanges.length > 0) {
      const found = existingRanges.find((r) => r.payrollId === selectedPayrollId);
      if (found) {
        const from = new Date(found.payPeriodStartDate);
        const to = new Date(found.payPeriodEndDate);
        const pay = new Date(found.paymentDate);
        const rangeText = `${formatDateDisplay(from)} - ${formatDateDisplay(to)}`;

        console.log("This the form date", from, to, pay);

        setPayrollDates({ from, to, totalDays: calculateDays(from, to) });
        setPaymentDate(pay);
        setPayrollId(selectedPayrollId);
        if (selectedRangeText !== rangeText) {
          setSelectedRangeText(rangeText);
          localStorage.setItem("selectedRangeText", rangeText);
        }
      }
    }
  }, [selectedPayrollId, existingRanges, setPayrollDates, setPaymentDate, setPayrollId, formatDateDisplay, selectedRangeText]);

  const calculateDays = (from, to) => {
    if (!from || !to) return 0;
    return Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  };

  const handleSubmit = async () => {
    const { from, to, paymentDate } = payrollDateModal;
    if (!from || !to || !paymentDate) return toast.error("All dates required");

    const rangeDays = calculateDays(from, to);
    if (rangeDays < MIN_PAY_PERIOD_DAYS || rangeDays > MAX_PAY_PERIOD_DAYS) {
      return toast.error(`Range must be between ${MIN_PAY_PERIOD_DAYS} and ${MAX_PAY_PERIOD_DAYS} days`);
    }

    const paymentGap = calculateDays(to, paymentDate);
    if (paymentGap > MAX_PAYMENT_DAYS_AHEAD || paymentDate < to) {
      return toast.error(`Payment must be within ${MAX_PAYMENT_DAYS_AHEAD} days after end date`);
    }

  const formatLocalDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

    try {
      setIsSubmitting(true);
    const payload = {
  payPeriodStartDate: formatLocalDate(from),
  payPeriodEndDate: formatLocalDate(to),
  paymentDate: formatLocalDate(paymentDate),
};
      const result = await generatePreview(payload);

      console.log("This is my payload:", payload)

      if (result.success) {
        const rangeText = `${formatDateDisplay(from)} - ${formatDateDisplay(to)}`;
        localStorage.setItem("selectedRangeText", rangeText);
        localStorage.setItem("payrollId", result.payrollId);
        setSelectedRangeText(rangeText);
        setSelectedPayrollId(result.payrollId);
        setPayrollDates({ from, to, totalDays: rangeDays });
        setPaymentDate(paymentDate);
        setPayrollId(result.payrollId);

        lastFetchedPayrollId.current = null;

        await fetchPayrollDateRanges();
        toast.success("Payroll preview generated.");
        setShowModal(false);
        setIsOpen(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate payroll");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectExistingRange = useCallback((payrollId) => {
    if (!payrollId || payrollId === "null") return;

    if (payrollId === "new") {
      localStorage.removeItem("payrollId");
      localStorage.removeItem("selectedRangeText");
      setSelectedRangeText("Select Payroll Date Range");
      setSelectedPayrollId(null);
      setShowModal(true);
      setIsOpen(false);
      return;
    }

    const found = existingRanges.find((r) => r.payrollId === payrollId);
    if (found) {
      const from = new Date(found.payPeriodStartDate);
      const to = new Date(found.payPeriodEndDate);
      const pay = new Date(found.paymentDate);
      const label = `${formatDateDisplay(from)} - ${formatDateDisplay(to)}`;

      localStorage.setItem("payrollId", payrollId);
      localStorage.setItem("selectedRangeText", label);
      setSelectedRangeText(label);
      setSelectedPayrollId(payrollId);
      setPayrollDates({ from, to, totalDays: calculateDays(from, to) });
      setPaymentDate(pay);
      setPayrollId(payrollId);
      lastFetchedPayrollId.current = null;
    }
    setIsOpen(false);
  }, [existingRanges, setPayrollDates, setPaymentDate, setPayrollId, formatDateDisplay]);

  const filterToDate = (date) => {
    if (!payrollDateModal.from) return true;
    const minDate = new Date(payrollDateModal.from);
    minDate.setDate(minDate.getDate() + MIN_PAY_PERIOD_DAYS - 1);
    const maxDate = new Date(payrollDateModal.from);
    maxDate.setDate(maxDate.getDate() + MAX_PAY_PERIOD_DAYS - 1);
    return date >= minDate && date <= maxDate;
  };

  const filterPaymentDate = (date) => {
    if (!payrollDateModal.to) return true;
    const min = new Date(payrollDateModal.to);
    const max = new Date(payrollDateModal.to);
    max.setDate(max.getDate() + MAX_PAYMENT_DAYS_AHEAD);
    return date >= min && date <= max;
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setPayrollDateModal({
      from: null,
      to: null,
      paymentDate: null,
      totalDays: 0,
    });
  };

  return (
    <div className="flex gap-4 items-center">
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-[280px] justify-start text-left font-normal"
            onClick={() => setIsOpen(!isOpen)}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {selectedRangeText}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-2 space-y-2">
            {loadingRanges ? (
              <div className="text-sm p-2">Loading ranges...</div>
            ) : (
              <>
                {existingRanges.map((range) => {
                  const label = `${formatDateDisplay(range.payPeriodStartDate)} - ${formatDateDisplay(range.payPeriodEndDate)}`;
                  return (
                    <div
                      key={range.payrollId}
                      className={`cursor-pointer text-sm p-2 rounded hover:bg-gray-100 ${
                        selectedPayrollId === range.payrollId ? "bg-blue-100 font-semibold border border-blue-300" : ""
                      }`}
                      onClick={() => handleSelectExistingRange(range.payrollId)}
                    >
                      {label}
                    </div>
                  );
                })}
                <div
                  className="text-blue-600 cursor-pointer border-t pt-2 mt-2 text-sm hover:bg-blue-50 p-2 rounded"
                  onClick={() => handleSelectExistingRange("new")}
                >
                  + Set New Payroll Range
                </div>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded shadow-md w-[400px] relative">
            <button
              onClick={handleCloseModal}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
            <h2 className="text-lg font-semibold mb-4">Set Payroll Range</h2>
            <div className="grid gap-4">
              <div>
                <Label>From</Label>
                <DatePicker
                  selected={payrollDateModal.from}
                  onChange={(date) => setPayrollDateModal((p) => ({ ...p, from: date, to: null, paymentDate: null }))}
                  className="border px-2 py-1 w-full rounded"
                  dateFormat="yyyy-MM-dd"
                  placeholderText="Select start date"
                />
              </div>
              <div>
                <Label>To</Label>
                <DatePicker
                  selected={payrollDateModal.to}
                  onChange={(date) => setPayrollDateModal((p) => ({ ...p, to: date, paymentDate: null }))}
                  className="border px-2 py-1 w-full rounded"
                  dateFormat="yyyy-MM-dd"
                  filterDate={filterToDate}
                  disabled={!payrollDateModal.from}
                  placeholderText="Select end date"
                />
              </div>
              <div>
                <Label>Payment Date</Label>
                <DatePicker
                  selected={payrollDateModal.paymentDate}
                  onChange={(date) => setPayrollDateModal((p) => ({ ...p, paymentDate: date }))}
                  className="border px-2 py-1 w-full rounded"
                  dateFormat="yyyy-MM-dd"
                  filterDate={filterPaymentDate}
                  disabled={!payrollDateModal.to}
                  placeholderText="Select payment date"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !payrollDateModal.from || !payrollDateModal.to || !payrollDateModal.paymentDate}
                  className="flex-1"
                >
                  {isSubmitting ? "Generating..." : "Generate Preview"}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
