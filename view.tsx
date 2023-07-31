import { ItemView, WorkspaceLeaf } from "obsidian";

import * as React from "react";
import * as ReactDOM from "react-dom";
import { ReactView } from "./ReactView";
import { createRoot } from "react-dom/client";
import TagsOverviewPlugin from "main";
import { AppContext } from "context";

export const VIEW_TYPE = "tags-overview-view";

export class TagsOverviewView extends ItemView {
  constructor(leaf: WorkspaceLeaf, plugin: TagsOverviewPlugin) {
    super(leaf);

    console.log("INIT, plugin: ", this);
  }

  getViewType() {
    return VIEW_TYPE;
  }

  getDisplayText() {
    return "Tags overview";
  }

  async onOpen() {
    const root = createRoot(this.containerEl.children[1]);
    root.render(
      <AppContext.Provider value={this.app}>
        <ReactView />
      </AppContext.Provider>
    );
  }

  async onClose() {
    ReactDOM.unmountComponentAtNode(this.containerEl.children[1]);
    // this.root.unmount();
  }
}
