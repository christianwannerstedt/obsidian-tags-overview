import * as React from "react";

import { ICON_TYPE, Icon } from "./icon";
import { TagTitleRow } from "./tag-title-row";
import { TableColumn, TagData, TaggedFile } from "../types";
import { addOrRemove, pluralize, upperCaseFirstChar } from "../utils";
import TagsOverviewPlugin from "src/main";
import { DEFAULT_SETTINGS } from "src/settings";
import { TFile } from "obsidian";
import { TABLE_COLUMN_TYPES } from "src/constants";

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
  onFileClick: (file: TFile, inNewLeaf: boolean) => void;
  collapsedTags: string[];
  setCollapsedTags: (arg0: string[]) => void;
  onTagClick: (tagData: TagData) => void;
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

    const tableColumns: TableColumn[] = plugin.settings.tableColumns.length
      ? plugin.settings.tableColumns
      : DEFAULT_SETTINGS.tableColumns;

    const getColStyle = (column: TableColumn) => {
      if (column.type == TABLE_COLUMN_TYPES.name) {
        return {
          minWidth: "200px",
        };
      } else if (
        [TABLE_COLUMN_TYPES.modified, TABLE_COLUMN_TYPES.created].includes(
          column.type
        )
      ) {
        return {
          minWidth: "150px",
        };
      }
      return {};
    };

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
          <div className="tag-content">
            <table>
              {plugin.settings.displayHeaders && (
                <thead>
                  <tr>
                    {tableColumns.map((column: TableColumn) => (
                      <th
                        key={`${tagLevel.tag}-${column.type}`}
                        className={`align-${column.align} col-${column.type}`}
                      >
                        {upperCaseFirstChar(
                          column.type === TABLE_COLUMN_TYPES.frontMatter
                            ? column.data || "-"
                            : column.type
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
              )}
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
                        {tableColumns.map(
                          (column: TableColumn, index: number) => (
                            <td
                              key={`${tagLevel.tag}-${file.file.basename}-${fileIndex}-${index}`}
                              className={`align-${column.align} col-${column.type}`}
                              style={getColStyle(column)}
                            >
                              {column.type === TABLE_COLUMN_TYPES.name &&
                                file.file.basename}
                              {column.type === TABLE_COLUMN_TYPES.modified &&
                                file.formattedModified}
                              {column.type === TABLE_COLUMN_TYPES.created &&
                                file.formattedCreated}
                              {column.type === TABLE_COLUMN_TYPES.size &&
                                file.file.stat.size}
                              {column.type === TABLE_COLUMN_TYPES.frontMatter &&
                                file.frontMatter &&
                                column.data &&
                                file.frontMatter[column.data] !== undefined &&
                                (Array.isArray(file.frontMatter[column.data])
                                  ? file.frontMatter[column.data].join(", ")
                                  : typeof file.frontMatter[column.data] ===
                                    "boolean"
                                  ? file.frontMatter[column.data]
                                    ? "Yes"
                                    : "No"
                                  : typeof file.frontMatter[column.data] ===
                                    "object"
                                  ? ""
                                  : file.frontMatter[column.data])}
                            </td>
                          )
                        )}
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
