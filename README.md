**🇯🇵 [日本語版紹介](README.jp.md)**

---

💡🐞 You're welcome to post your suggestions and bug reports [here](https://github.com/Merci-chao/userChrome.js/issues/new).

---

# [Multi Tab Rows](https://github.com/Merci-chao/userChrome.js/blob/main/MultiTabRows@Merci.chao.uc.js)
Make Firefox support multiple rows of tabs.

![screenshot](https://raw.githubusercontent.com/Merci-chao/userChrome.js/refs/heads/main/screenshots/scrolling.png)

📽️ [Preview Video](https://cdn.jsdelivr.net/gh/Merci-chao/userChrome.js@main/screenshots/preview4.0.mp4)

## Highlights

<table>
  <tr>
	  <td width="240">🚀 Newest Features Support</td>
	  <td>Fully supports the newest tab features, including Tab Group, Split View and Tab Stacking.</td>
  </tr>
  <tr>
	  <td>🖱️ Tab Dragging</td>
	  <td>Exclusively supports animated tab dragging in multi-row mode.</td>
  </tr>
  <tr>
	  <td>✨ Smooth Interactions</td>
	  <td>Provides a seamless and refined user experience for tab operations.</td>
  </tr>
  <tr>
	  <td>📐 Optimized Space Usage</td>
	  <td>Makes full use of available UI space, including the area beneath window control buttons.</td>
  </tr>
  <tr>
	  <td>📌 Pinned Tabs Grid Layout</td>
	  <td>Pinned tabs remain neatly compact when the Tabs bar is scrollable, minimizing space usage.</td>
  </tr>
  <tr>
	  <td>🛠️ Customizable Preferences</td>
	  <td>Offers a rich set of options and features to tailor the experience precisely to your liking.</td>
  </tr>
  <tr>
	  <td>🔄 Auto-Update Checking</td>
	  <td>Ensures you're always equipped with the newest enhancements and compatibility.</td>
  </tr>
</table>

## Compatibility
- Firefox 115, 146 to 148 (excluding ESR versions), for Windows 7 to 11.
- Supports general userChrome.js script loaders, such as:
	- [`firefox-scripts`](https://github.com/xiaoxiaoflood/firefox-scripts)
	- [`fx-autoconfig`](https://github.com/MrOtherGuy/fx-autoconfig)
 	- [`userChrome.js`](https://github.com/alice0775/userChrome.js)

## Cautions
**🚨 Please read the following notes carefully before using this script:**
- Since this script contains many sensitive layout calculations designed for native Firefox, any tab-related legacy extensions (e.g. [Tab Mix Plus](https://onemen.github.io/tabmixplus-docs)), user scripts (`userChrome.js`) or CSS styles (`userChrome.css`) can cause weird glitches and bugs.
  <br>⚠️ Please follow the installation steps below carefully.
- This is an unofficial (and complicated) script maintained solely by me. This script may contain unforeseen bugs and is not guaranteed to keep compatible with the latest versions of Firefox. If an unexpected issue occurs, restarting Firefox may be necessary. In extreme cases — especially when using an outdated version of the script with a newly updated Firefox — the browser may become unusable, potentially resulting in the permanent loss of your previous browsing session. You may need to disable the script in such situations. Please use this script only if you are capable of and prepared to handle these risks.
- This script is developed for Windows and probably does not work on Ubuntu (Linux) and macOS.
- This script needs to override some functions of Firefox and requires [`security.allow_unsafe_dangerous_privileged_evil_eval`](https://bugzilla.mozilla.org/show_bug.cgi?id=1958232) to be enabled on Firefox 139+ for this purpose. The said setting is enabled automatically once you are applying this script, and it requires a manual disabling through `about:config` after disabling or removing the script. Please note that and use this script with understanding.

## Installation
1. Install the script loader. Skip this step if you already have some scripts in use. There are several script loaders available:
	- [`firefox-scripts`](https://onemen.github.io/tabmixplus-docs/other/installation/#install-firefox-scripts) by *[xiaoxiaoflood](https://github.com/xiaoxiaoflood)*, maintained by *[onemen](https://github.com/onemen)*
	- [`fx-autoconfig`](https://github.com/MrOtherGuy/fx-autoconfig) by *[MrOtherGuy](https://github.com/MrOtherGuy)*
 	- [`userChrome.js`](https://github.com/alice0775/userChrome.js) by *[alice0775](https://github.com/alice0775)*
  <br><br>There is no difference among them for applying this script, so simply choose your preferred one. If you have no preference, you can follow the instructions in the 📘 [Tab Mix Plus - Docs](https://onemen.github.io/tabmixplus-docs/other/installation/#install-firefox-scripts) to install the `firefox-scripts`: 
  <br>![screenshot](https://raw.githubusercontent.com/Merci-chao/userChrome.js/refs/heads/main/screenshots/installscriptloader.png)
  <br>📝 The file placement location may slightly vary depending on the loader. The following steps assume the use of `firefox-scripts`.
2. Make sure that no other tab-related scripts and CSS styles are currently in use. Just in case, temporarily move all other `.js` and `.css` files (excluding the items in `utils` folder, and `userChrome.js`, if any) out of `chrome`.
   <br>⚠️ There are many reports of issues caused by conflicts with customized styles.
4. Download the 📥 [script file](https://github.com/Merci-chao/userChrome.js/raw/refs/heads/main/MultiTabRows@Merci.chao.uc.js) and place it into `chrome`.
5. Restart Firefox to apply.
6. If you moved some files out of `chrome` in step 2, please confirm that this script works as expected. Once verified, you can move the files back. If any conflicts arise, modify the scripts and style rules accordingly. If you need help, please provide the information 🛟 [here](https://github.com/Merci-chao/userChrome.js/issues/new).

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

### Interactions

| Name (w/ prefix) | Description |
| ------------- | ------------- |
| `animateTabMoveMaxCount` | When the number of dragged tabs exceeds this value, drag animations are disabled and a drop indicator is shown instead. Minimum: `0`. If dragging too many tabs causes lag, consider lowering this value.<br>📝 Note: Some tab grouping operations may be unavailable, and the final drop position is determined by Firefox's native behavior, which may not behave as expected in certain scenarios (e.g. Firefox bug [#1985434](https://bugzilla.mozilla.org/show_bug.cgi?id=1985434), [#1988159](https://bugzilla.mozilla.org/show_bug.cgi?id=1988159), [#1988162](https://bugzilla.mozilla.org/show_bug.cgi?id=1988162), [#1988194](https://bugzilla.mozilla.org/show_bug.cgi?id=1988194)). |
| `animationDuration` | Duration of animations in milliseconds (valid range: `0` - `1000`). Note: Lengthy animations could strain system performance. |
| `disableDragToPinOrUnpin` | Disable tab pinning/unpinning via drag-and-drop in the same window. |
| `dragStackPreceding` | Stack the preceding selected tabs of the dragged one (see [`browser.tabs.dragDrop.multiselectStacking`](#multiselectStacking)). When dragging the middle tab among selected ones, the following ones of the selected tabs may move forward undesirably. Disabling this setting can avoid the issue. |
| `dragToGroupTabs` | Enable tab grouping when dragging tabs over another. Disabling this setting results in behavior that differs from when `browser.tabs.dragDrop.moveOverThresholdPercent` is set to `50` or below: the disabled state allows tabs to be added to or removed from a group without altering their order. Not available on Firefox 115. |
| `dynamicMoveOverThreshold` | Make tab-dragging movement smoother in certain scenarios, e.g. dragging pinned or grouped tabs. Not available on Firefox 115, or `dragToGroupTabs` is `false`. |
| `hideDragPreview` | Hide the drag preview that appears next to the cursor during dragging:<ul><li>`0` - never</li><li>`1` - tab groups only</li><li>`2` - tabs only</li><li>`3` - both</li></ul> |
| `hidePinnedDropIndicator` | Hide the indicator that appears when dragging a tab to pin it, if there are no existing pinned tabs. Not available on Firefox 115. |
| `hideScrollButtonsWhenDragging` | Visually hide the up/down scroll buttons when dragging. |
| `linesToDragScroll` | How many rows to scroll when dragging tabs to top/bottom edge. Minimum: `1`. |
| `linesToScroll` | How many rows to scroll when using the mouse wheel. Minimum: `1`. |
| `previewPanelNoteEditable` | Allows the tab preview panel to be hovered, and the note inside to be editable (Firefox 148+). |
| `previewPanelShifted` | Shifts the preview panel when there are multiple rows, reducing the effect of the panel blocking items in the rows underneath. Affects tabs only when `previewPanelNoteEditable` is `true`.<ul><li>`0` - never</li><li>`1` - for groups</li><li>`2` - for tabs</li><li>`3` - for both</li></ul> |
| `scrollButtonsSize` | The size (in pixels) of the scroll buttons during dragging. Minimum: `0`, but it will be rendered as at least 2 device pixels in height; the maximum is limited to half the tab height. |

### Tabs Bar Layout

| Name (w/ prefix) | Description |
| ------------- | ------------- |
| `autoCollapse` | **🚨 EXPERIMENTAL 🧪**<br>Tabs will collapse to a single row when the cursor is not hovering. Enabling this feature will forcibly disable `tabsUnderControlButtons`, and pinned tabs are no longer fixed in position when Tabs Bar is scrollable. On Firefox 115, setting `layout.css.has-selector.enabled` as `true` is required.
| `autoCollapseDelayCollapsing` | Delay before collapsing the tabs when the cursor moves away (in milliseconds). Minimum: `0`. |
| `autoCollapseDelayExpanding` | Delay before expanding the tabs when the cursor hovers over them (in milliseconds). Minimum: `0`. |
| `compactControlButtons` | Display the window control buttons to a compact size, only available on Windows 10 and 11. |
| `hideAllTabs` | Hide the "List all tabs" button. Only available on Firefox 115. On newer versions of Firefox, you may remove it by right-clicking on it and choosing "Remove from Toolbar". |
| `hideEmptyPlaceholderWhenScrolling` | If there is no item in the upper left corner, hide the empty space in that corner when Tabs Bar is scrollable, available when `tabsUnderControlButtons` is `2`. |
| `justifyCenter` | Justify tabs to the center horizontally:<ul><li>`0` - never</li><li>`1` - when there is only one row</li><li>`2` - always</li></ul>Behaviors such as closing tabs and collapsing tab groups may differ slightly when tabs are centered. |
| `maxTabRows` | Maximum number of rows to display at once. Minimum: `1`. |
| `privateBrowsingIconOnNavBar` | Move the private window icon to Navigation Bar. Not available on Firefox 115. This setting is forcibly activated when `tabsAtBottom` is enabled. |
| `rowIncreaseEvery` | Each time the window width is increased by this amount, one more row is allowed. When set to the minimum value `0`, the maximum number of rows is directly allowed to be displayed. |
| `rowStartIncreaseFrom` | When the window width is larger than this number plus `rowIncreaseEvery`, multi-row display is allowed. |
| `spaceAfterTabs` | Empty space before the window control buttons. Minimum: `0`. |
| `spaceAfterTabsOnMaximizedWindow` | Empty space before the window control buttons, when maximumized. Minimum: `0`. |
| `spaceBeforeTabs` | Empty space on the left side of the window. Minimum: `0`. |
| `spaceBeforeTabsOnMaximizedWindow` | Empty space on the left side of the window, when maximumized. Minimum: `0`. |
| `tabsAtBottom` | Position the Tabs Bar beneath:<ul><li>`0` - Menu Bar</li><li>`1` - Navigation Toolbar</li><li>`2` - Bookmarks Toolbar</li></ul>Not available on Firefox 115. |
| `tabsbarItemsAlign` | Alignment of the items (mainly buttons) in Tabs Bar when there are multiple rows:<ul><li>`start` - top</li><li>`center` - middle</li><li>`end` - bottom</li></ul>This setting is only valid when `tabsUnderControlButtons` is `0`, or `1` with Tabs Bar is scrollable. |
| `tabsUnderControlButtons` | <a name="tabsUnderControlButtons"></a>**🚨 EXPERIMENTAL 🧪**<br>Show tabs beneath window control buttons when there are multiple rows:<ul><li>`0` - never</li><li>`1` - when Tabs Bar is not scrollable (legacy option, not recommended)</li><li>`2` - always</li></ul>If any issues occur, set the value to `0` to disable this feature. |
| `thinScrollbar` | Use a thin scrollbar without up and down buttons. |

### Tab Sizing

> [!NOTE]
> Not suggested to set narrower than the default value, as Firefox is not designed to be compact and unexpected glitches may occur. These settings may be overridden by rules in `userChrome.css` and have no effect.

| Name (w/ prefix) | Description |
| ------------- | ------------- |
| `gapAfterPinned` | Empty space between the pinned tabs and normal tabs. Minimum: `0`. |
| `pinnedTabsFlexWidth` | **🚨 EXPERIMENTAL 🧪**<br>Make pinned tab sizing behave like normal tabs. Pinned tabs will no longer be fixed in position when Tabs Bar is scrollable. |
| `pinnedTabsFlexWidthIndicator` | Display an icon on pinned tabs when `pinnedTabsFlexWidth` is enabled. |
| `tabContentHeight` | Height of tab content. Minimum: `16`. |
| `tabHorizontalMargin` | Horizontal space around tab. Minimum: `0`. |
| `tabHorizontalPadding` | Horizontal padding of tab. Minimum: `0`. |
| `tabMaxWidth` | Maximum width of tabs, including the surrounding white space. Use `browser.tabs.tabMinWidth` for the minimum width, and the actual maximum width will never be lower than that. |
| `tabVerticalMargin` | Vertical space around tab. Minimum: `0`. |

### Appearance

| Name (w/ prefix) | Description |
| ------------- | ------------- |
| `dynamicThemeImageSize` | When using themes, the size of the background image changes with the current number of rows. |
| `floatingBackdropBlurriness` | How blurry the background of items covering the tabs is when Tabs Bar is scrollable, available when `tabsUnderControlButtons` is `2` and both `floatingBackdropClip` & `nativeWindowStyle` are `false`. Minimum: `0`. Not available on Firefox 115. |
| `floatingBackdropClip` | Clip the area covered by items on the Tabs Bar when it is scrollable, available when `tabsUnderControlButtons` is `2`. |
| `floatingBackdropOpacity` | How opaque the background of items covering the tab is when Tabs Bar is scrollable, available when `tabsUnderControlButtons` is `2` and `floatingBackdropClip` is `false`. The value should be from `0` to `100`. |
| `nativeWindowStyle` | Display the system-native theme style (e.g. effects from tools like [DWMBlurGlass](https://github.com/Maplespe/DWMBlurGlass)) on Tabs Bar. To achieve the full visual effect on Windows 11, you may also need to enable `widget.windows.mica`. This behaves similarly to `browser.theme.windows.accent-color-in-tabs.enabled` when DWM tools are not used on Windows 10. Not available on Firefox 115, or using any Firefox theme with background image. |
| `scrollbarThumbColor` | Color of the scrollbar thumb, must be a valid CSS color, variable, or the keyword `auto`. |
| `scrollbarTrackColor` | Color of the scrollbar track, must be a valid CSS color, variable, or the keyword `auto`. |

### Miscellaneous

| Name (w/ prefix) | Description |
| ------------- | ------------- |
| `checkUpdate` | Check for a new version of this script when Firefox starts up or opens new windows. Set it to `1` or larger to enable, or `0` to disable. The value will be updated with the last checking time (e.g. `1759911972`).<br><b>💡 Enabling it is strongly recommended, as outdated scripts are unlikely to function properly on newer versions of Firefox.</b><br>📝 Note: Updates for this script will not be notified when using older versions of Firefox (except 115). |
| `checkUpdateAutoApply` | Update the script file automatically when there is a new version:<ul><li>`1` - never</li><li>`2` - always</li><li>`3` - always and sliently, also receive updates for minor changes and fixes that do not trigger notifications</li></ul> |
| `checkUpdateFrequency` | How often to check for new versions (days). Minimum: `1`. |
| `debugMode` | ⛔ Mode for debugging, not for general use. |

### Firefox Built-in Settings

| Name (w/o prefix) | Description |
| ------------- | ------------- |
| <span id="multiselectStacking">`browser.tabs.dragDrop.multiselectStacking`</span> | Enable tab stacking when dragging tabs. On Firefox 145 and below (including 115), create a new preference with this name and set it to `true` to enable. |
| `browser.tabs.splitView.enabled` | Enable the split view feature, available on Firefox 146 and above. |
| `browser.tabs.tabClipWidth` | Close button will show on the tabs that are wider than this size. |
| `browser.tabs.tabMinWidth` | Minimum width of normal tabs, including the white space around. Minimum: `50`. |
| `browser.theme.windows.accent-color-in-tabs.enabled` | Apply the system accent color on Tabs Bar (Windows 10). |
| `widget.windows.mica` | Apply the native system style on Tabs Bar (Windows 11). |
| `widget.windows.mica.toplevel-backdrop` | Choose the effect of backdrop (Windows 11).<ul><li>`0` - Auto</li><li>`1` - Mica</li><li>`2` - Acrylic</li><li>`3` - Mica Alt</li></ul> |

## Changelog
📥 [Download the Lastest Version](https://github.com/Merci-chao/userChrome.js/raw/refs/heads/main/MultiTabRows@Merci.chao.uc.js)

**Version 4.2**
- New
	- Add `previewPanelShifted`: Shifts the preview panel when there are multiple rows, reducing the effect of the panel blocking items in the rows underneath. Affects tabs only when `previewPanelNoteEditable` is `true`.
		- `0` - never
		- `1` - for groups
		- `2` - for tabs
		- `3` - for both
	- Add `previewPanelNoteEditable` (for Firefox 148+): Allows the tab preview panel to be hovered, and the note inside to be editable.
- Fixes
	- Continuously and rapidly closing tabs could result in the window being maximized/restored.
	- Issue that occurred when dragging the audio button of a non-selected tab.
	- Tab size locking issue when closing the last tab in certain cases.
	- Adjust the appearance of split view to match the original design.
	- Incorrect tab moved when dragging a non-selected tab from the tab list and drop it onto the tab strip.
	- Issue that occurred when pressing Ctrl to start dragging a split view.
	- Layout issue of tab group labels on older versions of Firefox.
	- Minor layout and visual issues.

**Version 4.1.3**
- Fixes
	- Firefox could freeze in certain cases when pinned tabs were present and the Tabs Bar became scrollable.
	- `tabHorizontalMargin` did not apply correctly to pinned tabs in Firefox 115.
	- Layout issue occurred in specific cases when modifying `tabContentHeight`.
	- `tabVerticalMargin` might be missing in `about:config` in certain cases.

<details>
<summary>Minor Updates</summary>

**Version 4.1.2.5**
- Adjusted margin of mini-audio button to prevent overlap with tab label.

**Version 4.1.2.4**
- Fix the layout issue that occurred when moving pinned tabs to another window while the Tabs Bar is scrollable.
- Fix the visual issue when closing pinned tabs.

**Version 4.1.2.3**
- Hide secondary tab label when `tabContentHeight` is bellow `30` (compact mode).
- Adjust the tab height in split view when it is too compact.
- The default value of `checkUpdateAutoApply` has been changed to `1`, which has the same effect as `0`.

**Version 4.1.2.2**
- Fix the visual issue of audio button on Firefox 115 since the last version.

**Version 4.1.2.1**
- Fix a visual bug that occurs when a tab in a split view is closing and the `tabMaxWidth` is smaller than a certain amount.
- Update the support for the tab note icon in Firefox 147+.
</details>

**Version 4.1.2**
- Fix
	- `tabMaxWidth` did not work on Firefox 146+.

**Version 4.1.1**
- Improvement
	- Update support for Firefox 148.
- Fix
	- Padding issue for pinned tabs when enabling `pinnedTabsFlexWidth` since v4.1.

<details>
<summary>Minor Updates</summary>

**Version 4.1.0.7**
- Fix an issue that may conflict with other scripts since v4.1.

**Version 4.1.0.6**
- Handle the case where `security.allow_unsafe_dangerous_privileged_evil_eval` is locked by the script loader.

**Version 4.1.0.2**
- Tune the sizing of group lines to achieve a better look with different values of `tabVerticalMargin`.
</details>

**Version 4.1**
- New
	- Add `tabContentHeight`, `tabVerticalMargin`, `tabHorizontalPadding` and `tabHorizontalMargin` to control tab height and spacing. Not suggested to set narrower than the default value, as Firefox is not designed to be compact and unexpected glitches may occur. These settings may be overridden by rules in `userChrome.css` and have no effect.
- Improvement
	- Tune the Tabs Bar layout when it is too compact.
	- Refine update notification UI.
- Fix
	- Notification Bar was placed incorrectly when  was enabled.

<details>
<summary>Minor Updates</summary>

**Version 4.0.2.3**
- Update the dependencies of settings in `about:config`.

**Version 4.0.2.2**
- Refine some minor animation related to tab group.

**Version 4.0.2.1**
- Follow up with the fix of Firefox bug [#1997096](https://bugzilla.mozilla.org/show_bug.cgi?id=1997096).

</details>

**Version 4.0.2**
- Fix
	- Layout problem that could occur when there were tabs with audio buttons since v4.0.

**Version 4.0.1**
- Fixes
	- Script was failed when newly installed.
 	- Could not move tabs between windows since v4.0.

**Version 4.0**
- New
	- Support the split view feature introduced in Firefox 146, which can be enabled by setting `browser.tabs.splitView.enabled` to `ture`.
	- Support for tab stacking when dragging multiple tabs. On Firefox 146, it can be enabled by setting `browser.tabs.dragDrop.multiselectStacking` to `true`. For Firefox 145 and below (including 115), a new boolean preference with that name needs to be created manually.
	- Add `dragStackPreceding`: stack the preceding selected tabs of the dragged one. When dragging the middle tab among selected ones, the following ones of the selected tabs may move forward undesirably. Disabling this setting can avoid the issue.
	- Support drag to pin/unpin on Firefox 115. Set `disableDragToPinOrUnpin` to `false` to enable.
	- Add `privateBrowsingIconOnNavBar`: move the private window icon to Navigation Bar. Not available on Firefox 115. This setting is forcibly activated when `tabsAtBottom` is enabled.
- Changes
	- In keeping with the original design of Firefox, `spaceAfterTabs`, `spaceAfterTabsOnMaximizedWindow`, `spaceBeforeTabs` and `spaceBeforeTabsOnMaximizedWindow` now affect the spacing at the edges of the Navigation Bar when `tabsAtBottom` is enabled.
	- In keeping with the original design of Firefox, `gapAfterPinned` now defaults to `0` on Firefox 143 and above.
	- Fix the size of New Tab button to prevent layout gliches.
- Improvement
	- Refine the behavior of tab size locking when closing tabs or collapsing tab groups.
	- Refine the dragging behavior to avoid the difficulty of moving items to the row edge in certain scenarios.
	- Update for Firefox 147.
	- Hide the group hover preview panel when scrolling.
	- Support `toolkit.tabbox.switchByScrolling`.
- Fixes
	- The group hover preview panel might incorrectly display when collapsing the group.
	- Scrolling was not smooth when expanding a group and the Tabs Bar started to scroll.
	- The animation of drag-and-drop with drop indicator was missing from v3.5.
	- Tabs Bar could not be scrolled after using the horizontal wheel.
	- Audio button did not have a consistent appearance on pinned tabs when `pinnedTabsFlexWidth` was enabled.
	- Incorrect minimum tab width and layout glitches when setting UI density to Touch.
	- Various minor bugs and issues.

<details>
<summary>Old Versions</summary>

<details>
<summary>Minor Updates</summary>

**Version 3.6.1.1**
- Bug fix: tab sizes were unlocked unexpectedly when rows were reduced, since version 3.6.0.1.

</details>

**Version 3.6.1**
- Update for `autoCollapse`:
	- Tabs Bar will now only expand for the current window.
	- Prevent Tabs Bar expand when URL bar is focused.
	- Clicking or pressing `Esc` will now help to collapse the Tabs Bar if it is not doing so in some rare cases.
	- Bug fix: issuse when dragging tab when there is only one row.
	- Bug fix: part of group line disappears when Tabs Bar is expanding.
- Fix a minor Firefox visual bug [#1995909](https://bugzilla.mozilla.org/show_bug.cgi?id=1995909).

<details>
<summary>Minor Updates</summary>

**Version 3.6.0.2**
- Reverse some code change for the scrollbar in the previous minor update.

**Version 3.6.0.1**
- Bug fix: resize the window immediately after closing a tab might result in an empty row temporarily.

</details>

**Version 3.6**
- Add `pinnedTabsFlexWidthIndicator`: display an icon on pinned tabs when `pinnedTabsFlexWidth` is enabled.
- Change the "Stop checking" option in the update notification to "Update script file directly".
- Refine the behavior of dragging a tab and pressing it to the edge of a row, to group with others on another row, or detach from a group.
- Refine the behavior of dragging tabs into or out of groups when `dragToGroupTabs` is `false`.
- Refine animations when pinned tabs are present and the Tabs Bar is scrollable.
- Refine animations for dragging tabs while pressing them against the edge of row.
- Pause the dragging animation when attempting to pin or unpin tabs.
- Workaround for Firefox bug [#1994643](https://bugzilla.mozilla.org/show_bug.cgi?id=1994643), which is amplified by this script.
- Bug fix: issues when enabling `pinnedTabsFlexWidth` and the pinned tab has no page icon.
- Fix minor visual bugs.

**Version 3.5.2**
- Bug fix: dragged tabs might not be moved to the intended position if it is pressed against to the edge.

**Version 3.5.1**
- Add `disableDragToPinOrUnpin`: Disable tab pinning/unpinning via drag-and-drop in the same window (not available on Firefox 115). This setting will be removed if an official one is introduced.
- Prevent window dragging during tab drop animation.

**Version 3.5**
- Update for Firefox 145.
- Add animation when tabs are moved to another window.
- Themes without background images can now use `nativeWindowStyle`.
- Adjust CSS variables: add `--group-label-max-width` and `--group-line-padding` on `#tabbrowser-tabs` to control the size of group label.
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
- Add `animateTabMoveMaxCount`: When the number of dragged tabs exceeds this value, drag animations are disabled and a drop indicator is shown instead. Minimum: `0`. If dragging too many tabs causes lag, consider lowering this value. Note: Some tab grouping operations may be unavailable, and the final drop position is determined by Firefox's native behavior, which may not behave as expected in certain scenarios.
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
- Add `scrollButtonsSize`: The size (in pixels) of the scroll buttons during dragging. Minimum: `2`; the maximum is limited to half the tab height.
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
- Other tab related scripts, styles, and legacy extensions (e.g. [Tab Mix Plus](https://onemen.github.io/tabmixplus-docs))
- Firefox Nightly
- Firefox 116 to the previous versions of latest released
- Touch operations
- macOS and Ubuntu (Linux)
- Vertical tabs, obviously

---

# [History Submenus II](https://github.com/Merci-chao/userChrome.js/blob/main/HistorySubmenus2@Merci.chao.uc.js)
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
| `checkUpdateAutoApply` | Update the script file automatically when there is a new version:<ul><li>`1` - never</li><li>`2` - always</li><li>`3` - always and sliently</li></ul> |
| `checkUpdateFrequency` | How often to check for new versions (days). Minimum: `1`. |
| `dateFormat` | The format of the name of sub-menus.|
| `submenuCount` | Count of sub-menus.|
| `historyCount` | Count of items listing directly in the History menu.|

## Changelog
📥 [Download the Lastest Version](https://github.com/Merci-chao/userChrome.js/raw/refs/heads/main/HistorySubmenus2@Merci.chao.uc.js)

**Version 2025-08-14**
- Update for Firefox 143.
- Add check upate feature.

---

# [Page Title in URL Bar](https://github.com/Merci-chao/userChrome.js/blob/main/PageTitle@Merci.chao.uc.js)
Show page title in URL Bar. [Add-on Page (web archive)](https://web.archive.org/web/20181101232504/https://addons.mozilla.org/en-US/firefox/addon/page-title/)

![screenshot](https://web.archive.org/web/20181009205610if_/https://addons.cdn.mozilla.net/user-media/previews/full/165/165890.png?modified=1530208887)

## Settings
Open `about:config` and search for the prefix `extensions.PageTitle@Merci.chao.`.

> [!NOTE]
> Settings will apply to new windows.

| Name | Description |
| ------------- | ------------- |
| `checkUpdate` | Check for a new version of this script when Firefox starts up or opens new windows. Set it to `1` or larger to enable or `0` to disable. The value will be updated with the last checking time. <br><b>💡 Enabling it is strongly recommended, as outdated scripts are unlikely to function properly on newer versions of Firefox.</b> |
| `checkUpdateAutoApply` | Update the script file automatically when there is a new version:<ul><li>`1` - never</li><li>`2` - always</li><li>`3` - always and sliently</li></ul> |
| `checkUpdateFrequency` | How often to check for new versions (days). Minimum: `1`. |
| `decodeHashAndSearch` | Decode the hash and the query part, e.g. `/index.html#hello%20world` to `/index.html#hello world`. |
| `formattingEnabled` | Highlight the domain (only when `showDomain` is `false`). |
| `hideWww` | Hide the `www` sub-domain. |
| `highlightIdentityBox` | Add a backgrond for identity box (only when `showDomain` is `true`). |
| `showDomain` | Display the domain nearby the lock icon. |
| `showSubTitle` | Display the URL path after the page title. |
| `showUnicodeDomain` | Display the Unicode characters in domain. |
| `showUriOnHover` | Display the URL temporarily when mouse hovering. |

## Changelog
📥 [Download the Lastest Version](https://github.com/Merci-chao/userChrome.js/raw/refs/heads/main/PageTitle@Merci.chao.uc.js)

**Version 2025-12-16**
- Add `showUnicodeDomain`: display the Unicode characters in domain. 

**Version 2025-12-12**
- Support Trust Panel feature.
- Update the update-checking feature.
- Add `checkUpdateAutoApply`: update the script file automatically when there is a new version, `1` - never, `2` - always, `3` - always and sliently.

**Version 2025-11-28**
- Update for Firefox 147.

**Version 2025-11-16**
- Update for Firefox 147.

**Version 2025-09-09**
- Add check upate feature.

---

# [Semi-Full Screen / Picture-in-Picture Mode](https://github.com/Merci-chao/userChrome.js/blob/main/SemiFullScreen@Merci.chao.uc.js)
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
| `checkUpdateAutoApply` | Update the script file automatically when there is a new version:<ul><li>`1` - never</li><li>`2` - always</li><li>`3` - always and sliently</li></ul> |
| `checkUpdateFrequency` | How often to check for new versions (days). Minimum: `1`. |
| `reverse` | Use `F11` for semi-full screen and `Ctrl + F11` for picture-in-picture.|

## Changelog
📥 [Download the Lastest Version](https://github.com/Merci-chao/userChrome.js/raw/refs/heads/main/SemiFullScreen@Merci.chao.uc.js)

**Version 2025-08-24**
- Restore missing window border on Windows 7 and 8.
- Add `autoHideToolbarDelay`: The delay (in milliseconds) before auto-hiding the toolbar when the mouse has left the window edge and hasn't re-entered.

**Version 2025-08-20**
- Not hiding the dragging spaces on no-Tabs Bar mode.

**Version 2025-08-16**
- Fix unintentional space on Tabs Bar.
- Add check upate feature.

---

# [Float Toolbars in Full Screen](https://github.com/Merci-chao/userChrome.js/blob/main/FloatToolbarsInFullScreen@Merci.chao.uc.js)
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
| `checkUpdateAutoApply` | Update the script file automatically when there is a new version:<ul><li>`1` - never</li><li>`2` - always</li><li>`3` - always and sliently</li></ul> |
| `checkUpdateFrequency` | How often to check for new versions (days). Minimum: `1`. |

## Changelog
📥 [Download the Lastest Version](https://github.com/Merci-chao/userChrome.js/raw/refs/heads/main/FloatToolbarsInFullScreen@Merci.chao.uc.js)

**Version 2025-08-16**
- Now the Tabs Bar will show the native window style in full screen.
- Add check upate feature.

---

# [undoCloseTab.uc.js](https://github.com/Merci-chao/userChrome.js/blob/main/undoCloseTab.uc.js)
Display the Undo Close Tabs, Recently Closed Tabs, Recently Closed Windows and Restore Previous Session at the Tabs Bar right-click menu.

---

# [lockBookmarksDefaultLocation.uc.js](https://github.com/Merci-chao/userChrome.js/blob/main/lockBookmarksDefaultLocation.uc.js)
Lock the location of newly added bookmarks, preventing it from being changed by Firefox. 

Before applying this script, click the Star button in the URL bar to create a new bookmark, and set the folder as the default location.

---

# [restart-button.uc.js](https://github.com/Merci-chao/userChrome.js/blob/main/restart-button.uc.js)
Restart Firefox by middle-clicking on the Exit button in Application menu.

---

# [autoTitleBar@Merci.chao.uc.js](https://github.com/Merci-chao/userChrome.js/blob/main/autoTitleBar%40Merci.chao.uc.js)
Display the title bar on mouseover at the top edge; hide it when hovering over page content.

---

# [showScrollbarInMenus.uc.js](https://github.com/Merci-chao/userChrome.js/blob/main/showScrollbarInMenus.uc.js)
Display scrollbar for long menus (Bookmarks menu, for instance), instead of arrows at the top and bottom.
