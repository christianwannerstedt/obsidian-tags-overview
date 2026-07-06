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
  getTagLineForPath,
  getTaggedFileFromFile,
  matchesExcludePattern,
  pluralize,
  setMaxTimesForTags,
  shouldExcludeByPath,
  shouldIgnoreFile,
  shouldIncludeTaggedFile,
  sortTagsAndFiles,
  upperCaseFirstChar,
} from "./utils";

const mockFile = (
  basename: string,
  path?: string,
  stat: { mtime: number; ctime: number } = { mtime: 100, ctime: 50 }
): TFile => ({
  basename,
  path: path ?? `${basename}.md`,
  stat,
});

const mockTaggedFile = (
  basename: string,
  tags: string[],
  frontMatter: Record<string, unknown> = {},
  stat: { mtime: number; ctime: number } = { mtime: 100, ctime: 50 }
): TaggedFile => ({
  file: mockFile(basename, undefined, stat),
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

describe("matchesExcludePattern", () => {
  it("matches /archive at vault root only", () => {
    expect(matchesExcludePattern("archive.md", "/archive")).toBe(true);
    expect(matchesExcludePattern("archive/foo.md", "/archive")).toBe(true);
    expect(matchesExcludePattern("notes/archive/foo.md", "/archive")).toBe(
      false
    );
  });

  it("matches archive anywhere in the vault", () => {
    expect(matchesExcludePattern("archive.md", "archive")).toBe(true);
    expect(matchesExcludePattern("archive/foo.md", "archive")).toBe(true);
    expect(matchesExcludePattern("notes/archive/foo.md", "archive")).toBe(true);
  });

  it("matches /archive/ as directory only at root", () => {
    expect(matchesExcludePattern("archive/foo.md", "/archive/")).toBe(true);
    expect(matchesExcludePattern("archive.md", "/archive/")).toBe(false);
  });

  it("matches exact file paths ending with .md", () => {
    expect(matchesExcludePattern("notes/drafts.md", "notes/drafts.md")).toBe(
      true
    );
    expect(matchesExcludePattern("notes/drafts/old.md", "notes/drafts.md")).toBe(
      false
    );
  });

  it("matches notes/drafts as a path prefix", () => {
    expect(matchesExcludePattern("notes/drafts.md", "notes/drafts")).toBe(true);
    expect(matchesExcludePattern("notes/drafts/old.md", "notes/drafts")).toBe(
      true
    );
    expect(
      matchesExcludePattern("other/notes/drafts.md", "notes/drafts")
    ).toBe(false);
  });

  it("ignores empty or whitespace patterns", () => {
    expect(matchesExcludePattern("archive.md", "")).toBe(false);
    expect(matchesExcludePattern("archive.md", "   ")).toBe(false);
  });
});

describe("shouldExcludeByPath", () => {
  it("returns true when any pattern matches", () => {
    expect(shouldExcludeByPath("archive/foo.md", ["/other", "/archive"])).toBe(
      true
    );
    expect(shouldExcludeByPath("notes/foo.md", ["/archive"])).toBe(false);
  });
});

describe("shouldIncludeTaggedFile", () => {
  it("excludes files without tags, ignored frontmatter, or excluded paths", () => {
    expect(
      shouldIncludeTaggedFile(mockTaggedFile("note", ["work"]), [])
    ).toBe(true);
    expect(
      shouldIncludeTaggedFile(mockTaggedFile("note", [], {}), [])
    ).toBe(false);
    expect(
      shouldIncludeTaggedFile(
        mockTaggedFile("note", ["work"], { tagsoverview: "ignore" }),
        []
      )
    ).toBe(false);
    expect(
      shouldIncludeTaggedFile(
        {
          ...mockTaggedFile("note", ["work"]),
          file: mockFile("note", "archive/note.md"),
        },
        ["/archive"]
      )
    ).toBe(false);
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

describe("getTagLineForPath", () => {
  const file = mockFile("note");
  const mockAppWithTags = (cache: Record<string, unknown>) =>
    ({
      metadataCache: {
        getFileCache: () => cache,
      },
    }) as unknown as App;

  it("returns the line of an exact inline tag match", () => {
    const line = getTagLineForPath(
      mockAppWithTags({
        tags: [
          {
            tag: "#work",
            position: { start: { line: 5, col: 0, offset: 0 }, end: {} },
          },
          {
            tag: "#home",
            position: { start: { line: 12, col: 0, offset: 0 }, end: {} },
          },
        ],
      }),
      file,
      "work"
    );

    expect(line).toBe(5);
  });

  it("prefers exact matches over nested tag matches", () => {
    const line = getTagLineForPath(
      mockAppWithTags({
        tags: [
          {
            tag: "#vehicle/car/sports",
            position: { start: { line: 3, col: 0, offset: 0 }, end: {} },
          },
          {
            tag: "#vehicle/car",
            position: { start: { line: 10, col: 0, offset: 0 }, end: {} },
          },
        ],
      }),
      file,
      "vehicle/car"
    );

    expect(line).toBe(10);
  });

  it("falls back to nested tag matches for parent tag rows", () => {
    const line = getTagLineForPath(
      mockAppWithTags({
        tags: [
          {
            tag: "#vehicle/car",
            position: { start: { line: 7, col: 0, offset: 0 }, end: {} },
          },
        ],
      }),
      file,
      "vehicle"
    );

    expect(line).toBe(7);
  });

  it("returns frontmatter position for frontmatter-only tags", () => {
    const line = getTagLineForPath(
      mockAppWithTags({
        frontmatter: { tags: ["work"] },
        frontmatterPosition: {
          start: { line: 1, col: 0, offset: 0 },
          end: {},
        },
      }),
      file,
      "work"
    );

    expect(line).toBe(1);
  });

  it("returns undefined when no matching tag is found", () => {
    const line = getTagLineForPath(
      mockAppWithTags({
        tags: [
          {
            tag: "#other",
            position: { start: { line: 2, col: 0, offset: 0 }, end: {} },
          },
        ],
      }),
      file,
      "work"
    );

    expect(line).toBeUndefined();
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

  it("collects tags and skips excluded paths", () => {
    const included = mockFile("included", "notes/included.md");
    const excluded = mockFile("excluded", "archive/excluded.md");
    const app = {
      metadataCache: {
        getFileCache: () => ({
          frontmatter: {},
          tags: [{ tag: "#work" }],
        }),
      },
      vault: {
        getMarkdownFiles: () => [included, excluded],
      },
    } as unknown as App;

    const { allTags, taggedFilesMap } = getAllTagsAndFiles(app, ["/archive"]);

    expect(allTags).toEqual(["work"]);
    expect([...taggedFilesMap.keys()].map((file) => file.path)).toEqual([
      "notes/included.md",
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
