import * as React from "react";
import { useEffect, useState } from "react";
import Select from "react-select";
import { App, getAllTags, Menu, Notice, TFile } from "obsidian";

import TagsOverviewPlugin, { TagsOverviewPluginSettings } from "../main";
import { HeaderSettings } from "../components/header-settings";

import * as fs from "fs";
import moment from "moment";
import { RootView } from "./root-view";

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
}

interface FilesByTag {
  [key: string]: TFile[];
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
  console.log("App init!", app, plugin);

  const [selectedOptions, setSelectedOptions] = useState([]);
  const [filterAnd, setFilterAnd] = useState(plugin.settings.filterAnd);
  const [displayType, setDisplayType] = useState(plugin.settings.displayType);
  const [sortTags, setSortTags] = useState(plugin.settings.sortTags);
  const [sortFiles, setSortFiles] = useState(plugin.settings.sortFiles);

  useEffect(() => {
    console.log("Update setting to: ", filterAnd);
    // plugin.settings.filterAnd = filterAnd;
    plugin.saveSettings({
      filterAnd,
      displayType,
    });
  });

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
            plugin.saveSettings({ sortTags: menuItem.key });
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
            plugin.saveSettings({ sortFiles: menuItem.key });
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
    ? taggedFiles.filter((file) => {
        return filterAnd
          ? selectedTags.every((selectedTag) => file.tags.includes(selectedTag))
          : file.tags.some((tag) => selectedTags.includes(tag));
      })
    : [...taggedFiles];

  // Get tags to be displayed
  const tagsTree: FilesByTag = {};
  let displayTags = new Set<string>();
  displayFiles.forEach((taggedFile) => {
    taggedFile.tags.forEach((tag) => {
      displayTags.add(tag);
      tagsTree[tag] = tagsTree[tag] || [];
      tagsTree[tag].push(taggedFile.file);
    });
  });

  // let tagItems: JSX.Element[];
  let tagItems: React.ReactElement;
  const displayTagsList: string[] = [...displayTags];

  // Sort tags
  displayTagsList.sort((a, b) => {
    console.log("SORT", sortTags, a, b);
    const ca = a.toLowerCase();
    const cb = b.toLowerCase();

    if (sortTags == "name") {
      return ca > cb ? 1 : -1;
    } else if (sortTags == "-name") {
      return ca < cb ? 1 : -1;
    } else {
      return ca < cb ? 1 : -1;
    }
  });

  if (displayType == "compact") {
    tagItems = (
      <>
        {displayTagsList.map((tag) => {
          return (
            <div key={tag}>
              <h3 className="tag-title">
                {tag.substring(1)}-{tagsTree[tag].length}
              </h3>
              <div>
                {tagsTree[tag].map((file) => {
                  return (
                    <span
                      key={file.basename}
                      onClick={(event) =>
                        openFile(app, file, event.ctrlKey || event.metaKey)
                      }
                      className="file-link"
                    >
                      {file.basename}
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
                    <h3 className="tag-title">
                      {tag.substring(1)} - {tagsTree[tag].length}
                    </h3>
                  </th>
                </tr>
              </thead>
              <tbody>
                {tagsTree[tag].map((file) => {
                  return (
                    <tr key={`${tag}-${file.basename}`}>
                      <td>{file.basename}</td>
                      <td className="last-modified">
                        {getLastModifiedDate(
                          `${app.vault.adapter.basePath}/${file.path}`
                        )}
                      </td>
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

  console.log("RENDER");

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
        onChange={setSelectedOptions}
        options={options}
        name="Testing"
        isMulti
        // styles={{
        //   input: (baseStyles, state) => ({
        //     ...baseStyles,
        //     borderColor: state.isFocused ? 'grey' : 'red',
        //   }),
        // }}
      />

      <HeaderSettings
        title="Tags"
        value={displayType}
        setFunction={setDisplayType}
        settings={[
          { label: "Compact", value: "compact" },
          { label: "List", value: "list" },
        ]}
      />
      <i className="count-label">
        {`Displaying ${displayTags.size} tags (${displayFiles.length} files)`}
      </i>
      <button onClick={(e) => showContextMenu(e, this)}>TEST</button>
      {tagItems}
    </div>
  );
};
