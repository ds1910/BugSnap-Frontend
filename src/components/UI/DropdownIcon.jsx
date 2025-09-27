import React, { useState } from "react";

const DropdownIcon = ({ width = 15, height = 8, className = "" }) => {
  const [rotated, setRotated] = useState(false);

  return (
    <svg
      onClick={() => setRotated(!rotated)}
      width={width}
      height={height}
      viewBox="0 0 15 8"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} cursor-pointer transition-transform duration-200`}
      style={{
        transform: rotated ? "rotate(-90deg)" : "rotate(0deg)",
        transformOrigin: "center",
      }}
      aria-hidden="true"
    >
      {/* Triangle shape */}
      <path d="M2.5 1.5 L7.5 7 L12.5 1.5 Z" fill="#707070" />
    </svg>
  );
};

export default DropdownIcon;
