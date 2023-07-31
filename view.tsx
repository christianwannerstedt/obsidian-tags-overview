import { ItemView, WorkspaceLeaf } from "obsidian";

import * as React from "react";
import * as ReactDOM from "react-dom";
import { ReactView } from "./ReactView";
import { createRoot } from "react-dom/client";

export const VIEW_TYPE = "tags-overview-view";

export class TagsOverviewView extends ItemView {
  constructor(leaf: WorkspaceLeaf) {
    super(leaf);
  }

  getViewType() {
    return VIEW_TYPE;
  }

  getDisplayText() {
    return "Tags overview";
  }

  async onOpen() {
    const root = createRoot(this.containerEl.children[1]);
    this.root = root;
    root.render(
      <React.StrictMode>
        <ReactView app={this.app} vault={this.app.vault} />
      </React.StrictMode>
    );
  }

  async onClose() {
    ReactDOM.unmountComponentAtNode(this.containerEl.children[1]);
    this.root.unmount();
  }
}
