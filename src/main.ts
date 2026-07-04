import { Plugin, WorkspaceLeaf } from "obsidian";

import {
  DEFAULT_SETTINGS,
  TagsOverviewSettingTab,
  TagsOverviewSettings,
} from "./settings";
import { RootView, VIEW_TYPE } from "./views/root-view";

export default class TagsOverviewPlugin extends Plugin {
  settings: TagsOverviewSettings;

  async onload() {
    await this.loadSettings();

    // Add the view
    this.registerView(VIEW_TYPE, (leaf) => new RootView(leaf, this));
    this.addRibbonIcon("tag", "Tags overview", () => {
      void this.activateView();
    });

    // Add a settings tab
    this.addSettingTab(new TagsOverviewSettingTab(this.app, this));
  }

  onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE);
  }

  async activateView() {
    let leaf: WorkspaceLeaf | null = this.getLeaf();
    if (!leaf) {
      leaf = this.app.workspace.getRightLeaf(false);
      if (leaf) {
        await leaf.setViewState({
          type: VIEW_TYPE,
          active: true,
        });
      }
    }

    if (leaf) {
      await this.app.workspace.revealLeaf(leaf);
    }
  }

  refreshView() {
    const leaf = this.getLeaf();
    if (leaf?.view) {
      (leaf.view as RootView).refresh();
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings(settings: Partial<TagsOverviewSettings>) {
    this.settings = {
      ...this.settings,
      ...settings,
    };
    await this.saveData(this.settings);
  }

  getLeaf(): WorkspaceLeaf | null {
    return this.app.workspace.getLeavesOfType(VIEW_TYPE).first() || null;
  }
}
