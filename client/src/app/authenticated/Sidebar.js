'use client';

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";
import api from '../config/api';
import Image from "next/image";
import { 
  Home, 
  Users, 
  Wallet, 
  CreditCard, 
  BarChart, 
  Settings, 
  User,
  ChevronDown,
  ChevronUp,
  Building
} from "lucide-react";
import { BASE_URL } from "../config/api";

const navigationData = {
  // ... your existing navigation data
  mainItems: [
    {
      id: "Dashboard",
      icon: Home,
      label: "Dashboard",
      path: "/authenticated/dashboard",
      subItems: []
    },
    {
      id: "Employees",
      icon: Users,
      label: "Employees",
      subItems: [
        { id: "All Employees", label: "All Employees", path: "/authenticated/dashboard/List" },
        { id: "Add Employee", label: "Add Employee", path: "/authenticated/dashboard/addEmployee" },
      ]
    },
    {
      id: "Payroll",
      icon: Wallet,
      label: "Payroll",
      subItems: [
        { id: "Payroll Data", label: "Payroll Data", path: "/authenticated/payroll-Data"},
        { id: "Process Payroll", label: "Process Payroll", path: "/authenticated/process-Pay" },
        // { id: "Payslip", label: "Payslip", path: "/authenticated/payslip" }
      ]
    },
    // {
    //   id: "Assets",
    //   icon: CreditCard,
    //   label: "Assets",
    //   subItems: [
    //     { id: "All Assets", label: "All Assets", path: "/authenticated/assets" },
    //     { id: "Add Asset", label: "Add Asset", path: "/authenticated/assets/add" }
    //   ]
    // },
       // {
    //   id: "Reports",
    //   icon: BarChart,
    //   label: "Reports",
    //   subItems: [
    //     { id: "Payroll Report", label: "Payroll Report", path: "/authenticated/reports/payrollReport" },
    //     { id: "Attendance Report", label: "Attendance Report", path: "/authenticated/reports/attendanceReport" }
    //   ]
    // },
  ],
  bottomItems: [
    {
      id: "Settings",
      icon: Settings,
      label: "Settings",
      path: "/authenticated/settings",
      subItems: [
        {
          id: "HRSettings",
          label: "HR Settings",
          path: "/authenticated/settings/hr",
          subItems: [
            {
              id: "JobTitle",
              label: "Job Title",
              path: "/authenticated/hr/jobtitle"
            },
            {
              id: "Departments",
              label: "Departments",
              path: "/authenticated/hr/departments"
            },
            {
              id: "Regions",
              label: "Regions/Branches",
              path: "/authenticated/hr/regions"
            },
            {
              id: "Projects",
              label: "Projects",
              path: "/authenticated/hr/projects"
            }
          ]
        },
        {
          id: "PayrollSettings",
          label: "Payroll Settings",
          path: "/authenticated/process-Pay",
          subItems: [
            {
              id: "Allowances",
              label: "Allowances",
              path: "/authenticated/payroll/allowances"
            },
            {
              id: "Deductions",
              label: "Deductions",
              path: "/authenticated/payroll/deductions"
            },
            {
              id: "Earnings",
              label: "Earnings",
              path: "/authenticated/payroll/earnings"
            },
            // {
            //   id: "Loans",
            //   label: "Loans",
            //   path: "/authenticated/payroll/loans"
            // }
          ]
        },
        {
          id: "AdminSettings",
          label: "Admin Settings",
          path: "/authenticated/dashboard",
          subItems: [
            {
                id: "Users",
                label: "Users",
                path: "/authenticated/users"
                },
          ]
        }
      ]
    },
    {
      id: "Profile",
      icon: User,
      label: "Profile",
      path: "/authenticated/profile",
      subItems: []
    }
  ]
};

