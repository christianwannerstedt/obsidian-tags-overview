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
  tags: string[];
  formattedModified?: string;
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
