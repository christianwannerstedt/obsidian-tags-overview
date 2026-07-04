import moment from "moment";

export { moment };

export function getAllTags(cache: {
  tags?: { tag: string }[];
  frontmatter?: { tags?: string[] };
}): string[] | null {
  const tags: string[] = [];
  cache.tags?.forEach(({ tag }) => tags.push(tag));
  cache.frontmatter?.tags?.forEach((tag) => tags.push(`#${tag}`));
  return tags.length ? tags : null;
}

export type TFile = {
  basename: string;
  path: string;
  stat: {
    mtime: number;
    ctime: number;
    size?: number;
  };
};

export type App = {
  metadataCache: {
    getFileCache: (file: TFile) => {
      frontmatter?: Record<string, unknown>;
      tags?: { tag: string }[];
    } | null;
  };
  vault: {
    getMarkdownFiles: () => TFile[];
  };
  workspace: {
    getMostRecentLeaf: () => unknown;
    getLeaf: (type: string) => { openFile: (file: TFile) => Promise<void> };
  };
};
