import { SelectOption, TagData, TaggedFile } from "./types";
import { App, TFile, WorkspaceLeaf, moment, getAllTags } from "obsidian";
import { SORT_FILES, SORT_TAGS } from "./constants";

export function formatDate(date: Date, dateFormat: string): string {
  return moment(date).format(dateFormat);
}

export function formatCalendardDate(mtime: Date, dateFormat: string): string {
  return moment(mtime).calendar({
    sameElse: dateFormat,
  });
}

export const getNestedTags = (taggedFile: TaggedFile): string[] => {
  const nestedTags: string[] = [];
  taggedFile.tags.forEach((tag: string) => {
    if (tag.includes("/")) {
      const splitTags = tag.split("/");
      for (let i = 0; i < splitTags.length; i++) {
        nestedTags.push(splitTags.slice(0, i + 1).join("/"));
      }
    }
  });
  return nestedTags;
};

export const addOrRemove = (arr: string[], item: string) =>
  arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

export const pluralize = (count: number, singular: string, plural: string) => {
  return count === 1 ? `1 ${singular}` : `${count} ${plural}`;
};

export const getTaggedFileFromFile = (app: App, file: TFile): TaggedFile => {
  const cache = app.metadataCache.getFileCache(file);
  const fileTags = cache
    ? getAllTags(cache)?.map((tag) => tag.substring(1)) || []
    : [];
  return {
    file,
    frontMatter: { ...cache?.frontmatter },
    tags: fileTags.length > 0 ? [...new Set(fileTags)] : fileTags,
  };
};

export const shouldIgnoreFile = (tagsoverview: string | string[]): boolean => {
  return Array.isArray(tagsoverview)
    ? tagsoverview.includes("ignore")
    : tagsoverview === "ignore";
};

export const matchesExcludePattern = (
  filePath: string,
  rawPattern: string
): boolean => {
  const pattern = rawPattern.trim();
  if (!pattern) return false;

  let path = pattern;
  const rootOnly = path.startsWith("/");
  if (rootOnly) path = path.slice(1);

  const directoryOnly = path.endsWith("/");
  if (directoryOnly) path = path.slice(0, -1);

  if (!path) return false;

  if (path.endsWith(".md")) {
    if (rootOnly) {
      return filePath === path;
    }
    return filePath === path || filePath.endsWith(`/${path}`);
  }

  const matchesPrefix = (prefix: string): boolean => {
    if (filePath === `${prefix}.md`) return true;
    if (filePath.startsWith(`${prefix}/`)) return true;
    return false;
  };

  const matchesAnywhere = (prefix: string): boolean => {
    if (matchesPrefix(prefix)) return true;
    if (filePath.includes(`/${prefix}/`)) return true;
    if (filePath.endsWith(`/${prefix}.md`)) return true;
    return false;
  };

  if (directoryOnly) {
    if (rootOnly || path.includes("/")) {
      return filePath.startsWith(`${path}/`);
    }
    return (
      filePath.startsWith(`${path}/`) || filePath.includes(`/${path}/`)
    );
  }

  if (rootOnly || path.includes("/")) {
    return matchesPrefix(path);
  }

  return matchesAnywhere(path);
};

export const shouldExcludeByPath = (
  filePath: string,
  patterns: string[]
): boolean => {
  return patterns.some((pattern) => matchesExcludePattern(filePath, pattern));
};

export const shouldIncludeTaggedFile = (
  taggedFile: TaggedFile,
  excludePaths: string[]
): boolean => {
  return (
    taggedFile.tags.length > 0 &&
    !shouldIgnoreFile(taggedFile.frontMatter?.tagsoverview) &&
    !shouldExcludeByPath(taggedFile.file.path, excludePaths)
  );
};

export const getAllTagsAndFiles = (app: App, excludePaths: string[] = []) => {
  const taggedFilesMap = new Map<TFile, TaggedFile>();
  let allTags: string[] = [];
  app.vault.getMarkdownFiles().forEach((markdownFile: TFile) => {
    const taggedFile: TaggedFile = getTaggedFileFromFile(app, markdownFile);
    if (shouldIncludeTaggedFile(taggedFile, excludePaths)) {
      allTags = [...allTags, ...getNestedTags(taggedFile), ...taggedFile.tags];
      taggedFilesMap.set(markdownFile, taggedFile);
    }
  });
  // Remove duplicates and sort
  allTags = [...new Set(allTags)].sort();
  return {
    allTags,
    taggedFilesMap,
  };
};

const normalizeTagName = (tag: string): string =>
  tag.startsWith("#") ? tag.slice(1) : tag;

const tagMatchesPath = (tag: string, tagPath: string): boolean => {
  const normalized = normalizeTagName(tag);
  return (
    normalized === tagPath || normalized.startsWith(`${tagPath}/`)
  );
};

