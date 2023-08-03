import { App, Menu, Notice, Plugin, PluginSettingTab, Setting } from "obsidian";

import { RootView, VIEW_TYPE } from "./views/root-view";
import { DISPLAY_TYPE, SORT_FILES, SORT_TAGS } from "./constants";

export interface TagsOverviewPluginSettings {
  filterAnd: boolean;
  displayType: string;
  sortTags: string;
  sortFiles: string;
}

const DEFAULT_SETTINGS: TagsOverviewPluginSettings = {
  filterAnd: true,
  displayType: DISPLAY_TYPE.compact,
  sortTags: SORT_TAGS.nameAsc,
  sortFiles: SORT_FILES.nameAsc,
};

export default class TagsOverviewPlugin extends Plugin {
  settings: TagsOverviewPluginSettings;

  async onload() {
    await this.loadSettings();

    this.registerView(VIEW_TYPE, (leaf) => new RootView(leaf, this));

    this.addRibbonIcon("tag", "Tags overview", () => {
      this.activateView();
    });

    // This adds a settings tab so the user can configure various aspects of the plugin
    this.addSettingTab(new SampleSettingTab(this.app, this));
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

  async saveSettings(settings: TagsOverviewPluginSettings) {
    this.settings = {
      ...this.settings,
      ...settings,
    };
    await this.saveData(this.settings);
  }
}

class SampleSettingTab extends PluginSettingTab {
  plugin: TagsOverviewPlugin;

  constructor(app: App, plugin: TagsOverviewPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    // new Setting(containerEl)
    //   .setName("Setting #1")
    //   .setDesc("It's a secret")
    //   .addText((text) =>
    //     text
    //       .setPlaceholder("Enter your secret")
    //       .setValue(this.plugin.settings.mySetting)
    //       .onChange(async (value) => {
    //         this.plugin.settings.mySetting = value;
    //         await this.plugin.saveSettings();
    //       })
    //   );
  }
}
