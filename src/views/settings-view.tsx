import * as React from "react";
import { TableColumnsSelector } from "../components/table-columns-select";
import TagsOverviewPlugin from "src/main";

export const SettingsView = ({ plugin }: { plugin: TagsOverviewPlugin }) => {
  let frontMatterPropertiesSet = new Set<string>();
  plugin.app.vault.getMarkdownFiles().forEach((file) => {
    let cache = plugin.app.metadataCache.getFileCache(file);
    if (cache?.frontmatter) {
      Object.keys(cache.frontmatter).forEach((key) =>
        frontMatterPropertiesSet.add(key)
      );
    }
  });

  const frontMatterProperties: string[] = Array.from(frontMatterPropertiesSet);

  return (
    <>
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
