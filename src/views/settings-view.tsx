import * as React from "react";
import { TableColumnsSelector } from "../components/table-columns-select";
import { PropertyFilterSelector } from "../components/property-filter-select";
import TagsOverviewPlugin from "src/main";

export const SettingsView = ({ plugin }: { plugin: TagsOverviewPlugin }) => {
  const frontMatterPropertiesSet = new Set<string>();
  plugin.app.vault.getMarkdownFiles().forEach((file) => {
    const cache = plugin.app.metadataCache.getFileCache(file);
    if (cache?.frontmatter) {
      Object.keys(cache.frontmatter).forEach((key) =>
        frontMatterPropertiesSet.add(key)
      );
    }
  });

  // Convert to array and sort
  const frontMatterProperties: string[] = Array.from(frontMatterPropertiesSet);
  frontMatterProperties.sort((a, b) => a.localeCompare(b));

  return (
    <>
      <div className="setting-item">
        <div className="setting-item-info">
          <div className="setting-item-name">Property filters</div>
          <div className="setting-item-description">
            Add additional filters.
          </div>
        </div>
      </div>
      <PropertyFilterSelector
        plugin={plugin}
        frontMatterProperties={frontMatterProperties}
      />

      <div className="setting-item">
        <div className="setting-item-info">
          <div className="setting-item-name">Table columns</div>
          <div className="setting-item-description">
            Select which columns to show in the list view table.
          </div>
        </div>
      </div>
      <TableColumnsSelector
        plugin={plugin}
        frontMatterProperties={frontMatterProperties}
      />
    </>
  );
};
