import React from 'react';

const StatCard = ({ title, value, icon: Icon, colorClass, onClick, loading }) => {
  return (
    <div 
      onClick={onClick}
      role={onClick ? 'button' : 'article'}
      tabIndex={onClick ? 0 : -1}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      className={`bg-white rounded-xl p-6 border border-gray-200 shadow-sm transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:-translate-y-1 hover:shadow-lg' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 mb-1">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-gray-900">
            {loading ? (
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mt-1"></div>
            ) : (
              value
            )}
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
