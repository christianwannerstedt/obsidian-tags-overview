# Tags overview - Obsidian plugin

This plugin for [Obsidian](https://obsidian.md/) adds an extended tags panel where tagged files can be overviewed, filtered and accessed in an easy way.

## Features

- Display tagged files directly.
- Toggle between list and table view.
- User friendly filter field.
- Additional sort options.
- Displays related tags (more info below).

### Related tags
When you filter the list of tags through a search, you can choose to display related tags. By default, the list will only include the tag(s) that are included in the search, but by showing related tags, tags that the files in the search contain are also included. The setting only affects which tags appear in the search results, not the files.

For example:
If a file contains the tags `#vehicle` and `#car`, then a search for `#vehicle` will show both tags in the result. However, files that only contain the `#car` tag will not be presented in the list.

### Nested tags
The plugin supports [nested tags](https://help.obsidian.md/Editing+and+formatting/Tags#Nested+tags), with an option to display nested tags as a tree or a flat list. You can choose to expand or collapse each nested level separately by clicking the arrow next to it.

## Install

### Manual installation
Unzip the [latest release](https://github.com/christianwannerstedt/obsidian-tags-overview/releases/latest) into your `<vault>/.obsidian/plugins/` folder.
