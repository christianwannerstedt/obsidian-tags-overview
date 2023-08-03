import * as React from "react";
import { useEffect, useState } from "react";
import Select from "react-select";
import { App, getAllTags, Menu, TFile } from "obsidian";
import * as fs from "fs";
import moment from "moment";

import TagsOverviewPlugin from "../main";
import { RootView } from "./root-view";
import { HeaderSettings } from "../components/header-settings";
import { DISPLAY_TYPE } from "../constants";

function getLastModifiedDate(filepath: string): string {
  const stats = fs.statSync(filepath);
  return moment(stats.mtime).calendar();
}

interface SelectOption {
  value: string;
  label: string;
}

interface TaggedFile {
  file: TFile;
  tags: string[];
  modified?: string;
}

interface FilesByTag {
  [key: string]: TaggedFile[];
}

function openFile(app: App, file: TFile, inNewLeaf = false): void {
  let leaf = app.workspace.getMostRecentLeaf();
  if (leaf) {
    if (inNewLeaf || leaf.getViewState().pinned) {
      leaf = app.workspace.getLeaf("tab");
      // leaf = app.workspace.getLeaf('window');
      // leaf = app.workspace.getLeaf("tab");
    }
    leaf.openFile(file);
  }
}

export const TagsView = ({ rootView }: { rootView: RootView }) => {
  const app: App = rootView.app;
  const plugin: TagsOverviewPlugin = rootView.plugin;

  const [selectedOptions, setSelectedOptions] = useState<SelectOption[]>([]);
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

    menu.showAtMouseEvent(event);
  }

  // Load tags
  const taggedFiles: TaggedFile[] = [];
  let allTags: string[] = [];
  const markdownFiles: TFile[] = app.vault.getMarkdownFiles();

  // Collect all tags and files
  markdownFiles.forEach((markdownFile) => {
    const cache = app.metadataCache.getFileCache(markdownFile);
    const fileTags: string[] = cache ? getAllTags(cache) || [] : [];
    allTags = allTags.concat(fileTags);
    taggedFiles.push({
      file: markdownFile,
      tags: fileTags,
    });
  });

  // Remove duplicates and sort
  allTags = [...new Set(allTags)].sort();

  const options: SelectOption[] = allTags
    .map((tag) => ({
      value: tag,
      label: tag.substring(1),
    }))
    .sort((a: SelectOption, b: SelectOption): number => {
      if (a.label == b.label) return 0;
      return a.label < b.label ? 1 : -1;
    });
  const selectedTags: string[] =
    (selectedOptions &&
      selectedOptions.map((option: SelectOption) => option.value)) ||
    [];

  // Get files to be displayed
  let displayFiles: TaggedFile[] = selectedTags.length
    ? taggedFiles.filter((file: TaggedFile) => {
        return filterAnd
          ? selectedTags.every((selectedTag) => file.tags.includes(selectedTag))
          : file.tags.some((tag) => selectedTags.includes(tag));
      })
    : [...taggedFiles];

  // Curry the files with last modified date
  displayFiles.forEach((file: TaggedFile) => {
    file.modified = getLastModifiedDate(
      `${app.vault.adapter.basePath}/${file.file.path}`
    );
  });

  // Get tags to be displayed
  const tagsTree: FilesByTag = {};
  let displayTags = new Set<string>();
  displayFiles.forEach((taggedFile) => {
    taggedFile.tags.forEach((tag) => {
      displayTags.add(tag);
      tagsTree[tag] = tagsTree[tag] || [];
      tagsTree[tag].push(taggedFile);
    });
  });

  let tagItems: React.ReactElement;
  const displayTagsList: string[] = [...displayTags];

  // Sort tags
  displayTagsList.sort((nameA: string, nameB: string) => {
    const ca: string = nameA.toLowerCase();
    const cb: string = nameB.toLowerCase();

    if (sortTags == "name") {
      return ca > cb ? 1 : -1;
    } else if (sortTags == "-name") {
      return ca < cb ? 1 : -1;
    } else if (sortTags == "frequency") {
      return tagsTree[nameA]?.length < tagsTree[nameB]?.length ? 1 : -1;
    } else if (sortTags == "-frequency") {
      return tagsTree[nameA]?.length < tagsTree[nameB]?.length ? -1 : 1;
    }
    return 0;
  });

  const sortFilesFn = (tFileA: TaggedFile, tFileB: TaggedFile) => {
    const nameA = tFileA.file.basename.toLowerCase();
    const nameB = tFileB.file.basename.toLowerCase();

    if (sortFiles == "name") {
      return nameA > nameB ? 1 : -1;
    } else if (sortFiles == "-name") {
      return nameA < nameB ? 1 : -1;
    } else if (tFileA.modified && tFileB.modified) {
      if (sortFiles == "modified") {
        return tFileA.modified < tFileB.modified ? 1 : -1;
      } else if (sortFiles == "-modified") {
        return tFileA.modified < tFileB.modified ? -1 : 1;
      }
    }
    return 0;
  };

  if (displayType == DISPLAY_TYPE.compact) {
    tagItems = (
      <>
        {displayTagsList.map((tag) => {
          return (
            <div key={tag}>
              <div className="tag-title-row">
                <h3 className="tag-title">{tag.substring(1)}</h3>
                <span>({tagsTree[tag].length})</span>
              </div>
              <div>
                {tagsTree[tag].map((file: TaggedFile) => {
                  return (
                    <span
                      key={file.file.basename}
                      onClick={(event) =>
                        openFile(app, file.file, event.ctrlKey || event.metaKey)
                      }
                      className="file-link"
                    >
                      {file.file.basename}
                    </span>
                  );
                })}
              </div>
            </div>
          );
        })}
      </>
    );
  } else {
    tagItems = (
      <table className="tags-overview-table">
        {displayTagsList.map((tag) => {
          return (
            <React.Fragment key={tag}>
              <thead>
                <tr>
                  <th colSpan={2}>
                    <div className="table-tag-title-row">
                      <h3 className="tag-title">{tag.substring(1)}</h3>
                      <span>{tagsTree[tag].length} files</span>
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {tagsTree[tag].sort(sortFilesFn).map((file) => {
                  return (
                    <tr key={`${tag}-${file.file.basename}`}>
                      <td>
                        <span
                          key={file.file.basename}
                          onClick={(event) =>
                            openFile(
                              app,
                              file.file,
                              event.ctrlKey || event.metaKey
                            )
                          }
                          className="file-link"
                        >
                          {file.file.basename}
                        </span>
                      </td>
                      <td className="last-modified">{file.modified}</td>
                    </tr>
                  );
                })}
              </tbody>
            </React.Fragment>
          );
        })}
      </table>
    );
  }

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
        className="tags-filter"
        value={selectedOptions}
        onChange={(val: SelectOption[]) => setSelectedOptions(val)}
        options={options}
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
      <div className="table-info-container">
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
