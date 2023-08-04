import { App, PluginSettingTab, Setting } from "obsidian";
import { DISPLAY_TYPE, SORT_FILES, SORT_TAGS } from "./constants";
import TagsOverviewPlugin from "./main";

export interface TagsOverviewSettings {
  filterAnd: boolean;
  displayType: string;
  sortTags: string;
  sortFiles: string;
  keepFilters: boolean;
  storedFilters: string;
  showRelatedTags: boolean;
}

export const DEFAULT_SETTINGS: TagsOverviewSettings = {
  filterAnd: true,
  displayType: DISPLAY_TYPE.compact,
  sortTags: SORT_TAGS.nameAsc,
  sortFiles: SORT_FILES.nameAsc,
  keepFilters: true,
  storedFilters: "",
  showRelatedTags: true,
};

export class TagsOverviewSettingTab extends PluginSettingTab {
  plugin: TagsOverviewPlugin;

  constructor(app: App, plugin: TagsOverviewPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName("Keep filters")
      .setDesc("Keep any set filters between sessions")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.keepFilters)
          .onChange(async (value) => {
            this.plugin.settings.keepFilters = value;
            await this.plugin.saveData(this.plugin.settings);
            this.plugin.activateView();
          })
      );

    new Setting(containerEl)
      .setName("Show related tags")
      .setDesc(
        "Control which tags are displayed in the results list when filtering. When a filter is active, all files matching the searched tags will be displayed. If you choose to show related tags, all tags that are connected to one of the matched files will be displayed, otherwise only the tags used in the filtering will be displayed."
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showRelatedTags)
          .onChange(async (value) => {
            this.plugin.settings.showRelatedTags = value;
            await this.plugin.saveData(this.plugin.settings);
            this.plugin.activateView();
          })
      );
  }
}
