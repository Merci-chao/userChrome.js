You're welcome to post your suggestions and bug reports [here](https://github.com/Merci-chao/userChrome.js/issues/new).

# [Multi Tab Rows](https://github.com/Merci-chao/userChrome.js/blob/main/MultiTabRows%40Merci.chao.uc.js)
Make Firefox support multiple tab rows.

 ![screenshot](https://github.com/Merci-chao/userChrome.js/blob/main/screenshots/themesupport.png)

## Highlights
- Maximize space utilization, e.g. fully utilize the space under the window control buttons.
- Tab-dragging animation is available in multi-row mode.
![screenshot](https://github.com/Merci-chao/userChrome.js/blob/main/screenshots/tabdragging.png)
- While the tab bar is scrollable, pinned tabs remain pinned and placed in a compact grid layout, allowing you to have numerous pinned tabs.
![screenshot](https://github.com/Merci-chao/userChrome.js/blob/main/screenshots/pinnedtabs.png)
- Highly integrated with Firefox's well-designed behavior, allowing Firefox to support multiple rows like native.
- Compatible with themes even if you have massive rows.

## Compatibility
- Firefox 115, the latest released and beta versions, for Windows 7 to 10.
- Support general script loaders, like [xiaoxiaoflood's userChromeJS](https://github.com/xiaoxiaoflood/firefox-scripts)

## Settings
Open `about:config` and search for the prefix `userChromeJS.multiTabRows@Merci.chao`. Settings will apply to new windows. 

| Name | Description |
| ------------- | ------------- |
| `maxTabRows` | Maximum number of rows to display at once. The minimum value is `1`. |
| `rowStartIncreaseFrom` | When the window width is larger than this number plus `rowIncreaseEvery`, multi-row display is allowed. |
| `rowIncreaseEvery` | Each time the window width is increased by this amount, one more row is allowed. When set to the minimum value `0`, the maximum number of rows is directly allowed to be displayed. |
| `spaceAfterTabs` | Empty space before the window control buttons. The minimum value is `0`. |
| `spaceAfterTabsOnMaximizedWindow` | Empty space before the window control buttons, when maximumized. The minimum value is `0`. |
| `spaceBeforeTabs` | Empty space on the left side of the window. The minimum value is `0`. |
| `spaceBeforeTabsOnMaximizedWindow` | Empty space on the left side of the window, when maximumized. The minimum value is `0`. |
| `gapAfterPinned` | Empty space between the pinned tabs and normal tabs. The minimum value is `0`. |
| `tabsUnderControlButtons` | Show tabs below window control buttons when there are multiple rows: `0` (never), `1` (when rows are not overflowing), `2` (always, not yet implemented). |
| `tabsbarItemsAlign` | Alignment of the Tabs Bar, allowed values are: `start` (top), `center` and `end` (bottom). This setting is only valid when `tabsUnderControlButtons` is `0`, or `1` with rows overflowing. |
| `linesToScroll` | How many rows to scroll when using the mouse wheel. The minimum value is `1`. |
| `linesToDragScroll` | How many rows to scroll when dragging tabs to top/bottom edge. The minimum value is `1`. |
| `thinScrollbar` | Use a thin scrollbar without up and down buttons. |
| `scrollbarTrackColor` | Color of the scrollbar track, must be a valid CSS color or variable. |
| `scrollbarThumbColor` | Color of the scrollbar thumb, must be a valid CSS color or variable. |
| `dynamicThemeImageSize` | When using themes, the size of the background image changes with the current number of rows. |
| `hideAllTabs` | Hide the "List all tabs" button. (only available on Firefox 115) |
| `compactControlButtons` | Display the window control buttons to a compact size. (only available on Windows 10 and above) |
| `debugMode` | Mode for debugging, not for general use. |

## Cautions
- Since this script contains many sensitive layout calculations designed for native Firefox, any tab or tabs toolbar-related legacy extensions, user scripts or stylesheets may cause weird glitches and bugs. Please check your legacy extensions, scripts and stylesheets (if any) before and after applying this script.
- This script is developed for Windows and may not (and probably doesn't) work on Linux or macOS.

## Known Issues
- Settings only apply to new windows, but not immediately.
- When the tab bar is scrollable, the tabs are restricted and no longer placed below the window control buttons. A solution may be coming, but it may not be perfect.
- Tabs opening/closing by themselves (e.g. pop-ups) while dragging tabs may cause strange behavior.
- Not support the native tab-groups feature of Firefox Nightly.
- Not tested on Windows 11 and touch devices.

## Won't Fixed Compatibility Issues
- Other tab related scripts, stylesheets, and legacy extensions (e.g. [Tab Mix Plus](https://github.com/onemen/TabMixPlus))
- Firefox Nightly
- Firefox 116 to the previous versions of latest released
- macOS and Linux
- Vertical tabs, obviously

# [History Submenus II](https://github.com/Merci-chao/userChrome.js/blob/main/HistorySubmenus2%40Merci.chao.uc.js)
Add sub-menus to History Menu for previous days' history. [Add-on Page (web archive)](https://web.archive.org/web/20181102024750/https://addons.mozilla.org/en-US/firefox/addon/history-submenus-2/)

![screenshot](https://web.archive.org/web/20181007203210if_/https://addons.cdn.mozilla.net/user-media/previews/full/134/134638.png?modified=1530208752) 
![screenshot](https://web.archive.org/web/20181007203207if_/https://addons.cdn.mozilla.net/user-media/previews/full/63/63969.png?modified=1530208752)

## Settings
There is no setting panel and you need to open `about:config` and search for the prefix `extensions.HistorySubmenus2@Merci.chao`. Settings will apply to new windows. 
| Name | Description |
| ------------- | ------------- |
| `submenuCount` | Count of items listing directly in the History menu.|
| `historyCount` | Count of sub-menus.|
| `dateFormat` | The format of the name of sub-menus.|

# [Page Title in URL Bar](https://github.com/Merci-chao/userChrome.js/blob/main/PageTitle%40Merci.chao.uc.js)
Show page title in URL Bar. [Add-on Page (web archive)](https://web.archive.org/web/20181101232504/https://addons.mozilla.org/en-US/firefox/addon/page-title/)

![screenshot](https://web.archive.org/web/20181009205610if_/https://addons.cdn.mozilla.net/user-media/previews/full/165/165890.png?modified=1530208887)

## Settings
Open `about:config` and search for the prefix `extensions.PageTitle@Merci.chao`. Settings will apply to new windows. 

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
