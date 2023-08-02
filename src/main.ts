import { App, Menu, Notice, Plugin, PluginSettingTab, Setting } from "obsidian";

import { RootView, VIEW_TYPE } from "./views/root-view";

export interface TagsOverviewPluginSettings {
  filterAnd: boolean;
  displayType: string;
  sortTags: string;
  sortFiles: string;
}

const DEFAULT_SETTINGS: TagsOverviewPluginSettings = {
  filterAnd: true,
  displayType: "compact",
  sortTags: "name",
  sortFiles: "name",
};

export default class TagsOverviewPlugin extends Plugin {
  settings: TagsOverviewPluginSettings;

  async onload() {
    await this.loadSettings();

    this.registerView(VIEW_TYPE, (leaf) => new RootView(leaf, this));

    this.addRibbonIcon("tag", "Tags overview", () => {
      this.activateView();
    });

    this.addRibbonIcon("dice", "Open menu", (event) => {
      const menu = new Menu();

      menu.addItem((item) =>
        item
          .setTitle("Copy")
          .setIcon("documents")
          .onClick(() => {
            new Notice("Copied");
          })
      );

      menu.addItem((item) =>
        item
          .setTitle("Paste")
          .setIcon("paste")
          .onClick(() => {
            new Notice("Pasted");
          })
      );

      menu.showAtMouseEvent(event);
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

  async saveSettings(settings) {
    console.log("saveSettings", settings);
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
