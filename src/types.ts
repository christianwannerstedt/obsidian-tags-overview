import { TFile } from "obsidian";

export interface SelectOption {
  value: string;
  label: string;
}

export interface TaggedFile {
  file: TFile;
  tags: string[];
  modified?: string;
}

export interface FilesByTag {
  [key: string]: TaggedFile[];
}
