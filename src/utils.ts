import { TagData, TaggedFile } from "./types";
import { App, TFile, moment, getAllTags } from "obsidian";
import { SORT_FILES, SORT_TAGS } from "./constants";

export function formatDate(date: Date, dateFormat: string): string {
  return moment(date).format(dateFormat);
}

export function formatCalendardDate(mtime: Date, dateFormat: string): string {
  return moment(mtime).calendar({
    sameElse: dateFormat,
  });
}

export const addOrRemove = (arr: string[], item: string) =>
  arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

export const pluralize = (count: number, singular: string, plural: string) => {
  return count === 1 ? `1 ${singular}` : `${count} ${plural}`;
};

export const getTagsFromFile = (app: App, file: TFile): string[] => {
  const cache = app.metadataCache.getFileCache(file);
  return cache ? getAllTags(cache)?.map((tag) => tag.substring(1)) || [] : [];
};

export const getAllTagsAndFiles = (app: App) => {
  const allTaggedFiles: TaggedFile[] = [];
  let allTags: string[] = [];
  app.vault.getMarkdownFiles().forEach((markdownFile) => {
    const fileTags: string[] = getTagsFromFile(app, markdownFile);
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
  return {
    allTags,
    allTaggedFiles,
  };
};

export const openFile = (app: App, file: TFile, inNewLeaf = false): void => {
  let leaf = app.workspace.getMostRecentLeaf();
  if (leaf) {
    if (inNewLeaf || leaf.getViewState().pinned) {
      leaf = app.workspace.getLeaf("tab");
    }
    leaf.openFile(file);
  }
};

// Set dates functions
const getMaxDatesFromFiles = (
  files: TaggedFile[]
): [Date | undefined, Date | undefined] => {
  let modifiedDate: Date | undefined;
  let createdDate: Date | undefined;
  files.forEach((file: TaggedFile) => {
    if (
      !modifiedDate ||
      (file.modifiedDate && file.modifiedDate > modifiedDate)
    ) {
      modifiedDate = file.modifiedDate;
    }
    if (!createdDate || (file.createdDate && file.createdDate > createdDate)) {
      createdDate = file.createdDate;
    }
  });

  return [modifiedDate, createdDate];
};
export const setMaxDatesForTags = (
  tags: TagData[]
): [Date | undefined, Date | undefined] => {
  let totalModifiedDate: Date | undefined;
  let totalCreatedDate: Date | undefined;
  tags.forEach((tagData: TagData) => {
    let [tagModifiedDate, tagCreatedDate] = getMaxDatesFromFiles(tagData.files);
    let [subModifiedDate, subCreatedDate] = setMaxDatesForTags(tagData.sub);

    const modifiedDate: Date | undefined =
      tagModifiedDate && subModifiedDate
        ? tagModifiedDate < subModifiedDate
          ? tagModifiedDate
          : subModifiedDate
        : tagModifiedDate || subModifiedDate;
    const createdDate: Date | undefined =
      tagCreatedDate && subCreatedDate
        ? tagCreatedDate > subCreatedDate
          ? tagCreatedDate
          : subCreatedDate
        : tagCreatedDate || subCreatedDate;

    tagData.maxModifiedDate = modifiedDate;
    tagData.maxCreatedDate = createdDate;

    if (
      modifiedDate &&
      (!totalModifiedDate || modifiedDate < totalModifiedDate)
    ) {
      totalModifiedDate = modifiedDate;
    }
    if (createdDate && (!totalCreatedDate || createdDate > totalCreatedDate)) {
      totalCreatedDate = createdDate;
    }
  });
  return [totalModifiedDate, totalCreatedDate];
};

// Sort functions
export const sortTagsAndFiles = (
  nestedTags: TagData[],
  sortTags: string,
  sortFiles: string
) => {
  // Sort tags and file
  const sortFilesFn = (tFileA: TaggedFile, tFileB: TaggedFile) => {
    const nameA: string = tFileA.file.basename.toLowerCase();
    const nameB: string = tFileB.file.basename.toLowerCase();

    if (sortFiles == SORT_FILES.nameAsc) {
      return nameA > nameB ? 1 : -1;
    } else if (sortFiles == SORT_FILES.nameDesc) {
      return nameA < nameB ? 1 : -1;
    }
    if (tFileA.modifiedDate && tFileB.modifiedDate) {
      if (sortFiles == SORT_FILES.modifiedAsc) {
        return tFileA.modifiedDate < tFileB.modifiedDate ? 1 : -1;
      } else if (sortFiles == SORT_FILES.modifiedDesc) {
        return tFileA.modifiedDate < tFileB.modifiedDate ? -1 : 1;
      }
    }
    if (tFileA.createdDate && tFileB.createdDate) {
      if (sortFiles == SORT_FILES.createdAsc) {
        return tFileA.createdDate < tFileB.createdDate ? 1 : -1;
      } else if (sortFiles == SORT_FILES.createdDesc) {
        return tFileA.createdDate < tFileB.createdDate ? -1 : 1;
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
    if (tagA.maxModifiedDate && tagB.maxModifiedDate) {
      if (sortTags == SORT_TAGS.modifiedAsc) {
        return tagA.maxModifiedDate < tagB.maxModifiedDate ? 1 : -1;
      } else if (sortTags == SORT_TAGS.modifiedDesc) {
        return tagA.maxModifiedDate > tagB.maxModifiedDate ? 1 : -1;
      }
    }
    if (tagA.maxCreatedDate && tagB.maxCreatedDate) {
      if (sortTags == SORT_TAGS.createdAsc) {
        return tagA.maxCreatedDate < tagB.maxCreatedDate ? 1 : -1;
      } else if (sortTags == SORT_TAGS.createdDesc) {
        return tagA.maxCreatedDate > tagB.maxCreatedDate ? 1 : -1;
      }
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
};
