import * as React from "react";
import { MouseEvent } from "react";

export const ICON_TYPE = {
  arrow: "arrow",
  nested: "nested",
  sort: "sort",
};
Object.freeze(ICON_TYPE);

export const Icon = ({
  iconType,
  onClick,
  className,
  label,
  active,
}: {
  iconType: string;
  onClick: Function;
  className: string;
  label?: string;
  active?: boolean;
}) => {
  let classes = `custom-icon ${className}`;
  if (active) {
    classes += " is-active";
  }
  return (
    <div
      aria-label={label}
      className={classes}
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
        ) : iconType === ICON_TYPE.sort ? (
          <>
            <path d="M11 11h4"></path>
            <path d="M11 15h7"></path>
            <path d="M11 19h10"></path>
            <path d="M9 7 6 4 3 7"></path>
            <path d="M6 6v14"></path>
          </>
        ) : (
          <>
            <path d="M13 10h7a1 1 0 0 0 1-1V6a1 1 0 0 0-1-1h-2.5a1 1 0 0 1-.8-.4l-.9-1.2A1 1 0 0 0 15 3h-2a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1Z"></path>
            <path d="M13 21h7a1 1 0 0 0 1-1v-3a1 1 0 0 0-1-1h-2.88a1 1 0 0 1-.9-.55l-.44-.9a1 1 0 0 0-.9-.55H13a1 1 0 0 0-1 1v5a1 1 0 0 0 1 1Z"></path>
            <path d="M3 3v2c0 1.1.9 2 2 2h3"></path>
            <path d="M3 3v13c0 1.1.9 2 2 2h3"></path>
          </>
        )}
      </svg>
    </div>
  );
};