function SidebarItem({ item, activeId, expandedItems, toggleExpand, handleNavigation, depth = 0 }) {
  const isActive = activeId === item.id;
  const isExpanded = expandedItems[item.id];
  const hasSubItems = item.subItems && item.subItems.length > 0;
  
  // Check if any child items are active
  const hasActiveChild = hasSubItems && findActiveChild(item, activeId);
  
  return (
    <div className="w-full">
      <div
        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors duration-200 ${
          isActive || hasActiveChild 
            ? "bg-gray-300 font-bold text-black" 
            : "hover:bg-gray-200 text-gray-700"
        }`}
        onClick={() => {
          if (hasSubItems) {
            toggleExpand(item.id);
          } else {
            handleNavigation(item.id, item.path);
          }
        }}
      >
        <div className="flex items-center">
          {item.icon && (
            <item.icon 
              className={`w-5 h-5 mr-2 ${
                isActive || hasActiveChild ? "text-black" : "text-gray-700"
              }`} 
            />
          )}
          <span className="text-sm">{item.label}</span>
        </div>
        {hasSubItems && (
          <div className="ml-auto">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4 text-gray-700 transition-transform duration-300" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-700 transition-transform duration-300" />
            )}
          </div>
        )}
      </div>
      
      {/* SubItems*/}
      {hasSubItems && (
        <div 
          className={`pl-4 overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
          }`}
          style={{ 
            transitionDelay: isExpanded ? "0ms" : "0ms",
          }}
        >
          <div className="space-y-0.5 py-1">
            {item.subItems.map((subItem) => (

              subItem.subItems && subItem.subItems.length > 0 ? (
                <SidebarItem 
                  key={subItem.id} 
                  item={subItem} 
                  activeId={activeId}
                  expandedItems={expandedItems}
                  toggleExpand={toggleExpand}
                  handleNavigation={handleNavigation}
                  depth={depth + 1} 
                />
              ) : (
                <div
                  key={subItem.id}
                  className={`p-1.5 rounded-md cursor-pointer text-xs transition-colors duration-200 ${
                    activeId === subItem.id 
                      ? "bg-gray-200 font-semibold text-black" 
                      : "text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNavigation(subItem.id, subItem.path);
                  }}
                >
                  {subItem.label}
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function findActiveChild(item, activeId) {
  if (!item.subItems) return false;
  
  for (const subItem of item.subItems) {
    if (subItem.id === activeId) return true;
    if (subItem.subItems && findActiveChild(subItem, activeId)) return true;
  }
  
  return false;
}

function findItemByPath(items, path, results = []) {
  for (const item of items) {
    if (item.path === path) {
      results.push(item.id);
      return true;
    }
    
    if (item.subItems && item.subItems.length > 0) {
      const foundInChildren = findItemByPath(item.subItems, path, results);
      if (foundInChildren) {
        results.push(item.id);
        return true;
      }
    }
  }
  
  return false;
}

function getItemHierarchy(path) {
  const results = [];
  
  findItemByPath(navigationData.mainItems, path, results);
  
  findItemByPath(navigationData.bottomItems, path, results);
  
  return results;
}

