import React from 'react';

const PageTitle = ({
  title,
  icon: Icon,
  description,
  titleClass = "",
  descriptionClass = ""
}) => {
  return (
    <div className="w-full">
      <h1
        className={`
          ${titleClass}
          text-2xl sm:text-3xl lg:text-4xl
          font-bold
          flex items-center flex-wrap
          gap-2 sm:gap-3
        `}
      >
        {Icon && (
          <Icon className="text-primary text-xl sm:text-2xl" />
        )}
        {title}
      </h1>

      {description && (
        <p
          className={`
            ${descriptionClass}
            mt-1 sm:mt-2
            text-sm sm:text-base
            text-gray-600
          `}
        >
          {description}
        </p>
      )}
    </div>
  );
};

export default PageTitle;