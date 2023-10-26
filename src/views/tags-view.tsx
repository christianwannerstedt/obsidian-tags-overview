import * as React from "react";
import { useEffect, useState } from "react";
import Select from "react-select";
import { App, TFile } from "obsidian";

import TagsOverviewPlugin from "../main";
import { RootView } from "./root-view";
import { HeaderSettings } from "../components/header-settings";
import { Tags } from "../components/tags";
import {
  formatDate,
  formatCalendardDate,
  openFile,
  setMaxTimesForTags,
} from "src/utils";
import { FilesByTag, SelectOption, TagData, TaggedFile } from "src/types";

export const TagsView = ({
  rootView,
  allTags,
  allTaggedFiles,
}: {
  rootView: RootView;
  allTags: string[];
  allTaggedFiles: TaggedFile[];
}) => {
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
  const [showNested, setShowNested] = useState(true);
  const [showRelatedTags, setShowRelatedTags] = useState(
    plugin.settings.showRelatedTags
  );

  useEffect(() => {
    plugin.saveSettings({
      filterAnd,
      showRelatedTags,
    });
  }, [filterAnd, showRelatedTags]);

  useEffect(() => {
    plugin.saveSettings({
      storedFilters: selectedOptions.map((option) => option.value).join(","),
    });
  }, [selectedOptions]);

  const onFileClicked: Function = (file: TFile, inNewLeaf: boolean = false) => {
    openFile(app, file, inNewLeaf);
  };

  // Get files to be displayed
  const selectedTags: string[] =
    selectedOptions?.map((option: SelectOption) => option.value) || [];
  let displayFiles: TaggedFile[] = selectedTags.length
    ? allTaggedFiles.filter((file: TaggedFile) => {
        return filterAnd
          ? selectedTags.every((selectedTag) => file.tags.includes(selectedTag))
          : file.tags.some((tag) => selectedTags.includes(tag));
      })
    : [...allTaggedFiles];

  // Curry the files with a formatted version of the last modified date
  const getFormattedDate = (date: Date): string => {
    return plugin.settings.showCalendarDates
      ? formatCalendardDate(date, plugin.settings.dateFormat)
      : formatDate(date, plugin.settings.dateFormat);
  };
  displayFiles.forEach((taggedFile: TaggedFile) => {
    taggedFile.formattedModified = getFormattedDate(
      new Date(taggedFile.file.stat.mtime)
    );
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

  // Curry the tags with counts and max dates
  sumUpNestedFilesCount(nestedTags);
  setMaxTimesForTags(nestedTags);

  return (
    <div className="tags-overview">
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

      <Tags
        plugin={plugin}
        tags={nestedTags}
        tagsCount={tagsCount}
        filesCount={displayFiles.length}
        hasFilters={!!selectedOptions.length}
        showNested={showNested}
        setShowNested={setShowNested}
        showRelatedTags={showRelatedTags}
        setShowRelatedTags={setShowRelatedTags}
        onFileClick={onFileClicked}
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
