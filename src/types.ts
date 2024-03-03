import { TFile } from "obsidian";

export interface HeaderSetting {
  value: string | boolean;
  label: string;
}

export interface SelectOption {
  value: string;
  label: string;
}

export interface ContextMenuOption {
  key: string;
  label: string;
}

export interface TaggedFile {
  file: TFile;
  frontMatter: Record<string, string[]>;
  tags: string[];
  formattedModified?: string;
  formattedCreated?: string;
}

export interface FilesByTag {
  [key: string]: TaggedFile[];
}

export interface TagLevel {
  tag: string;
  files: string;
  sub: TagLevel[];
}

export interface TagData {
  tag: string;
  tagPath: string;
  files: TaggedFile[];
  sub: TagData[];
  subFilesCount: number;
  maxModifiedTime?: number;
  maxCreatedTime?: number;
}

export interface TableColumn {
  type: string;
  align?: string;
  data?: string;
}

export interface PropertyFilter {
  property: string;
  type: string;
}

export interface PropertyFilterData {
  selected: string[];
  filterAnd?: boolean;
  filterOperator?: string;
}

export interface PropertyFilterDataList {
  [key: string]: PropertyFilterData;
}

export interface AvailableFilterOptions {
  [key: string]: string[];
}

export interface StringMap {
  [key: string]: string;
}

export interface SavedFilter {
  name: string;
  selectedOptions: SelectOption[];
  filterAnd: boolean;
  properyFilters: PropertyFilterDataList;
}
