import React from "react";

export const HeaderSettings = ({ title, value, settings, setFunction }) => {
  return (
    <div className="header-with-settings">
      <p className="title">{title}</p>
      <div className="settings-switch filter-type-setting">
        {settings.map((setting) => {
          return (
            <span
              key={setting.label}
              className={setting.value == value ? "active" : "inactive"}
              onClick={(e) => setFunction(setting.value)}
            >
              {setting.label}
            </span>
          );
        })}
      </div>
    </div>
  );
};
