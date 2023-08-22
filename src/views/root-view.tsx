import { ItemView, TFile, WorkspaceLeaf, getAllTags } from "obsidian";

import * as React from "react";
import { TagsView } from "./tags-view";
import { Root, createRoot } from "react-dom/client";
import TagsOverviewPlugin from "../main";
import { TaggedFile } from "src/types";
import { getAllTagsAndFiles, getTagsFromFile } from "src/utils";

export const VIEW_TYPE = "tags-overview-view";

export class RootView extends ItemView {
  plugin: TagsOverviewPlugin;
  root: Root;
  allTags: string[];
  allTaggedFiles: TaggedFile[];

  constructor(leaf: WorkspaceLeaf, plugin: TagsOverviewPlugin) {
    super(leaf);
    this.plugin = plugin;

    // Collect all tags and files
    const {
      allTags,
      allTaggedFiles,
    }: { allTags: string[]; allTaggedFiles: TaggedFile[] } = getAllTagsAndFiles(
      this.app
    );
    this.allTags = allTags;
    this.allTaggedFiles = allTaggedFiles;

    // Listen on file changes and update the list of tagged files
    plugin.registerEvent(
      this.app.vault.on("modify", (modifiedFile: TFile) => {
        const tags: string[] = getTagsFromFile(this.app, modifiedFile);
        const existingFile = this.allTaggedFiles.find(
          (f) => f.file.path === modifiedFile.path
        );
        if (tags.length && !existingFile) {
          this.allTaggedFiles.push({ file: modifiedFile, tags });
          this.render();
        } else if (
          tags.length &&
          existingFile &&
          tags.sort().join() !== existingFile.tags.sort().join()
        ) {
          existingFile.tags = tags;
          this.render();
        }
      })
    );

    // Remove deleted files from the list
    plugin.registerEvent(
      this.app.vault.on("delete", (deletedFile: TFile) => {
        this.allTaggedFiles = this.allTaggedFiles.filter(
          (f) => f.file.path !== deletedFile.path
        );
        this.render();
      })
    );
  }

  getViewType() {
    return VIEW_TYPE;
  }

  getDisplayText() {
    return "Tags overview";
  }

  getIcon(): string {
    return "tag";
  }

  async onOpen() {
    this.root = createRoot(this.containerEl.children[1]);
    this.render();
  }

  render() {
    if (this.root) {
      this.root.render(
        <TagsView
          rootView={this}
          allTags={this.allTags}
          allTaggedFiles={this.allTaggedFiles}
        />
      );
    }
  }

  async onClose() {
    this.root.unmount();
  }
}
