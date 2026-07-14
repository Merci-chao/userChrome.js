**🇯🇵 [日本語版紹介](README.jp.md)**

---

💡🐞 You're welcome to post your suggestions and bug reports [here](https://github.com/Merci-chao/userChrome.js/issues/new).

---

# [Multi Tab Rows](https://github.com/Merci-chao/userChrome.js/blob/main/MultiTabRows@Merci.chao.uc.js)
Make Firefox support multiple rows of tabs.

![screenshot](https://cdn.jsdelivr.net/gh/Merci-chao/userChrome.js@main/screenshots/preview.png)

![screenshot](https://cdn.jsdelivr.net/gh/Merci-chao/userChrome.js@main/screenshots/tabsAtBottom.en.png)

## Introduction

Check out the [introduction page](https://merci-chao.github.io/userChrome.js/multitabrows/en/) to explore the highlights with screenshots and detailed descriptions.

## Compatibility
- Firefox 115, 140, 151 - 153

- Windows 7 - 11

- Supports general *userChrome.js* script loaders, such as:
	- [*MrOtherGuy/fx-autoconfig*](https://github.com/MrOtherGuy/fx-autoconfig)
	- [*xiaoxiaoflood/firefox-scripts*](https://github.com/xiaoxiaoflood/firefox-scripts)
 	- [*alice0775/userChrome.js*](https://github.com/alice0775/userChrome.js)
 	- [*Endor8/userChrome.js*](https://github.com/Endor8/userChrome.js)
 	- [*BSTweaker/UserChromeJS*](https://bitbucket.org/BSTweaker/userchromejs/src/master/loader/)

## Cautions
**🚨 Please read the following notes carefully before using this script:**
- This script is developed for Windows and has been lightly tested on Ubuntu (Linux). It has not been tested on macOS and probably does not work there. Other Firefox-based derivative browsers are not supported.

- Since this script contains many sensitive layout calculations designed for native Firefox, any tab-related legacy extensions (e.g. [*Tab Mix Plus*](https://onemen.github.io/tabmixplus-docs)), user scripts (`*.uc.js`) or customized styles (`userChrome.css`) can cause weird glitches and bugs.
  <p>⚠️ Please follow the installation steps below carefully.</p>

- This is an unofficial and complex script maintained solely by me. It may contain unforeseen bugs, and if unexpected issues occur, restarting Firefox may be required. In extreme cases — especially when using an outdated version of the script with a newly updated Firefox — the browser may become unusable, potentially resulting in the permanent loss of your previous browsing session. You may need to disable the script in such situations. Please use this script only if you are capable of and prepared to handle these risks.

- This script is more like a meticulous tab extension than a simple multi-row tweak. It consolidates thousands of lines of logic and styling into a single file, yet remains as manageable as a typical script. It is a hardcore implementation built with perfection and performance in mind. The number of lines is never a concern during development — just as *Tab Mix Plus* could never be achieved with only a few hundred lines of half-baked code. However, if you prefer something simple and fully understandable in coding — providing a stronger sense of safety and allowing you to easily make changes at will — this may not be your favorite choice.

- Always use scripts and files from sources you trust. Malicious code can cause severe damage, such as corrupting your files, hacking into your accounts, or stealing sensitive information like bank and credit card details — and all of this can happen without you even noticing.

## Installation
1. Please ensure you are using a Firefox version listed in the [compatibility list](#compatibility) above. Other Firefox versions and operating systems may potentially not be supported.

2. Install the script loader (*userChrome.js*). Skip to step 4 if you already have one in use. There are several script loaders available:
	- [*MrOtherGuy/fx-autoconfig*](https://github.com/MrOtherGuy/fx-autoconfig)
	- [*Firefox Scripts*](https://onemen.github.io/tabmixplus-docs/other/installation/#install-firefox-scripts) (forked from *xiaoxiaoflood/firefox-scripts*)
 	- [*alice0775/userChrome.js*](https://github.com/alice0775/userChrome.js) (Japanese)
 	- [*Endor8/userChrome.js*](https://github.com/Endor8/userChrome.js) (German)
 	- [*BSTweaker/UserChromeJS*](https://bitbucket.org/BSTweaker/userchromejs/src/master/loader/) (Japanese)
   <p>There is no difference among them for applying this script, so simply choose your preferred one. If you have no preference, you can try <em>MrOtherGuy/fx-autoconfig</em>, which provides an <a href="https://github.com/MrOtherGuy/fx-autoconfig/commit/8453c45dc67496864aeb593dabb8d991a5785989">update-checking feature</a>, or follow the instructions in the <a href="https://onemen.github.io/tabmixplus-docs/other/installation/#install-firefox-scripts"><em>Tab Mix Plus - Docs</em></a> to install the <em>Firefox Scripts</em>.</p>
   <p><image src="https://github.com/Merci-chao/userChrome.js/raw/refs/heads/main/screenshots/installscriptloader.png"></p>
   <p>⛔ Do not install <em>Tab Mix Plus</em> as it will cause conflict.</p>
   <p>🚨 It is very common for script loaders to stop working after a Firefox update. Please check the pages above for the new version of your script loader if this happens.</p>

3. Quit Firefox completely (`Ctrl`+`Shift`+`Q`) and restart (or use the *Clear startup cache* button in [*about:support*](https://support.mozilla.org/kb/use-troubleshooting-information-page-fix-firefox) to restart), then check whether the script loader is running correctly if you are using:
   <table>
	   <tr>
		   <td><em>MrOtherGuy/fx-autoconfig</em></td>
		   <td>On the first run, Firefox will display the notification message <em>"fx-autoconfig: Firefox is being modified with custom autoconfig scripting"</em>. Additionally, A new item called <em>userScripts</em> appears in the <em>Tools</em> menu (<code>Alt</code>+<code>T</code>).</td>
	   </tr>
	   <tr>
		   <td width="230"><em>Firefox Scripts</em></td>
		   <td>Open <a href="https://support.mozilla.org/kb/about-config-editor-firefox"><em>about:config</em></a> and search for <code>userChromeJS.enabled</code> to verify whether the preference exists, and there is no delete button (🗑) on the right.</td>
	   </tr>
	   <tr>
		   <td><em>alice0775/userChrome.js</em></td>
		   <td>Press <code>Ctrl</code>+<code>Shift</code>+<code>J</code> to open the <em>Browser Console</em>. Enable the <em>Logs</em> filter, enter <code>getScripts</code> in the <em>Filter Output</em>, and verify whether the related logs appear.<details><summary>Screenshot</summary><img src="https://cdn.jsdelivr.net/gh/Merci-chao/userChrome.js@main/screenshots/alice-scriptloader-en.png"></details></td>
	   </tr>
	   <tr>
		   <td><em>Endor8/userChrome.js</em></td>
		   <td>There is no simple method to verify.</td>
	   </tr>
	   <tr>
		   <td><em>BSTweaker/UserChromeJS</em></td>
		   <td>A new item called <em>UserChromeJSLoader</em> appears in the <em>Tools</em> menu (<code>Alt</code>+<code>T</code>).</td>
	   </tr>
   </table>

4. Make sure that no other tab-related scripts and customized styles are currently in use. Just in case, temporarily move all other `*.uc.js` and `userChrome.css` files out of `chrome`.
   <p>⚠️ There are many reports of issues caused by conflicts with customized styles in <code>userChrome.css</code>. It is highly recommended to remove all styles related to tabs or the tab bar first, then rewrite afterward if the settings below do not cover.</p>

5. Download the 📥 [script file](https://github.com/Merci-chao/userChrome.js/raw/refs/heads/main/MultiTabRows@Merci.chao.uc.js) (right-click and save as) and place it in `chrome` (or in `chrome/JS` if you are using *MrOtherGuy/fx-autoconfig*).
   <p>⚠️ Creating the file by copy & paste or other methods may cause incorrect encoding.</p>
   <p>⛔ Do not modify the file name during or after saving.</p>

6. Restart Firefox to apply.

7. If you moved some files out of `chrome` in step 4, please confirm that this script works as expected. Once verified, you can move the files back. If any conflicts arise, modify the scripts and the style rules in `userChrome.css` accordingly. If you need help, please provide the information 🛟 [here](https://github.com/Merci-chao/userChrome.js/issues/new).

## Settings
Open [*about:config*](https://support.mozilla.org/kb/about-config-editor-firefox) and search for the prefix `userChromeJS.multiTabRows@Merci.chao.`. Settings shown in gray are disabled due to dependency on other preferences.

If configuring via *user.js* (not recommended), be sure to include the prefix `userChromeJS.multiTabRows@Merci.chao.`. Example:
```js
user_pref("userChromeJS.multiTabRows@Merci.chao.maxTabRows", 5);
```

> [!NOTE]
> Many of these settings may not take effect due to dependencies with other preferences. It is strongly recommended to configure them via *about:config* rather than using *user.js*.

### Interactions

| Name (w/ prefix) | Description |
| ------------- | ------------- |
| ~~`animateTabMoveMaxCount`~~<span title="Removed">🗑</span> | Replaced with `animateTabMoveUnderLimit`. |
| `animateTabMoveShiftKeyToPause` | When pressing `Shift` key, pause the drag & drop animation and show the drop indicator instead. This feature can be helpful in special situations where it is difficult to move items next to a specific one in another row. |
| `animateTabMoveUnderLimit` | When the number of visible tabs reaches this amount, disable the drag & drop animation and show the drop indicator instead. Setting the value below `3` will effectively force using the indicator for moving. If dragging causes lag with many tabs, consider lowering this value. |
| `animationDuration` | Duration of animations in milliseconds (valid range: `0` - `1000`). Note: Lengthy animations could strain system performance. |
| ~~`disableDragToPinOrUnpin`~~<span title="Removed">🗑</span> | Use the built-in preference [`browser.tabs.dragDrop.dragToPin.enabled`](#dragToPinEnabled) instead. |
| `dragStackPreceding` | Stack the preceding selected tabs of the dragged one (see [`browser.tabs.dragDrop.multiselectStacking`](#multiselectStacking)). When dragging the middle tab among selected ones, the following ones of the selected tabs may move forward undesirably. Disabling this setting can avoid the issue. |
| ~~`dragToGroupTabs`~~<span title="Removed">🗑</span> | Use the built-in preference [`browser.tabs.dragDrop.createGroup.enabled`](#dragToGroupTabs) instead. |
| `dynamicMoveOverThreshold` | Make tab-dragging movement smoother in certain scenarios, e.g. dragging pinned or grouped tabs. Not available on Firefox 115, or `browser.tabs.dragDrop.createGroup.enabled` is `false`. |
| `hideDragPreview` | Hide the drag preview that appears next to the cursor during dragging:<ul><li>`0` - never</li><li>`1` - tab groups only</li><li>`2` - tabs only</li><li>`3` - both</li></ul> |
| <span id="hidePinnedDropIndicator">`hidePinnedDropIndicator`</span> | Hide the indicator that appears when dragging a tab to pin it, if there are no existing pinned tabs. Not available on Firefox 115 and 140. |
| `hideScrollButtonsWhenDragging` | Visually hide the up/down scroll buttons when dragging. |
| `linesToDragScroll` | How many rows to scroll when dragging tabs to top/bottom edge. Minimum: `1`. |
| `linesToScroll` | How many rows to scroll when using the mouse wheel. Minimum: `1`. |
| `previewPanelNoteEditable` | Allow the tab preview panel to be hovered and the note inside to be editable when the tab note feature of Firefox is enabled. Not available on Firefox 115 and 140. |
| `previewPanelShifted` | Shift the preview panel when there are multiple rows, reducing the effect of the panel blocking items in the rows underneath. Affects tabs only when `previewPanelNoteEditable` is `true`. Not available on Firefox 115 and 140.<ul><li>`0` - never</li><li>`1` - for groups</li><li>`2` - for tabs</li><li>`3` - for both</li></ul> |
| `previewPanelShiftedAlways` | Shift the preview panel even when there is only one row. |
| `scrollButtonsSize` | The size (in pixels) of the scroll buttons during dragging. Minimum: `0`, but it will be rendered as at least 2 device pixels in height; the maximum is limited to half the tab height. |

### Tab Bar Layout

| Name (w/ prefix) | Description |
| ------------- | ------------- |
| `autoCollapse`<span title="Experimental">🧪</span> | Tabs will collapse to a single row when the cursor is not hovering. Enabling this feature will forcibly disable `tabsUnderControlButtons` and `positionPinnedTabs`. On Firefox 115, setting `layout.css.has-selector.enabled` as `true` is required.
| `autoCollapseDelayCollapsing` | Delay before collapsing the tabs when the cursor moves away (in milliseconds). Minimum: `0`. |
| `autoCollapseDelayExpanding` | Delay before expanding the tabs when the cursor hovers over them (in milliseconds). Minimum: `0`. |
| `compactControlButtons` | Display the window control buttons to a compact size. Available on Windows 10 and later, when the title bar is hidden. Affects only web apps when the menu bar is displayed. |
| `controlButtonsAutoHide` | Hide the window control buttons and show them when the cursor enters the top right corner:<ul><li>`0` - disabled</li><li>`1` - only on maximized windows</li><li>`2` - on all windows</li></ul><p>Available on Windows 10 and later, when the title bar is hidden. Affects only web apps when the menu bar is displayed.</p> |
| `controlButtonsAutoHideTriggerHeight` | The height of the trigger area. |
| `hamburgerMenuOnTabBar` | On classic windows, setting it to `false` moves the Firefox menu button (☰) back to the navigation toolbar when Firefox Smart Window is available. Forcibly inactivated when `tabsAtBottom` is enabled. Only available on Firefox 153. |
| `hideAllTabs` | Hide the *List all tabs* button. Only available on Firefox 115. On newer versions of Firefox, you may remove it by right-clicking on it and choosing *Remove from Toolbar*. |
| `hideEmptyPlaceholderWhenScrolling` | If there is no item in the upper corner, hide the empty space in that corner when the tab bar is scrollable, available when `tabsUnderControlButtons` is `2`. |
| `justifyCenter` | Justify tabs to the center horizontally:<ul><li>`0` - never</li><li>`1` - when there is only one row</li><li>`2` - always (behaviors such as closing tabs and collapsing tab groups may differ slightly)</li></ul> |
| `maxTabRows` | <p>Maximum number of rows to display at once. Minimum: `1`.</p><p>📝 Note: The actual count depends on the window width, refer to `rowIncreaseEvery`.</p> |
| `newTabButtonAfterLastTab` | <p>Place the New Tab button after the last tab. When disabled, the button follows the position specified in toolbar customization.</p><p>📝 Note: The New Tab button stays after the last tab only when it is placed directly after the tabs.</p> |
| `positionPinnedTabs` | Position pinned tabs as a fixed grid before normal tabs when the tab bar is scrollable. |
| `privateBrowsingIconOnNavBar` | Move the private window icon to the navigation toolbar. Not available on Firefox 115. Forcibly activated when `tabsAtBottom` is enabled. |
| `rowIncreaseEvery` | Each time the window width increases by this amount, one more row is displayed. A narrower window will therefore show fewer rows at once. When set to the minimum value `0`, the maximum number of rows is directly allowed to be displayed. |
| `rowStartIncreaseFrom` | When the window width is larger than this number plus `rowIncreaseEvery`, multi-row display is allowed. |
| `smartWindowButtonOnNavBar` | On classic windows, move the Firefox Smart Window switching button to the navigation toolbar. Forcibly activated when `tabsAtBottom` is enabled. Not available on Firefox 115 and 140. |
| `spaceAfterTabs` | Empty space before the window control buttons. Minimum: `0`. Available when the title bar is hidden. Affects only web apps when the menu bar is displayed. |
| `spaceAfterTabsOnMaximizedWindow` | Empty space before the window control buttons, when maximumized. Minimum: `0`. Available when the title bar is hidden. Affects only web apps when the menu bar is displayed. |
| `spaceBeforeTabs` | Empty space on the left side of the window. Minimum: `0`. Available when the title bar is hidden. Affects only web apps when the menu bar is displayed. |
| `spaceBeforeTabsOnMaximizedWindow` | Empty space on the left side of the window, when maximumized. Minimum: `0`. Available when the title bar is hidden. Affects only web apps when the menu bar is displayed. |
| `tabsAtBottom` | Position the tab bar beneath:<ul><li>`0` - the menu bar</li><li>`1` - the navigation toolbar</li><li>`2` - the bookmarks toolbar</li><li>`-1` - the browser content</li></ul><p>Not available on Firefox 115.</p> |
| `tabsbarItemsAlign` | Alignment of the items (mainly buttons) in the tab bar when there are multiple rows:<ul><li>`start` - top</li><li>`center` - middle</li><li>`end` - bottom</li></ul>This setting is only valid when `tabsUnderControlButtons` is `0`, or `1` with the tab bar is scrollable. |
| `tabsUnderControlButtons` | <a name="tabsUnderControlButtons"></a>Show tabs beneath window control buttons when there are multiple rows:<ul><li>`0` - never</li><li>`1` - when the tab bar is not scrollable (legacy option, not recommended)</li><li>`2` - always</li></ul> |
| `thinScrollbar` | Use a thin scrollbar without up and down buttons when the tab bar is scrollable. |

### Tab Sizing

> [!NOTE]
> Not suggested to set narrower than the default value, as Firefox is not designed to be compact and unexpected glitches may occur. These settings may be overridden by rules in `userChrome.css` and have no effect.

| Name (w/ prefix) | Description |
| ------------- | ------------- |
| `gapAfterPinned` | Empty space between the pinned tabs and normal tabs. Minimum: `0`. |
| `lastRowTabsFlexibe` | Tabs in the last row have flexible width when multiple rows are present. Forcibly activated when `justifyCenter` is `2`. |
| `pinnedTabsFlexWidth` | Make pinned tab sizing behave like normal tabs. Enabling this feature will forcibly disable `positionPinnedTabs`. |
| `pinnedTabsFlexWidthIndicator` | Display an icon on pinned tabs when `pinnedTabsFlexWidth` is enabled. |
| `tabContentHeight` | Height of tab content. Minimum: `16`. |
| `tabHorizontalMargin` | Horizontal space around tab. Minimum: `0`. |
| `tabHorizontalPadding` | Horizontal padding of tab. Minimum: `0`. |
| `tabMaxWidth` | Maximum width of tabs, including the surrounding white space. Use `browser.tabs.tabMinWidth` for the minimum width, and the actual maximum width will never be lower than that. |
| `tabVerticalMargin` | Vertical space around tab. Minimum: `0`. |

### Appearance

| Name (w/ prefix) | Description |
| ------------- | ------------- |
| ~~`dynamicThemeImageSize`~~<span title="Removed">🗑</span> | Replaced with `themeImageSize`. |
| `floatingBackdropBlurriness` | How blurry the background of the floating blocks is when the tab bar is scrollable, available when `tabsUnderControlButtons` is `2`. Minimum: `0`. Not available on Firefox 115 and in some cases where the blur effect cannot be applied. |
| `floatingBackdropClip` | Clip the area covered by the floating blocks when the tab bar is scrollable, available when `tabsUnderControlButtons` is `2`. |
| `floatingBackdropOpacity` | How opaque the background of the floating blocks is when the tab bar is scrollable, available when `tabsUnderControlButtons` is `2` and `floatingBackdropClip` is `false`. The value should be from `0` to `100`. |
| `nativeWindowStyle` | Display the system-native theme style (e.g. transparency effects of Windows 11 and effects from tools like [*DWMBlurGlass*](https://github.com/Maplespe/DWMBlurGlass)) on the tab bar. To achieve the full visual effect on Windows 11, you may also need to enable `widget.windows.mica`. This behaves similarly to `browser.theme.windows.accent-color-in-tabs.enabled` when DWM tools are not used on Windows 10. It also allows you to remove the background color on themes designed with patterns with transparency. Not available on Firefox 115. |
| `nativeWindowStyleToolbarColorOpacity` | The opacity of the background color of toolbars, and the dividing line between the navigation toolbar and the tab bar, minimum: `0`, maximum: `100`. Changing this setting cannot increase the opacity of a color if the original color contains transparency. Available when the tab bar is at the top or Firefox Nova is enabled. |
| `nativeWindowStyleURLBarColorOpacity` | The opacity of the background color of the address bar and he search bar, minimum: `0`, maximum: `100`. Changing this setting cannot increase opacity if the original color includes transparency. |
| `scrollbarThumbColor` | Color of the scrollbar thumb, must be a valid CSS color, variable, or the keyword `auto`. |
| `scrollbarTrackColor` | Color of the scrollbar track, must be a valid CSS color, variable, or the keyword `auto`. |
| `showScrollShadow` | Show shadow on the top and bottom edges when the tab bar is scrollable. |
| `themeImageSize` | When using themes with background images, size the image according to:<ul><li>`-1` - the original size of the image</li><li>`0` - the maximum number of rows allowed</li><li>`1` - the maximum number of rows allowed within the current window width</li><li>`2` - the current number of rows</li></ul><p>The best choice depends on your preference and the design of the theme. No difference when the image height is large enough to support the number of rows.</p> |

### Miscellaneous

| Name (w/ prefix) | Description |
| ------------- | ------------- |
| `checkUpdate` | <p>Check for a new version of this script when Firefox starts up or opens new windows. Set to `1` to enable or `0` to disable. The value will be updated with the last checking time (e.g. `1759911972`). Execute the check immediately in a new window by resetting it to `1`.</p><p>💡 Enabling it is strongly recommended, as outdated scripts are unlikely to function properly on newer versions of Firefox.</p><p>📝 Note: Updates for this script will not be notified when using older versions of Firefox (except 115 and 140).</p> |
| `checkUpdateAutoApply` | Update the script file automatically when there is a new version:<ul><li>`1` - never</li><li>`2` - always</li><li>`3` - always and sliently, also receive updates for minor changes and fixes that do not trigger notifications</li></ul> |
| `checkUpdateFrequency` | How often to check for new versions (days). Minimum: `1`. |
| `currentVersion` | The version number you are currently using. |
| `debugMode`<span title="Do Not Use">⛔</span> | Mode for debugging, not for general use. |
| `incompatible` | This item only appears when you are running an incompatible version of Firefox. Modifying it will cause the compatibility alert to show up again when Firefox starts up. |

### Firefox Built-in Settings

| Name (w/o prefix) | Description |
| ------------- | ------------- |
| `browser.nova.enabled` | Apply the Nova design (in development). Available on Firefox 152+. |
| `browser.tabs.dragDrop.createGroup.delayMS` | Time to wait (in milliseconds) before starting to group tabs during dragging. Not available on Firefox 115. |
| <span id="dragToGroupTabs">`browser.tabs.dragDrop.createGroup.enabled`</span> | Drag tabs together to create tab groups. On Firefox 140, create a new boolean preference with this name to toggle. Not available on Firefox 115. |
| <span id="dragToPinEnabled">`browser.tabs.dragDrop.dragToPin.enabled`</span> | Enable tab pinning/unpinning via drag & drop in the same window, e.g. whether dropping tabs onto the pinned tabs will pin them. Create a new boolean preference with this name to toggle. |
| `browser.tabs.dragDrop.moveOverThresholdPercent` | Percentage of overlap required when dragging to move. `100 - n` defines the grouping threshold. For example, if the value is `80`, then overlapping 20%+ will group tabs, while overlapping 80%+ will move them over. Minimum: `0`, Maximum: `100`. The value is locked at `50` in the following cases: <ul><li>when moving to another row</li><li>when using Firefox 115</li><li>when dragging to group tabs is disabled</li><li>in certain scenarios when `dynamicMoveOverThreshold` is enabled</li></ul> |
| <span id="multiselectStacking">`browser.tabs.dragDrop.multiselectStacking`</span> | Enable tab stacking when dragging tabs. Create a new boolean preference with this name to toggle. |
| `browser.tabs.dragDrop.pinInteractionCue.delayMS` | Time to wait (in milliseconds) before showing the <a href="#hidePinnedDropIndicator">pinned drop indicator</a>. Not available on Firefox 115 and 140. |
| `browser.tabs.tabClipWidth` | Close buttons will show on the tabs that are wider than this size. Takes effect in new windows after changing. When the value is:<ul><li>equal to or larger than `tabMaxWidth` - never show close buttons on non-selected tabs</li><li>smaller than `browser.tabs.tabMinWidth` - always show close buttons on non-selected tabs</li></ul> |
| `browser.tabs.tabMinWidth` | Minimum width of normal tabs, including the white space around. Minimum: `50`. |
| `browser.theme.windows.accent-color-in-tabs.enabled` | Apply the system accent color on the tab bar (Windows 10). |
| `widget.windows.mica` | Apply the native system style on the tab bar (Windows 11). |
| `widget.windows.mica.toplevel-backdrop` | Choose the effect of backdrop (Windows 11).<ul><li>`0` - auto</li><li>`1` - Mica</li><li>`2` - Acrylic</li><li>`3` - Mica Alt</li></ul> |

## Changelog
📥 [Download the Lastest Version](https://github.com/Merci-chao/userChrome.js/raw/refs/heads/main/MultiTabRows@Merci.chao.uc.js)

[**Version 4.9.2**](https://github.com/Merci-chao/userChrome.js/raw/e98e4168878018501e916ee53e8a57475fde5d62/MultiTabRows@Merci.chao.uc.js)
- Improvements
	- Improved compatibility with theme customizing extensions.
	- Updates for Nova.

[**Version 4.9.1**](https://github.com/Merci-chao/userChrome.js/raw/de38d8381282d4097ac7a0c83dbaf9bb169246a0/MultiTabRows@Merci.chao.uc.js)
- Regression Fixes:
	- Could not drop links or bookmarks onto the tab bar to open tabs.
	- The tab bar had an opaque background on Windows 7 and 8.

[**Version 4.9**](https://github.com/Merci-chao/userChrome.js/raw/dcd1edf80d34213cc10beb57c702a38fa3818197/MultiTabRows@Merci.chao.uc.js)
- New
	- Adds new sub-settings for `nativeWindowStyle`:
		- `nativeWindowStyleToolbarColorOpacity`: The opacity of the background color of toolbars, and the dividing line between the navigation toolbar and the tab bar. Available when the tab bar is at the top or Firefox Nova is enabled.
		- `nativeWindowStyleURLBarColorOpacity`: The opacity of the background color of the address bar and the search bar.
	- Adds `hamburgerMenuOnTabBar` (Firefox 153): Setting it to `false` moves the Firefox menu button (☰) back to the navigation toolbar when Firefox Smart Window is available.
- Improvements
	- Improved theme support and compatibility:
		- `themeImageSize` is now available for themes that have repeated background images, and no more reserving size for the hidden menu bar.
		- `nativeWindowStyle` is now available for themes that have background images, which allows you to remove the background color on themes designed with patterns with transparency.
		- Supports themes that have multiple layers of images.
		- Some themes now have a better presentation when the tab bar is showing beneath the browser content.
		- Updates for Nova UI design of Firefox 152+.
	- Shows alert when running on an incompatible version of Firefox.
- Fixes
	- Animation glitches in special cases and when dragging multiple tabs.
	- Minor visual issues.

[**Version 4.8.1**](https://github.com/Merci-chao/userChrome.js/raw/7b465c52edf88e2175afe29c35996cd4f71aa1b9/MultiTabRows@Merci.chao.uc.js)
- Supports Firefox ESR version (140).

[**Version 4.8.0.1**](https://github.com/Merci-chao/userChrome.js/raw/802f2c376de9b24ff6708a4607c3545f850714bb/MultiTabRows@Merci.chao.uc.js)
- Adds `currentVersion` to display the current version number.

[**Version 4.8**](https://github.com/Merci-chao/userChrome.js/raw/9a9c6cd694b60b8f4ae6069e468450cc4d2f26e4/MultiTabRows@Merci.chao.uc.js)
- New
	- Adds `controlButtonsAutoHide` and related setting: hide the window control buttons and show them when the cursor enters the top right corner.
- Change
	- No longer relies on `security.allow_unsafe_dangerous_privileged_evil_eval` being enabled. Please reset it to `false` if it is not needed for other scripts.
- Improvements
	- Supports Nova UI design of Firefox 152.
	- For `tabsAtBottom` set to `-1`:
		- Supports hiding the tab bar in full screen mode.
		- Menus of the items in tab bar open upward by default.
	- Updates for Firefox 152.
	- Minor layout refinements for media buttons.
- Fixes
	- A protential memory leak issue.
	- Incorrect background and icon color in the sidebar when `tabsAtBottom` was enabled.
	- Animation issues in special cases.
	- Visual issue where stacking tabs looked messy during dragging on some themes.
	- Minor visual and layout issues.

<details>
<summary>Old Versions</summary>

[**Version 4.7.2**](https://github.com/Merci-chao/userChrome.js/raw/e907a3752a237595c93c9c6b69f228b612af1569/MultiTabRows@Merci.chao.uc.js)
- Fixed an issue that could cause the "Reopen Closed Tab" to stop functioning.

[**Version 4.7.1**](https://github.com/Merci-chao/userChrome.js/raw/d684754c50e71e0c0d4159948837e099a02f323a/MultiTabRows@Merci.chao.uc.js)
- Fixed an issue when switching between a tab and a tab inside a collapsed tab group, where one of them belonged to a split view.
- The New Tab button now has an animation when the tab bar switches between scrollable and non-scrollable.

[**Version 4.7**](https://github.com/Merci-chao/userChrome.js/raw/798b230f25123a0556f0fc0c80ed156fd497f600/MultiTabRows@Merci.chao.uc.js)
- Improvement
	- Dragging to group tabs is now supported when using the indicator to move. Modify `browser.tabs.dragDrop.createGroup.enabled` or `browser.tabs.dragDrop.createGroup.delayMS` to adjust the behavior.
- Change
	- Replaced `animateTabMoveMaxCount` with `animateTabMoveUnderLimit`: use the indicator to move when the number of visible tabs reaches the specified amount.
- Fixes
	- Could not apply updates directly when using some script loaders.
	- Issues related to web apps when `tabsAtBottom` was enabled.
	- When using the indicator to move:
		- Tabs might jitter in special cases.
		- The New Tab button was not hidden when the tab bar was scrollable.
	- Minor visual issues in special cases.

<details>
<summary>Minor Update</summary>

[**Version 4.6.1.1**](https://github.com/Merci-chao/userChrome.js/raw/4e12d4cda2b3d4239901a72fe0786aa12f20883f/MultiTabRows@Merci.chao.uc.js)
- Updates for Firefox 151.
- Fixed the issue where the "Add Note" item did not display when tab notes had just been enabled.
</details>

[**Version 4.6.1**](https://github.com/Merci-chao/userChrome.js/raw/05a819fa133b8814693f2cbe2300770657311fc6/MultiTabRows@Merci.chao.uc.js)
- Adds new option for `themeImageSize`: `-1` - the original size of the image.

[**Version 4.6**](https://github.com/Merci-chao/userChrome.js/raw/10479eb67e6851bb17cbade0aa3861e353bcc942/MultiTabRows@Merci.chao.uc.js)
- New
	- Supports placing the tab bar at the bottom of browser (by setting `tabsAtBottom` to `-1`).
	- Replaces `dynamicThemeImageSize` with `themeImageSize`, which provides a new option.
- Improvements
	- Using the indicator to move tabs no longer relies on Firefox native functions and now produces correct results (related to `animateTabMoveMaxCount` and `animateTabMoveShiftKeyToPause`).
	- Reduces some unnecessary animation to improve performance.
	- Refines the behavior when closing the only tab in the last row.
	- Updates for Firefox 150 and 151.
	- Update-checking will retry tomorrow if a network error occurs.
- Fixes
	- Issues when only one row was allowed.
	- Issues when using the indicator to move tabs.
	- Themes with repeated background image did not behave correctly.
	- Potential freeze when the tab bar was extremely narrow.
	- `gapAfterPinned` did not work in some cases.
	- Minor layout and visual issues in special cases.

[**Version 4.5.1**](https://github.com/Merci-chao/userChrome.js/raw/e109f1131ea71e4d94e5c99f8f8d977af9ceba8a/MultiTabRows@Merci.chao.uc.js)
- Improvements
	- The roundness of the corners of buttons and tabs in the tab bar begins to decrease once the tab content height and horizontal padding are reduced beyond a certain point.
	- Updates for Firefox 150.
	- Fine-tunes the divider in split views.
- Fixes
	- Tab preview panel was wrongly shifted when the tab note feature was disabled.
	- Audio icons and close buttons did not update after dragging tabs.
	- Minor layout issue occurred when start up in special case.

<details>
<summary>Minor Update</summary>

[**Version 4.5.0.1**](https://github.com/Merci-chao/userChrome.js/raw/1f0f7f439884512fc882c308452b3a504f9489c9/MultiTabRows@Merci.chao.uc.js)
- Fixed minor layout issue in special case.

</details>

[**Version 4.5**](https://github.com/Merci-chao/userChrome.js/raw/4aaf427455b1873ac386f7c2074c7c0474564a30/MultiTabRows@Merci.chao.uc.js)
- Changes
	- Removes `disableDragToPinOrUnpin` and use the built-in preference `browser.tabs.dragDrop.dragToPin.enabled` as a replacement.
	- Removes `dragToGroupTabs` and use the built-in preference `browser.tabs.dragDrop.createGroup.enabled` as a replacement.
- Improvements
	- Improved performance while dragging.
	- Updates for Firefox 149 and 150.
	- Minor adjustments to drag & drop behavior of tab groups.
	- Adjusts the width of scroll buttons and shadow.
- Fixes
	- Dragging to move multiple tabs together might result in incorrect order.
	- Did not scroll to the seleced tab when resizing window.
	- Minor bugs in the auto-collapse feature.
	- Minor issue that occurred when scrolling during dragging.
	- `showScrollShadow` did not work on Firefox 115.
	- Minor visual bugs in special cases.

[**Version 4.4**](https://github.com/Merci-chao/userChrome.js/raw/1cd561a9b926abe7d6ee00f39c8347efed860133/MultiTabRows@Merci.chao.uc.js)
- New
	- Adds `showScrollShadow`: Show shadow on the top and bottom edges when the tab bar is scrollable, to align with the interface design of Firefox.
	- Adds `animateTabMoveShiftKeyToPause`: When pressing `Shift` key, pause the drag & drop animation and show the drop indicator instead. Note: Drop position may not behave as expected in certain scenarios due to Firefox bugs.
	- Adds `smartWindowButtonOnNavBar` (Firefox 149+): Move the Firefox Smart Window switching button to the navigation toolbar. Forcibly activated when `tabsAtBottom` is enabled.
- Improvements
	- Adds extra dragging space above the tab bar for easier scrolling and dragging (only when the tab bar is not the topmost).
	- Updates compatibility with:
		- Firefox Smart Window feature;
		- Firefox 149.
	- When `tabsAtBottom` is enabled:
		- The extra dragging space below the tab bar is ensured;
		- Moves the DLP button to the navigation toolbar.
- Fix
	- Drag & drop problems in special cases.

[**Version 4.3.1**](https://github.com/Merci-chao/userChrome.js/raw/4393a0f31b062811872d658884fe1f4803a5eb03/MultiTabRows@Merci.chao.uc.js)
- Improvements
	- Displays a pin/unpin icon next to the drop indicator to identify dragging to pin/unpin.
	- Updates for Firefox 149.
- Fixes
	- Firefox might freeze after drag-and-drop in special case of having many pinned tabs and the window was narrow.
	- Could not rearrange pinned tabs in some cases when the tab bar was scrollable.
	- Some layout update was performed unnecessarily.
	- Minor visual issues when drag-and-drop in special cases.
	- Minor appearance issues in special cases.

[**Version 4.3**](https://github.com/Merci-chao/userChrome.js/raw/8e58bd0162eefb9f258257249dcd10172943826a/MultiTabRows@Merci.chao.uc.js)
- New
	- Adds `lastRowTabsFlexible`: Tabs in the last row have flexible width when multiple rows are present. Forcibly activated when `justifyCenter` is `2`.
	- Adds `positionPinnedTabs`: Position pinned tabs as a fixed grid before normal tabs when the tab bar is scrollable.
	- Adds `newTabButtonAfterLastTab`: Place the New Tab button after the last tab. When disabled, the button follows the position specified in toolbar customization. Note: The New Tab button stays after the last tab only when it is placed directly after the tabs.
	- Adds `previewPanelShiftedAlways`: Shift the preview panel even when there is only one row.
- Improvements
	- Supports locking tab size when closing tabs or collapsing a group when `justifyCenter` is `1`.
	- Refines animations for tab group.
	- Fine-tuning of some minor operational details.
	- Updates for Firefox 149.
	- Updates features related to tab notes.
- Fixes
	- Temporary layout issues occurring when:
		- Dragging a group that was not fully collapsed out of the window;
		- Closing the first tab in a row or the last tab;
		- Grouping tabs by dragging.
	- Minor issues in special-case dragging and animation.

[**Version 4.2**](https://github.com/Merci-chao/userChrome.js/raw/00c0f19da45e1a391a96c5d7203c4a2413cd9360/MultiTabRows@Merci.chao.uc.js)
- New
	- Adds `previewPanelShifted`: Shifts the preview panel when there are multiple rows, reducing the effect of the panel blocking items in the rows underneath. Affects tabs only when `previewPanelNoteEditable` is `true`. Not available on Firefox 115.
		- `0` - never
		- `1` - for groups
		- `2` - for tabs
		- `3` - for both
	- Adds `previewPanelNoteEditable` (for Firefox 148+): Allows the tab preview panel to be hovered, and the note inside to be editable.
- Fixes
	- Continuously and rapidly closing tabs could result in the window being maximized/restored.
	- Issue that occurred when dragging the audio button of a non-selected tab.
	- Tab size locking issue when closing the last tab in certain cases.
	- Adjust the appearance of split view to match the original design.
	- Incorrect tab moved when dragging a non-selected tab from the tab list and drop it onto the tab strip.
	- Issue that occurred when pressing Ctrl to start dragging a split view.
	- Layout issue of tab group labels on older versions of Firefox.
	- Minor layout and visual issues.

[**Version 4.1.3**](https://github.com/Merci-chao/userChrome.js/raw/6c0a12ca3fb872c3f5b4c644454b6b7b69b38eef/MultiTabRows@Merci.chao.uc.js)
- Fixes
	- Firefox could freeze in certain cases when pinned tabs were present and the tab bar became scrollable.
	- `tabHorizontalMargin` did not apply correctly to pinned tabs in Firefox 115.
	- Layout issue occurred in specific cases when modifying `tabContentHeight`.
	- `tabVerticalMargin` might be missing in *about:config* in certain cases.

<details>
<summary>Minor Updates</summary>

[**Version 4.1.2.5**](https://github.com/Merci-chao/userChrome.js/raw/c6e59860ed977aec878ce0550c5a7f0b8327d0b9/MultiTabRows@Merci.chao.uc.js)
- Adjusts margin of mini-audio button to prevent overlap with tab label.

[**Version 4.1.2.4**](https://github.com/Merci-chao/userChrome.js/raw/d6f43131d380eb5159fdd6a845ed184d20618ccb/MultiTabRows@Merci.chao.uc.js)
- Fixed the layout issue that occurred when moving pinned tabs to another window while the tab bar is scrollable.
- Fixed the visual issue when closing pinned tabs.

[**Version 4.1.2.3**](https://github.com/Merci-chao/userChrome.js/raw/3c4e92e7733abd23a720d91687ee84121b716407/MultiTabRows@Merci.chao.uc.js)
- Hides secondary tab label when `tabContentHeight` is bellow `30` (compact mode).
- Adjusts the tab height in split view when it is too compact.
- The default value of `checkUpdateAutoApply` has been changed to `1`, which has the same effect as `0`.

[**Version 4.1.2.2**](https://github.com/Merci-chao/userChrome.js/raw/2f2ed90bffb0d8c36ed9ad1a9e93030a4b2e7390/MultiTabRows@Merci.chao.uc.js)
- Fixed the visual issue of audio button on Firefox 115 since the last version.

[**Version 4.1.2.1**](https://github.com/Merci-chao/userChrome.js/raw/e1897daad71fb35903eb129f90f7799ae1a0bead/MultiTabRows@Merci.chao.uc.js)
- Fixed a visual bug that occurs when a tab in a split view is closing and the `tabMaxWidth` is smaller than a certain amount.
- Updates for the tab note icon in Firefox 147+.
</details>

[**Version 4.1.2**](https://github.com/Merci-chao/userChrome.js/raw/d7accbd33d613703bbf3f88bf085369b5aa43072/MultiTabRows@Merci.chao.uc.js)
- Fix
	- `tabMaxWidth` did not work on Firefox 146+.

[**Version 4.1.1**](https://github.com/Merci-chao/userChrome.js/raw/2605d71e35fe3d3811ff795695581d3d957ab54d/MultiTabRows@Merci.chao.uc.js)
- Improvement
	- Updates for Firefox 148.
- Fix
	- Padding issue for pinned tabs when enabling `pinnedTabsFlexWidth` since v4.1.

<details>
<summary>Minor Updates</summary>

[**Version 4.1.0.7**](https://github.com/Merci-chao/userChrome.js/raw/4f41b6419194e5be3883ebd9c332386573459ccd/MultiTabRows@Merci.chao.uc.js)
- Fixed an issue that may conflict with other scripts since v4.1.

[**Version 4.1.0.6**](https://github.com/Merci-chao/userChrome.js/raw/131ae1fe0a6893515a238d4e996e0346f0587e5e/MultiTabRows@Merci.chao.uc.js)
- Handles the case where `security.allow_unsafe_dangerous_privileged_evil_eval` is locked by the script loader.

[**Version 4.1.0.2**](https://github.com/Merci-chao/userChrome.js/raw/d4ba5f8d43c6e68e42ada1cd8f2108b55d7c444c/MultiTabRows@Merci.chao.uc.js)
- Tunes the sizing of group lines to achieve a better look with different values of `tabVerticalMargin`.
</details>

[**Version 4.1**](https://github.com/Merci-chao/userChrome.js/raw/915d87a20b0dbaacbb1b3ac5709dede2bc02cbd0/MultiTabRows@Merci.chao.uc.js)
- New
	- Adds `tabContentHeight`, `tabVerticalMargin`, `tabHorizontalPadding` and `tabHorizontalMargin` to control tab height and spacing. Not suggested to set narrower than the default value, as Firefox is not designed to be compact and unexpected glitches may occur. These settings may be overridden by rules in `userChrome.css` and have no effect.
- Improvements
	- Tunes the tab bar layout when it is too compact.
	- Refines update notification UI.
- Fix
	- Notification bar was placed incorrectly when  was enabled.

<details>
<summary>Minor Updates</summary>

[**Version 4.0.2.3**](https://github.com/Merci-chao/userChrome.js/raw/5b908e70e03a724c9c7bee6208ede691498e6f13/MultiTabRows@Merci.chao.uc.js)
- Updates the dependencies of settings in *about:config*.

[**Version 4.0.2.2**](https://github.com/Merci-chao/userChrome.js/raw/6fe214ec244687756c2f238c8af21a2864c1e81d/MultiTabRows@Merci.chao.uc.js)
- Refines some minor animation related to tab group.

[**Version 4.0.2.1**](https://github.com/Merci-chao/userChrome.js/raw/8b5df9cd8f39e2a19405f53d18cd87df8d7a0485/MultiTabRows@Merci.chao.uc.js)
- Follows up with the fix of Firefox bug [#1997096](https://bugzilla.mozilla.org/show_bug.cgi?id=1997096).

</details>

[**Version 4.0.2**](https://github.com/Merci-chao/userChrome.js/raw/fcc877abb73d14e2be2743d4c056ca7881d40c32/MultiTabRows@Merci.chao.uc.js)
- Fix
	- Layout problem that could occur when there were tabs with audio buttons since v4.0.

[**Version 4.0.1**](https://github.com/Merci-chao/userChrome.js/raw/03f755577005868ecb0960c77189d28d56336974/MultiTabRows@Merci.chao.uc.js)
- Fixes
	- Script was failed when newly installed.
 	- Could not move tabs between windows since v4.0.

[**Version 4.0**](https://github.com/Merci-chao/userChrome.js/raw/ea2ce83a7cbfabae30c0e3f873769b62619e2894/MultiTabRows@Merci.chao.uc.js)
- New
	- Supports the split view feature introduced in Firefox 146, which can be enabled by setting `browser.tabs.splitView.enabled` to `ture`.
	- Supports for tab stacking when dragging multiple tabs. On Firefox 146, it can be enabled by setting `browser.tabs.dragDrop.multiselectStacking` to `true`. For Firefox 145 and below (including 115), a new boolean preference with that name needs to be created manually.
	- Adds `dragStackPreceding`: stack the preceding selected tabs of the dragged one. When dragging the middle tab among selected ones, the following ones of the selected tabs may move forward undesirably. Disabling this setting can avoid the issue.
	- Supports drag to pin/unpin on Firefox 115. Set `disableDragToPinOrUnpin` to `false` to enable.
	- Adds `privateBrowsingIconOnNavBar`: move the private window icon to the navigation toolbar. Not available on Firefox 115. Forcibly activated when `tabsAtBottom` is enabled.
- Changes
	- In keeping with the original design of Firefox, `spaceAfterTabs`, `spaceAfterTabsOnMaximizedWindow`, `spaceBeforeTabs` and `spaceBeforeTabsOnMaximizedWindow` now affect the spacing at the edges of the navigation toolbar when `tabsAtBottom` is enabled.
	- In keeping with the original design of Firefox, `gapAfterPinned` now defaults to `0` on Firefox 143 and above.
	- Fixes the size of New Tab button to prevent layout gliches.
- Improvements
	- Refines the behavior of tab size locking when closing tabs or collapsing tab groups.
	- Refines the dragging behavior to avoid the difficulty of moving items to the row edge in certain scenarios.
	- Updates for Firefox 147.
	- Hides the group hover preview panel when scrolling.
	- Supports `toolkit.tabbox.switchByScrolling`.
- Fixes
	- The group hover preview panel might incorrectly display when collapsing the group.
	- Scrolling was not smooth when expanding a group and the tab bar started to scroll.
	- The animation of drag-and-drop with drop indicator was missing from v3.5.
	- The tab bar could not be scrolled after using the horizontal wheel.
	- Audio button did not have a consistent appearance on pinned tabs when `pinnedTabsFlexWidth` was enabled.
	- Incorrect minimum tab width and layout glitches when setting UI density to Touch.
	- Various minor bugs and issues.

<details>
<summary>Minor Update</summary>

[**Version 3.6.1.1**](https://github.com/Merci-chao/userChrome.js/raw/c78381b0d0d5d8c95cc881021d1329f907bec051/MultiTabRows@Merci.chao.uc.js)
- Bug fix: tab sizes were unlocked unexpectedly when rows were reduced, since version 3.6.0.1.

</details>

[**Version 3.6.1**](https://github.com/Merci-chao/userChrome.js/raw/0fc2766a8e4df89944cb82088fcb2b4e69c5ccea/MultiTabRows@Merci.chao.uc.js)
- Updates for `autoCollapse`:
	- The tab bar will now only expand for the current window.
	- Prevent the tab bar expand when the address bar is focused.
	- Clicking or pressing `Esc` will now help to collapse the tab bar if it is not doing so in some rare cases.
	- Bug fix: issuse when dragging tab when there is only one row.
	- Bug fix: part of group line disappears when the tab bar is expanding.
- Fixed a minor Firefox visual bug [#1995909](https://bugzilla.mozilla.org/show_bug.cgi?id=1995909).

<details>
<summary>Minor Updates</summary>

[**Version 3.6.0.2**](https://github.com/Merci-chao/userChrome.js/raw/a3399b69e7f91e34f62a1fce4e61515c663d309e/MultiTabRows@Merci.chao.uc.js)
- Reversed some code change for the scrollbar in the previous minor update.

[**Version 3.6.0.1**](https://github.com/Merci-chao/userChrome.js/raw/6172e2fc2e47088803b839a12c2f05358a736365/MultiTabRows@Merci.chao.uc.js)
- Bug fix: resizing the window immediately after closing a tab might result in an empty row temporarily.

</details>

[**Version 3.6**](https://github.com/Merci-chao/userChrome.js/raw/f8527bad286d272b7ef74faaf1196c87a13a0329/MultiTabRows@Merci.chao.uc.js)
- Adds `pinnedTabsFlexWidthIndicator`: display an icon on pinned tabs when `pinnedTabsFlexWidth` is enabled.
- Changes the "Stop checking" option in the update notification to "Update script file directly".
- Refines the behavior of dragging a tab and pressing it to the edge of a row, to group with others on another row, or detach from a group.
- Refines the behavior of dragging tabs into or out of groups when `dragToGroupTabs` is `false`.
- Refines animations when pinned tabs are present and the tab bar is scrollable.
- Refines animations for dragging tabs while pressing them against the edge of row.
- Pauses the dragging animation when attempting to pin or unpin tabs.
- Workaround for Firefox bug [#1994643](https://bugzilla.mozilla.org/show_bug.cgi?id=1994643), which is amplified by this script.
- Bug fix: issues when enabling `pinnedTabsFlexWidth` and the pinned tab has no page icon.
- Fixed minor visual bugs.

[**Version 3.5.2**](https://github.com/Merci-chao/userChrome.js/raw/6e0aeaec8a9deb2275f00d8f2c0d4078543f2384/MultiTabRows@Merci.chao.uc.js)
- Bug fix: dragged tabs might not be moved to the intended position if it is pressed against to the edge.

[**Version 3.5.1**](https://github.com/Merci-chao/userChrome.js/raw/f8754c538d7912ac4f246594f0e99418753ce49c/MultiTabRows@Merci.chao.uc.js)
- Adds `disableDragToPinOrUnpin`: Disable tab pinning/unpinning via drag-and-drop in the same window (not available on Firefox 115). This setting will be removed if an official one is introduced.
- Prevents window dragging during tab drop animation.

[**Version 3.5**](https://github.com/Merci-chao/userChrome.js/raw/04835a0ae05f8af40aa88b2be69811d3f8d2874d/MultiTabRows@Merci.chao.uc.js)
- Updates for Firefox 145.
- Adds animation when tabs are moved to another window.
- Themes without background images can now use `nativeWindowStyle`.
- Adjust CSS variables: add `--group-label-max-width` and `--group-line-padding` on `#tabbrowser-tabs` to control the size of group label.
- Always close the menu when dragging an item from it onto the tab strip, if the menu overlaps the tab strip.
- Bug fix: background image issues when using `tabsAtBottom`.
- Bug fix: certain settings were unexpectedly disabled under specific conditions.
- Bug fix: issue occured after dragging tabs to pin or unpin them.
- Bug fix: issue occured after dragging tabs to copy them to another window.
- Bug fix: issue occured after dragging a tab group out of the window so fast.
- Minor bug fixes.
- Refined code style for better readability.

[**Version 3.4.2**](https://github.com/Merci-chao/userChrome.js/raw/d81d597c10eecb899817c42e7686eb9dde020fed/MultiTabRows@Merci.chao.uc.js)
- Bug fix: Could not drag and drop tabs when enabling `hidePinnedDropIndicator`.
- Bug fix: Tabs might have a weird jump on a newly opened window
- Bug fix: Tab close buttons did not always display or hide correctly.
- Bug fix: Layout issues with `tabsUnderControlButtons` in special cases.
- Updates for this script will no longer be notified when using older versions of Firefox (except 115).

<details>
<summary>Minor Updates</summary>

[**Version 3.4.1.3**](https://github.com/Merci-chao/userChrome.js/raw/2770e1cd7330b6ad59cddc9184ad1e967b65f7ce/MultiTabRows@Merci.chao.uc.js)
- Drag-and-drop with a drop indicator now animate.

[**Version 3.4.1.1**](https://github.com/Merci-chao/userChrome.js/raw/e07d6395a0d8c19e3a3a2cb1772106e7c95c3f99/MultiTabRows@Merci.chao.uc.js)
- Bug fix: Drop indicator is positioned incorrectly when dragging non-tab items onto the pinned tabs.
</details>

[**Version 3.4.1**](https://github.com/Merci-chao/userChrome.js/raw/537abb84e34ae05f49fee5934b0ae85ed6f1b89d/MultiTabRows@Merci.chao.uc.js)
- Bug fix: Dropping non-tab items onto the tab bar causes issues.
- Bug fix: `hideEmptyPlaceholderWhenScrolling` may not work on private windows.
- With `checkUpdateAutoApply` set to `3`, it will now also receive updates for minor changes and fixes that do not trigger notifications.

[**Version 3.4**](https://github.com/Merci-chao/userChrome.js/raw/24a669b235a4ef2eda7ffc2575e73939c68fd28d/MultiTabRows@Merci.chao.uc.js)
- Add `animateTabMoveMaxCount`: When the number of dragged tabs exceeds this value, drag animations are disabled and a drop indicator is shown instead. Minimum: `0`. If dragging too many tabs causes lag, consider lowering this value. Note: Some tab grouping operations may be unavailable, and the final drop position is determined by Firefox's native behavior, which may not behave as expected in certain scenarios.
- Add `hidePinnedDropIndicator`: Hide the indicator that appears when dragging a tab to pin it, if there are no existing pinned tabs (not available on Firefox 115).
- Streamline and improve the animation logic.
- The tab bar will appear below the bookmarks toolbar when `tabsAtBottom` is set to `2`, even if the bookmarks toolbar is set as "Only Show on New Tab".
- Improve `autoCollapse`: the tab strip now remains open while a context menu is displayed.
- Increase the default values for two delay settings for `autoCollapse`.
- Bug fix: When tab group spans multiple rows, collapsing or dragging it could be buggy in certain cases.
- Bug fix: Pressing the Esc key while dragging could cause issue.
- Bug fix: Copying multiple tabs with Ctrl key does not work reliably (Firefox bug #1987160).
- Bug fix: Tabs may scroll up when closing the last tab with keyboard shortcut.
- The script will never apply on popup windows.
- Update for Firefox 143 and 144.
- Multiple minor bug fixes.

[**Version 3.3**](https://github.com/Merci-chao/userChrome.js/raw/2094baff3cc4802583d6b6013d406929f117c67a/MultiTabRows@Merci.chao.uc.js)
- Add `pinnedTabsFlexWidth`: Make pinned tab sizing behave like normal tabs. Pinned tabs will no longer be fixed in position when the tab bar is scrollable (experimental).
- Add `checkUpdateAutoApply`: Update the script file automatically when there is a new version. `0` - never, `1` - ask, `2` - always, `3` - always and slient.
- Fix a bug where reopening a closed pinned tab causes tab functions to not work normally on Firefox 142.
- Fix minor bugs related to full screen.
- `nativeWindowStyle` will also apply on full screen.
- Refine the behavior for locking the size of the tab bar.
- Minor bug fix.

[**Version 3.2.1**](https://github.com/Merci-chao/userChrome.js/raw/ff2876589433550df6128c3091a1cd51fb17e8b7/MultiTabRows@Merci.chao.uc.js)
- Bug fix: Tabs occasionally exhibit strange jittering during animation.
- Bug fix: "Drag to create group" sometimes doesn't behave smoothly.
- Bug fix: Dragging an open group doesn't behave smoothly since the previous version.
- Update for Firefox 143.

[**Version 3.2**](https://github.com/Merci-chao/userChrome.js/raw/950eb48e30775f8f8656f71ddcc68a88020919b3/MultiTabRows@Merci.chao.uc.js)
- Add `justifyCenter`: Justify tabs to the center horizontally: `0` - never, `1` - when there is only one row, `2` - always. Behaviors such as closing tabs and collapsing tab groups may differ slightly when tabs are centered.
- Add `scrollButtonsSize`: The size (in pixels) of the scroll buttons during dragging. Minimum: `2`; the maximum is limited to half the tab height.
- Update for Firefox 143.
- Fix the problem that cannot drag tabs onto the bookmarks toolbar in some cases.
- Bug fixes.

[**Version 3.1**](https://github.com/Merci-chao/userChrome.js/raw/9401e40c4c7b7d4ec9338a81750dfb89210f9438/MultiTabRows@Merci.chao.uc.js)
- Add `autoCollapse` and related settings: tabs will collapse to a single row when the cursor is not hovering. On Firefox 115, `layout.css.has-selector.enabled` is required. (experimental)
- Add `tabsAtBottom`: position the tab bar beneath `1` - the navigation toolbar, `2` - the bookmarks toolbar. Not available on Firefox 115.
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

[**Version 3.0**](https://github.com/Merci-chao/userChrome.js/raw/45cbb07d406c1ae9c53c100533836c8c008f60bb/MultiTabRows@Merci.chao.uc.js)
- Add full support for tab groups.
- Introduce animations for various tab-related actions.
- Add the `dragToGroupTabs` option to enable or disable tab grouping when dragging tabs over another.
- Add the `dynamicMoveOverThreshold` option to make tab-dragging movement smoother in certain scenarios.
- Add the `nativeWindowStyle` option to display the system-native theme style on the tab bar (e.g. effects from DWM tools).
- Update for Firefox 141.
- Bug fixes and improvements.
 
[**Version 2.6**](https://github.com/Merci-chao/userChrome.js/raw/8482a3baaa85b59ac68fbbd604d98cc36e5480a0/MultiTabRows@Merci.chao.uc.js)
- Fix layout problem when there are some audio playing/blocked/muted tabs.
- Fix layout problem when UI density is `Touch`.

[**Version 2.5.1**](https://github.com/Merci-chao/userChrome.js/raw/29c6c200b979bde17232b9eb231c0b2cc57b8d69/MultiTabRows@Merci.chao.uc.js)
- Fix a bug that can't drop non-tab things onto the tab bar since the previous version.

[**Version 2.5**](https://github.com/Merci-chao/userChrome.js/raw/a3a0b4f574821a9c7b85441f15d8e921c8d87e19/MultiTabRows@Merci.chao.uc.js)
- Improve the experience of dragging non-adjacent tabs.
- Add check-update feature. Change `checkUpdateFrequency` to how often (days) you want, disable it by setting `checkUpdate` to `0`.

[**Version 2.4**](https://github.com/Merci-chao/userChrome.js/raw/39998cf614f7ba2abd0933e72a0628009afd608c/MultiTabRows@Merci.chao.uc.js)
- Update for Firefox 138.
- Improvements and bug-fixings for tab dragging animation.

[**Version 2.3.5.1**](https://github.com/Merci-chao/userChrome.js/raw/bcbd6da374d913b17ccb0a59e4d4179d5ab53839/MultiTabRows@Merci.chao.uc.js)
- Bug fix: not working on Firefox 115

[**Version 2.3.5**](https://github.com/Merci-chao/userChrome.js/raw/1258248ebcfcea275df749bfed7ba3dc1124dc5c/MultiTabRows@Merci.chao.uc.js)
- Update for Firefox 137.

[**Version 2.3.4.2**](https://github.com/Merci-chao/userChrome.js/raw/ea0d771e6e4b0bea68ce81b1e59a16c4710fc34a/MultiTabRows@Merci.chao.uc.js)
- Bug fix: tabs cannot be dragged to the first row in a special case.

[**Version 2.3.3**](https://github.com/Merci-chao/userChrome.js/raw/14387581e5fee5898182738e0e37bc53cec6a025/MultiTabRows@Merci.chao.uc.js)
- Fix several bugs that occur when the window is too narrow and only one scrolling row is allowed to show.

[**Version 2.3.2.3**](https://github.com/Merci-chao/userChrome.js/raw/636331c8b2b31f3688c96f5dcba197b0bea599e9/MultiTabRows@Merci.chao.uc.js)
- Update for Firefox 136.

[**Version 2.3.1**](https://github.com/Merci-chao/userChrome.js/raw/c901f71a1b61851e8d1782184a39b75caefe1572/MultiTabRows@Merci.chao.uc.js)
- Update for the native tab groups feature.
- Fix a visual glitch when moving the selected pinned tabs together and the tab bar is scrollable.

[**Version 2.2**](https://github.com/Merci-chao/userChrome.js/raw/f16a647ba27288eaf6b3aadbed0b5418c1866cbe/MultiTabRows@Merci.chao.uc.js)
- Update the appearance of the scrollbar on Windows 11.
- Bug fix: layout may break when the display scaling is not 100%.
- Bug fix: tabs keep bouncing in some circumstances.

[**Version 2.1.3.1**](https://github.com/Merci-chao/userChrome.js/raw/af7757559d7549297640572070099897bcf87734/MultiTabRows@Merci.chao.uc.js)
- Bug fix: tabs keep bouncing in some spacial cases, typically happens when there are many pinned tabs.
- `tabsUnderControlButtons` is forced to be `0` now when tab groups is enabled (`browser.tabs.groups.enabled` is `true`).

[**Version 2.1.2**](https://github.com/Merci-chao/userChrome.js/raw/1983caf3eee3844a5d0e0a28e95580ef23d128ff/MultiTabRows@Merci.chao.uc.js)
- Fix a bug since version 2.1: buttons before tabs cannot be clicked when there is only one row.

[**Version 2.1.1**](https://github.com/Merci-chao/userChrome.js/raw/c3f78eee83c336425402eaec9df7e9f8a70508eb/MultiTabRows@Merci.chao.uc.js)
- Fixed a bug where tabs kept bouncing in some cases.

[**Version 2.1**](https://github.com/Merci-chao/userChrome.js/raw/3f24205a522a586451683d49625c42b897df8bba/MultiTabRows@Merci.chao.uc.js)
- Improve the behavior when closing tabs.

[**Version 2.0.1**](https://github.com/Merci-chao/userChrome.js/raw/4893ce6eac6d5df54af6c0eea51561110249a17d/MultiTabRows@Merci.chao.uc.js)
- Bug fix: Changing settings or theme when there are multiple windows could cause Firefox to lag or freeze.

[**Version 2.0**](https://github.com/Merci-chao/userChrome.js/raw/0ac08cc86ba14d0db05d618163b84892560594f3/MultiTabRows@Merci.chao.uc.js)
- Implement `tabsUnderControlButtons = 2` (default).
- Add new settings: `floatingBackdropClip`, `floatingBackdropBlurriness`, `floatingBackdropOpacity`, `hideEmptyPlaceholderWhenScrolling`.
- Change `scrollbarTrackColor` and `scrollbarThumbColor` default value to `auto`.
- Settings are applied immediately.
- Better scrolling experience on tabs.
- Support Firefox 134.
- Various improvements and bug fixes.

[**Version 1.0**](https://github.com/Merci-chao/userChrome.js/raw/6156d334bffb877a85d8561bb401c620d3209304/MultiTabRows@Merci.chao.uc.js)
- First release.
</details>

## Won't Fixed Compatibility Issues
- Other tab related scripts, styles, and legacy extensions (e.g. [*Tab Mix Plus*](https://onemen.github.io/tabmixplus-docs))
- Firefox Nightly
- Firefox 116 to the previous versions of latest released
- Other Firefox-based derivative browsers
- Touch operations
- macOS
- Vertical tabs, obviously

---

# [History Submenus II](https://github.com/Merci-chao/userChrome.js/blob/main/HistorySubmenus2@Merci.chao.uc.js)
Add sub-menus to History Menu for previous days' history. [Add-on Page (web archive)](https://web.archive.org/web/20181102024750/https://addons.mozilla.org/en-US/firefox/addon/history-submenus-2/)

![screenshot](https://web.archive.org/web/20181007203210if_/https://addons.cdn.mozilla.net/user-media/previews/full/134/134638.png?modified=1530208752) 
![screenshot](https://web.archive.org/web/20181007203207if_/https://addons.cdn.mozilla.net/user-media/previews/full/63/63969.png?modified=1530208752)

## Settings
There is no setting panel and you need to open *about:config* and search for the prefix `extensions.HistorySubmenus2@Merci.chao.`.

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

[**Version 2026-05-06**](https://github.com/Merci-chao/userChrome.js/raw/a6c1cf1ca95ad2535edac611efdef41a78adeaa3/HistorySubmenus2%40Merci.chao.uc.js)
- Settings changes now take effect immediately.
- No longer relies on `security.allow_unsafe_dangerous_privileged_evil_eval` being enabled. Please reset it to `false` if it is not needed for other scripts.

[**Version 2026-05-04-1**](https://github.com/Merci-chao/userChrome.js/raw/f2f62fafc822d003c21e826a8cd6f314735154cd/HistorySubmenus2%40Merci.chao.uc.js)
- Update for Firefox 152.

[**Version 2026-05-04**](https://github.com/Merci-chao/userChrome.js/raw/ed561f60c44227f176847cb224f5f08bf71c5bb5/HistorySubmenus2%40Merci.chao.uc.js)
- Improve compatibility with some script loaders.

[**Version 2025-08-14**](https://github.com/Merci-chao/userChrome.js/raw/ed74f043645ef8c91211aaf5f593ee2bc536fe0d/HistorySubmenus2%40Merci.chao.uc.js)
- Update for Firefox 143.
- Add check upate feature.

---

# [Page Title in URL Bar](https://github.com/Merci-chao/userChrome.js/blob/main/PageTitle@Merci.chao.uc.js)
Show page title in the address bar. [Add-on Page (web archive)](https://web.archive.org/web/20181101232504/https://addons.mozilla.org/en-US/firefox/addon/page-title/)

![screenshot](https://web.archive.org/web/20181009205610if_/https://addons.cdn.mozilla.net/user-media/previews/full/165/165890.png?modified=1530208887)

## Settings
Open *about:config* and search for the prefix `extensions.PageTitle@Merci.chao.`.

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

[**Version 2026-07-14**](https://github.com/Merci-chao/userChrome.js/raw/3d653904e81287d5123e2a8a7ef3c64f9df9a587/PageTitle%40Merci.chao.uc.js)
- Update for Firefox 154.
- Fixed an issue where the corners of text were cut off.

[**Version 2026-06-17**](https://github.com/Merci-chao/userChrome.js/raw/47d3a4b9c2cbfc539be1112c5d623068b585978b/PageTitle%40Merci.chao.uc.js)
- Update for Firefox 153.

[**Version 2026-05-04-1**](https://github.com/Merci-chao/userChrome.js/raw/e17abacd2975c2b71b912702f69112c206fdb92f/PageTitle%40Merci.chao.uc.js)
- Update for Firefox 152.

[**Version 2026-05-04**](https://github.com/Merci-chao/userChrome.js/raw/9a0ee009101ca89dd15188677e51731e7bff79f5/PageTitle%40Merci.chao.uc.js)
- Improve compatibility with some script loaders.

[**Version 2026-04-16**](https://github.com/Merci-chao/userChrome.js/raw/1d73ef36bd4e4ca88f5106560d66b752ea45bf29/PageTitle%40Merci.chao.uc.js)
- Update for Firefox 151.

[**Version 2026-01-09**](https://github.com/Merci-chao/userChrome.js/raw/cff7e5f0cc0f930ee3216790876fe8b8da827321/PageTitle%40Merci.chao.uc.js)
- Fix minor layout issues according to the Trust Panel.

[**Version 2025-12-16**](https://github.com/Merci-chao/userChrome.js/raw/0a74ea21813d6fb5aa4c24b583c5850ad3fad64c/PageTitle%40Merci.chao.uc.js)
- Add `showUnicodeDomain`: display the Unicode characters in domain. 

[**Version 2025-12-12**](https://github.com/Merci-chao/userChrome.js/raw/dfcd52a73eb79e9e9a7db2b5d2a25872d4c736e7/PageTitle%40Merci.chao.uc.js)
- Support Trust Panel feature.
- Update the update-checking feature.
- Add `checkUpdateAutoApply`: update the script file automatically when there is a new version, `1` - never, `2` - always, `3` - always and sliently.

[**Version 2025-11-28**](https://github.com/Merci-chao/userChrome.js/raw/6d6b2481f653efee2432134088713fc70729bf81/PageTitle%40Merci.chao.uc.js)
- Update for Firefox 147.

[**Version 2025-11-16-01**](https://github.com/Merci-chao/userChrome.js/raw/1a5106bb79819ce02b7b23d58e1e1cff8ace156e/PageTitle%40Merci.chao.uc.js)
- Update for Firefox 147.

[**Version 2025-09-09**](https://github.com/Merci-chao/userChrome.js/raw/cb188806fef8b365d8761ad2609a59055ac885e6/PageTitle%40Merci.chao.uc.js)
- Add check upate feature.

---

# [Semi-Full Screen / Toolbar Auto-Hide](https://github.com/Merci-chao/userChrome.js/blob/main/SemiFullScreen@Merci.chao.uc.js)
Full screen with keeping your task bar visible, or hide the toolbars when not maximized. [Add-on Page (web archive)](https://web.archive.org/web/20181102230042/https://addons.mozilla.org/en-US/firefox/addon/semi-full-screen/)

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
Open *about:config* and search for the prefix `extensions.SemiFullScreen@Merci.chao.`.

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

[**Version 2026-05-04**](https://github.com/Merci-chao/userChrome.js/raw/edd0d7a00b737dde1103dd012a23c9683833dae3/SemiFullScreen%40Merci.chao.uc.js)
- Improve compatibility with some script loaders.

[**Version 2025-08-24**](https://github.com/Merci-chao/userChrome.js/raw/b1a644af37a53705909283b9bfd1459446596a88/SemiFullScreen%40Merci.chao.uc.js)
- Restore missing window border on Windows 7 and 8.
- Add `autoHideToolbarDelay`: The delay (in milliseconds) before auto-hiding the toolbar when the mouse has left the window edge and hasn't re-entered.

[**Version 2025-08-20**](https://github.com/Merci-chao/userChrome.js/raw/c9807aa1d1004f9ec3b7c95b6f5ec3979be9a70c/SemiFullScreen%40Merci.chao.uc.js)
- Not hiding the dragging spaces on no-tab bar mode.

[**Version 2025-08-16**](https://github.com/Merci-chao/userChrome.js/raw/47a3bd1a4b2c93fbab83a6917926d71ed535e00a/SemiFullScreen%40Merci.chao.uc.js)
- Fix unintentional space on the tab bar.
- Add check upate feature.

---

# [Float Toolbars in Full Screen](https://github.com/Merci-chao/userChrome.js/blob/main/FloatToolbarsInFullScreen@Merci.chao.uc.js)
Float the toolbars over the page in full screen mode, instead of making the web page jumpy when the toolbars showing / hiding. [Add-on Page (web achive)](https://web.archive.org/web/20181017035437/https://addons.mozilla.org/en-US/firefox/addon/float-toolbars-in-full-screen/)

**CAUTION: This version of Float Toolbars in Full Screen is not tested on Mac OS and Ubuntu (Linux). It is probably glitchy or simply doesn't work at all.**

![screenshot](https://web.archive.org/web/20181012014653if_/https://addons.cdn.mozilla.net/user-media/previews/full/180/180636.png?modified=1530209532)

## Settings
Open *about:config* and search for the prefix `FloatToolbarsInFullScreen@Merci.chao.`.

> [!NOTE]
> Settings will apply to new windows.

| Name | Description |
| ------------- | ------------- |
| `checkUpdate` | Check for a new version of this script when Firefox starts up or opens new windows. Set it to `1` or larger to enable or `0` to disable. The value will be updated with the last checking time. <br><b>💡 Enabling it is strongly recommended, as outdated scripts are unlikely to function properly on newer versions of Firefox.</b> |
| `checkUpdateAutoApply` | Update the script file automatically when there is a new version:<ul><li>`1` - never</li><li>`2` - always</li><li>`3` - always and sliently</li></ul> |
| `checkUpdateFrequency` | How often to check for new versions (days). Minimum: `1`. |

## Changelog
📥 [Download the Lastest Version](https://github.com/Merci-chao/userChrome.js/raw/refs/heads/main/FloatToolbarsInFullScreen@Merci.chao.uc.js)

[**Version 2026-05-04**](https://github.com/Merci-chao/userChrome.js/raw/655fe2c483e74d3ec6c68c2055faa9d1ec8fc4c6/FloatToolbarsInFullScreen%40Merci.chao.uc.js)
- Improve compatibility with some script loaders.

[**Version 2025-08-16**](https://github.com/Merci-chao/userChrome.js/raw/30ece47b652ffa9ec8af996595c3c128c1b4e85d/FloatToolbarsInFullScreen%40Merci.chao.uc.js)
- Now the tab bar will show the native window style in full screen.
- Add check upate feature.

---

# [undoCloseTab.uc.js](https://github.com/Merci-chao/userChrome.js/blob/main/undoCloseTab.uc.js)
Display the Undo Close Tabs, Recently Closed Tabs, Recently Closed Windows and Restore Previous Session at the tab bar right-click menu.

---

# [lockBookmarksDefaultLocation.uc.js](https://github.com/Merci-chao/userChrome.js/blob/main/lockBookmarksDefaultLocation.uc.js)
Lock the location of newly added bookmarks, preventing it from being changed by Firefox. 

Before applying this script, click the Star button in the address bar to create a new bookmark, and set the folder as the default location.

---

# [restart-button.uc.js](https://github.com/Merci-chao/userChrome.js/blob/main/restart-button.uc.js)
Restart Firefox by middle-clicking on the Exit button in Application menu.

---

# [autoTitleBar@Merci.chao.uc.js](https://github.com/Merci-chao/userChrome.js/blob/main/autoTitleBar%40Merci.chao.uc.js)
Display the title bar on mouseover at the top edge; hide it when hovering over page content.

---

# [showScrollbarInMenus.uc.js](https://github.com/Merci-chao/userChrome.js/blob/main/showScrollbarInMenus.uc.js)
Display scrollbar for long menus (Bookmarks menu, for instance), instead of arrows at the top and bottom.
