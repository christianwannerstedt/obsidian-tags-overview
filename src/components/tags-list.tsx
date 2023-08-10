import * as React from "react";

import { TagData, TaggedFile } from "../types";
import { addOrRemove } from "src/utils";
import { ICON_TYPE, Icon } from "./icon";
import { TagTitleRow } from "./tag-title-row";

export const TagsList = ({
  tags,
  onFileClick,
  collapsedTags,
  setCollapsedTags,
}: {
  tags: TagData[];
  onFileClick: Function;
  collapsedTags: string[];
  setCollapsedTags: Function;
}) => {
  const getTagList = (tagLevel: TagData, depth: number) => {
    const hasSubTags: boolean = !!tagLevel.sub.length;
    const isCollapsed: boolean =
      hasSubTags && collapsedTags.includes(tagLevel.tagPath);
    let containerClasses: string = `nested-tags-container tags-level-${depth}`;
    if (hasSubTags) {
      containerClasses += " has-sub-tags";
    }
    if (isCollapsed) {
      containerClasses += " is-collapsed";
    }

    return (
      <div key={tagLevel.tag} className={containerClasses}>
        {hasSubTags && (
          <Icon
            className="collapse-icon"
            iconType={ICON_TYPE.arrow}
            onClick={() => {
              setCollapsedTags(addOrRemove(collapsedTags, tagLevel.tagPath));
            }}
          />
        )}
        <TagTitleRow
          title={tagLevel.tag}
          filesInfo={`(${
            isCollapsed || !hasSubTags
              ? tagLevel.files.length
              : tagLevel.subFilesCount
          })`}
        />
        <div className="nested-container">
          {!!tagLevel.files.length && (
            <div>
              {tagLevel.files.map((file: TaggedFile) => (
                <span
                  key={file.file.basename}
                  onClick={(event) =>
                    onFileClick(file.file, event.ctrlKey || event.metaKey)
                  }
                  className="file-link"
                >
                  {file.file.basename}
                </span>
              ))}
            </div>
          )}
          {!!tagLevel.sub &&
            !collapsedTags.includes(tagLevel.tagPath) &&
            tagLevel.sub.map((subTagData: TagData) =>
              getTagList(subTagData, depth + 1)
            )}
        </div>
      </div>
    );
  };

  return <>{tags.map((tag: TagData) => getTagList(tag, 0))}</>;
};
