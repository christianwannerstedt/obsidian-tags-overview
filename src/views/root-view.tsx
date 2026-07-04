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
  shouldIncludeTaggedFile,
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

    const { allTags, taggedFilesMap } = getAllTagsAndFiles(
      this.app,
      this.plugin.settings.excludedPaths
    );
    this.allTags = allTags;
    this.taggedFilesMap = taggedFilesMap;

    plugin.registerEvent(
      this.app.metadataCache.on("changed", (modifiedFile: TFile) => {
        this.updateTaggedFile(modifiedFile);
        this.rebuildAllTags();
        this.render();
      })
    );

    plugin.registerEvent(
      this.app.vault.on("delete", (deletedFile: TFile) => {
        this.taggedFilesMap.delete(deletedFile);
        this.rebuildAllTags();
        this.render();
      })
    );
  }

  private updateTaggedFile(modifiedFile: TFile) {
    const taggedFile = getTaggedFileFromFile(this.app, modifiedFile);
    if (
      shouldIncludeTaggedFile(taggedFile, this.plugin.settings.excludedPaths)
    ) {
      this.taggedFilesMap.set(modifiedFile, taggedFile);
    } else {
      this.taggedFilesMap.delete(modifiedFile);
    }
  }

  private rebuildAllTags() {
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
  }

  rescan() {
    const { allTags, taggedFilesMap } = getAllTagsAndFiles(
      this.app,
      this.plugin.settings.excludedPaths
    );
    this.allTags = allTags;
    this.taggedFilesMap = taggedFilesMap;
    this.render();
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
