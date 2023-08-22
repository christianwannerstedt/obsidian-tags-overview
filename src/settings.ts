import { App, PluginSettingTab, Setting } from "obsidian";
import { DISPLAY_TYPE, SORT_FILES, SORT_TAGS } from "./constants";
import TagsOverviewPlugin from "./main";
import { formatDate } from "./utils";

export interface TagsOverviewSettings {
  filterAnd: boolean;
  displayType: string;
  sortTags: string;
  sortFiles: string;
  keepFilters: boolean;
  storedFilters: string;
  showRelatedTags: boolean;
  showCalendarDates: boolean;
  dateFormat: string;
}

export const DEFAULT_SETTINGS: TagsOverviewSettings = {
  filterAnd: true,
  displayType: DISPLAY_TYPE.compact,
  sortTags: SORT_TAGS.nameAsc,
  sortFiles: SORT_FILES.nameAsc,
  keepFilters: true,
  storedFilters: "",
  showRelatedTags: true,
  showCalendarDates: true,
  dateFormat: "YYYY-MM-DD",
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
      .setName("Show calendar dates")
      .setDesc(
        "Display dates relative to today. Will format a date with different strings if it is not older than a week."
      )
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.showCalendarDates)
          .onChange(async (value) => {
            this.plugin.settings.showCalendarDates = value;
            await this.plugin.saveData(this.plugin.settings);
            this.plugin.activateView();
          })
      );

    const date = new Date();
    const dateFormats = [
      "YYYY-MM-DD",
      "YYYY-MM-DD HH:mm",
      "YYYY-MM-DD HH:mm:ss",
      "DD/MM/YYYY",
      "l",
      "L",
      "LL",
      "LLL",
      "LLLL",
      "ll",
      "lll",
      "llll",
      "lll",
    ];
    new Setting(containerEl)
      .setName("Date format")
      .setDesc("Set the date format used in the results list")
      .addDropdown((dropdown) => {
        dateFormats.forEach((format) => {
          dropdown.addOption(format, formatDate(date, format));
        });
        dropdown.setValue(this.plugin.settings.dateFormat);
        dropdown.onChange(async (value) => {
          this.plugin.settings.dateFormat = value;
          await this.plugin.saveData(this.plugin.settings);
          this.plugin.activateView();
        });
      });
  }
}
