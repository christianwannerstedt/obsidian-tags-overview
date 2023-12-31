import * as React from "react";
import { SetStateAction } from "react";
import { HeaderSetting } from "src/types";

export const HeaderSettings = ({
  title,
  value,
  settings,
  setFunction,
  className,
}: {
  title: string;
  value: string | boolean;
  settings: HeaderSetting[];
  setFunction: (arg0: SetStateAction<string> | SetStateAction<boolean>) => void;
  className?: string;
}) => {
  return (
    <div className={`header-with-settings ${className || ""}`}>
      <p className="title">{title}</p>
      <div className="settings-switch filter-type-setting">
        {settings.map((setting: HeaderSetting) => {
          return (
            <span
              key={setting.label}
              className={setting.value == value ? "active" : "inactive"}
              onClick={() => setFunction(setting.value)}
            >
              {setting.label}
            </span>
          );
        })}
      </div>
    </div>
  );
};
