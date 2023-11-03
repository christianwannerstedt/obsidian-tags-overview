import * as React from "react";

import { TagData, TaggedFile } from "../types";
import { addOrRemove } from "src/utils";
import { ICON_TYPE, Icon } from "./icon";
import { TagTitleRow } from "./tag-title-row";
import { TFile } from "obsidian";

export const TagsList = ({
  tags,
  onFileClick,
  collapsedTags,
  setCollapsedTags,
  onTagClick,
}: {
  tags: TagData[];
  onFileClick: (file: TFile, inNewLeaf: boolean) => void;
  collapsedTags: string[];
  setCollapsedTags: (arg0: string[]) => void;
  onTagClick: (tagData: TagData) => void;
}) => {
  const getTagList = (tagLevel: TagData, depth: number) => {
    const hasSubTags: boolean = !!tagLevel.sub.length;
    const isCollapsable: boolean = hasSubTags || !!tagLevel.files.length;
    const isCollapsed: boolean =
      isCollapsable && collapsedTags.includes(tagLevel.tagPath);
    let containerClasses: string = `nested-tags-container tags-level-${depth}`;
    if (isCollapsable) {
      containerClasses += " has-sub-tags";
    }
    if (isCollapsed) {
      containerClasses += " is-collapsed";
    }
    return (
      <div key={tagLevel.tag} className={containerClasses}>
        {isCollapsable && (
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
          filesInfo={`(${tagLevel.files.length + tagLevel.subFilesCount})`}
          onTagClick={(
            event: React.MouseEvent<HTMLHeadingElement, MouseEvent>
          ) => {
            if (isCollapsable && (event.ctrlKey || event.metaKey)) {
              onTagClick(tagLevel);
            } else {
              setCollapsedTags(addOrRemove(collapsedTags, tagLevel.tagPath));
            }
          }}
        />
        {!isCollapsed && (
          <div className="nested-container">
            {!!tagLevel.files.length && (
              <div>
                {tagLevel.files.map((file: TaggedFile, index: number) => (
                  <span
                    key={`${file.file.basename}-${index}`}
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
        )}
      </div>
    );
  };

  return <>{tags.map((tag: TagData) => getTagList(tag, 0))}</>;
};
