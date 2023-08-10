import * as React from "react";
import { HeaderSetting } from "src/types";

export const HeaderSettings = ({
  title,
  value,
  settings,
  setFunction,
}: {
  title: string;
  value: string | boolean;
  settings: HeaderSetting[];
  setFunction: Function;
}) => {
  return (
    <div className="header-with-settings">
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
