import * as React from "react";

import { TagData } from "../types";
import { TagsList } from "./tags-list";
import { TagsTable } from "./tags-table";
import { DISPLAY_TYPE } from "../constants";

export const Tags = ({
  tags,
  onFileClick,
  displayType,
  collapsedTags,
  setCollapsedTags,
  onTagClick,
}: {
  tags: TagData[];
  onFileClick: Function;
  displayType: string;
  collapsedTags: string[];
  setCollapsedTags: Function;
  onTagClick: Function;
}) => {
  const props = {
    tags,
    onFileClick,
    collapsedTags,
    setCollapsedTags,
    onTagClick,
  };

  return (
    <div className={`tags-container display-type-${displayType}`}>
      {displayType === DISPLAY_TYPE.compact ? (
        <TagsList {...props} />
      ) : (
        <TagsTable {...props} />
      )}
    </div>
  );
};
