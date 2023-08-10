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
}: {
  tags: TagData[];
  onFileClick: Function;
  displayType: string;
  collapsedTags: string[];
  setCollapsedTags: Function;
}) => {
  const props = { tags, onFileClick, collapsedTags, setCollapsedTags };

  return (
    <div className={`display-type-${displayType}`}>
      {displayType === DISPLAY_TYPE.compact ? (
        <TagsList {...props} />
      ) : (
        <TagsTable {...props} />
      )}
    </div>
  );
};
