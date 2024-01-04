import { ContextMenuOption } from "./types";

export const DISPLAY_TYPE: Record<string, string> = {
  compact: "compact",
  list: "list",
};
Object.freeze(DISPLAY_TYPE);

export const SORT_TAGS: Record<string, string> = {
  nameAsc: "name",
  nameDesc: "-name",
  frequencyAsc: "frequency",
  frequencyDesc: "-frequency",
  modifiedAsc: "modified",
  modifiedDesc: "-modified",
  createdAsc: "created",
  createdDesc: "-created",
};
Object.freeze(SORT_TAGS);

export const SORT_FILES: Record<string, string> = {
  nameAsc: "name",
  nameDesc: "-name",
  modifiedAsc: "modified",
  modifiedDesc: "-modified",
  createdAsc: "created",
  createdDesc: "-created",
};
Object.freeze(SORT_FILES);

export const SORT_TAGS_OPTIONS: ContextMenuOption[] = [
  { label: "name (A to Z)", key: SORT_TAGS.nameAsc },
  { label: "name (Z to A)", key: SORT_TAGS.nameDesc },
  {
    label: "frequency (high to low)",
    key: SORT_TAGS.frequencyAsc,
  },
  {
    label: "frequency (low to high)",
    key: SORT_TAGS.frequencyDesc,
  },
  {
    label: "modified time (new to old)",
    key: SORT_TAGS.modifiedAsc,
  },
  {
    label: "modified time (old to new)",
    key: SORT_TAGS.modifiedDesc,
  },
  {
    label: "created time (new to old)",
    key: SORT_TAGS.createdAsc,
  },
  {
    label: "created time (old to new)",
    key: SORT_TAGS.createdDesc,
  },
];

export const SORT_FILES_OPTIONS: ContextMenuOption[] = [
  { label: "name (A to Z)", key: SORT_FILES.nameAsc },
  { label: "name (Z to A)", key: SORT_FILES.nameDesc },
  {
    label: "modified time (new to old)",
    key: SORT_FILES.modifiedAsc,
  },
  {
    label: "modified time (old to new)",
    key: SORT_FILES.modifiedDesc,
  },
  {
    label: "created time (new to old)",
    key: SORT_FILES.createdAsc,
  },
  {
    label: "created time (old to new)",
    key: SORT_FILES.createdDesc,
  },
];

export const TABLE_COLUMN_TYPES: Record<string, string> = {
  name: "name",
  modified: "modified",
  created: "created",
  size: "size",
  frontMatter: "frontMatter",
};

export const TABLE_COLUMN_LABELS: Record<string, string> = {
  name: "File name",
  modified: "Modified time",
  created: "Created time",
  size: "Size",
  frontMatter: "Property",
};

export const ALIGN_OPTIONS: Record<string, string> = {
  left: "left",
  center: "center",
  right: "right",
};

export const FILTER_TYPES: Record<string, string> = {
  select: "Select",
  text: "Text",
};
