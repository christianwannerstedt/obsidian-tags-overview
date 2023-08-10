import * as React from "react";
import { useState } from "react";

import { TagData } from "../types";
import { TagsList } from "./tags-list";
import { TagsTable } from "./tags-table";
import { DISPLAY_TYPE } from "../constants";

export const Tags = ({
  tags,
  onFileClick,
  displayType,
}: {
  tags: TagData[];
  onFileClick: Function;
  displayType: string;
}) => {
  const [collapsedTags, setCollapsedTags] = useState<string[]>([]);
  const props = { tags, onFileClick, collapsedTags, setCollapsedTags };

  return (
    <div className={`display-type-${displayType}`}>
      {displayType === DISPLAY_TYPE.compact ? (
        <TagsList {...props} />
      ) : (
        <TagsTable tags={tags} onFileClick={onFileClick} />
      )}
    </div>
  );
};
