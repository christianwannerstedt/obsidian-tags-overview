import * as fs from "fs";
import moment from "moment";
import { TaggedFile } from "./types";
import { App, getAllTags } from "obsidian";

export function getLastModifiedDate(filepath: string): string {
  const stats = fs.statSync(filepath);
  return moment(stats.mtime).calendar();
}

export const addOrRemove = (arr, item) =>
  arr.includes(item) ? arr.filter((i) => i !== item) : [...arr, item];

export const pluralize = (count: number, singular: string, plural: string) => {
  return count === 1 ? `1 ${singular}` : `${count} ${plural}`;
};

export const getAllTagsAndFiles = (app: App) => {
  const allTaggedFiles: TaggedFile[] = [];
  let allTags: string[] = [];
  app.vault.getMarkdownFiles().forEach((markdownFile) => {
    const cache = app.metadataCache.getFileCache(markdownFile);
    const fileTags: string[] = cache
      ? getAllTags(cache)?.map((tag) => tag.substring(1)) || []
      : [];
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
