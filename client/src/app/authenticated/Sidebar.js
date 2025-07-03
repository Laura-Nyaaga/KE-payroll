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
  Building,
  Briefcase, 
  Building2, 
  List, 
  UserPlus, 
  ClipboardList, 
  Calculator, 
  Sliders, 
  HandCoins, 
  UserCog, 
} from "lucide-react"; 
import { BASE_URL } from "../config/api";

const navigationData = {
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
        { id: "All Employees", icon: List, label: "All Employees", path: "/authenticated/dashboard/list" },
        { id: "Add Employee", icon: UserPlus, label: "Add Employee", path: "/authenticated/dashboard/addEmployee" },
      ]
    },
    {
      id: "Payroll",
      icon: Wallet,
      label: "Payroll",
      subItems: [
        { id: "Payroll Data", icon: ClipboardList, label: "Payroll Data", path: "/authenticated/payroll-data"},
        { id: "Process Payroll", icon: Calculator, label: "Process Payroll", path: "/authenticated/process-Pay" },
        { id: "Payroll Summary", icon: ClipboardList, label: "Payroll Summary", path: "/authenticated/payroll-summary" },
      ]
    },
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
          icon: Sliders, 
          label: "HR Settings",
          path: "/authenticated/settings/hr",
          subItems: [
            {
              id: "JobTitle",
              icon: Briefcase, 
              label: "Job Title",
              path: "/authenticated/hr/jobtitle"
            },
            {
              id: "Departments",
              icon: Building2, 
              label: "Departments",
              path: "/authenticated/hr/departments"
            },
            {
              id: "Regions",
              icon: Building, 
              label: "Regions/Branches",
              path: "/authenticated/hr/regions"
            },
            {
              id: "Projects",
              icon: Briefcase,
              label: "Projects",
              path: "/authenticated/hr/projects"
            }
          ]
        },
        {
          id: "PayrollSettings",
          icon: Sliders, 
          label: "Payroll Settings",
          path: "/authenticated/process-Pay", 
          subItems: [
            {
              id: "Deductions",
              icon: HandCoins, 
              label: "Deductions",
              path: "/authenticated/payroll/deductions"
            },
            {
              id: "Allowances",
              icon: HandCoins, 
              label: "Allowances",
              path: "/authenticated/payroll/earnings"
            },
          ]
        },
        {
          id: "AdminSettings",
          icon: Sliders, 
          label: "Admin Settings",
          path: "/authenticated/dashboard", 
          subItems: [
            {
                id: "Users",
                icon: UserCog, 
                label: "Users",
                path: "/authenticated/users"
                },
                {
                  id: "Company",
                  icon: Building,
                  label: "Company",
                  path: "/authenticated/company/[id]"
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

function SidebarItem({ item, activeId, expandedItems, toggleExpand, handleNavigation, depth = 0, closeOtherTopLevel }) {
  const isActive = activeId === item.id;
  const isExpanded = expandedItems[item.id];
  const hasSubItems = item.subItems && item.subItems.length > 0;

  const hasActiveChild = hasSubItems && findActiveChild(item, activeId);

  const IconComponent = item.icon;

  return (
    <div className="w-full">
      <div
        className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors duration-200 ${
          isActive || hasActiveChild
            ? "bg-gray-300 font-bold text-black"
            : "hover:bg-gray-200 text-gray-700"
        } ${depth > 0 ? 'ml-2' : ''}`}
        onClick={() => {
          if (hasSubItems) {
            if (depth === 0) {
                closeOtherTopLevel(item.id);
            }
            toggleExpand(item.id);
          } else {
            handleNavigation(item.id, item.path);
          }
        }}
      >
        <div className="flex items-center">
          {IconComponent && (
            <IconComponent
              className={`w-4 h-4 mr-2 ${
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

      {/* SubItems */}
      {hasSubItems && (
        <div
          className={`pl-4 overflow-hidden transition-all duration-300 ease-in-out ${
            isExpanded ? "max-h-screen opacity-100" : "max-h-0 opacity-0" // Increased max-h for deeper nesting
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
                  closeOtherTopLevel={depth === 0 ? closeOtherTopLevel : undefined}
                />
              ) : (
                <div
                  key={subItem.id}
                  className={`flex items-center p-1.5 rounded-md cursor-pointer text-xs transition-colors duration-200 ${
                    activeId === subItem.id
                      ? "bg-gray-200 font-semibold text-black"
                      : "text-gray-700 hover:bg-gray-200"
                  } ${depth > 0 ? 'ml-2' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation(); 
                    handleNavigation(subItem.id, subItem.path);
                  }}
                >
                  {subItem.icon && ( 
                    <subItem.icon
                      className={`w-3.5 h-3.5 mr-2 ${
                        activeId === subItem.id ? "text-black" : "text-gray-700"
                      }`}
                    />
                  )}
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

  if (!findItemByPath(navigationData.mainItems, path, results)) {
    findItemByPath(navigationData.bottomItems, path, results);
  }

  return results;
}


export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [activeId, setActiveId] = useState("");
  const [expandedItems, setExpandedItems] = useState({});
  const [companyInfo, setCompanyInfo] = useState({
    name: "",
    logo: "", 
  });

  useEffect(() => {
    fetchCompanyInfo();

    const hierarchy = getItemHierarchy(pathname);
    if (hierarchy.length > 0) {
      setActiveId(hierarchy[0]); 
      const newExpandedState = {};
      hierarchy.forEach(id => {
        newExpandedState[id] = true;
      });
      setExpandedItems(newExpandedState);
    } else {
        setExpandedItems({});
    }
  }, [pathname]);


  const fetchCompanyInfo = async () => {
    try {
      const companyId = localStorage.getItem('companyId');
      if (!companyId) {
        console.error('No company ID found in localStorage');
        const companyNameFallback = localStorage.getItem('companyName');
        setCompanyInfo({ name: companyNameFallback || "Company Name", logo: "" });
        return;
      }

      const response = await api.get(`${BASE_URL}/companies/${companyId}`, {
        withCredentials: true
      });
      const company = response.data;

      if (company) {
        setCompanyInfo({
          name: company.name,
          logo: company.companyLogo || "", 
        });
        localStorage.setItem('companyName', company.name); 
      }
    } catch (error) {
      console.error('Error fetching company info:', error);
      const companyNameFallback = localStorage.getItem('companyName');
      setCompanyInfo({
        name: companyNameFallback || "Company Name",
        logo: "", 
      });
    }
  };

  const handleNavigation = (id, path) => {
    setActiveId(id);
    if (path) {
      router.push(path);
    }
  };

  const closeOtherTopLevel = (currentItemId) => {
    setExpandedItems(prev => {
        const newExpandedState = {};
       
        [...navigationData.mainItems, ...navigationData.bottomItems].forEach(item => {
            if (item.id === currentItemId) {
               
            } else {
                newExpandedState[item.id] = false;
            }
        });
        return { ...prev, ...newExpandedState }; 
    });
  };


  const toggleExpand = (itemId) => {
    setExpandedItems(prev => ({
      ...prev, 
      [itemId]: !prev[itemId] 
    }));
  };


  return (
    <div className="h-screen w-60 bg-gray-100 shadow-lg p-3 flex flex-col">
      <div>
        <div className="flex items-center justify-center mb-4">
          {companyInfo.logo ? (
            <Image
              src={companyInfo.logo}
              alt={`logo`}
              width={100} 
              height={200} 
              className="rounded-lg object-cover"
              priority 
            />
          ) : (
            <div className="bg-gray-300 text-gray-600 text-sm font-semibold w-12 h-12 flex items-center justify-center rounded-lg">
              No Logo
            </div>
          )}
        </div>

        <p className="text-center text-gray-700 font-semibold text-sm mb-4">
          {companyInfo.name || "Company Name"}
        </p>

        <nav className="space-y-0.5">
          {navigationData.mainItems.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              activeId={activeId}
              expandedItems={expandedItems}
              toggleExpand={toggleExpand}
              handleNavigation={handleNavigation}
              closeOtherTopLevel={closeOtherTopLevel} 
            />
          ))}
        </nav>
      </div>

      <div className="space-y-0.5 mt-auto pt-2 border-t border-gray-200">
        {navigationData.bottomItems.map((item) => (
          <SidebarItem
            key={item.id}
            item={item}
            activeId={activeId}
            expandedItems={expandedItems}
            toggleExpand={toggleExpand}
            handleNavigation={handleNavigation}
            closeOtherTopLevel={closeOtherTopLevel} 
          />
        ))}
      </div>
    </div>
  );
}