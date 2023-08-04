import { Plugin } from "obsidian";

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
      this.activateView();
    });

    // Add a settings tab
    this.addSettingTab(new TagsOverviewSettingTab(this.app, this));
  }

  async activateView() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE);

    await this.app.workspace.getRightLeaf(false).setViewState({
      type: VIEW_TYPE,
      active: true,
    });

    this.app.workspace.revealLeaf(
      this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]
    );
  }

  onunload() {}

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
}
