import * as React from "react";
import { MouseEvent } from "react";
import { useEffect, useState } from "react";
import Select from "react-select";
import { App, FileSystemAdapter, getAllTags, Menu, TFile } from "obsidian";

import TagsOverviewPlugin from "../main";
import { RootView } from "./root-view";
import { HeaderSettings } from "../components/header-settings";
import { DISPLAY_TYPE, SORT_FILES, SORT_TAGS } from "../constants";
import { getLastModifiedDate } from "src/utils";
import { FilesByTag, SelectOption, TaggedFile } from "src/types";

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

  // Load tags
  const allTaggedFiles: TaggedFile[] = [];
  let allTags: string[] = [];
  const markdownFiles: TFile[] = app.vault.getMarkdownFiles();

  // Collect all tags and files
  markdownFiles.forEach((markdownFile) => {
    const cache = app.metadataCache.getFileCache(markdownFile);
    const fileTags: string[] = cache
      ? getAllTags(cache)?.map((tag) => tag.substring(1)) || []
      : [];
    allTags = allTags.concat(fileTags);
    allTaggedFiles.push({
      file: markdownFile,
      tags: fileTags,
    });
  });

  // Remove duplicates and sort
  allTags = [...new Set(allTags)].sort();

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
    let tags = taggedFile.tags;
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

  const displayTagsList: string[] = [...displayTags];

  // Sort tags
  displayTagsList.sort((nameA: string, nameB: string) => {
    const ca: string = nameA.toLowerCase();
    const cb: string = nameB.toLowerCase();

    if (sortTags == SORT_TAGS.nameAsc) {
      return ca > cb ? 1 : -1;
    } else if (sortTags == SORT_TAGS.nameDesc) {
      return ca < cb ? 1 : -1;
    } else if (sortTags == SORT_TAGS.frequencyAsc) {
      return tagsTree[nameA]?.length < tagsTree[nameB]?.length ? 1 : -1;
    } else if (sortTags == SORT_TAGS.frequencyDesc) {
      return tagsTree[nameA]?.length < tagsTree[nameB]?.length ? -1 : 1;
    }
    return 0;
  });

  const sortFilesFn = (tFileA: TaggedFile, tFileB: TaggedFile) => {
    const nameA = tFileA.file.basename.toLowerCase();
    const nameB = tFileB.file.basename.toLowerCase();

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

  const tagItems: React.ReactElement =
    displayType == DISPLAY_TYPE.compact ? (
      <>
        {displayTagsList.map((tag) => (
          <div key={tag}>
            <div className="tag-title-row">
              <h3 className="tag-title">{tag}</h3>
              <span>({tagsTree[tag].length})</span>
            </div>
            <div>
              {tagsTree[tag].map((file: TaggedFile) => (
                <span
                  key={file.file.basename}
                  onClick={(event) =>
                    openFile(app, file.file, event.ctrlKey || event.metaKey)
                  }
                  className="file-link"
                >
                  {file.file.basename}
                </span>
              ))}
            </div>
          </div>
        ))}
      </>
    ) : (
      <table className="tags-overview-table">
        {displayTagsList.map((tag) => (
          <React.Fragment key={tag}>
            <thead>
              <tr>
                <th colSpan={2}>
                  <div className="table-tag-title-row">
                    <h3 className="tag-title">{tag}</h3>
                    <span>{tagsTree[tag].length} files</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {tagsTree[tag].sort(sortFilesFn).map((file) => (
                <tr
                  key={`${tag}-${file.file.basename}`}
                  onClick={(event) =>
                    openFile(app, file.file, event.ctrlKey || event.metaKey)
                  }
                >
                  <td>
                    <span className="file-link">{file.file.basename}</span>
                  </td>
                  <td className="last-modified">{file.modified}</td>
                </tr>
              ))}
            </tbody>
          </React.Fragment>
        ))}
      </table>
    );

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
          {`Displaying ${displayTags.size} tags (${displayFiles.length} files)`}
        </i>
        <div
          className="clickable-icon nav-action-button"
          aria-label="Change sort order"
          onClick={(e) => showContextMenu(e)}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="svg-icon"
          >
            <path d="M11 11h4"></path>
            <path d="M11 15h7"></path>
            <path d="M11 19h10"></path>
            <path d="M9 7 6 4 3 7"></path>
            <path d="M6 6v14"></path>
          </svg>
        </div>
      </div>

      <div className={`display-type-${displayType}`}>{tagItems}</div>
    </div>
  );
};
