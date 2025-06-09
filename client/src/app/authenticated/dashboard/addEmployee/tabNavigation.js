import React from 'react';

const TabNavigation = ({ tabs, activeTab, setActiveTab }) => {
  return (
    <nav className="mb-6" aria-label="Employee form sections">
      <div className="flex border-b border-gray-200">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`px-4 py-2 text-sm font-medium transition-colors duration-200 ${
              activeTab === index
                ? 'text-red-600 border-b-2 border-red-500 cursor-default'
                : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab(index)}
            aria-current={activeTab === index ? 'page' : undefined}
            disabled={activeTab === index}
          >
            {tab}
          </button>
        ))}
      </div>
    </nav>
  );
};


export default TabNavigation;