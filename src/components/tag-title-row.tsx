import * as React from "react";

export const TagTitleRow = ({
  title,
  filesInfo,
}: {
  title: string;
  filesInfo: string;
}) => (
  <div className="tag-title-row">
    <h3 className="tag-title">{title}</h3>
    <span>{filesInfo}</span>
  </div>
);
