**🇯🇵 [日本語版紹介](README.jp.md)**

---

💡🐞 You're welcome to post your suggestions and bug reports [here](https://github.com/Merci-chao/userChrome.js/issues/new).

---

# [Multi Tab Rows](https://github.com/Merci-chao/userChrome.js/blob/main/MultiTabRows%40Merci.chao.uc.js)
Make Firefox support multiple rows of tabs.

![screenshot](https://raw.githubusercontent.com/Merci-chao/userChrome.js/refs/heads/main/screenshots/scrolling.png)
## Highlights

<table>
  <tr>
	  <td>🗂️&nbsp;Tab&nbsp;Groups&nbsp;Support</td>
	  <td>Fully supports mouse operations for tab groups, delivering a smoother and more graceful experience.</td>
  </tr>
  <tr>
	  <td>🎞️&nbsp;Enhanced&nbsp;Animations</td>
	  <td>Adds fluid transitions for various tab-related actions.</td>
  </tr>
  <tr>
	  <td>📐&nbsp;Optimized&nbsp;Space&nbsp;Usage</td>
	  <td>Makes full use of available UI space, including the area beneath window control buttons.</td>
  </tr>
  <tr>
	  <td>🖱️&nbsp;Smooth&nbsp;Dragging</td>
	  <td>Supports animated tab dragging even in multi-row mode.</td>
  </tr>
  <tr>
	  <td>📌&nbsp;Pinned&nbsp;Tabs&nbsp;Grid&nbsp;Layout</td>
	  <td>Pinned tabs remain neatly compact when the Tabs bar is scrollable, minimizing space usage.</td>
  </tr>
  <tr>
	  <td>🛠️&nbsp;Customizable&nbsp;Preferences</td>
	  <td>Offers a rich set of options and features to tailor the experience precisely to your liking.</td>
  </tr>
  <tr>
	  <td>🔄&nbsp;Auto-Update&nbsp;Checking</td>
	  <td>Ensures you're always equipped with the newest enhancements and compatibility.</td>
  </tr>
</table>

## Compatibility
- Firefox 115, 143 to 145 (excluding ESR versions), for Windows 7 to 11.
- Supports general script loaders, like xiaoxiaoflood's userChromeJS (Firefox Scripts).

## Cautions
**🚨 Please read the following notes carefully before using this script:**
- ❗ **Since this script contains many sensitive layout calculations designed for native Firefox, any tab-related legacy extensions (e.g. [Tab Mix Plus](https://onemen.github.io/tabmixplus-docs)), user scripts (`userChrome.js`) or CSS styles (`userChrome.css`) can cause weird glitches and bugs. **Please follow the installation steps below carefully.**
- This is an unofficial (and complicated) script maintained solely by me. This script may contain unforeseen bugs and is not guaranteed to keep compatible with the latest versions of Firefox. If an unexpected issue occurs, restarting Firefox may be necessary. In extreme cases — especially when using an outdated version of the script with a newly updated Firefox — the browser may become unusable, potentially resulting in the permanent loss of your previous browsing session. You may need to disable the script in such situations. Please use this script only if you are capable of and prepared to handle these risks.
- This script is developed for Windows and probably does not work on Ubuntu (Linux) and macOS.
- This script needs to override some functions of Firefox and requires [`security.allow_unsafe_dangerous_privileged_evil_eval`](https://bugzilla.mozilla.org/show_bug.cgi?id=1958232) to be enabled on Firefox 139+ for this purpose. The said setting is enabled automatically once you are applying this script, and it requires a manual disabling through `about:config` after disabling or removing the script. Please note that and use this script with understanding.

## Installation
1. Follow the instructions in the 📘[Tab Mix Plus - Docs](https://onemen.github.io/tabmixplus-docs/other/installation/#install-firefox-scripts) to install the script loader (Firefox Scripts) if you are not using any scripts. Skip this step if some scripts are already in use.
<br>![screenshot](https://raw.githubusercontent.com/Merci-chao/userChrome.js/refs/heads/main/screenshots/installscriptloader.png)
2. Make sure that no other tab-related scripts and CSS styles are currently in use. Just in case, temporarily move all other `.js` (excluding `userChrome.js`, if any) and `.css` files out of `chrome`. **There are many reports of issues caused by conflicts with customized styles.**
3. Download the 📥[script file](https://github.com/Merci-chao/userChrome.js/raw/refs/heads/main/MultiTabRows@Merci.chao.uc.js) and place it into `chrome`.
4. Restart Firefox to apply.
5. If you moved some files out of `chrome` in step 2, please confirm that this script works as expected. Once verified, you can move the files back. If any conflicts arise, modify the scripts and style rules accordingly. If you need help, please provide the information 🛟[here](https://github.com/Merci-chao/userChrome.js/issues/new).

> [!IMPORTANT]
> If the script loader stops working after updating Firefox, please visit the page above and reinstall the latest version of the script loader.

## Settings
Open [`about:config`](https://support.mozilla.org/kb/about-config-editor-firefox) and search for the prefix `userChromeJS.multiTabRows@Merci.chao.`. Settings shown in gray are disabled due to other preferences.

If configuring via `user.js` (not recommended), be sure to include the prefix `userChromeJS.multiTabRows@Merci.chao.`. Example:
```js
user_pref("userChromeJS.multiTabRows@Merci.chao.maxTabRows", 5);
```

> [!NOTE]
> Many of these settings may not take effect due to dependencies with other preferences. It is strongly recommended to configure them via `about:config` rather than using `user.js`.

### Operations

| Name (w/ prefix) | Description |
| ------------- | ------------- |
| `animateTabMoveMaxCount` | When the number of dragged tabs exceeds this value, drag animations are disabled and a drop indicator is shown instead. The minimum value is `0`. If dragging too many tabs causes lag, consider lowering this value.<br>📝 Note: Some tab grouping operations may be unavailable, and the final drop position is determined by Firefox's native behavior, which may not behave as expected in certain scenarios (Firefox bug [#1985434](https://bugzilla.mozilla.org/show_bug.cgi?id=1985434), [#1988159](https://bugzilla.mozilla.org/show_bug.cgi?id=1988159), [#1988162](https://bugzilla.mozilla.org/show_bug.cgi?id=1988162), [#1988194](https://bugzilla.mozilla.org/show_bug.cgi?id=1988194)). |
| `animationDuration` | Duration of animations in milliseconds (valid range: `0` - `1000`). Note: Lengthy animations could strain system performance. |
| `disableDragToPinOrUnpin` | Disable tab pinning/unpinning via drag-and-drop in the same window. Not available on Firefox 115. |
| `dragToGroupTabs` | Enable tab grouping when dragging tabs over another. Disabling this setting results in behavior that differs from when `browser.tabs.dragDrop.moveOverThresholdPercent` is set to `50` or below: the disabled state allows tabs to be added to or removed from a group without altering their order. Not available on Firefox 115 or `browser.tabs.groups.enabled` is `false`. |
| `dynamicMoveOverThreshold` | Make tab-dragging movement smoother in certain scenarios, e.g. dragging pinned or grouped tabs. Not available on Firefox 115, or either `dragToGroupTabs` or `browser.tabs.groups.enabled` is `false`. |
| `hideDragPreview` | Hide the drag preview during a drag interaction:<ul><li>`0` - never</li><li>`1` - tab groups only</li><li>`2` - tabs only</li><li>`3` - both</li></ul> |
| `hidePinnedDropIndicator` | Hide the indicator that appears when dragging a tab to pin it, if there are no existing pinned tabs. Not available on Firefox 115. |
| `hideScrollButtonsWhenDragging` | Visually hide the up/down scroll buttons when dragging. |
| `linesToDragScroll` | How many rows to scroll when dragging tabs to top/bottom edge. The minimum value is `1`. |
| `linesToScroll` | How many rows to scroll when using the mouse wheel. The minimum value is `1`. |
| `scrollButtonsSize` | The size (in pixels) of the scroll buttons during dragging. The minimum value is `0`, but it will be rendered as at least 2 device pixels in height; the maximum is limited to half the tab height. |

### Layout

| Name (w/ prefix) | Description |
| ------------- | ------------- |
| `autoCollapse` | **🚨 EXPERIMENTAL 🧪**<br>Tabs will collapse to a single row when the cursor is not hovering. Enabling this feature will forcibly disable `tabsUnderControlButtons`, and pinned tabs are no longer fixed in position. On Firefox 115, setting `layout.css.has-selector.enabled` as `true` is required.
| `autoCollapseDelayCollapsing` | Delay before collapsing the tabs when the cursor moves away (in milliseconds). |
| `autoCollapseDelayExpanding` | Delay before expanding the tabs when the cursor hovers over them (in milliseconds). |
| `compactControlButtons` | Display the window control buttons to a compact size, only available on Windows 10 and 11. |
| `gapAfterPinned` | Empty space between the pinned tabs and normal tabs. The minimum value is `0`. |
| `hideAllTabs` | Hide the "List all tabs" button. Only available on Firefox 115. On newer versions of Firefox, you may remove it by right-clicking on it and choosing "Remove from Toolbar". |
| `hideEmptyPlaceholderWhenScrolling` | If there is no item in the upper left corner, hide the empty space in that corner when Tabs Bar is scrollable, available when `tabsUnderControlButtons` is `2`. |
| `justifyCenter` | Justify tabs to the center horizontally:<ul><li>`0` - never</li><li>`1` - when there is only one row</li><li>`2` - always</li></ul>Behaviors such as closing tabs and collapsing tab groups may differ slightly when tabs are centered. |
| `maxTabRows` | Maximum number of rows to display at once. The minimum value is `1`. |
| `pinnedTabsFlexWidth` | **🚨 EXPERIMENTAL 🧪**<br>Make pinned tab sizing behave like normal tabs. Pinned tabs will no longer be fixed in position when Tabs Bar is scrollable. |
| `pinnedTabsFlexWidthIndicator` | Display an icon on pinned tabs. |
| `rowIncreaseEvery` | Each time the window width is increased by this amount, one more row is allowed. When set to the minimum value `0`, the maximum number of rows is directly allowed to be displayed. |
| `rowStartIncreaseFrom` | When the window width is larger than this number plus `rowIncreaseEvery`, multi-row display is allowed. |
| `spaceAfterTabs` | Empty space before the window control buttons. The minimum value is `0`. |
| `spaceAfterTabsOnMaximizedWindow` | Empty space before the window control buttons, when maximumized. The minimum value is `0`. |
| `spaceBeforeTabs` | Empty space on the left side of the window. The minimum value is `0`. |
| `spaceBeforeTabsOnMaximizedWindow` | Empty space on the left side of the window, when maximumized. The minimum value is `0`. |
| `tabMaxWidth` | Maximum width of tabs, including the white space around. Please use `browser.tabs.tabMinWidth` for the minimum width. |
| `tabsAtBottom` | Position the Tabs Bar beneath:<ul><li>`0` - Default</li><li>`1` - Navigation Toolbar</li><li>`2` - Bookmarks Toolbar</li></ul>Not available on Firefox 115. |
| `tabsbarItemsAlign` | Alignment of the items in Tabs Bar when there are multiple rows:<ul><li>`start` - top</li><li>`center` - middle</li><li>`end` - bottom</li></ul>This setting is only valid when `tabsUnderControlButtons` is `0`, or `1` with Tabs Bar is scrollable. |
| `tabsUnderControlButtons` | <a name="tabsUnderControlButtons"></a>**🚨 EXPERIMENTAL 🧪**<br>Show tabs beneath window control buttons when there are multiple rows:<ul><li>`0` - never</li><li>`1` - when Tabs Bar is not scrollable (legacy option, not recommended)</li><li>`2` - always</li></ul>If any issues occur, set the value to `0` to disable this feature. |
| `thinScrollbar` | Use a thin scrollbar without up and down buttons. |

### Appearance

| Name (w/ prefix) | Description |
| ------------- | ------------- |
| `dynamicThemeImageSize` | When using themes, the size of the background image changes with the current number of rows. |
| `floatingBackdropBlurriness` | How blurry the background of items covering the tabs is when Tabs Bar is scrollable, available when `tabsUnderControlButtons` is `2` and both `floatingBackdropClip` & `nativeWindowStyle` are `false`. The minimum value is `0`. Not available on Firefox 115. |
| `floatingBackdropClip` | Clip the area covered by items on the Tabs Bar when it is scrollable, available when `tabsUnderControlButtons` is `2`. |
| `floatingBackdropOpacity` | How opaque the background of items covering the tab is when Tabs Bar is scrollable, available when `tabsUnderControlButtons` is `2` and `floatingBackdropClip` is `false`. The value should be from `0` to `100`. |
| `nativeWindowStyle` | Display the system-native theme style (e.g. effects from tools like [DWMBlurGlass](https://github.com/Maplespe/DWMBlurGlass)) on Tabs Bar. To achieve the full visual effect on Windows 11, you may also need to enable `widget.windows.mica`. This behaves similarly to `browser.theme.windows.accent-color-in-tabs.enabled` when DWM tools are not used on Windows 10. Not available on Firefox 115, or using any Firefox theme with background image. |
| `scrollbarThumbColor` | Color of the scrollbar thumb, must be a valid CSS color, variable, or the keyword `auto`. |
| `scrollbarTrackColor` | Color of the scrollbar track, must be a valid CSS color, variable, or the keyword `auto`. |

### Miscellaneous

| Name (w/ prefix) | Description |
| ------------- | ------------- |
| `checkUpdate` | Check for a new version of this script when Firefox starts up or opens new windows. Set it to `1` or larger to enable, or `0` to disable. The value will be updated with the last checking time (e.g. `1759911972`).<br><b>💡 Enabling it is strongly recommended, as outdated scripts are unlikely to function properly on newer versions of Firefox.</b><br>📝 Note: Updates for this script will not be notified when using older versions of Firefox (except 115). |
| `checkUpdateAutoApply` | Update the script file automatically when there is a new version:<ul><li>`0` - never</li><li>`1` - ask</li><li>`2` - always</li><li>`3` - always and sliently, also receive updates for minor changes and fixes that do not trigger notifications</li></ul> |
| `checkUpdateFrequency` | How often to check for new versions (days). The minimum value is `1`. |
| `debugMode` | ⛔ Mode for debugging, not for general use. |

## Advanced Tweaks
You can use [`userChrome.css`](https://support.mozilla.org/kb/contributors-guide-firefox-advanced-customization) to tweak the following parameters to control tab size and spacing. The values shown below are default settings.

> [!NOTE]
> Avoid using decimal values or units other than pixels (`px`). 

```css
:root {
  /* Horizontal space between tabs */
  --tab-overflow-clip-margin: 2px !important;

  /* Horizontal padding of tabs */
  --tab-inline-padding: 8px !important;

  /* Height of tab content: compact - 29px, normal - 36px, touch - 41px, should not small than 24px */
  --tab-min-height: 36px !important;
	
  /* Vertical space between tabs */
  --tab-block-margin: 4px !important;
}

/*
  This rule is necessary when: var(--tab-min-height) + var(--tab-block-margin) * 2 < 33px
  Why 33px? The default height of .tab-label-container is 2.7em,
  which is 32.4px when the font size is 12px,
  and the tab should be taller than the .tab-label-container inside.
  Otherwise the tab height will contain decimal and cause issues.
  Example:
  - --tab-min-height = 29px
  - --tab-block-margin = 1px
  → Total: 29 + 1×2 = 31px
  Since 31px < 33px, then this rule needs to apply to prevent layout issues.
*/
.tab-label-container {
  height: auto !important;
}

.tab-content[pinned] {
  /* Horizontal padding of pinned tabs */
  padding-inline: 10px !important;
}

#tabbrowser-tabs {
  /* Horizontal padding in tab groups */
  --group-line-padding: 3px !important;

  /* Max width of the labels of tab groups. It's OK to use other units */
  --group-label-max-width: 10em !important;
}
```

There also few settings in `about:config` for the layout of tabs:

| Name (w/o prefix) | Description |
| ------------- | ------------- |
| `browser.tabs.tabClipWidth` | Close button will show on the tabs that are wider than this size. |
| `browser.tabs.tabMinWidth` | Minimum width of normal tabs, including the white space around. |
| `widget.windows.mica` | Apply the native system style on Tabs Bar (Windows 11). |
| `widget.windows.mica.toplevel-backdrop` | Choose the effect of backdrop (Windows 11).<ul><li>`0` - Auto</li><li>`1` - Mica</li><li>`2` - Acrylic</li><li>`3` - Mica Alt</li></ul> |
| `browser.theme.windows.accent-color-in-tabs.enabled` | Apply the system accent color on Tabs Bar (Windows 10). |

## Changelog
📥 [Download the Lastest Version](https://github.com/Merci-chao/userChrome.js/raw/refs/heads/main/MultiTabRows@Merci.chao.uc.js)

**Version 3.6**
- Add `pinnedTabsFlexWidthIndicator`: display an icon on pinned tabs when `pinnedTabsFlexWidth` is enabled.
- Change the "Stop checking" option in the update notification to "Update script file directly".
- Refine the behavior of dragging tabs to group with others or detach from a group when the dragged tabs are at the edge of the row.
- Refine the behavior of dragging tabs into or out of groups when `dragToGroupTabs` is `false`.
- Refine animations when pinned tabs are present and the Tabs Bar is scrollable.
- Refine animations for dragging tabs while pressing them against the edge of row.
- Pause the dragging animation when attempting to pin or unpin tabs.
- Workaround for Firefox bug [#1994643](https://bugzilla.mozilla.org/show_bug.cgi?id=1994643), which is amplified by this script.
- Bug fix: issues when enabling `pinnedTabsFlexWidth` and the pinned tab has no page icon.
- Fix minor visual bugs.

<details>
<summary>Old Versions</summary>

**Version 3.5.2**
- Bug fix: dragged tabs might not be moved to the intended position if it is pressed against to the edge.

**Version 3.5.1**
- Add `disableDragToPinOrUnpin`: Disable tab pinning/unpinning via drag-and-drop in the same window (not available on Firefox 115). This setting will be removed if an official one is introduced.
- Prevent window dragging during tab drop animation.

**Version 3.5**
- Update for Firefox 145.
- Add animation when tabs are moved to another window.
- Themes without background images can now use `nativeWindowStyle`.
- Adjust CSS variables: add `--group-label-max-width` and `--group-line-padding` on `#tabbrowser-tabs` to control the size of group label (See: [Advanced Tweaks](#advanced-tweaks)).
- Always close the menu when dragging an item from it onto the tab strip, if the menu overlaps the tab strip.
- Bug fix: background image issues when using `tabsAtBottom`.
- Bug fix: certain settings were unexpectedly disabled under specific conditions.
- Bug fix: issue occured after dragging tabs to pin or unpin them.
- Bug fix: issue occured after dragging tabs to copy them to another window.
- Bug fix: issue occured after dragging a tab group out of the window so fast.
- Minor bug fixes.
- Refine code style for better readability.

**Version 3.4.2**
- Bug fix: Could not drag and drop tabs when enabling `hidePinnedDropIndicator`.
- Bug fix: Tabs might have a weird jump on a newly opened window
- Bug fix: Tab close buttons did not always display or hide correctly.
- Bug fix: Layout issues with `tabsUnderControlButtons` in special cases.
- Updates for this script will no longer be notified when using older versions of Firefox (except 115).

<details>
<summary>Minor Updates</summary>

**Version 3.4.1.3**
- Drag-and-drop with a drop indicator now animate.

**Version 3.4.1.1**
- Bug fix: Drop indicator is positioned incorrectly when dragging non-tab items onto the pinned tabs.
</details>

**Version 3.4.1**
- Bug fix: Dropping non‑tab items onto Tabs Bar causes issues.
- Bug fix: `hideEmptyPlaceholderWhenScrolling` may not work on private windows.
- With `checkUpdateAutoApply` set to `3`, it will now also receive updates for minor changes and fixes that do not trigger notifications.

**Version 3.4**
- Add `animateTabMoveMaxCount`: When the number of dragged tabs exceeds this value, drag animations are disabled and a drop indicator is shown instead. The minimum value is `0`. If dragging too many tabs causes lag, consider lowering this value. Note: Some tab grouping operations may be unavailable, and the final drop position is determined by Firefox's native behavior, which may not behave as expected in certain scenarios.
- Add `hidePinnedDropIndicator`: Hide the indicator that appears when dragging a tab to pin it, if there are no existing pinned tabs (not available on Firefox 115).
- Streamline and improve the animation logic.
- The Tabs Bar will appear below the Bookmarks Toolbar when `tabsAtBottom` is set to `2`, even if Bookmarks Toolbar is set as "Only Show on New Tab".
- Improve `autoCollapse`: the tab strip now remains open while a context menu is displayed.
- Increase the default values for two delay settings for `autoCollapse`.
- Bug fix: When tab group spans multiple rows, collapsing or dragging it could be buggy in certain cases.
- Bug fix: Pressing the Esc key while dragging could cause issue.
- Bug fix: Copying multiple tabs with Ctrl key does not work reliably (Firefox bug #1987160).
- Bug fix: Tabs may scroll up when closing the last tab with keyboard shortcut.
- The script will never apply on popup windows.
- Update for Firefox 143 and 144.
- Multiple minor bug fixes.

**Version 3.3**
- Add `pinnedTabsFlexWidth`: Make pinned tab sizing behave like normal tabs. Pinned tabs will no longer be fixed in position when Tabs Bar is scrollable (experimental).
- Add `checkUpdateAutoApply`: Update the script file automatically when there is a new version. `0` - never, `1` - ask, `2` - always, `3` - always and slient.
- Fix a bug where reopening a closed pinned tab causes tab functions to not work normally on Firefox 142.
- Fix minor bugs related to full screen.
- `nativeWindowStyle` will also apply on full screen.
- Refine the behavior for locking the size of the Tabs Bar.
- Minor bug fix.

**Version 3.2.1**
- Bug fix: Tabs occasionally exhibit strange jittering during animation.
- Bug fix: "Drag to create group" sometimes doesn't behave smoothly.
- Bug fix: Dragging an open group doesn't behave smoothly since the previous version.
- Update for Firefox 143.

**Version 3.2**
- Add `justifyCenter`: Justify tabs to the center horizontally: `0` - never, `1` - when there is only one row, `2` - always. Behaviors such as closing tabs and collapsing tab groups may differ slightly when tabs are centered.
- Add `scrollButtonsSize`: The size (in pixels) of the scroll buttons during dragging. The minimum value is `2`; the maximum is limited to half the tab height.
- Update for Firefox 143.
- Fix the problem that cannot drag tabs onto the Bookmarks Toolbar in some cases.
- Bug fixes.

**Version 3.1**
- Add `autoCollapse` and related settings: tabs will collapse to a single row when the cursor is not hovering. On Firefox 115, `layout.css.has-selector.enabled` is required. (experimental)
- Add `tabsAtBottom`: position the Tabs Bar beneath `1` - Navigation Toolbar, `2` - Bookmarks Toolbar. Not available on Firefox 115.
- Add `hideDragPreview`: hide the drag preview during a drag interaction. Valid values are: `0` (never), `1` (tab groups only), `2` (tabs only), `3` (both).
- Add `animationDuration`: duration in milliseconds (valid range: `0` - `1000`). Note: Lengthy animations could strain system performance.
- Add `tabMaxWidth`: max width of tabs. Please use `browser.tabs.tabMinWidth` for the min width.
- Display the scroll up/down buttons when dragging, set `hideScrollButtonsWhenDragging` to `true` to hide it.
- When all tabs in a tab group are dragged, the group now remains until the tabs are dropped.
- Update for Firefox 142.
- Fix a glich when dragging tab to the top/bottom edge to scroll.
- Fix display issue with some themes.
- `compactControlButtons` is always available on Windows 11 now.
- Minor bug-fixes.

**Version 3.0**
- Add full support for tab groups.
- Introduce animations for various tab-related actions.
- Add the `dragToGroupTabs` option to enable or disable tab grouping when dragging tabs over another.
- Add the `dynamicMoveOverThreshold` option to make tab-dragging movement smoother in certain scenarios.
- Add the `nativeWindowStyle` option to display the system-native theme style on Tabs Bar (e.g. effects from DWM tools).
- Update for Firefox 141.
- Bug fixes and improvements.
 
**Version 2.6**
- Fix layout problem when there are some audio playing/blocked/muted tabs.
- Fix layout problem when UI density is `Touch`.

**Version 2.5.1**
- Fix a bug that can't drop non-tab things onto Tabs Bar since the previous version.

**Version 2.5**
- Improve the experience of dragging non-adjacent tabs.
- Add check-update feature. Change `checkUpdateFrequency` to how often (days) you want, disable it by setting `checkUpdate` to `0`.

**Version 2.4**
- Update for Firefox 138.
- Improvements and bug-fixings for tab dragging animation.

**Version 2.3.5.1**
- Bug fix: not working on Firefox 115

**Version 2.3.5**
- Update for Firefox 137.

**Version 2.3.4.2**
- Bug fix: tabs cannot be dragged to the first row in a special case.

**Version 2.3.3**
- Fix several bugs that occur when the window is too narrow and only one scrolling row is allowed to show.

**Version 2.3.2.3**
- Update for Firefox 136.

**Version 2.3.1**
- Update for the native tab groups feature.
- Fix a visual glitch when moving the selected pinned tabs together and Tabs Bar is scrollable.

**Version 2.2**
- Update the appearance of the scrollbar on Windows 11.
- Bug fix: layout may break when the display scaling is not 100%.
- Bug fix: tabs keep bouncing in some circumstances.

**Version 2.1.3.1**
- Bug fix: tabs keep bouncing in some spacial cases, typically happens when there are many pinned tabs.
- `tabsUnderControlButtons` is forced to be `0` now when tab groups is enabled (`browser.tabs.groups.enabled` is `true`).

**Version 2.1.2**
- Fix a bug since version 2.1: buttons before tabs cannot be clicked when there is only one row.

**Version 2.1.1**
- Fixed a bug where tabs kept bouncing in some cases.

**Version 2.1**
- Improve the behavior when closing tabs.

**Version 2.0.1**
- Bug fix: Changing settings or theme when there are multiple windows could cause Firefox to lag or freeze.

**Version 2.0**
- Implement `tabsUnderControlButtons = 2` (default).
- Add new settings: `floatingBackdropClip`, `floatingBackdropBlurriness`, `floatingBackdropOpacity`, `hideEmptyPlaceholderWhenScrolling`.
- Change `scrollbarTrackColor` and `scrollbarThumbColor` default value to `auto`.
- Settings are applied immediately.
- Better scrolling experience on tabs.
- Support Firefox 134.
- Various improvements and bug fixes.

**Version 1.0**
- First release.
</details>

## Won't Fixed Compatibility Issues
- Other tab related user scripts, styles, and legacy extensions (e.g. [Tab Mix Plus](https://onemen.github.io/tabmixplus-docs))
- Firefox Nightly
- Firefox 116 to the previous versions of latest released
- Touch operations
- macOS and Ubuntu (Linux)
- Vertical tabs, obviously

---

# [History Submenus II](https://github.com/Merci-chao/userChrome.js/blob/main/HistorySubmenus2%40Merci.chao.uc.js)
Add sub-menus to History Menu for previous days' history. [Add-on Page (web archive)](https://web.archive.org/web/20181102024750/https://addons.mozilla.org/en-US/firefox/addon/history-submenus-2/)

![screenshot](https://web.archive.org/web/20181007203210if_/https://addons.cdn.mozilla.net/user-media/previews/full/134/134638.png?modified=1530208752) 
![screenshot](https://web.archive.org/web/20181007203207if_/https://addons.cdn.mozilla.net/user-media/previews/full/63/63969.png?modified=1530208752)

## Settings
There is no setting panel and you need to open `about:config` and search for the prefix `extensions.HistorySubmenus2@Merci.chao.`.

> [!NOTE]
> Settings will apply to new windows.

| Name | Description |
| ------------- | ------------- |
| `checkUpdate` | Check for a new version of this script when Firefox starts up or opens new windows. Set it to `1` or larger to enable or `0` to disable. The value will be updated with the last checking time. <br><b>💡 Enabling it is strongly recommended, as outdated scripts are unlikely to function properly on newer versions of Firefox.</b> |
| `checkUpdateFrequency` | How often to check for new versions (days). The minimum value is `1`. |
| `dateFormat` | The format of the name of sub-menus.|
| `submenuCount` | Count of sub-menus.|
| `historyCount` | Count of items listing directly in the History menu.|

## Changelog
**Version 2025-08-14**
- Update for Firefox 143.
- Add check upate feature.

---

# [Page Title in URL Bar](https://github.com/Merci-chao/userChrome.js/blob/main/PageTitle%40Merci.chao.uc.js)
Show page title in URL Bar. [Add-on Page (web archive)](https://web.archive.org/web/20181101232504/https://addons.mozilla.org/en-US/firefox/addon/page-title/)

![screenshot](https://web.archive.org/web/20181009205610if_/https://addons.cdn.mozilla.net/user-media/previews/full/165/165890.png?modified=1530208887)

## Settings
Open `about:config` and search for the prefix `extensions.PageTitle@Merci.chao.`.

> [!NOTE]
> Settings will apply to new windows.

| Name | Description |
| ------------- | ------------- |
| `showDomain` | Display the domain nearby the lock icon. |
| `showSubTitle` | Display the url path after the page title. |
| `showUriOnHover` | Display the url temporarily when mouse hovering. |
| `decodeHashAndSearch` | Decode the hash and the query part, e.g. `/index.html#hello%20world` to `/index.html#hello world`. |
| `hideWww` | Hide the `www` sub-domain. |
| `highlightIdentityBox` | Add a backgrond for identity box (only when `showDomain` is `true`). |
| `formattingEnabled` | Highlight the domain (only when `showDomain` is `false`). |
| `checkUpdate` | Check for a new version of this script when Firefox starts up or opens new windows. Set it to `1` or larger to enable or `0` to disable. The value will be updated with the last checking time. <br><b>💡 Enabling it is strongly recommended, as outdated scripts are unlikely to function properly on newer versions of Firefox.</b> |
| `checkUpdateFrequency` | How often to check for new versions (days). The minimum value is `1`. |

## Changelog
**Version 2025-09-09**
- Add check upate feature.

---

# [Semi-Full Screen / Picture-in-Picture Mode](https://github.com/Merci-chao/userChrome.js/blob/main/SemiFullScreen%40Merci.chao.uc.js)
Full screen with keeping your task bar visible, or hide the toolbars when not maximized (picture-in-picture). [Add-on Page (web archive)](https://web.archive.org/web/20181102230042/https://addons.mozilla.org/en-US/firefox/addon/semi-full-screen/)

> [!WARNING]
> This version of Semi-Full Screen is not tested on Mac OS and Ubuntu (Linux). It is probably glitchy or simply doesn't work at all.

![screenshot](https://web.archive.org/web/20181013030904if_/https://addons.cdn.mozilla.net/user-media/previews/full/173/173740.png?modified=1530209326)

## Hotkeys
| Hotkey<br>(`⤢` - Full Screen Button) | Function |
| ------------- | ------------- |
| `F11` or `⤢` | Hide the toolbars and enter picture-in-picture mode. |
| `Ctrl`+`F11` or `Ctrl`+`⤢` | Mazimize the window and enter semi-full screen mode, taskbar and sidebar (if any) will keep visible. |
| `Shift`+`F11` or `Shift`+`⤢` | Enter normal full screen mode. |

## Settings
Open `about:config` and search for the prefix `extensions.SemiFullScreen@Merci.chao.`.

> [!NOTE]
> Settings will apply to new windows.

| Name | Description |
| ------------- | ------------- |
| `autoHideToolbarDelay` | The delay (in milliseconds) before auto-hiding the toolbar when the mouse has left the window edge and hasn't re-entered. |
| `checkUpdate` | Check for a new version of this script when Firefox starts up or opens new windows. Set it to `1` or larger to enable or `0` to disable. The value will be updated with the last checking time. <br><b>💡 Enabling it is strongly recommended, as outdated scripts are unlikely to function properly on newer versions of Firefox.</b> |
| `checkUpdateFrequency` | How often to check for new versions (days). The minimum value is `1`. |
| `reverse` | Use `F11` for semi-full screen and `Ctrl + F11` for picture-in-picture.|

## Changelog
**Version 2025-08-24**
- Restore missing window border on Windows 7 and 8.
- Add `autoHideToolbarDelay`: The delay (in milliseconds) before auto-hiding the toolbar when the mouse has left the window edge and hasn't re-entered.

**Version 2025-08-20**
- Not hiding the dragging spaces on no-Tabs Bar mode.

**Version 2025-08-16**
- Fix unintentional space on Tabs Bar.
- Add check upate feature.

---

# [Float Toolbars in Full Screen](https://github.com/Merci-chao/userChrome.js/blob/main/FloatToolbarsInFullScreen%40Merci.chao.uc.js)
Float the toolbars over the page in full screen mode, instead of making the web page jumpy when the toolbars showing / hiding. [Add-on Page (web achive)](https://web.archive.org/web/20181017035437/https://addons.mozilla.org/en-US/firefox/addon/float-toolbars-in-full-screen/)

**CAUTION: This version of Float Toolbars in Full Screen is not tested on Mac OS and Ubuntu (Linux). It is probably glitchy or simply doesn't work at all.**

![screenshot](https://web.archive.org/web/20181012014653if_/https://addons.cdn.mozilla.net/user-media/previews/full/180/180636.png?modified=1530209532)

## Settings
Open `about:config` and search for the prefix `FloatToolbarsInFullScreen@Merci.chao.`.

> [!NOTE]
> Settings will apply to new windows.

| Name | Description |
| ------------- | ------------- |
| `checkUpdate` | Check for a new version of this script when Firefox starts up or opens new windows. Set it to `1` or larger to enable or `0` to disable. The value will be updated with the last checking time. <br><b>💡 Enabling it is strongly recommended, as outdated scripts are unlikely to function properly on newer versions of Firefox.</b> |
| `checkUpdateFrequency` | How often to check for new versions (days). The minimum value is `1`. |

## Changelog
**Version 2025-08-16**
- Now the Tabs Bar will show the native window style in full screen.
- Add check upate feature.

---

# [undoCloseTab.uc.js](https://github.com/Merci-chao/userChrome.js/blob/main/undoCloseTab.uc.js)
Display the Undo Close Tabs, Recently Closed Tabs, Recently Closed Windows and Restore Previous Session at the Tabs Bar right-click menu.

---

# [restart-button.uc.js](https://github.com/Merci-chao/userChrome.js/blob/main/restart-button.uc.js)
Restart Firefox by middle-clicking on the Exit button in Application menu.

---

# [autoTitleBar@Merci.chao.uc.js](https://github.com/Merci-chao/userChrome.js/blob/main/autoTitleBar%40Merci.chao.uc.js)
Display the title bar on mouseover at the top edge; hide it when hovering over page content.

---

# [showScrollbarInMenus.uc.js](https://github.com/Merci-chao/userChrome.js/blob/main/showScrollbarInMenus.uc.js)
Display scrollbar for long menus (Bookmarks menu, for instance), instead of arrows at the top and bottom.
