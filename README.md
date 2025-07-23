You're welcome to post your suggestions and bug reports [here](https://github.com/Merci-chao/userChrome.js/issues/new).

# IMPORTANT

Since the scripts may not fully work on new versions of Firefox, please check here for newer versions of script if you encounter any issues. You may subscribe to this repository to receive notifications of updates:

1. Sign up GitHub: https://github.com/signup
2. Click the `Watch` button of this repository and choose `Custom`:

     ![screenshot](https://github.com/Merci-chao/userChrome.js/blob/main/screenshots/gitwatch-0.png)

3. Select `Releases` and click `Apply`:

     ![screenshot](https://github.com/Merci-chao/userChrome.js/blob/main/screenshots/gitwatch-2.png)

# [Multi Tab Rows](https://github.com/Merci-chao/userChrome.js/blob/main/MultiTabRows%40Merci.chao.uc.js)
Make Firefox support multiple rows of tabs.

![screenshot](https://raw.githubusercontent.com/Merci-chao/userChrome.js/refs/heads/main/screenshots/scrolling.png)
## Highlights
- **🗂️ Tab Groups Support:** Fully supports tab groups and fine-tunes tab operation for a smoother experience.
- **🎞️ Enhanced Tab Animations:** Adds fluid transitions for various tab-related actions.
- **📐 Optimized Space Usage:** Makes full use of available UI space, including the area beneath window control buttons.
- **🖱️ Smooth Tab-Dragging Animation:** Supports animated tab dragging even in multi-row mode.
- **📌 Pinned Tabs Grid Layout:** Pinned tabs are fixed in a compact grid when the Tabs Bar scrolls — ideal for managing large numbers of pinned tabs.
- **🦊 Native-Like Firefox Integration:** Seamlessly aligns with Firefox’s behavior to support multi-row tabs as if natively built-in.
- **🎨 Theme Compatibility:** Fully compatible with themes, regardless of how many tab rows are present.

## Compatibility
- Firefox 115, 140, 141, for Windows 7 to 11.
- Supports general script loaders, like xiaoxiaoflood's userChromeJS.

## Cautions
**⚠️ Please read the following notes carefully before using this script:**
- This is an unofficial (and complicated) script maintained solely by me. It may contain unforeseen bugs and does not guarantee compatibility with the latest versions of Firefox. In extreme cases, particularly when using an outdated version of this script with a newly updated Firefox, it could render the browser unusable and potentially result in the permanent loss of your previous browsing session. Please use this script only if you are prepared to handle such situations.
- This script needs to override some functions of Firefox and requires [`security.allow_unsafe_dangerous_privileged_evil_eval`](https://bugzilla.mozilla.org/show_bug.cgi?id=1958232) to be enabled on Firefox 139+ for this purpose, which may weaken the security of your browser in some special cases. The said setting is enabled automatically once you are applying this script, and it requires a manual disabling through `about:config` after disabling or removing the script. Please note that and use this script with understanding.
- Since this script contains many sensitive layout calculations designed for native Firefox, any tab or Tabs Bar-related legacy extensions (e.g. [Tab Mix Plus](https://github.com/onemen/TabMixPlus)), user scripts or styles can cause weird glitches and bugs. Please check your legacy extensions, scripts and styles (if any) before and after applying this script.
- This script is developed for Windows and probably does not work on Linux and macOS.

## Installation
1. Follow the instructions in the [Tab Mix Plus - Docs](https://onemen.github.io/tabmixplus-docs/other/installation/#install-firefox-scripts) to install the Firefox Scripts, including `configuration files` and `utils`.
2. Download the [script file](https://github.com/Merci-chao/userChrome.js/raw/refs/heads/main/MultiTabRows@Merci.chao.uc.js) and place it in your `chrome` folder.
3. Restart Firefox to apply.

🪧 Note: If the script loader stops working after updating Firefox, please visit the page above and reinstall the latest version of the script loader.

## Settings
Open [`about:config`](https://support.mozilla.org/kb/about-config-editor-firefox) and search for the prefix `userChromeJS.multiTabRows@Merci.chao`. Settings shown in gray are disabled due to other configurations.

| Name | Description |
| ------------- | ------------- |
| `checkUpdate` | Check for a new version of this script when Firefox starts up or opens new windows. Set it to `1` to enable or `0` to disable. The value will be updated with the last checking time. <br><b>💡 Enabling it is strongly recommended, as outdated scripts are unlikely to function properly on newer versions of Firefox.</b> |
| `checkUpdateFrequency` | How often to check for new versions (days). The minimum value is `1`. |
| `compactControlButtons` | Display the window control buttons to a compact size, only available on Windows 10 and 11, unavailable when Mica is activated and [Accent Color on Title Bars](https://support.microsoft.com/windows/3290d30f-d064-5cfe-6470-2fe9c6533e37) is inactivated. |
| `debugMode` | ⛔ Mode for debugging, not for general use. |
| `dragToGroupTabs` | Enable tab grouping when dragging tabs over another. Disabling this setting results in behavior that differs from when `browser.tabs.dragDrop.moveOverThresholdPercent` is set to `50` or below: the disabled state allows tabs to be added to or removed from a group without altering their order. Not available on Firefox 115 or `browser.tabs.groups.enabled` is `false`. |
| `dynamicMoveOverThreshold` | Make tab-dragging movement smoother in certain scenarios, e.g. dragging pinned or grouped tabs. Not available on Firefox 115, or either `dragToGroupTabs` or `browser.tabs.groups.enabled` is `false`. |
| `dynamicThemeImageSize` | When using themes, the size of the background image changes with the current number of rows. |
| `floatingBackdropBlurriness` | How blurry the background of items covering the tabs is when scrolling, available when `tabsUnderControlButtons` is `2` and both `floatingBackdropClip` & `nativeWindowStyle` are `false`. The minimum value is `0`. Not available on Firefox 115. |
| `floatingBackdropClip` | Clip the area covered by items on the Tabs Bar when scrolling, available when `tabsUnderControlButtons` is `2`. |
| `floatingBackdropOpacity` | How opaque the background of items covering the tab is when scrolling, available when `tabsUnderControlButtons` is `2` and `floatingBackdropClip` is `false`. The value should be from `0` to `100`. |
| `gapAfterPinned` | Empty space between the pinned tabs and normal tabs. The minimum value is `0`. |
| `hideAllTabs` | Hide the "List all tabs" button. Only available on Firefox 115. On newer versions of Firefox, you may remove it by right-clicking on it and choosing "Remove from Toolbar". |
| `hideEmptyPlaceholderWhenScrolling` | If there is no item in the upper left corner, hide the empty space in that corner when scrolling, available when `tabsUnderControlButtons` is `2`. |
| `linesToDragScroll` | How many rows to scroll when dragging tabs to top/bottom edge. The minimum value is `1`. |
| `linesToScroll` | How many rows to scroll when using the mouse wheel. The minimum value is `1`. |
| `maxTabRows` | Maximum number of rows to display at once. The minimum value is `1`. |
| `nativeWindowStyle` | Display the system-native theme style on Tabs Bar (e.g. effects from DWM tools). Not available on Firefox 115, or using any Firefox theme. |
| `rowIncreaseEvery` | Each time the window width is increased by this amount, one more row is allowed. When set to the minimum value `0`, the maximum number of rows is directly allowed to be displayed. |
| `rowStartIncreaseFrom` | When the window width is larger than this number plus `rowIncreaseEvery`, multi-row display is allowed. |
| `scrollbarThumbColor` | Color of the scrollbar thumb, must be a valid CSS color, variable, or the keyword `auto`. |
| `scrollbarTrackColor` | Color of the scrollbar track, must be a valid CSS color, variable, or the keyword `auto`. |
| `spaceAfterTabs` | Empty space before the window control buttons. The minimum value is `0`. |
| `spaceAfterTabsOnMaximizedWindow` | Empty space before the window control buttons, when maximumized. The minimum value is `0`. |
| `spaceBeforeTabs` | Empty space on the left side of the window. The minimum value is `0`. |
| `spaceBeforeTabsOnMaximizedWindow` | Empty space on the left side of the window, when maximumized. The minimum value is `0`. |
| `tabsbarItemsAlign` | Alignment of the Tabs Bar, allowed values are: `start` (top), `center` and `end` (bottom). This setting is only valid when `tabsUnderControlButtons` is `0`, or `1` with rows scrolling. |
| `tabsUnderControlButtons` | Show tabs beneath window control buttons when there are multiple rows: `0` (never), `1` (when rows are not scrolling), `2` (always).<br>**🪧 Note:** This feature is experimental and may contain bugs or glitches. If any issues occur, set the value to `0` or `1` to disable or partially disable this feature. |
| `thinScrollbar` | Use a thin scrollbar without up and down buttons. |

## Changelog
Version 3.0
- Add full support for tab groups.
- Introduce animations for various tab-related actions.
- Add the `dragToGroupTabs` option to enable or disable tab grouping when dragging tabs over another.
- Add the `dynamicMoveOverThreshold` option to make tab-dragging movement smoother in certain scenarios.
- Add the `nativeWindowStyle` option to display the system-native theme style on Tabs Bar (e.g. effects from DWM tools).
- Update for Firefox 141.
- Bug fixes and improvements.

Version 2.6
- Fix layout problem when there are some audio playing/blocked/muted tabs.
- Fix layout problem when UI density is `Touch`.

Version 2.5.1
- Fix a bug that can't drop non-tab things onto Tabs Bar since the previous version.

Version 2.5
- Improve the experience of dragging non-adjacent tabs.
- Add check-update feature. Change `checkUpdateFrequency` to how often (days) you want, disable it by setting `checkUpdate` to `0`.

Version 2.4
- Update for Firefox 138.
- Improvements and bug-fixings for tab dragging animation.

Version 2.3.5.1
- Bug fix: not working on Firefox 115

Version 2.3.5
- Update for Firefox 137.

Version 2.3.4.2
- Bug fix: tabs cannot be dragged to the first row in a special case.

Version 2.3.3
- Fix several bugs that occur when the window is too narrow and only one scrolling row is allowed to show.

Version 2.3.2.3
- Update for Firefox 136.

Version 2.3.1
- Update for the native tab groups feature.
- Fix a visual glitch when moving the selected pinned tabs together and the tabs are scrolling.

Version 2.2
- Update the appearance of the scrollbar on Windows 11.
- Bug fix: layout may break when the display scaling is not 100%.
- Bug fix: tabs keep bouncing in some circumstances.

Version 2.1.3.1
- Bug fix: tabs keep bouncing in some spacial cases, typically happens when there are many pinned tabs.
- `tabsUnderControlButtons` is forced to be `0` now when tab groups is enabled (`browser.tabs.groups.enabled` is `true`).

Version 2.1.2
- Fix a bug since version 2.1: buttons before tabs cannot be clicked when there is only one row.

Version 2.1.1
- Fixed a bug where tabs kept bouncing in some cases.

Version 2.1
- Improve the behavior when closing tabs.

Version 2.0.1
- Bug fix: Changing settings or theme when there are multiple windows could cause Firefox to lag or freeze.

Version 2.0
- Implement `tabsUnderControlButtons = 2` (default).
- Add new settings: `floatingBackdropClip`, `floatingBackdropBlurriness`, `floatingBackdropOpacity`, `hideEmptyPlaceholderWhenScrolling`.
- Change `scrollbarTrackColor` and `scrollbarThumbColor` default value to `auto`.
- Settings are applied immediately.
- Better scrolling experience on tabs.
- Support Firefox 134.
- Various improvements and bug fixes.

Version 1.0
- First release.

## Won't Fixed Compatibility Issues
- Other tab related user scripts, styles, and legacy extensions (e.g. [Tab Mix Plus](https://github.com/onemen/TabMixPlus))
- Firefox Nightly
- Firefox 116 to the previous versions of latest released
- macOS and Linux
- Vertical tabs, obviously

# [History Submenus II](https://github.com/Merci-chao/userChrome.js/blob/main/HistorySubmenus2%40Merci.chao.uc.js)
Add sub-menus to History Menu for previous days' history. [Add-on Page (web archive)](https://web.archive.org/web/20181102024750/https://addons.mozilla.org/en-US/firefox/addon/history-submenus-2/)

![screenshot](https://web.archive.org/web/20181007203210if_/https://addons.cdn.mozilla.net/user-media/previews/full/134/134638.png?modified=1530208752) 
![screenshot](https://web.archive.org/web/20181007203207if_/https://addons.cdn.mozilla.net/user-media/previews/full/63/63969.png?modified=1530208752)

## Settings
There is no setting panel and you need to open `about:config` and search for the prefix `extensions.HistorySubmenus2@Merci.chao`. Settings will be applied after restarting Firefox. 
| Name | Description |
| ------------- | ------------- |
| `submenuCount` | Count of items listing directly in the History menu.|
| `historyCount` | Count of sub-menus.|
| `dateFormat` | The format of the name of sub-menus.|

# [Page Title in URL Bar](https://github.com/Merci-chao/userChrome.js/blob/main/PageTitle%40Merci.chao.uc.js)
Show page title in URL Bar. [Add-on Page (web archive)](https://web.archive.org/web/20181101232504/https://addons.mozilla.org/en-US/firefox/addon/page-title/)

![screenshot](https://web.archive.org/web/20181009205610if_/https://addons.cdn.mozilla.net/user-media/previews/full/165/165890.png?modified=1530208887)

## Settings
Open `about:config` and search for the prefix `extensions.PageTitle@Merci.chao`. Settings will be applied after restarting Firefox. 

| Name | Description |
| ------------- | ------------- |
| `showDomain` | Display the domain nearby the lock icon. |
| `showSubTitle` | Display the url path after the page title. |
| `showUriOnHover` | Display the url temporarily when mouse hovering. |
| `decodeHashAndSearch` | Decode the hash and the query part, e.g. `/index.html#hello%20world` to `/index.html#hello world`. |
| `hideWww` | Hide the `www` sub-domain. |
| `highlightIdentityBox` | Add a backgrond for identity box (only when `showDomain` is `true`). |
| `formattingEnabled` | Highlight the domain (only when `showDomain` is `false`). |

# [Semi-Full Screen / Picture-in-Picture Mode](https://github.com/Merci-chao/userChrome.js/blob/main/SemiFullScreen%40Merci.chao.uc.js)
Full screen with keeping your task bar visible, or hide the toolbars when not maximized (picture-in-picture). [Add-on Page (web archive)](https://web.archive.org/web/20181102230042/https://addons.mozilla.org/en-US/firefox/addon/semi-full-screen/)

**CAUTION: This version of Semi-Full Screen is not tested on Mac OS and Ubuntu (Linux). It is probably glitchy or simply doesn't work at all.**

![screenshot](https://web.archive.org/web/20181013030904if_/https://addons.cdn.mozilla.net/user-media/previews/full/173/173740.png?modified=1530209326)

## Hotkeys
| Hotkey | Function |
| ------------- | ------------- |
| `F11` or `Full Screen Button` | Hide the toolbars and enter picture-in-picture mode. |
| `Ctrl + F11` or `Ctrl + Full Screen Button` | Mazimize the window and enter semi-full screen mode, taskbar and sidebar (if any) will keep visible. |
| `Shift + F11` or `Shift + Full Screen Button` | Enter normal full screen mode. |

## Settings
Open `about:config` and search for the prefix `extensions.SemiFullScreen@Merci.chao`. Settings will apply to new windows. 
| Name | Description |
| ------------- | ------------- |
| `reverse` | Use `F11` for semi-full screen and `Ctrl + F11` for picture-in-picture.|

# [Float Toolbars in Full Screen](https://github.com/Merci-chao/userChrome.js/blob/main/FloatToolbarsInFullScreen%40Merci.chao.uc.js)
Float the toolbars over the page in full screen mode, instead of making the web page jumpy when the toolbars showing / hiding. [Add-on Page (web achive)](https://web.archive.org/web/20181017035437/https://addons.mozilla.org/en-US/firefox/addon/float-toolbars-in-full-screen/)

**CAUTION: This version of Float Toolbars in Full Screen is not tested on Mac OS and Ubuntu (Linux). It is probably glitchy or simply doesn't work at all.**

![screenshot](https://web.archive.org/web/20181012014653if_/https://addons.cdn.mozilla.net/user-media/previews/full/180/180636.png?modified=1530209532)

# [undoCloseTab.uc.js](https://github.com/Merci-chao/userChrome.js/blob/main/undoCloseTab.uc.js)
Display the Undo Close Tabs, Recently Closed Tabs, Recently Closed Windows and Restore Previous Session at the top of tabbar context menu.

# [restart-button.uc.js](https://github.com/Merci-chao/userChrome.js/blob/main/restart-button.uc.js)
Restart Firefox by middle-clicking on the Exit button in Application menu.

# [showScrollbarInMenus.uc.js](https://github.com/Merci-chao/userChrome.js/blob/main/showScrollbarInMenus.uc.js)
Display scrollbar for long menus (Bookmarks menu, for instance), instead of arrows at the top and bottom.
