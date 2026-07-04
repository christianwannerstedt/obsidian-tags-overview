import { describe, expect, it } from "vitest";
import { App, TFile } from "obsidian";
import { SORT_FILES, SORT_TAGS } from "./constants";
import { TagData, TaggedFile } from "./types";
import {
  addOrRemove,
  camelCaseString,
  convertStringsToOptions,
  deepCopy,
  getAllTagsAndFiles,
  getNestedTags,
  getTaggedFileFromFile,
  pluralize,
  setMaxTimesForTags,
  shouldIgnoreFile,
  sortTagsAndFiles,
  upperCaseFirstChar,
} from "./utils";

const mockFile = (
  basename: string,
  stat: { mtime: number; ctime: number } = { mtime: 100, ctime: 50 }
): TFile => ({
  basename,
  path: `${basename}.md`,
  stat,
});

const mockTaggedFile = (
  basename: string,
  tags: string[],
  frontMatter: Record<string, unknown> = {},
  stat: { mtime: number; ctime: number } = { mtime: 100, ctime: 50 }
): TaggedFile => ({
  file: mockFile(basename, stat),
  tags,
  frontMatter: frontMatter as TaggedFile["frontMatter"],
});

const mockTagData = (
  tag: string,
  files: TaggedFile[],
  sub: TagData[] = []
): TagData => ({
  tag,
  tagPath: tag,
  files,
  sub,
  subFilesCount: sub.reduce(
    (count, subTag) => count + subTag.files.length + subTag.subFilesCount,
    0
  ),
});

describe("getNestedTags", () => {
  it("expands nested tag paths", () => {
    expect(
      getNestedTags(mockTaggedFile("note", ["vehicle/car/sports"]))
    ).toEqual(["vehicle", "vehicle/car", "vehicle/car/sports"]);
  });

  it("returns empty array when tags are not nested", () => {
    expect(getNestedTags(mockTaggedFile("note", ["alpha", "beta"]))).toEqual(
      []
    );
  });
});

describe("shouldIgnoreFile", () => {
  it("detects ignore in string and array frontmatter values", () => {
    expect(shouldIgnoreFile("ignore")).toBe(true);
    expect(shouldIgnoreFile(["visible", "ignore"])).toBe(true);
    expect(shouldIgnoreFile("visible")).toBe(false);
    expect(shouldIgnoreFile(["visible"])).toBe(false);
  });
});

describe("addOrRemove", () => {
  it("toggles items in an array", () => {
    expect(addOrRemove(["a"], "b")).toEqual(["a", "b"]);
    expect(addOrRemove(["a", "b"], "a")).toEqual(["b"]);
  });
});

describe("pluralize", () => {
  it("uses singular or plural labels based on count", () => {
    expect(pluralize(1, "tag", "tags")).toBe("1 tag");
    expect(pluralize(3, "tag", "tags")).toBe("3 tags");
  });
});

describe("string helpers", () => {
  it("converts strings to select options", () => {
    expect(convertStringsToOptions(["alpha", "beta"])).toEqual([
      { value: "alpha", label: "Alpha" },
      { value: "beta", label: "Beta" },
    ]);
  });

  it("title-cases words and first characters", () => {
    expect(camelCaseString("hello world")).toBe("Hello World");
    expect(upperCaseFirstChar("beta")).toBe("Beta");
    expect(upperCaseFirstChar("")).toBe("");
  });

  it("deep copies serializable values", () => {
    const original = { filters: [{ name: "work", selected: ["a"] }] };
    const copy = deepCopy(original);
    copy.filters[0].selected.push("b");
    expect(original.filters[0].selected).toEqual(["a"]);
  });
});

describe("getTaggedFileFromFile", () => {
  it("normalizes tags from metadata cache", () => {
    const file = mockFile("note");
    const app = {
      metadataCache: {
        getFileCache: () => ({
          frontmatter: { status: "open" },
          tags: [{ tag: "#work" }, { tag: "#work" }, { tag: "#home" }],
        }),
      },
    } as unknown as App;

    expect(getTaggedFileFromFile(app, file)).toEqual({
      file,
      frontMatter: { status: "open" },
      tags: ["work", "home"],
    });
  });
});

describe("getAllTagsAndFiles", () => {
  it("collects tags and skips ignored files", () => {
    const included = mockFile("included");
    const ignored = mockFile("ignored");
    const app = {
      metadataCache: {
        getFileCache: (file: TFile) => {
          if (file.basename === "ignored") {
            return {
              frontmatter: { tagsoverview: "ignore", tags: ["skip"] },
              tags: [{ tag: "#skip" }],
            };
          }
          return {
            frontmatter: {},
            tags: [{ tag: "#vehicle/car" }],
          };
        },
      },
      vault: {
        getMarkdownFiles: () => [included, ignored],
      },
    } as unknown as App;

    const { allTags, taggedFilesMap } = getAllTagsAndFiles(app);

    expect(allTags).toEqual(["vehicle", "vehicle/car"]);
    expect([...taggedFilesMap.keys()].map((file) => file.basename)).toEqual([
      "included",
    ]);
  });
});

describe("setMaxTimesForTags", () => {
  it("propagates min modified and max created times through nested tags", () => {
    const tags = [
      mockTagData(
        "parent",
        [mockTaggedFile("a", ["x"], {}, { mtime: 300, ctime: 10 })],
        [
          mockTagData("child", [
            mockTaggedFile("b", ["x"], {}, { mtime: 100, ctime: 50 }),
          ]),
        ]
      ),
    ];

    expect(setMaxTimesForTags(tags)).toEqual([100, 50]);
    expect(tags[0].maxModifiedTime).toBe(100);
    expect(tags[0].maxCreatedTime).toBe(50);
    expect(tags[0].sub[0].maxModifiedTime).toBe(100);
    expect(tags[0].sub[0].maxCreatedTime).toBe(50);
  });
});

describe("sortTagsAndFiles", () => {
  it("sorts tags and files by name", () => {
    const tags = [
      mockTagData("beta", [
        mockTaggedFile("zebra", ["beta"]),
        mockTaggedFile("alpha", ["beta"]),
      ]),
      mockTagData("alpha", [mockTaggedFile("note", ["alpha"])]),
    ];

    sortTagsAndFiles(tags, SORT_TAGS.nameAsc, SORT_FILES.nameAsc);

    expect(tags.map((tag) => tag.tag)).toEqual(["alpha", "beta"]);
    expect(tags[1].files.map((file) => file.file.basename)).toEqual([
      "alpha",
      "zebra",
    ]);
  });

  it("sorts tags by frequency ascending key (more files first)", () => {
    const tags = [
      mockTagData("few", [mockTaggedFile("one", ["few"])]),
      mockTagData("many", [
        mockTaggedFile("one", ["many"]),
        mockTaggedFile("two", ["many"]),
      ]),
    ];

    sortTagsAndFiles(tags, SORT_TAGS.frequencyAsc, SORT_FILES.nameAsc);

    expect(tags.map((tag) => tag.tag)).toEqual(["many", "few"]);
  });

  it("sorts files by frontmatter property", () => {
    const tags = [
      mockTagData("work", [
        mockTaggedFile("b", ["work"], { priority: "b" }),
        mockTaggedFile("a", ["work"], { priority: "a" }),
      ]),
    ];

    sortTagsAndFiles(
      tags,
      SORT_TAGS.nameAsc,
      "property__priority"
    );

    expect(tags[0].files.map((file) => file.file.basename)).toEqual(["a", "b"]);
  });
});
