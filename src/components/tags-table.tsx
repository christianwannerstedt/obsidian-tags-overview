import * as React from "react";
import { useState } from "react";

import { ICON_TYPE, Icon } from "./icon";
import { TagTitleRow } from "./tag-title-row";
import { TagData, TaggedFile } from "../types";
import { addOrRemove, pluralize } from "../utils";

export const TagsTable = ({
  tags,
  onFileClick,
}: {
  tags: TagData[];
  onFileClick: Function;
}) => {
  const [collapsedTags, setCollapsedTags] = useState<string[]>([]);

  const getTagTable = (tagLevel: TagData, depth: number) => {
    const hasSubTags: boolean = !!tagLevel.sub.length;
    const isCollapsed: boolean =
      hasSubTags && collapsedTags.includes(tagLevel.tagPath);
    let containerClasses: string = `tags-table-container tags-level-${depth}`;
    if (hasSubTags) {
      containerClasses += " has-sub-tags";
    }
    if (isCollapsed) {
      containerClasses += " is-collapsed";
    }

    let filesInfo: string = pluralize(tagLevel.files.length, "file", "files");
    if (tagLevel.subFilesCount) {
      filesInfo += ` (${tagLevel.subFilesCount} total)`;
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
        <TagTitleRow title={tagLevel.tag} filesInfo={filesInfo} />
        <div className="tag-content">
          <table>
            <tbody>
              {tagLevel.files &&
                tagLevel.files.map((file: TaggedFile) => (
                  <React.Fragment key={`${tagLevel.tag}-${file.file.basename}`}>
                    <tr
                      className="file-row"
                      onClick={(event) =>
                        onFileClick(file.file, event.ctrlKey || event.metaKey)
                      }
                    >
                      <td>
                        <span className="file-link">{file.file.basename}</span>
                      </td>
                      <td className="last-modified">{file.modified}</td>
                    </tr>
                  </React.Fragment>
                ))}
              {!!tagLevel.sub && !collapsedTags.includes(tagLevel.tagPath) && (
                <tr>
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
      </div>
    );
  };

  return <>{tags.map((tag: TagData) => getTagTable(tag, 0))}</>;
};
