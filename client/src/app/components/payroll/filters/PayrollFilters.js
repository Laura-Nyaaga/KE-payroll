'use client';

import { useState, useEffect, useRef } from 'react';
import axios from '../../utils/statutoryApi';
import 'react-datepicker/dist/react-datepicker.css';
import PayrollDateFilterModal from '../payrollDates/PayrollDateFilterModal';
import { usePayrollContext } from "../context/PayrollContext";

export default function PayrollFilters() {
  const {
    filters,
    setFilters,
  } = usePayrollContext();

  const [dropdownsOpen, setDropdownsOpen] = useState({
    departments: false,
    jobTitles: false,
    projects: false,
    modes: false,
    employmentTypes: false,
    paymentDate: false,
  });

  const [options, setOptions] = useState({
    departments: [],
    jobTitles: [],
    projects: [],
    modes: ["cash", "cheque", "bank", "mobileMoney"],
    employmentTypes: ['Permanent', 'Full-Time', 'Regular', 'Contract', 'Internship', 'Probationary', 'Part-Time', 'Casual'],
    paymentDate: [],
  });

  const companyId = 3;
  const dropdownRefs = useRef({});

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const openDropdowns = Object.entries(dropdownsOpen)
        .filter(([_, isOpen]) => isOpen)
        .map(([key]) => key);
  
      if (openDropdowns.length > 0) {
        const clickedOutsideAll = openDropdowns.every(key => {
          const ref = dropdownRefs.current[key];
          return ref && !ref.contains(event.target);
        });
  
        if (clickedOutsideAll) {
          setDropdownsOpen(prev => ({
            ...prev,
            ...Object.fromEntries(openDropdowns.map(key => [key, false]))
          }));
        }
      }
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownsOpen]);

  const fetchOptions = async (key, url) => {
    try {
      const response = await axios.get(url);
      const data = response.data || [];
      setOptions(prev => ({ ...prev, [key]: data }));
    } catch (error) {
      console.error(`Failed to fetch ${key}:`, error);
    }
  };

  const toggleDropdown = (key, url) => {
    setDropdownsOpen(prev => {
      const newState = { ...prev, [key]: !prev[key] };
      if (newState[key]) {
        Object.keys(newState).forEach(k => {
          if (k !== key) newState[k] = false;
        });
      }
      return newState;
    });
    
    if (!dropdownsOpen[key] && options[key].length === 0) {
      fetchOptions(key, url);
    }
  };

  const toggleSelect = (key, value) => {
    setFilters(prev => {
      const selected = new Set(prev[key] || []);
      selected.has(value) ? selected.delete(value) : selected.add(value);
      return { ...prev, [key]: Array.from(selected) };
    });
  };

  const toggleSelectAll = (key) => {
    setFilters(prev => {
      let allValues = [];
      
      if (key === 'jobTitles') {
        allValues = options[key]?.map(j => j.id.toString()) || [];
      } else if (key === 'modes') {
        allValues = ['cash', 'cheque', 'bank', 'mobileMoney'];
      } else if (key === 'employmentTypes') {
        allValues = ['Permanent', 'Full-Time', 'Regular', 'Contract', 'Internship', 'Probationary', 'Part-Time', 'Casual'];
      } else {
        allValues = options[key]?.map(opt => opt.id.toString()) || [];
      }
  
      const currentSelected = prev[key] || [];
      
      const allSelected = allValues.length > 0 && 
        allValues.every(val => currentSelected.includes(val));
  
      return { 
        ...prev, 
        [key]: allSelected ? [] : allValues 
      };
    });
  };

  return (
    <div className="flex flex-wrap gap-4 items-center">
      <PayrollDateFilterModal/>

      <DropdownFilter
        label="Departments"
        isOpen={dropdownsOpen.departments}
        options={options.departments.map(dep => ({ id: dep.id.toString(), label: dep.title }))}
        selected={filters.departments || []}
        onToggle={() => toggleDropdown('departments', `/departments/companies/${companyId}`)}
        onSelect={(id) => toggleSelect('departments', id)}
        onSelectAll={() => toggleSelectAll('departments')}
        dropdownRef={el => dropdownRefs.current.departments = el}
      />

      <DropdownFilter
        label="Projects"
        isOpen={dropdownsOpen.projects}
        options={options.projects.map(proj => ({ id: proj.id.toString(), label: proj.name }))}
        selected={filters.projects || []}
        onToggle={() => toggleDropdown('projects', `/projects/companies/${companyId}`)}
        onSelect={(id) => toggleSelect('projects', id)}
        onSelectAll={() => toggleSelectAll('projects')}
        dropdownRef={el => dropdownRefs.current.projects = el}
      />

      <DropdownFilter
        label="Job Titles"
        isOpen={dropdownsOpen.jobTitles}
        options={options.jobTitles.map(job => ({ id: job.id.toString(), label: job.name }))}
        selected={filters.jobTitles || []}
        onToggle={() => toggleDropdown('jobTitles', `/job-titles/companies/${companyId}`)}
        onSelect={(id) => toggleSelect('jobTitles', id)}
        onSelectAll={() => toggleSelectAll('jobTitles')}
        dropdownRef={el => dropdownRefs.current.jobTitles = el}
      />

      <DropdownFilter
        label="Payment Method"
        isOpen={dropdownsOpen.modes}
        options={options.modes.map(mode => ({ id: mode, label: mode }))}
        selected={filters.modes || []}
        onToggle={() => toggleDropdown('modes')}
        onSelect={(mode) => toggleSelect('modes', mode)}
        onSelectAll={() => toggleSelectAll('modes')}
        dropdownRef={el => dropdownRefs.current.modes = el}
      />

      <DropdownFilter
        label="Employment Type"
        isOpen={dropdownsOpen.employmentTypes}
        options={options.employmentTypes.map(type => ({ id: type, label: type }))}
        selected={filters.employmentTypes || []}
        onToggle={() => toggleDropdown('employmentTypes')}
        onSelect={(type) => toggleSelect('employmentTypes', type)}
        onSelectAll={() => toggleSelectAll('employmentTypes')}
        dropdownRef={el => dropdownRefs.current.employmentTypes = el}
      />
    </div>
  );
}

function DropdownFilter({ label, isOpen, options, selected, onToggle, onSelect, onSelectAll, dropdownRef }) {
  const allSelected = options.length > 0 && 
    options.every(opt => selected.includes(opt.id));
  
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className="border rounded-md px-4 py-1 text-sm hover:bg-gray-100"
      >
        {label}
      </button>
      {isOpen && (
        <div 
          className="absolute mt-2 bg-gray-50 border-0 rounded-md shadow-md max-h-64 overflow-y-auto z-10 min-w-[200px]"
          onClick={(e) => e.stopPropagation()} 
        >
          <div className="p-2 border-b flex items-center">
            <input
              type="checkbox"
              className="mr-2"
              checked={allSelected}
              onChange={(e) => {
                e.stopPropagation();
                onSelectAll();
              }}
            />
            <span className="text-sm font-medium">Select All</span>
          </div>
          {options.map((opt) => (
            <label 
              key={opt.id} 
              className="flex items-center px-3 py-1 text-sm cursor-pointer hover:bg-gray-300"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="checkbox"
                className="mr-2"
                checked={selected.includes(opt.id)}
                onChange={(e) => {
                  e.stopPropagation();
                  onSelect(opt.id);
                }}
              />
              {opt.label}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}


