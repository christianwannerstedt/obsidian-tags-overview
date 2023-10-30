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
  const fileTags = cache
    ? getAllTags(cache)?.map((tag) => tag.substring(1)) || []
    : [];
  return fileTags.length > 0 ? [...new Set(fileTags)] : fileTags;
};

export const getFrontMatterFromFile = (app: App, file: TFile) => {
  const cache = app.metadataCache.getFileCache(file);
  return { ...cache?.frontmatter };
};

export const getAllTagsAndFiles = (app: App) => {
  const taggedFilesMap = new Map<TFile, TaggedFile>();
  let allTags: string[] = [];
  app.vault.getMarkdownFiles().forEach((markdownFile: TFile) => {
    const fileTags: string[] = getTagsFromFile(app, markdownFile);
    if (fileTags.length) {
      allTags = allTags.concat(fileTags);
      taggedFilesMap.set(markdownFile, {
        file: markdownFile,
        frontMatter: getFrontMatterFromFile(app, markdownFile),
        tags: fileTags,
      });
    }
  });
  // Remove duplicates and sort
  allTags = [...new Set(allTags)].sort();
  return {
    allTags,
    taggedFilesMap,
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
const getMaxTimesFromFiles = (
  taggedFiles: TaggedFile[]
): [number | undefined, number | undefined] => {
  let modifiedTime: number | undefined;
  let createdTime: number | undefined;
  taggedFiles.forEach((taggedFile: TaggedFile) => {
    if (
      !modifiedTime ||
      (taggedFile.file.stat.mtime && taggedFile.file.stat.mtime > modifiedTime)
    ) {
      modifiedTime = taggedFile.file.stat.mtime;
    }
    if (
      !createdTime ||
      (taggedFile.file.stat.ctime && taggedFile.file.stat.ctime > createdTime)
    ) {
      createdTime = taggedFile.file.stat.ctime;
    }
  });

  return [modifiedTime, createdTime];
};
export const setMaxTimesForTags = (
  tags: TagData[]
): [number | undefined, number | undefined] => {
  let totalModifiedTime: number | undefined;
  let totalCreatedTime: number | undefined;
  tags.forEach((tagData: TagData) => {
    const [tagModifiedTime, tagCreatedTime] = getMaxTimesFromFiles(
      tagData.files
    );
    const [subModifiedTime, subCreatedTime] = setMaxTimesForTags(tagData.sub);

    const modifiedTime: number | undefined =
      tagModifiedTime && subModifiedTime
        ? Math.min(tagModifiedTime, subModifiedTime)
        : tagModifiedTime || subModifiedTime;
    const createdTime: number | undefined =
      tagCreatedTime && subCreatedTime
        ? Math.max(tagCreatedTime, subCreatedTime)
        : tagCreatedTime || subCreatedTime;

    tagData.maxModifiedTime = modifiedTime;
    tagData.maxCreatedTime = createdTime;

    if (
      modifiedTime &&
      (!totalModifiedTime || modifiedTime < totalModifiedTime)
    ) {
      totalModifiedTime = modifiedTime;
    }
    if (createdTime && (!totalCreatedTime || createdTime > totalCreatedTime)) {
      totalCreatedTime = createdTime;
    }
  });
  return [totalModifiedTime, totalCreatedTime];
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
    if (tFileA.file.stat.mtime && tFileB.file.stat.mtime) {
      if (sortFiles == SORT_FILES.modifiedAsc) {
        return tFileA.file.stat.mtime < tFileB.file.stat.mtime ? 1 : -1;
      } else if (sortFiles == SORT_FILES.modifiedDesc) {
        return tFileA.file.stat.mtime < tFileB.file.stat.mtime ? -1 : 1;
      }
    }
    if (tFileA.file.stat.ctime && tFileB.file.stat.ctime) {
      if (sortFiles == SORT_FILES.createdAsc) {
        return tFileA.file.stat.ctime < tFileB.file.stat.ctime ? 1 : -1;
      } else if (sortFiles == SORT_FILES.createdDesc) {
        return tFileA.file.stat.ctime < tFileB.file.stat.ctime ? -1 : 1;
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
    if (tagA.maxModifiedTime && tagB.maxModifiedTime) {
      if (sortTags == SORT_TAGS.modifiedAsc) {
        return tagA.maxModifiedTime < tagB.maxModifiedTime ? 1 : -1;
      } else if (sortTags == SORT_TAGS.modifiedDesc) {
        return tagA.maxModifiedTime > tagB.maxModifiedTime ? 1 : -1;
      }
    }
    if (tagA.maxCreatedTime && tagB.maxCreatedTime) {
      if (sortTags == SORT_TAGS.createdAsc) {
        return tagA.maxCreatedTime < tagB.maxCreatedTime ? 1 : -1;
      } else if (sortTags == SORT_TAGS.createdDesc) {
        return tagA.maxCreatedTime > tagB.maxCreatedTime ? 1 : -1;
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
