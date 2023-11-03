import * as React from "react";

export const TagTitleRow = ({
  title,
  filesInfo,
  onTagClick,
}: {
  title: string;
  filesInfo: string;
  onTagClick: (arg0: React.MouseEvent<HTMLHeadingElement, MouseEvent>) => void;
}) => (
  <div className="tag-title-row">
    <h3 className="tag-title" onClick={onTagClick}>
      {title}
    </h3>
    <span>{filesInfo}</span>
  </div>
);
