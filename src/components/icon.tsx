import * as React from "react";
import { MouseEvent } from "react";

export const ICON_TYPE = {
  arrow: "arrow",
  sort: "sort",
};
Object.freeze(ICON_TYPE);

export const Icon = ({
  iconType,
  onClick,
  className,
  label,
}: {
  iconType: string;
  onClick: Function;
  className: string;
  label?: string;
}) => {
  return (
    <div
      aria-label={label}
      className={`custom-icon ${className}`}
      onClick={(e: MouseEvent) => onClick(e)}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`svg-icon-icon`}
      >
        {iconType === ICON_TYPE.arrow ? (
          <path d="M3 8L12 17L21 8"></path>
        ) : (
          <>
            <path d="M11 11h4"></path>
            <path d="M11 15h7"></path>
            <path d="M11 19h10"></path>
            <path d="M9 7 6 4 3 7"></path>
            <path d="M6 6v14"></path>
          </>
        )}
      </svg>
    </div>
  );
};