export const getTagLineForPath = (
  app: App,
  file: TFile,
  tagPath: string
): number | undefined => {
  const cache = app.metadataCache.getFileCache(file);
  if (!cache) return undefined;

  const sortByLine = (
    a: { position: { start: { line: number } } },
    b: { position: { start: { line: number } } }
  ) => a.position.start.line - b.position.start.line;

  const exactMatches =
    cache.tags
      ?.filter((tagCache) => normalizeTagName(tagCache.tag) === tagPath)
      .sort(sortByLine) ?? [];

  if (exactMatches.length > 0) {
    return exactMatches[0].position.start.line;
  }

  const nestedMatches =
    cache.tags
      ?.filter((tagCache) =>
        normalizeTagName(tagCache.tag).startsWith(`${tagPath}/`)
      )
      .sort(sortByLine) ?? [];

  if (nestedMatches.length > 0) {
    return nestedMatches[0].position.start.line;
  }

  const frontmatterTags = cache.frontmatter?.tags;
  const hasFrontmatterTag = Array.isArray(frontmatterTags)
    ? frontmatterTags.some((tag) =>
        tagMatchesPath(typeof tag === "string" ? tag : `#${tag}`, tagPath)
      )
    : false;

  if (hasFrontmatterTag && cache.frontmatterPosition) {
    return cache.frontmatterPosition.start.line;
  }

  return undefined;
};

const findLeafWithFile = (app: App, file: TFile): WorkspaceLeaf | null => {
  let existingLeaf: WorkspaceLeaf | null = null;
  app.workspace.iterateAllLeaves((leaf) => {
    if (existingLeaf) {
      return;
    }
    const viewState = leaf.getViewState();
    if (viewState.type === "markdown" && viewState.state?.file === file.path) {
      existingLeaf = leaf;
    }
  });
  return existingLeaf;
};

export const openFile = (
  app: App,
  file: TFile,
  inNewLeaf = false,
  tagPath?: string
): void => {
  const line = tagPath ? getTagLineForPath(app, file, tagPath) : undefined;
  const openState = line !== undefined ? { eState: { line } } : undefined;

  if (!inNewLeaf) {
    const existingLeaf = findLeafWithFile(app, file);
    if (existingLeaf) {
      void existingLeaf.openFile(file, openState);
      void app.workspace.revealLeaf(existingLeaf);
      return;
    }
  }

  let leaf = app.workspace.getMostRecentLeaf();
  if (leaf) {
    if (inNewLeaf || leaf.getViewState().pinned) {
      leaf = app.workspace.getLeaf("tab");
    }
    void leaf.openFile(file, openState);
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

    // Sort by name
    if (sortFiles == SORT_FILES.nameAsc) {
      return nameA > nameB ? 1 : -1;
    } else if (sortFiles == SORT_FILES.nameDesc) {
      return nameA < nameB ? 1 : -1;
    }

    // Sort by modified timestamp
    if (tFileA.file.stat.mtime && tFileB.file.stat.mtime) {
      if (sortFiles == SORT_FILES.modifiedAsc) {
        return tFileA.file.stat.mtime < tFileB.file.stat.mtime ? 1 : -1;
      } else if (sortFiles == SORT_FILES.modifiedDesc) {
        return tFileA.file.stat.mtime < tFileB.file.stat.mtime ? -1 : 1;
      }
    }

    // Sort by created timestamp
    if (tFileA.file.stat.ctime && tFileB.file.stat.ctime) {
      if (sortFiles == SORT_FILES.createdAsc) {
        return tFileA.file.stat.ctime < tFileB.file.stat.ctime ? 1 : -1;
      } else if (sortFiles == SORT_FILES.createdDesc) {
        return tFileA.file.stat.ctime < tFileB.file.stat.ctime ? -1 : 1;
      }
    }

    // Sort by frontmatter property
    if (
      sortFiles.includes("property__") &&
      tFileA.frontMatter &&
      tFileB.frontMatter
    ) {
      let property = sortFiles.replace("property__", "");
      let desc = false;
      if (property.startsWith("-")) {
        desc = true;
        property = property.substring(1);
      }
      const frontMatterA = tFileA.frontMatter[property];
      const frontMatterB = tFileB.frontMatter[property];
      if (frontMatterA && frontMatterB) {
        const frontMatterValueA = Array.isArray(frontMatterA)
          ? frontMatterA.join("").toLowerCase()
          : typeof frontMatterA === "string"
          ? (frontMatterA as string).toLowerCase()
          : typeof frontMatterA === "object"
          ? ""
          : frontMatterA;
        const frontMatterValueB = Array.isArray(frontMatterB)
          ? frontMatterB.join("").toLowerCase()
          : typeof frontMatterB === "string"
          ? (frontMatterB as string).toLowerCase()
          : typeof frontMatterB === "object"
          ? ""
          : frontMatterB;

        // If both values starts with "-" we should flip the sort order
        if (
          frontMatterValueA.startsWith("-") &&
          frontMatterValueB.startsWith("-")
        ) {
          desc = !desc;
        }

        return desc
          ? frontMatterValueA < frontMatterValueB
            ? 1
            : -1
          : frontMatterValueA > frontMatterValueB
          ? 1
          : -1;
      }
    }

    // Default sort by name
    return nameA > nameB ? 1 : -1;
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

export function convertStringsToOptions(strings: string[]): SelectOption[] {
  return strings.map((val: string) => ({
    value: val,
    label: upperCaseFirstChar(val),
  }));
}

export function camelCaseString(str: string): string {
  return str
    ? str
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "";
}

export function upperCaseFirstChar(str: string): string {
  return str ? str.charAt(0).toUpperCase() + str.slice(1) : "";
}

export function deepCopy<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