// Updated Sidebar component with company info
export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeId, setActiveId] = useState("");
  const [expandedItems, setExpandedItems] = useState({});
  const [companyInfo, setCompanyInfo] = useState({
    name: "",
    logo: "",
    initials: "CN" // Default initials if no company name is found
  });
  
  useEffect(() => {
    // Try to get company name from localStorage (set during signup)
    const companyName = localStorage.getItem('companyName');
    const token = localStorage.getItem('token');
    
    if (companyName && !token) {
      // If we have a company name but no token, just use the name and initials
      setCompanyInfo(prev => ({
        ...prev,
        name: companyName,
        initials: getInitials(companyName)
      }));
    } else if (token) {
      // If we have a token, fetch complete company info from API
      fetchCompanyInfo();
    } else {
      // No token and no company name
      console.log("No token or company name available");
    }
    
    // For debugging
    console.log("Token exists:", !!token);
    console.log("Company name:", companyName);
  }, []);


  // Auto-expand and set active based on current path
  useEffect(() => {
    const hierarchy = getItemHierarchy(pathname);
    
    if (hierarchy.length > 0) {
      // Set the last item (child) as active
      setActiveId(hierarchy[0]);
      
      // Expand all parent items
      const newExpandedState = {};
      for (let i = 1; i < hierarchy.length; i++) {
        newExpandedState[hierarchy[i]] = true;
      }
      
      setExpandedItems(prev => ({
        ...prev,
        ...newExpandedState
      }));
    }
  }, [pathname]);

  // Function to fetch company info from API including the logo
  const fetchCompanyInfo = async () => {
    try {
      console.log("Fetching company info from API");
      
      const companyId = localStorage.getItem('companyId');

      if (!companyId) {
        console.error('No company ID found in localStorage');
        return;
      }

      const response = await api.get(`${BASE_URL}/companies/${companyId}`, {
        withCredentials: true}
        // headers: {
        //   Authorization: `Bearer ${token}`
        // }
      );
      const company = response.data;
      console.log("Company info received:", company);
      
      if (company) {
        const logoUrl = company.companyLogo;

        
        setCompanyInfo({
          name: company.name,
          logo: logoUrl, 
          initials: getInitials(company.name)
        });
        
        // Store company name in localStorage for future use
        localStorage.setItem('companyName', company.name);
        
        console.log("Updated company info with:", {
          name: company.name,
          logo: logoUrl ? "Logo URL exists" : "No logo URL",
          initials: getInitials(company.name)
        });
      }
    } catch (error) {
      console.error('Error fetching company info:', error);
      // If error in fetching, use the company name from localStorage if available
      const companyName = localStorage.getItem('companyName');
      if (companyName) {
        setCompanyInfo({
          name: companyName,
          logo: null,
          initials: getInitials(companyName)
        });
      }
    }
  };

  // Get initials from company name
  const getInitials = (name) => {
    if (!name) return "CO";
    
    // Split by spaces and get first letter of each word
    const words = name.split(' ');
    if (words.length === 1) {
      // If only one word, take first two letters
      return name.substring(0, 2).toUpperCase();
    } else {
      // Otherwise take first letter of first two words
      return (words[0][0] + words[1][0]).toUpperCase();
    }
  };

  const handleNavigation = (id, path) => {
    setActiveId(id);
    if (path) {
      router.push(path);
    }
  };

  const toggleExpand = (item) => {
    setExpandedItems(prev => ({
      ...prev,
      [item]: !prev[item]
    }));
  };

  return (
    <div className="h-screen w-60 bg-gray-100 shadow-lg p-3 flex flex-col">
      <div>
        {/* Company Logo */}
        <div className="flex items-center justify-center mb-4">
          {companyInfo.logo ? (
            // Display the actual company logo if available
            <div className="w-12 h-12 rounded-lg overflow-hidden">
              <img 
                src={companyInfo.logo} 
                alt={`${companyInfo.name} logo`}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            // Display initials if no logo is available
            <div className="bg-pink-500 text-white text-2xl font-bold w-12 h-12 flex items-center justify-center rounded-lg">
              {companyInfo.initials}
            </div>
          )}
        </div>
        
        {/* Company Name */}
        <p className="text-center text-gray-700 font-semibold text-sm mb-4">
          {companyInfo.name || "Company Name"}
        </p>
        
        {/* Navigation */}
        <nav className="space-y-0.5">
          {navigationData.mainItems.map((item) => (
            <SidebarItem 
              key={item.id} 
              item={item}
              activeId={activeId}
              expandedItems={expandedItems}
              toggleExpand={toggleExpand}
              handleNavigation={handleNavigation}
            />
          ))}
        </nav>
      </div>
      
      {/* Bottom Section - with reduced margin-top */}
      <div className="space-y-0.5 mt-auto pt-2 border-t border-gray-200">
        {navigationData.bottomItems.map((item) => (
          <SidebarItem 
            key={item.id} 
            item={item} 
            activeId={activeId}
            expandedItems={expandedItems}
            toggleExpand={toggleExpand}
            handleNavigation={handleNavigation}
          />
        ))}
      </div>
    </div>
  );
}