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
  convertStringsToOptions,
  camelCaseString,
} from "src/utils";
import {
  AvailableFilterOptions,
  FilesByTag,
  PropertyFilter,
  PropertyFilterDataList,
  SelectOption,
  StringMap,
  TagData,
  TaggedFile,
} from "src/types";
import { FILTER_TYPES } from "src/constants";

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
  const [showNested, setShowNested] = useState(plugin.settings.showNested);
  const [showRelatedTags, setShowRelatedTags] = useState(
    plugin.settings.showRelatedTags
  );
  const [propertyFilterDataList, setSelectedFilters] =
    useState<PropertyFilterDataList>({});

  // Construct a map of property filters and their types
  const propertyFilterTypeMap: StringMap =
    plugin.settings.propertyFilters.reduce(
      (typeMap: StringMap, propertyFilter: PropertyFilter) => {
        typeMap[propertyFilter.property] = propertyFilter.type;
        return typeMap;
      },
      {}
    );

  // Construct the map of available filter options
  const availableFilterOptions: AvailableFilterOptions =
    plugin.settings.propertyFilters.reduce(
      (options: AvailableFilterOptions, propertyFilter: PropertyFilter) => {
        options[propertyFilter.property] = [];
        return options;
      },
      {}
    );
  if (plugin.settings.propertyFilters.length) {
    plugin.app.vault.getMarkdownFiles().forEach((file) => {
      const cache = plugin.app.metadataCache.getFileCache(file);
      if (cache?.frontmatter) {
        Object.keys(cache.frontmatter).forEach((key) => {
          if (cache.frontmatter && availableFilterOptions[key] !== undefined) {
            const frontMatterVal = cache.frontmatter[key];

            if (Array.isArray(frontMatterVal)) {
              frontMatterVal.forEach((val) => {
                if (val !== undefined && val !== null) {
                  availableFilterOptions[key].push(val.toString());
                }
              });
            } else {
              if (frontMatterVal !== undefined && frontMatterVal !== null) {
                availableFilterOptions[key].push(frontMatterVal.toString());
              }
            }
          }
        });
      }
    });
  }

  // Remove duplicates
  Object.keys(availableFilterOptions).forEach((key) => {
    availableFilterOptions[key] = [...new Set(availableFilterOptions[key])];
  });

  useEffect(() => {
    plugin.saveSettings({
      filterAnd,
      showNested,
      showRelatedTags,
    });
  }, [filterAnd, showNested, showRelatedTags]);

  useEffect(() => {
    plugin.saveSettings({
      storedFilters: selectedOptions.map((option) => option.value).join(","),
    });
  }, [selectedOptions]);

  const onFileClicked = (file: TFile, inNewLeaf: boolean = false) => {
    openFile(app, file, inNewLeaf);
  };

  const onFiltersChange = (propertyFilterKey: string, values: string[]) => {
    const newSelectedFilters = { ...propertyFilterDataList };
    if (newSelectedFilters[propertyFilterKey] === undefined) {
      newSelectedFilters[propertyFilterKey] = {
        selected: values,
        filterAnd: false,
      };
    } else {
      newSelectedFilters[propertyFilterKey].selected = values;
    }
    setSelectedFilters(newSelectedFilters);
  };

  const updatePropertyFilter = (
    propertyFilterKey: string,
    filterOperator: string | undefined,
    filterAnd: boolean | undefined
  ) => {
    const newSelectedFilters = { ...propertyFilterDataList };
    if (newSelectedFilters[propertyFilterKey] === undefined) {
      newSelectedFilters[propertyFilterKey] = {
        selected: [],
        filterOperator: filterOperator || "eq",
        filterAnd: filterAnd || false,
      };
    } else {
      if (filterOperator !== undefined) {
        newSelectedFilters[propertyFilterKey].filterOperator = filterOperator;
      }
      if (filterAnd !== undefined) {
        newSelectedFilters[propertyFilterKey].filterAnd = filterAnd;
      }
    }
    setSelectedFilters(newSelectedFilters);
  };
  // Get files to be displayed
  const selectedTags: string[] =
    selectedOptions?.map((option: SelectOption) => option.value) || [];
  let displayFiles: TaggedFile[] = selectedTags.length
    ? allTaggedFiles.filter((file: TaggedFile) => {
        return filterAnd
          ? selectedTags.every(
              (selectedTag) =>
                file.tags.includes(selectedTag) ||
                file.tags.some((tag) => tag.startsWith(`${selectedTag}/`))
            )
          : file.tags.some(
              (tag) =>
                selectedTags.includes(tag) ||
                selectedTags.some((selectedTag) =>
                  tag.startsWith(`${selectedTag}/`)
                )
            );
      })
    : [...allTaggedFiles];

  // Filter the list of files based on the property filters
  if (Object.keys(propertyFilterDataList).length > 0) {
    displayFiles = displayFiles.filter((file: TaggedFile) => {
      const frontMatter = plugin.app.metadataCache.getFileCache(
        file.file
      )?.frontmatter;

      for (let i = 0; i < Object.keys(propertyFilterDataList).length; i++) {
        const propertyFilterKey = Object.keys(propertyFilterDataList)[i];
        const propertyFilterData = propertyFilterDataList[propertyFilterKey];
        if (
          propertyFilterData.selected.length === 0 ||
          !propertyFilterData.selected[0]
        ) {
          continue;
        }
        const propertyFilterVal = propertyFilterData.selected[0];
        const frontMatterVal = frontMatter
          ? frontMatter[propertyFilterKey]
          : false;
        if (!frontMatterVal) return false;

        let includeFile;
        if (propertyFilterTypeMap[propertyFilterKey] === FILTER_TYPES.text) {
          const searchString = propertyFilterVal.toLowerCase();
          if (Array.isArray(frontMatterVal)) {
            includeFile = frontMatterVal.some((val) =>
              val.toLowerCase().contains(searchString)
            );
          } else {
            includeFile = frontMatterVal.contains(searchString);
          }
        } else if (
          propertyFilterTypeMap[propertyFilterKey] === FILTER_TYPES.number
        ) {
          const filterOperator = propertyFilterData.filterOperator || "eq";
          if (Array.isArray(frontMatterVal)) {
            includeFile = frontMatterVal.some((val) => {
              switch (filterOperator) {
                case "eq":
                  return val === propertyFilterVal;
                case "neq":
                  return val !== propertyFilterVal;
                case "gt":
                  return val > propertyFilterVal;
                case "gte":
                  return val >= propertyFilterVal;
                case "lt":
                  return val < propertyFilterVal;
                case "lte":
                  return val <= propertyFilterVal;
                default:
                  return false;
              }
            });
          } else {
            switch (filterOperator) {
              case "eq":
                includeFile = frontMatterVal === propertyFilterVal;
                break;
              case "neq":
                includeFile = frontMatterVal !== propertyFilterVal;
                break;
              case "gt":
                includeFile = frontMatterVal > propertyFilterVal;
                break;
              case "gte":
                includeFile = frontMatterVal >= propertyFilterVal;
                break;
              case "lt":
                includeFile = frontMatterVal < propertyFilterVal;
                break;
              case "lte":
                includeFile = frontMatterVal <= propertyFilterVal;
                break;
              default:
                includeFile = false;
                break;
            }
          }
        } else if (propertyFilterData.filterAnd || false) {
          includeFile = Array.isArray(frontMatterVal)
            ? propertyFilterData.selected.every((val) =>
                frontMatterVal.includes(val.toString())
              )
            : propertyFilterData.selected.length === 1 &&
              frontMatterVal === propertyFilterVal.toString();
        } else {
          includeFile = Array.isArray(frontMatterVal)
            ? frontMatterVal.some((val) =>
                propertyFilterData.selected.includes(val.toString())
              )
            : propertyFilterData.selected.includes(frontMatterVal.toString());
        }

        if (!includeFile) return false;
      }
      return true;
    });
  }

  // Curry the files with a formatted version of the last modified and created date
  const getFormattedDate = (date: Date): string => {
    return plugin.settings.showCalendarDates
      ? formatCalendardDate(date, plugin.settings.dateFormat)
      : formatDate(date, plugin.settings.dateFormat);
  };
  displayFiles.forEach((taggedFile: TaggedFile) => {
    taggedFile.formattedCreated = getFormattedDate(
      new Date(taggedFile.file.stat.ctime)
    );
    taggedFile.formattedModified = getFormattedDate(
      new Date(taggedFile.file.stat.mtime)
    );
  });

  // Get tags to be displayed
  const tagsTree: FilesByTag = {};
  const displayTags = new Set<string>();

  // Include related tags
  displayFiles.forEach((taggedFile: TaggedFile) => {
    let tags: string[] = taggedFile.tags;
    if (!showRelatedTags) {
      tags = tags.filter(
        (tag: string) =>
          !selectedTags.length ||
          selectedTags.contains(tag) ||
          selectedTags.some((selectedTag) => tag.startsWith(`${selectedTag}/`))
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
    const tagPaths: string[] = [];
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
        activePart.push(checkPart);
      }
      activePart = checkPart.sub;
    });
  });

  const sumUpNestedFilesCount = (tags: TagData[]) => {
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
        className="slim"
      />
      <Select
        className="tags-filter-select"
        value={selectedOptions}
        onChange={(val: SelectOption[]) => {
          setSelectedOptions(val);
        }}
        options={convertStringsToOptions(allTags).sort(
          (optionA: SelectOption, optionB: SelectOption): number => {
            const lblA: string = optionA.label.toLowerCase();
            const lblB: string = optionB.label.toLowerCase();
            return lblA === lblB ? 0 : lblA > lblB ? 1 : -1;
          }
        )}
        name="Filter"
        placeholder="Select tags..."
        isMulti
      />

      <div>
        {plugin.settings.propertyFilters &&
          plugin.settings.propertyFilters.map((propertyFilter) => (
            <div key={propertyFilter.property}>
              <HeaderSettings
                title={camelCaseString(propertyFilter.property)}
                value={
                  propertyFilter.type === FILTER_TYPES.number
                    ? propertyFilterDataList[propertyFilter.property]
                        ?.filterOperator || "eq"
                    : propertyFilterDataList[propertyFilter.property]
                        ?.filterAnd || false
                }
                setFunction={(val: boolean | string) => {
                  if (propertyFilter.type === FILTER_TYPES.number) {
                    updatePropertyFilter(
                      propertyFilter.property,
                      val.toString(),
                      undefined
                    );
                  } else {
                    updatePropertyFilter(
                      propertyFilter.property,
                      undefined,
                      Boolean(val)
                    );
                  }
                }}
                settings={
                  propertyFilter.type === FILTER_TYPES.select
                    ? [
                        { label: "AND", value: true },
                        { label: "OR", value: false },
                      ]
                    : propertyFilter.type === FILTER_TYPES.number
                    ? [
                        { label: "=", value: "eq" },
                        { label: "!=", value: "neq" },
                        { label: ">", value: "gt" },
                        { label: ">=", value: "gte" },
                        { label: "<=", value: "lte" },
                        { label: "<", value: "lt" },
                      ]
                    : []
                }
                className="slim"
              />

              {propertyFilter.type === FILTER_TYPES.select && (
                <Select
                  className="tags-filter-select"
                  value={convertStringsToOptions(
                    propertyFilterDataList[propertyFilter.property]?.selected ||
                      []
                  )}
                  onChange={(val: SelectOption[]) => {
                    onFiltersChange(
                      propertyFilter.property,
                      val.map((value: SelectOption) => value.value)
                    );
                  }}
                  options={convertStringsToOptions(
                    availableFilterOptions[propertyFilter.property]
                  ).sort(
                    (optionA: SelectOption, optionB: SelectOption): number => {
                      const lblA: string = (
                        optionA.label !== undefined ? optionA.label : ""
                      )
                        .toString()
                        .toLowerCase();
                      const lblB: string = (
                        optionB.label !== undefined ? optionB.label : ""
                      )
                        .toString()
                        .toLowerCase();
                      return lblA === lblB ? 0 : lblA > lblB ? 1 : -1;
                    }
                  )}
                  name="Filter"
                  placeholder={`Select ${propertyFilter.property}`}
                  isMulti
                />
              )}
              {propertyFilter.type === FILTER_TYPES.text && (
                <input
                  type="text"
                  value={
                    propertyFilterDataList[propertyFilter.property]?.selected
                      ? propertyFilterDataList[propertyFilter.property]
                          ?.selected[0] || ""
                      : ""
                  }
                  className="tags-filter-text"
                  placeholder={`Filter ${propertyFilter.property}`}
                  onChange={(event) => {
                    const val = event.target.value;
                    onFiltersChange(propertyFilter.property, val ? [val] : []);
                  }}
                />
              )}
              {propertyFilter.type === FILTER_TYPES.number && (
                <input
                  type="number"
                  value={
                    propertyFilterDataList[propertyFilter.property]?.selected
                      ? propertyFilterDataList[propertyFilter.property]
                          ?.selected[0] || ""
                      : ""
                  }
                  className="tags-filter-text tags-filter-number"
                  placeholder={`Filter ${propertyFilter.property}`}
                  onChange={(event) => {
                    const val = event.target.value;
                    onFiltersChange(propertyFilter.property, val ? [val] : []);
                  }}
                />
              )}
            </div>
          ))}
      </div>

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
