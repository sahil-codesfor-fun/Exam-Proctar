import React from 'react';

const StatCard = ({ title, value, icon: Icon, colorClass }) => {
  return (
    <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-gray-900">
            {value}
          </h3>
        </div>
        <div className={`p-3 rounded-lg ${colorClass}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
