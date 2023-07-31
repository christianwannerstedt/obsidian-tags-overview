import React, { useState } from "react";

import { useApp } from "./hooks";
import { App, getAllTags, Notice, TFile, TFolder } from "obsidian";
import Select from "react-select";
import { HeaderSettings } from "./components/header-settings";
import { Icon } from "./icon";

import fs from "fs";
import moment from "moment";

function uniqueArray(array: any[]) {
  return [...new Set(array)];
}

function getLastModifiedDate(vault, filepath) {
  console.log(vault.adapter.basePath + "/" + filepath);
  const stats = fs.statSync(vault.adapter.basePath + "/" + filepath);
  // return stats.mtime;
  return moment(stats.mtime).calendar();
}

interface FilePath {
  path: string;
  basename: string;
}

function openFile(app, file: FilePath, inNewLeaf = false): void {
  const targetFile = app.vault.getFiles().find((f) => f.path === file.path);

  if (!targetFile) {
    new Notice("File not found");
    return;
  }

  let leaf = app.workspace.getMostRecentLeaf();
  if (inNewLeaf || leaf.getViewState().pinned) {
    leaf = app.workspace.getLeaf("split");
    //   leaf = app.workspace.getLeaf('window');
  } else {
    leaf = app.workspace.getLeaf("tab");
  }
  leaf.openFile(targetFile);
}

export const ReactView = ({ app, vault }) => {
  const [selectedOption, setSelectedOption] = useState(null);
  const [filterAnd, setFilterAnd] = useState(true);
  const [displayType, setDisplayType] = useState("compact");

  // Load tags
  const files = [];
  const tagFiles = {};
  let allTags: string[] = [];
  let markdownFiles = app.vault.getMarkdownFiles();

  markdownFiles.forEach((markdownFile) => {
    const cache = app.metadataCache.getFileCache(markdownFile);
    const fileTags: string[] = getAllTags(cache) || [];

    allTags = allTags.concat(fileTags);
    fileTags.forEach((fileTag) => {
      tagFiles[fileTag] = tagFiles[fileTag] || [];
      tagFiles[fileTag].push(markdownFile);
    });
    files.push({
      file: markdownFile,
      tags: fileTags,
    });
  });

  allTags = uniqueArray(allTags).sort();

  console.log("tagFiles", tagFiles);

  const options = allTags.map((tag) => ({
    value: tag,
    label: tag.substring(1),
  }));
  const selectedTags =
    (selectedOption && selectedOption.map((option) => option.value)) || [];

  let displayFiles = [];

  if (filterAnd) {
    displayFiles = files.filter((file) => {
      return (
        !selectedTags.length ||
        selectedTags.every((selectedTag) => file.tags.includes(selectedTag))
      );
    });
  } else {
    displayFiles = files.filter((file) => {
      return (
        !selectedTags.length ||
        file.tags.some((tag) => selectedTags.includes(tag))
      );
    });
  }

  const tagsTree = {};
  let displayTags = new Set();
  displayFiles.forEach((fileObj) => {
    console.log("fileObj", fileObj);
    fileObj.tags.forEach((tag) => {
      displayTags.add(tag);
      tagsTree[tag] = tagsTree[tag] || [];
      tagsTree[tag].push(fileObj.file);
    });
  });

  let tagItems: JSX.Element[];

  if (displayType == "compact") {
    tagItems = [...displayTags].map((tag) => {
      return (
        <div key={tag}>
          <h3 className="tag-title">{tag.substring(1)}</h3>
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
    });
  } else {
    tagItems = (
      <table className="tags-overview-table">
        {/*<thead>
          <tr>
            <th>Title</th>
            <th>...</th>
          </tr>
        </thead>*/}
        {[...displayTags].map((tag) => {
          return (
            <>
              <thead>
                <tr>
                  <th colspan="2">
                    <h3 className="tag-title">{tag.substring(1)}</h3>
                  </th>
                </tr>
              </thead>
              <tbody>
                {tagsTree[tag].map((file) => {
                  return (
                    <tr>
                      <td>{file.basename}</td>
                      <td>{getLastModifiedDate(vault, file.path)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </>
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
        value={selectedOption}
        onChange={setSelectedOption}
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
      {tagItems}
    </div>
  );
};
