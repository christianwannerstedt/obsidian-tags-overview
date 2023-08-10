import * as React from "react";
import { MouseEvent } from "react";
import { useEffect, useState } from "react";
import Select from "react-select";
import { App, FileSystemAdapter, getAllTags, Menu, TFile } from "obsidian";

import TagsOverviewPlugin from "../main";
import { RootView } from "./root-view";
import { HeaderSettings } from "../components/header-settings";
import { Tags } from "../components/tags";
import { DISPLAY_TYPE, SORT_FILES, SORT_TAGS } from "../constants";
import { getLastModifiedDate, pluralize } from "src/utils";
import { FilesByTag, SelectOption, TagData, TaggedFile } from "src/types";
import { ICON_TYPE, Icon } from "src/components/icon";

function openFile(app: App, file: TFile, inNewLeaf = false): void {
  let leaf = app.workspace.getMostRecentLeaf();
  if (leaf) {
    if (inNewLeaf || leaf.getViewState().pinned) {
      leaf = app.workspace.getLeaf("tab");
    }
    leaf.openFile(file);
  }
}

export const TagsView = ({ rootView }: { rootView: RootView }) => {
  const app: App = rootView.app;
  const plugin: TagsOverviewPlugin = rootView.plugin;

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

  useEffect(() => {
    plugin.saveSettings({
      filterAnd,
      displayType,
      sortTags,
      sortFiles,
    });
  }, [filterAnd, displayType, sortTags, sortFiles]);

  useEffect(() => {
    plugin.saveSettings({
      storedFilters: selectedOptions.map((option) => option.value).join(","),
    });
  }, [selectedOptions]);

  function showContextMenu(event: MouseEvent) {
    const menu = new Menu();

    [
      { title: "Sort tags on name (A to Z)", key: "name" },
      { title: "Sort tags on name (Z to A)", key: "-name" },
      { title: "Sort tags on frequency (high to low)", key: "frequency" },
      { title: "Sort tags on frequency (low to high)", key: "-frequency" },
    ].forEach((menuItem) => {
      menu.addItem((item) =>
        item
          .setTitle(menuItem.title)
          .setChecked(plugin.settings.sortTags == menuItem.key)
          .onClick(() => {
            setSortTags(menuItem.key);
          })
      );
    });

    menu.addSeparator();

    [
      { title: "Sort files on name (A to Z)", key: "name" },
      { title: "Sort files on name (Z to A)", key: "-name" },
      { title: "Sort files on last modified (new to old)", key: "modified" },
      { title: "Sort files on last modified (old to new)", key: "-modified" },
    ].forEach((menuItem) => {
      menu.addItem((item) =>
        item
          .setTitle(menuItem.title)
          .setChecked(plugin.settings.sortFiles == menuItem.key)
          .onClick(() => {
            setSortFiles(menuItem.key);
          })
      );
    });

    menu.showAtMouseEvent(event.nativeEvent);
  }

  const onFileClicked: Function = (file: TFile, inNewLeaf: boolean = false) => {
    openFile(app, file, inNewLeaf);
  };

  // Collect all tags and files
  const allTaggedFiles: TaggedFile[] = [];
  let allTags: string[] = [];
  app.vault.getMarkdownFiles().forEach((markdownFile) => {
    const cache = app.metadataCache.getFileCache(markdownFile);
    const fileTags: string[] = cache
      ? getAllTags(cache)?.map((tag) => tag.substring(1)) || []
      : [];
    allTags = allTags.concat(fileTags);
    if (fileTags.length) {
      allTaggedFiles.push({
        file: markdownFile,
        tags: fileTags,
      });
    }
  });

  // Remove duplicates and sort
  allTags = [...new Set(allTags)].sort();

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

  displayFiles.forEach((file: TaggedFile) => {
    file.modified = basePath
      ? getLastModifiedDate(`${basePath}/${file.file.path}`)
      : "";
  });

  // Get tags to be displayed
  const tagsTree: FilesByTag = {};
  let displayTags = new Set<string>();

  // Include related tags
  displayFiles.forEach((taggedFile: TaggedFile) => {
    let tags: string[] = taggedFile.tags;
    if (!plugin.settings.showRelatedTags) {
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

  // Sum up file counts
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
  sumUpNestedFilesCount(nestedTags);

  // Sort tags and file
  const sortFilesFn = (tFileA: TaggedFile, tFileB: TaggedFile) => {
    const nameA: string = tFileA.file.basename.toLowerCase();
    const nameB: string = tFileB.file.basename.toLowerCase();

    if (sortFiles == SORT_FILES.nameAsc) {
      return nameA > nameB ? 1 : -1;
    } else if (sortFiles == SORT_FILES.nameDesc) {
      return nameA < nameB ? 1 : -1;
    } else if (tFileA.modified && tFileB.modified) {
      if (sortFiles == SORT_FILES.modifiedAsc) {
        return tFileA.modified < tFileB.modified ? 1 : -1;
      } else if (sortFiles == SORT_FILES.modifiedDesc) {
        return tFileA.modified < tFileB.modified ? -1 : 1;
      }
    }
    return 0;
  };
  const sortTagsFn = (tagA: TagData, tagB: TagData) => {
    const nameA: string = tagA.tag.toLowerCase();
    const nameB: string = tagB.tag.toLowerCase();

    if (sortTags == SORT_TAGS.nameAsc) {
      return nameA > nameB ? 1 : -1;
    } else if (sortTags == SORT_TAGS.nameDesc) {
      return nameA < nameB ? 1 : -1;
    } else if (sortTags == SORT_TAGS.frequencyAsc) {
      return tagA.files.length < tagB.files.length ? 1 : -1;
    } else if (sortTags == SORT_TAGS.frequencyDesc) {
      return tagA.files.length < tagB.files.length ? -1 : 1;
    }
    return 0;
  };
  const sortNestedTags = (tags: TagData[]) => {
    tags.sort(sortTagsFn);
    tags.forEach((tagData: TagData) => {
      tagData.files.sort(sortFilesFn);
      if (tagData.sub.length) {
        sortNestedTags(tagData.sub);
      }
    });
  };
  sortNestedTags(nestedTags);

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
        onChange={(val: SelectOption[]) => setSelectedOptions(val)}
        options={allTags
          .map((tag: string) => ({
            value: tag,
            label: tag,
          }))
          .sort((optionA: SelectOption, optionB: SelectOption): number =>
            optionA.label == optionB.label
              ? 0
              : optionA.label < optionB.label
              ? 1
              : -1
          )}
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
          {`Displaying ${pluralize(tagsCount, "tag", "tags")} (${pluralize(
            displayFiles.length,
            "file",
            "files"
          )})`}
        </i>

        <div className="icons">
          {hasAnySub && (
            <Icon
              className="nested-icon"
              iconType={ICON_TYPE.nested}
              label="Show nested tags"
              onClick={(e: MouseEvent) => setShowNested(!showNested)}
              active={showNested}
            />
          )}
          <Icon
            className="sort-icon"
            iconType={ICON_TYPE.sort}
            label="Change sort order"
            onClick={(e: MouseEvent) => showContextMenu(e)}
          />
        </div>
      </div>

      <Tags
        tags={nestedTags}
        onFileClick={onFileClicked}
        displayType={displayType}
      />
    </div>
  );
};
