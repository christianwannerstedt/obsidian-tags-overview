import * as React from "react";
import { useEffect, useState, MouseEvent } from "react";

import { ContextMenuOption, TagData } from "../types";
import { TagsList } from "./tags-list";
import { TagsTable } from "./tags-table";
import {
  DISPLAY_TYPE,
  SORT_FILES_OPTIONS,
  SORT_TAGS_OPTIONS,
} from "../constants";
import { pluralize, sortTagsAndFiles } from "src/utils";
import TagsOverviewPlugin from "src/main";
import { ICON_TYPE, Icon } from "./icon";
import { HeaderSettings } from "./header-settings";
import { Menu, TFile } from "obsidian";
import { DEFAULT_SETTINGS } from "src/settings";

export const Tags = ({
  plugin,
  tags,
  onFileClick,
  hasFilters,
  showNested,
  setShowNested,
  showRelatedTags,
  setShowRelatedTags,
  tagsCount,
  filesCount,
  onTagClick,
}: {
  plugin: TagsOverviewPlugin;
  tags: TagData[];
  onFileClick: (file: TFile, inNewLeaf: boolean) => void;
  hasFilters: boolean;
  showNested: boolean;
  setShowNested: (arg0: boolean) => void;
  showRelatedTags: boolean;
  setShowRelatedTags: (arg0: boolean) => void;
  tagsCount: number;
  filesCount: number;
  onTagClick: (tagData: TagData) => void;
}) => {
  const [showCollapseAll, setShowCollapseAll] = useState(true);
  const [displayType, setDisplayType] = useState(plugin.settings.displayType);
  const [sortTags, setSortTags] = useState(plugin.settings.sortTags);
  const [sortFiles, setSortFiles] = useState(plugin.settings.sortFiles);
  const [collapsedTags, setCollapsedTags] = useState<string[]>([]);

  const props = {
    tags,
    onFileClick,
    collapsedTags,
    setCollapsedTags,
    onTagClick,
  };

  useEffect(() => {
    plugin.saveSettings({
      sortTags,
      sortFiles,
    });
  }, [sortTags, sortFiles]);

  const collectTags = (tags: TagData[]): string[] => {
    const nestedTags: string[] = [];
    tags.forEach((tag: TagData) => {
      if (showNested) {
        nestedTags.push(tag.tagPath);
        const subTags: string[] = collectTags(tag.sub);
        subTags.forEach((subTag: string) => {
          nestedTags.push(subTag);
        });
      } else {
        const parts: string[] = tag.tag.split("/");
        for (let i = 1; i <= parts.length; i++) {
          nestedTags.push(parts.slice(0, i).join("/"));
        }
      }
    });
    return nestedTags;
  };

  const collapseAll = () => {
    setCollapsedTags(collectTags(tags));
    setShowCollapseAll(false);
  };
  const expandAll = () => {
    setCollapsedTags([]);
    setShowCollapseAll(true);
  };

  const showContextMenu = (event: MouseEvent) => {
    const menu = new Menu();

    SORT_TAGS_OPTIONS.forEach((menuItem: ContextMenuOption) => {
      menu.addItem((item) =>
        item
          .setTitle(`Sort tags on ${menuItem.label}`)
          .setChecked(plugin.settings.sortTags == menuItem.key)
          .onClick(() => {
            setSortTags(menuItem.key);
          })
      );
    });

    menu.addSeparator();

    // Construct options for sorting files.
    // If the user has added additional property columns, add those to the list.
    const tableColumns = plugin.settings.tableColumns.length
      ? plugin.settings.tableColumns
      : DEFAULT_SETTINGS.tableColumns;
    const additionalProperties: string[] = tableColumns
      .filter((column) => column.type === "frontMatter" && column.data)
      .map((column): string => column.data || "");
    [
      ...SORT_FILES_OPTIONS,
      ...additionalProperties.reduce(
        (acc: ContextMenuOption[], property: string) => {
          acc.push({
            key: `property__${property}`,
            label: `property: ${property} (ascending)`,
          });
          acc.push({
            key: `-property__${property}`,
            label: `property: ${property} (descending)`,
          });
          return acc;
        },
        []
      ),
    ].forEach((menuItem: ContextMenuOption) => {
      menu.addItem((item) =>
        item
          .setTitle(`Sort files on ${menuItem.label}`)
          .setChecked(plugin.settings.sortFiles == menuItem.key)
          .onClick(() => {
            setSortFiles(menuItem.key);
          })
      );
    });

    menu.showAtMouseEvent(event.nativeEvent);
  };

  // Sort the tags
  sortTagsAndFiles(tags, sortTags, sortFiles);

  const hasAnySub: boolean = !!tags.find(
    (tag: TagData) => tag.sub.length || tag.tag.includes("/")
  );

  return (
    <>
      <HeaderSettings
        title="Tags"
        value={displayType}
        setFunction={setDisplayType}
        settings={[
          { label: "Compact", value: DISPLAY_TYPE.compact },
          { label: "List", value: DISPLAY_TYPE.list },
        ]}
      />
      <div className="tags-info-container">
        <i className="count-label">
          {`Showing ${pluralize(tagsCount, "tag", "tags")} (${pluralize(
            filesCount,
            "file",
            "files"
          )})`}
        </i>

        <div className="icons">
          <Icon
            className="sort-icon"
            iconType={ICON_TYPE.tags}
            label="Show related tags"
            onClick={() => setShowRelatedTags(!showRelatedTags)}
            active={showRelatedTags}
            disabled={!hasFilters}
          />
          <Icon
            className="sort-icon"
            iconType={ICON_TYPE.sort}
            label="Change sort order"
            onClick={(e: MouseEvent) => showContextMenu(e)}
          />
          <Icon
            className="nested-icon"
            iconType={ICON_TYPE.nested}
            label="Show nested tags"
            onClick={() => setShowNested(!showNested)}
            active={hasAnySub && showNested}
            disabled={!hasAnySub}
          />
          {showCollapseAll && (
            <Icon
              className="collapse-all-icon"
              iconType={ICON_TYPE.collapse}
              label="Collapse all"
              onClick={() => collapseAll()}
            />
          )}
          {!showCollapseAll && (
            <Icon
              className="expand-all-icon"
              iconType={ICON_TYPE.expand}
              label="Expand all"
              onClick={() => expandAll()}
            />
          )}
        </div>
      </div>

      <div className={`tags-container display-type-${displayType}`}>
        {displayType === DISPLAY_TYPE.compact ? (
          <TagsList {...props} />
        ) : (
          <TagsTable plugin={plugin} {...props} />
        )}
      </div>
    </>
  );
};
