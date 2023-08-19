import * as React from "react";

import { ICON_TYPE, Icon } from "./icon";
import { TagTitleRow } from "./tag-title-row";
import { TagData, TaggedFile } from "../types";
import { addOrRemove, pluralize } from "../utils";

export const TagsTable = ({
  tags,
  onFileClick,
  collapsedTags,
  setCollapsedTags,
  onTagClick,
}: {
  tags: TagData[];
  onFileClick: Function;
  collapsedTags: string[];
  setCollapsedTags: Function;
  onTagClick: Function;
}) => {
  const getTagTable = (tagLevel: TagData, depth: number) => {
    const hasSubTags: boolean = !!tagLevel.sub.length;
    const isCollapsable: boolean = hasSubTags || !!tagLevel.files.length;
    const isCollapsed: boolean =
      isCollapsable && collapsedTags.includes(tagLevel.tagPath);
    let containerClasses: string = `tags-table-container tags-level-${depth}`;
    if (isCollapsable) {
      containerClasses += " has-sub-tags";
    }
    if (isCollapsed) {
      containerClasses += " is-collapsed";
    }

    let filesInfo: string = pluralize(tagLevel.files.length, "file", "files");
    if (tagLevel.subFilesCount) {
      filesInfo += ` (${tagLevel.files.length + tagLevel.subFilesCount} total)`;
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
          filesInfo={filesInfo}
          onTagClick={() => onTagClick(tagLevel)}
        />
        {!isCollapsed && (
          <div className="tag-content">
            <table>
              <tbody>
                {tagLevel.files &&
                  tagLevel.files.map((file: TaggedFile) => (
                    <React.Fragment
                      key={`${tagLevel.tag}-${file.file.basename}`}
                    >
                      <tr
                        className="file-row"
                        onClick={(event) =>
                          onFileClick(file.file, event.ctrlKey || event.metaKey)
                        }
                      >
                        <td>
                          <span className="file-link">
                            {file.file.basename}
                          </span>
                        </td>
                        <td className="last-modified">{file.modified}</td>
                      </tr>
                    </React.Fragment>
                  ))}
                {!!tagLevel.sub.length &&
                  !collapsedTags.includes(tagLevel.tagPath) && (
                    <tr className="sub-tags-row">
                      <td colSpan={2}>
                        {tagLevel.sub.map((subTagData: TagData) =>
                          getTagTable(subTagData, depth + 1)
                        )}
                      </td>
                    </tr>
                  )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  return <>{tags.map((tag: TagData) => getTagTable(tag, 0))}</>;
};
