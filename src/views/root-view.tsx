import { ItemView, WorkspaceLeaf } from "obsidian";

import * as React from "react";
import { TagsView } from "./tags-view";
import { Root, createRoot } from "react-dom/client";
import TagsOverviewPlugin from "../main";

export const VIEW_TYPE = "tags-overview-view";

export class RootView extends ItemView {
  plugin: TagsOverviewPlugin;
  root: Root;

  constructor(leaf: WorkspaceLeaf, plugin: TagsOverviewPlugin) {
    super(leaf);
    this.plugin = plugin;

    plugin.registerEvent(this.app.vault.on("modify", this.render.bind(this)));
    plugin.registerEvent(this.app.vault.on("create", this.render.bind(this)));
    plugin.registerEvent(this.app.vault.on("delete", this.render.bind(this)));
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
      this.root.render(<TagsView rootView={this} />);
    }
  }

  async onClose() {
    this.root.unmount();
  }
}
