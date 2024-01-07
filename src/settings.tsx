import * as React from "react";

import { App, ButtonComponent, PluginSettingTab, Setting } from "obsidian";
import {
  ALIGN_OPTIONS,
  DISPLAY_TYPE,
  SORT_FILES,
  SORT_TAGS,
  TABLE_COLUMN_TYPES,
} from "./constants";
import TagsOverviewPlugin from "./main";
import { formatDate } from "./utils";
import { createRoot } from "react-dom/client";
import { SettingsView } from "./views/settings-view";
import { PropertyFilter, TableColumn } from "./types";

export interface TagsOverviewSettings {
  filterAnd: boolean;
  displayType: string;
  sortTags: string;
  sortFiles: string;
  keepFilters: boolean;
  storedFilters: string;
  showNested: boolean;
  showRelatedTags: boolean;
  showCalendarDates: boolean;
  dateFormat: string;
  tableColumns: TableColumn[];
  propertyFilters: PropertyFilter[];
}

export const DEFAULT_SETTINGS: TagsOverviewSettings = {
  filterAnd: true,
  displayType: DISPLAY_TYPE.list,
  sortTags: SORT_TAGS.nameAsc,
  sortFiles: SORT_FILES.nameAsc,
  keepFilters: true,
  storedFilters: "",
  showNested: false,
  showRelatedTags: true,
  showCalendarDates: true,
  dateFormat: "YYYY-MM-DD",
  tableColumns: [
    { type: TABLE_COLUMN_TYPES.name },
    { type: TABLE_COLUMN_TYPES.modified, align: ALIGN_OPTIONS.right },
  ],
  propertyFilters: [],
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
            this.plugin.refreshView();
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
            this.plugin.refreshView();
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
          this.plugin.refreshView();
        });
      });

    const root = document.createElement("div");
    root.className = "tags-overview-table-settings";
    containerEl.appendChild(root);

    const reactRoot = createRoot(root);
    reactRoot.render(<SettingsView plugin={this.plugin} />);

    new Setting(containerEl)
      .setName("Reset settings")
      .setDesc("Reset all settings to their default values")
      .addButton((button: ButtonComponent) =>
        button.setButtonText("Reset settings").onClick(async () => {
          if (confirm("Are you sure you want to reset the settings?")) {
            this.plugin.settings = Object.assign({}, DEFAULT_SETTINGS);
            await this.plugin.saveData(this.plugin.settings);
            this.display();
            this.plugin.refreshView();
          }
        })
      );
  }
}
