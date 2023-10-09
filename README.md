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

![related-tags](https://github.com/christianwannerstedt/obsidian-tags-overview/assets/25314/9ed3edd0-b6a3-4669-aec1-6bc9158d93ad)

### Nested tags
The plugin supports [nested tags](https://help.obsidian.md/Editing+and+formatting/Tags#Nested+tags), with an option to display nested tags as a tree or a flat list. You can choose to expand or collapse each nested level separately by clicking the arrow next to it.

![nested-tags](https://github.com/christianwannerstedt/obsidian-tags-overview/assets/25314/3c551140-1c97-4fa4-aeb0-a8bef7608bb3)

### Different views
Choose between a table view or a more minimalistic list view. The table view will display the date when the file was last modified. It is possible to change the format of the dates in the plugin settings.

![display-types](https://github.com/christianwannerstedt/obsidian-tags-overview/assets/25314/bc677992-f1e9-4eb3-93bb-59955aee7120)

### Filter
Filter the list easily by selecting one or more tags in the dropdown menu. You can choose whether the results must match all search criterias (AND) or just any of them (OR). It is also possible to toggle a tag in the search by clicking on the tag in the results list while holding down ctrl/cmd.

![filter](https://github.com/christianwannerstedt/obsidian-tags-overview/assets/25314/f8374340-17da-4fd0-bde3-cebde2e74815)


## Install

### Manual installation
Unzip the [latest release](https://github.com/christianwannerstedt/obsidian-tags-overview/releases/latest) into your `<vault>/.obsidian/plugins/` folder.

### Within Obsidian
1. Go to `Settings > Community plugins`
2. Ensure that Safe mode is turned off
3. Click `Community plugins > Browse`
4. Search for `Tags overview`
5. Click install
6. Once installed, close the community plugins window and activate the newly installed plugin
