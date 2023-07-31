import * as React from "react";
import { useState } from "react";
import Select from "react-select";
import { App, getAllTags, TFile } from "obsidian";

import { useApp } from "./hooks";
import { HeaderSettings } from "./components/header-settings";

import * as fs from "fs";
import moment from "moment";

function getLastModifiedDate(filepath: string): string {
  const stats = fs.statSync(filepath);
  return moment(stats.mtime).calendar();
}

interface FilePath {
  path: string;
  basename: string;
}

interface TaggedFile {
  file: TFile;
  tags: string[];
}

function openFile(app: App, file: TFile, inNewLeaf = false): void {
  let leaf = app.workspace.getMostRecentLeaf();
  if (inNewLeaf || leaf.getViewState().pinned) {
    leaf = app.workspace.getLeaf("tab");
    // leaf = app.workspace.getLeaf('window');
    // leaf = app.workspace.getLeaf("tab");
  }
  leaf.openFile(file);
}

export const ReactView = () => {
  const app = useApp();

  const [selectedOption, setSelectedOption] = useState(null);
  const [filterAnd, setFilterAnd] = useState(true);
  const [displayType, setDisplayType] = useState("compact");

  // Load tags
  const taggedFiles: TaggedFile[] = [];
  let allTags: string[] = [];
  const markdownFiles: TFile[] = app.vault.getMarkdownFiles();

  // Collect all tags and files
  markdownFiles.forEach((markdownFile) => {
    const cache = app.metadataCache.getFileCache(markdownFile);
    const fileTags: string[] = getAllTags(cache) || [];
    allTags = allTags.concat(fileTags);
    taggedFiles.push({
      file: markdownFile,
      tags: fileTags,
    });
  });

  // Remove duplicates and sort
  allTags = [...new Set(allTags)].sort();

  const options = allTags.map((tag) => ({
    value: tag,
    label: tag.substring(1),
  }));
  const selectedTags =
    (selectedOption && selectedOption.map((option) => option.value)) || [];

  let displayFiles: TaggedFile[] = [];

  if (filterAnd) {
    displayFiles = taggedFiles.filter((file) => {
      return (
        !selectedTags.length ||
        selectedTags.every((selectedTag) => file.tags.includes(selectedTag))
      );
    });
  } else {
    displayFiles = taggedFiles.filter((file) => {
      return (
        !selectedTags.length ||
        file.tags.some((tag) => selectedTags.includes(tag))
      );
    });
  }

  const tagsTree = {};
  let displayTags = new Set();
  displayFiles.forEach((taggedFile) => {
    console.log("taggedFile", taggedFile);
    taggedFile.tags.forEach((tag) => {
      displayTags.add(tag);
      tagsTree[tag] = tagsTree[tag] || [];
      tagsTree[tag].push(taggedFile.file);
    });
  });

  let tagItems: JSX.Element[];
  const displayTagsList: string[] = [...displayTags];

  if (displayType == "compact") {
    tagItems = displayTagsList.map((tag) => {
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
        {displayTagsList.map((tag) => {
          return (
            <React.Fragment key={tag}>
              <thead>
                <tr>
                  <th colSpan={2}>
                    <h3 className="tag-title">{tag.substring(1)}</h3>
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
