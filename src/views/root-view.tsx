import { ItemView, TFile, WorkspaceLeaf } from "obsidian";

import * as React from "react";
import { TagsView } from "./tags-view";
import { Root, createRoot } from "react-dom/client";
import TagsOverviewPlugin from "../main";
import { TaggedFile } from "src/types";
import {
  getAllTagsAndFiles,
  getNestedTags,
  getTaggedFileFromFile,
} from "src/utils";

export const VIEW_TYPE = "tags-overview-view";

export class RootView extends ItemView {
  plugin: TagsOverviewPlugin;
  root: Root;
  allTags: string[];
  taggedFilesMap: Map<TFile, TaggedFile>;

  constructor(leaf: WorkspaceLeaf, plugin: TagsOverviewPlugin) {
    super(leaf);
    this.plugin = plugin;

    // Collect all tags and files
    const {
      allTags,
      taggedFilesMap,
    }: { allTags: string[]; taggedFilesMap: Map<TFile, TaggedFile> } =
      getAllTagsAndFiles(this.app);
    this.allTags = allTags;
    this.taggedFilesMap = taggedFilesMap;

    // Listen on file changes and update the list of tagged files
    plugin.registerEvent(
      this.app.metadataCache.on("changed", (modifiedFile: TFile) => {
        this.taggedFilesMap.set(
          modifiedFile,
          getTaggedFileFromFile(this.app, modifiedFile)
        );

        // Update the allTags list
        this.allTags = [
          ...new Set(
            [...this.taggedFilesMap.values()].reduce(
              (tags: string[], taggedFile: TaggedFile) => [
                ...getNestedTags(taggedFile),
                ...taggedFile.tags,
                ...tags,
              ],
              []
            )
          ),
        ].sort();
        this.render();
      })
    );

    // Remove deleted files from the list
    plugin.registerEvent(
      this.app.vault.on("delete", (deletedFile: TFile) => {
        this.taggedFilesMap.delete(deletedFile);
        this.render();
      })
    );
  }

  refresh() {
    this.render();
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
          allTaggedFiles={[...this.taggedFilesMap.values()]}
        />
      );
    }
  }

  async onClose() {
    this.root.unmount();
  }
}
