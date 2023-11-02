import * as React from "react";

import { ICON_TYPE, Icon } from "./icon";
import { TagTitleRow } from "./tag-title-row";
import { TagData, TaggedFile } from "../types";
import { addOrRemove, pluralize } from "../utils";
import TagsOverviewPlugin from "src/main";
import { DEFAULT_SETTINGS } from "src/settings";

export const TagsTable = ({
  plugin,
  tags,
  onFileClick,
  collapsedTags,
  setCollapsedTags,
  onTagClick,
}: {
  plugin: TagsOverviewPlugin;
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

    const tableColumns = plugin.settings.tableColumns.length
      ? plugin.settings.tableColumns
      : DEFAULT_SETTINGS.tableColumns;

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
          onTagClick={(event: MouseEvent) => {
            if (isCollapsable && (event.ctrlKey || event.metaKey)) {
              onTagClick(tagLevel);
            } else {
              setCollapsedTags(addOrRemove(collapsedTags, tagLevel.tagPath));
            }
          }}
        />
        {!isCollapsed && (
          <div className="tag-content">
            <table>
              <tbody>
                {tagLevel.files &&
                  tagLevel.files.map((file: TaggedFile, fileIndex: number) => (
                    <React.Fragment
                      key={`${tagLevel.tag}-${file.file.basename}-${fileIndex}`}
                    >
                      <tr
                        className="file-row"
                        onClick={(event) =>
                          onFileClick(file.file, event.ctrlKey || event.metaKey)
                        }
                      >
                        {tableColumns.map((column, index) => (
                          <td
                            key={`${tagLevel.tag}-${file.file.basename}-${fileIndex}-${index}`}
                            className={`align-${column.align} col-${column.type}`}
                          >
                            {column.type === "name" && file.file.basename}
                            {column.type === "modified" &&
                              file.formattedModified}
                            {column.type === "created" && file.formattedCreated}
                            {column.type === "size" && file.file.stat.size}
                            {column.type === "frontMatter" &&
                              file.frontMatter &&
                              column.data &&
                              file.frontMatter[column.data] &&
                              (typeof file.frontMatter[column.data] === "string"
                                ? file.frontMatter[column.data]
                                : file.frontMatter[column.data].join(", "))}
                          </td>
                        ))}
                      </tr>
                    </React.Fragment>
                  ))}
                {!!tagLevel.sub.length &&
                  !collapsedTags.includes(tagLevel.tagPath) && (
                    <tr className="sub-tags-row">
                      <td colSpan={tableColumns.length}>
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
