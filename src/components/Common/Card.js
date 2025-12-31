import React from 'react';

const Card = ({ children, title, className = '' }) => {
  return (
    <div className={`bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 ${className}`}>
      {title && <h2 className="text-xl font-bold mb-4 text-gray-800 border-b border-gray-100 pb-3">{title}</h2>}
      {children}
    </div>
  );
};

export default Card;

