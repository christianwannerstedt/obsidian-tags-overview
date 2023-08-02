import { ItemView, WorkspaceLeaf } from "obsidian";

import * as React from "react";
import * as ReactDOM from "react-dom";
import { TagsView } from "./tags-view";
import { createRoot } from "react-dom/client";
import TagsOverviewPlugin from "../main";

export const VIEW_TYPE = "tags-overview-view";

export class RootView extends ItemView {
  plugin: TagsOverviewPlugin;

  constructor(leaf: WorkspaceLeaf, plugin: TagsOverviewPlugin) {
    super(leaf);
    this.plugin = plugin;

    console.log(
      new Intl.RelativeTimeFormat("en", { numeric: "always" }).format(-1, "day")
    );
  }

  getViewType() {
    return VIEW_TYPE;
  }

  getDisplayText() {
    return "Tags overview";
  }

  async onOpen() {
    const root = createRoot(this.containerEl.children[1]);
    root.render(<TagsView rootView={this} />);
  }

  async onClose() {
    ReactDOM.unmountComponentAtNode(this.containerEl.children[1]);
    // this.root.unmount();
  }
}
