'use client';

import { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Home, 
  Users, 
  Wallet, 
  CreditCard, 
  BarChart, 
  Settings, 
  User,
  ChevronDown,
  ChevronUp 
} from "lucide-react";

export default function Sidebar() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [expandedItems, setExpandedItems] = useState({});

  const handleNavigation = (tab, path) => {
    setActiveTab(tab);
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

  // Navigation items with submenu structure
  const navItems = [
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
        { id: "Departments", label: "Departments", path: "/departments" },
        { id: "Projects", label: "Projects", path: "/projects" }
      ]
    },
    {
      id: "Payroll",
      icon: Wallet,
      label: "Payroll",
      subItems: [
        { id: "Payroll List", label: "Payroll List", path: "/payroll" },
        { id: "Payslip", label: "Payslip", path: "/payroll/payslip" },
        { id: "Process Payroll", label: "Process Payroll", path: "/payroll/process" },
        { id: "Payroll Data", label: "Payroll Data", path: "/authenticated/payroll-Data" }
      ]
    },
    {
      id: "Assets",
      icon: CreditCard,
      label: "Assets",
      subItems: [
        { id: "All Assets", label: "All Assets", path: "/assets" },
        { id: "Add Asset", label: "Add Asset", path: "/assets/add" }
      ]
    },
    {
      id: "Reports",
      icon: BarChart,
      label: "Reports",
      subItems: [
        { id: "Payroll Report", label: "Payroll Report", path: "/reports/payroll" },
        { id: "Attendance Report", label: "Attendance Report", path: "/reports/attendance" },
        { id: "Leaves Report", label: "Leaves Report", path: "/reports/leaves" }
      ]
    },
  ];

  const bottomItems = [
    {
      id: "Settings",
      icon: Settings,
      label: "Settings",
      path: "/settings",
      subItems: []
    },
    {
      id: "Profile",
      icon: User,
      label: "Profile",
      path: "/profile",
      subItems: []
    }
  ];

  function SidebarItem({ item, isBottom = false }) {
    const isActive = activeTab === item.id;
    const isExpanded = expandedItems[item.id];
    const hasSubItems = item.subItems && item.subItems.length > 0;
    
    return (
      <div className="w-full">
        <div
          className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition ${
            isActive ? "bg-gray-300 font-bold text-black" : "hover:bg-gray-200 text-gray-700"
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
            <item.icon className={`w-5 h-5 mr-3 ${isActive ? "text-black" : "text-gray-700"}`} />
            <span>{item.label}</span>
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
        {/* SubItems / Dropdown with animation */}
        {hasSubItems && (
          <div 
            className={`pl-8 mt-1 overflow-hidden transition-all duration-300 ease-in-out ${
              isExpanded ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="space-y-1 py-1">
              {item.subItems.map((subItem) => (
                <div
                  key={subItem.id}
                  className={`p-2 rounded-md cursor-pointer text-sm text-black ${
                    activeTab === subItem.id ? "bg-gray-200 font-semibold" : "hover:bg-gray-200"
                  }`}
                  onClick={() => handleNavigation(subItem.id, subItem.path)}
                >
                  {subItem.label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="h-screen w-64 bg-gray-100 shadow-lg p-4 flex flex-col justify-between">
      {/* Top Section */}
      <div>
        {/* Logo */}
        <div className="flex items-center justify-center mb-6">
          <div className="bg-pink-500 text-white text-2xl font-bold w-16 h-16 flex items-center justify-center rounded-lg">
            AB
          </div>
        </div>
        <p className="text-center text-gray-700 font-semibold mb-6">ABC Company</p>
        {/* Navigation */}
        <nav className="space-y-1">
          {navItems.map((item) => (
            <SidebarItem key={item.id} item={item} />
          ))}
        </nav>
      </div>
      {/* Bottom Section */}
      <div className="space-y-1 pt-4 border-t border-gray-200">
        {bottomItems.map((item) => (
          <SidebarItem key={item.id} item={item} isBottom={true} />
        ))}
      </div>
    </div>
  );
}