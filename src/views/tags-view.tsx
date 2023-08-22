import * as fs from "fs";
import * as React from "react";
import { MouseEvent } from "react";
import { useEffect, useState } from "react";
import Select from "react-select";
import { App, FileSystemAdapter, Menu, TFile } from "obsidian";

import TagsOverviewPlugin from "../main";
import { RootView } from "./root-view";
import { HeaderSettings } from "../components/header-settings";
import { Tags } from "../components/tags";
import {
  DISPLAY_TYPE,
  SORT_FILES_OPTIONS,
  SORT_TAGS_OPTIONS,
} from "../constants";
import {
  getAllTagsAndFiles,
  formatDate,
  formatCalendardDate,
  openFile,
  pluralize,
  setMaxDatesForTags,
  sortTagsAndFiles,
} from "src/utils";
import {
  ContextMenuOption,
  FilesByTag,
  SelectOption,
  TagData,
  TaggedFile,
} from "src/types";
import { ICON_TYPE, Icon } from "src/components/icon";

export const TagsView = ({ rootView }: { rootView: RootView }) => {
  const app: App = rootView.app;
  const plugin: TagsOverviewPlugin = rootView.plugin;

  // Setup hooks
  const defaultOptions: SelectOption[] =
    plugin.settings.keepFilters && plugin.settings.storedFilters
      ? plugin.settings.storedFilters.split(",").map((tag: string) => ({
          value: tag,
          label: tag,
        }))
      : [];
  const [selectedOptions, setSelectedOptions] =
    useState<SelectOption[]>(defaultOptions);
  const [filterAnd, setFilterAnd] = useState(plugin.settings.filterAnd);
  const [displayType, setDisplayType] = useState(plugin.settings.displayType);
  const [sortTags, setSortTags] = useState(plugin.settings.sortTags);
  const [sortFiles, setSortFiles] = useState(plugin.settings.sortFiles);
  const [showNested, setShowNested] = useState(true);
  const [showCollapseAll, setShowCollapseAll] = useState(true);
  const [showRelatedTags, setShowRelatedTags] = useState(
    plugin.settings.showRelatedTags
  );
  const [collapsedTags, setCollapsedTags] = useState<string[]>([]);

  useEffect(() => {
    plugin.saveSettings({
      filterAnd,
      displayType,
      sortTags,
      sortFiles,
      showRelatedTags,
    });
  }, [filterAnd, displayType, sortTags, sortFiles, showRelatedTags]);

  useEffect(() => {
    plugin.saveSettings({
      storedFilters: selectedOptions.map((option) => option.value).join(","),
    });
  }, [selectedOptions]);

  const collapseAll = () => {
    const { allTags }: { allTags: string[] } = getAllTagsAndFiles(app);
    const nestedTags = new Set<string>();
    allTags.forEach((tag: string) => {
      const parts: string[] = tag.split("/");
      for (let i = 1; i <= parts.length; i++) {
        nestedTags.add(parts.slice(0, i).join("/"));
      }
    });
    setCollapsedTags([...nestedTags]);
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

    SORT_FILES_OPTIONS.forEach((menuItem: ContextMenuOption) => {
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

  const onFileClicked: Function = (file: TFile, inNewLeaf: boolean = false) => {
    openFile(app, file, inNewLeaf);
  };

  // Collect all tags and files
  const {
    allTags,
    allTaggedFiles,
  }: { allTags: string[]; allTaggedFiles: TaggedFile[] } =
    getAllTagsAndFiles(app);

  const hasAnySub: boolean = !!allTags.find((tag: string) => tag.includes("/"));

  const selectedTags: string[] =
    (selectedOptions &&
      selectedOptions.map((option: SelectOption) => option.value)) ||
    [];

  // Get files to be displayed
  let displayFiles: TaggedFile[] = selectedTags.length
    ? allTaggedFiles.filter((file: TaggedFile) => {
        return filterAnd
          ? selectedTags.every((selectedTag) => file.tags.includes(selectedTag))
          : file.tags.some((tag) => selectedTags.includes(tag));
      })
    : [...allTaggedFiles];

  // Curry the files with last modified date
  const basePath: string =
    app.vault.adapter instanceof FileSystemAdapter
      ? app.vault.adapter.getBasePath()
      : "";

  const getFormattedDate = (date: Date): string => {
    return plugin.settings.showCalendarDates
      ? formatCalendardDate(date, plugin.settings.dateFormat)
      : formatDate(date, plugin.settings.dateFormat);
  };

  displayFiles.forEach((file: TaggedFile) => {
    const filepath = `${basePath}/${file.file.path}`;
    const stats = fs.statSync(filepath);
    file.modifiedDate = stats.mtime;
    file.createdDate = stats.birthtime;
    file.modified = getFormattedDate(file.modifiedDate);
    file.created = getFormattedDate(file.createdDate);
  });

  // Get tags to be displayed
  const tagsTree: FilesByTag = {};
  let displayTags = new Set<string>();

  // Include related tags
  displayFiles.forEach((taggedFile: TaggedFile) => {
    let tags: string[] = taggedFile.tags;
    if (!showRelatedTags) {
      tags = tags.filter(
        (tag: string) => !selectedTags.length || selectedTags.contains(tag)
      );
    }
    tags.forEach((tag) => {
      displayTags.add(tag);
      tagsTree[tag] = tagsTree[tag] || [];
      tagsTree[tag].push(taggedFile);
    });
  });

  // Construct the tree of nested tags
  const nestedTags: TagData[] = [];
  let tagsCount = 0;
  [...displayTags].forEach((tag: string) => {
    let activePart: TagData[] = nestedTags;
    let tagPaths: string[] = [];
    let filesCount = 0;
    // Split the tag into nested ones, if the setting is enabled
    (showNested ? tag.split("/") : [tag]).forEach((part: string) => {
      tagPaths.push(part);
      let checkPart: TagData | undefined = activePart.find(
        (c: TagData) => c.tag == part
      );
      if (!checkPart) {
        tagsCount += 1;
        checkPart = {
          tag: part,
          tagPath: tagPaths.join("/"),
          sub: [],
          files: tagsTree[tagPaths.join("/")] || [],
          subFilesCount: 0,
        };
        filesCount += (tagsTree[tagPaths.join("/")] || []).length;
        activePart.push(checkPart);
      }
      activePart = checkPart.sub;
    });
  });

  const sumUpNestedFilesCount: Function = (tags: TagData[]) => {
    tags.forEach((tagData: TagData) => {
      if (tagData.sub.length) {
        tagData.subFilesCount = tagData.sub.reduce(
          (count: number, sub: TagData) => {
            return (
              count +
              Object.keys(tagsTree)
                .filter((tag) => {
                  return tag.includes(sub.tag) && tag !== sub.tag;
                })
                .reduce((subCount: number, tag: string) => {
                  return subCount + tagsTree[tag].length;
                }, 0)
            );
          },
          0
        );
        sumUpNestedFilesCount(tagData.sub);
      }
    });
  };

  // Sort and curry the tags
  sumUpNestedFilesCount(nestedTags);
  setMaxDatesForTags(nestedTags);
  sortTagsAndFiles(nestedTags, sortTags, sortFiles);

  return (
    <div>
      <HeaderSettings
        title="Filter"
        value={filterAnd}
        setFunction={setFilterAnd}
        settings={[
          { label: "AND", value: true },
          { label: "OR", value: false },
        ]}
      />
      <Select
        className="tags-filter-select"
        value={selectedOptions}
        onChange={(val: SelectOption[]) => {
          setSelectedOptions(val);
        }}
        options={allTags
          .map((tag: string) => ({
            value: tag,
            label: tag,
          }))
          .sort((optionA: SelectOption, optionB: SelectOption): number => {
            const lblA: string = optionA.label.toLowerCase();
            const lblB: string = optionB.label.toLowerCase();
            return lblA === lblB ? 0 : lblA > lblB ? 1 : -1;
          })}
        name="Filter"
        placeholder="Select tags..."
        isMulti
      />

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
            displayFiles.length,
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
            disabled={!selectedOptions.length}
          />
          <Icon
            className="sort-icon"
            iconType={ICON_TYPE.sort}
            label="Change sort order"
            onClick={(e: MouseEvent) => showContextMenu(e)}
          />
          {hasAnySub && (
            <Icon
              className="nested-icon"
              iconType={ICON_TYPE.nested}
              label="Show nested tags"
              onClick={(e: MouseEvent) => setShowNested(!showNested)}
              active={showNested}
            />
          )}

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

      <Tags
        tags={nestedTags}
        onFileClick={onFileClicked}
        displayType={displayType}
        collapsedTags={collapsedTags}
        setCollapsedTags={setCollapsedTags}
        onTagClick={(tagData: TagData) => {
          setSelectedOptions(
            selectedOptions.find((option) => option.value === tagData.tagPath)
              ? selectedOptions.filter(
                  (option) => option.value !== tagData.tagPath
                )
              : [
                  ...selectedOptions,
                  {
                    label: tagData.tagPath,
                    value: tagData.tagPath,
                  },
                ]
          );
        }}
      />
    </div>
  );
};
