**🌐 [English Version](README.md)**

---

💡🐞ご提案やバグ報告は[こちら](https://github.com/Merci-chao/userChrome.js/issues/new)にどうぞ（日本語歓迎）。

---

# [Multi Tab Rows（多段タブ）](https://github.com/Merci-chao/userChrome.js/blob/main/MultiTabRows%40Merci.chao.uc.js)
Firefox に多段タブ表示をサポートさせる。

![screenshot](https://raw.githubusercontent.com/Merci-chao/userChrome.js/refs/heads/main/screenshots/scrolling.png)

## 注目ポイント
- **🗂️ タブグループ対応：** タブグループを完全にサポートし、滑らかな操作を実現。
- **🎞️ 強化されたタブアニメーション：** タブに関連する各種動作にスムーズなアニメーションを追加。
- **📐 スペース活用の最適化：** ウィンドウ制御ボタン下のスペースも含め、UI領域を最大限に活用。（手動で有効化する必要あり）
- **🖱️ 滑らかなタブドラッグアニメーション：** 多段モードでもドラッグのアニメーションをサポート。
- **📌 ピン留めタブのグリッド表示：** タブバーがスクロールされる際、ピン留めされたタブをコンパクトなグリッドに固定。
- **🦊 Firefox にネイティブ統合：** Firefox の動作とシームレスに連携し、まるで標準機能のように多段タブに対応。
- **🎨 テーマとの互換性：** 段数に関係なく様々なテーマに完全対応。

## 対応環境
- Firefox 115、141、142、Windows 7〜11 に対応。
- 一般的なスクリプトローダーに対応。

## 注意事項
**🚨 ※注意：ご使用の前に、以下の注意点をよくお読みください：**
- ❗ **Firefox に最適化されたレイアウト計算を多く含むため、タブやタブバー関連の旧式拡張（例：[Tab Mix Plus](https://onemen.github.io/tabmixplus-docs)）、スクリプト、CSSスタイルによって不具合が発生する可能性があります。スクリプト適用前後にそれらを確認するか、[`tabsUnderControlButtons`](#tabsUnderControlButtons) を無効にしてください。**
- 本スクリプトは Windows 専用です。Ubuntu（Linux）および macOS では動作しない、あるいは不具合が生じる恐れがあります。
- 非公式かつ複雑なスクリプトで、個人によって管理されています。予期しないバグを含む可能性があり、最新の Firefox バージョンとの互換性は保証されません。古いスクリプトを新しい Firefox に適用すると、最悪の場合正常に動作しなくなったり、セッションが失われるおそれがあります。リスクと対処方法をご理解の上、ご利用ください。
- Firefox の関数を上書きする必要があるため、Firefox 139 以降では [`security.allow_unsafe_dangerous_privileged_evil_eval`](https://bugzilla.mozilla.org/show_bug.cgi?id=1958232) の設定が必要です。この設定はスクリプト適用時に自動で有効化されますが、スクリプト削除時には `about:config` で手動無効化が必要です。

## インストール方法
1. ほかのスクリプトを使用していない場合は、[Tab Mix Plus - Docs（Google 翻訳）](http://translate.google.com/translate?tl=ja&u=https://onemen.github.io/tabmixplus-docs/other/installation/#install-firefox-scripts) に従ってスクリプトローダー（Firefox Scripts）をインストールします。すでに他のスクリプトを使用している場合はこの手順を省略できます。  
![screenshot](https://raw.githubusercontent.com/Merci-chao/userChrome.js/refs/heads/main/screenshots/installscriptloader.jp.png)

2. [スクリプトファイル](https://github.com/Merci-chao/userChrome.js/raw/refs/heads/main/MultiTabRows@Merci.chao.uc.js)をダウンロードし、`chrome` フォルダーに配置します。<br>
**🔔 他のタブバー関連スクリプトや CSS が有効になっていないことを確認してください。**  
4. Firefox を再起動して反映します。

🪧 注意：Firefox 更新後にスクリプトローダーが動作しなくなった場合は、上記ページから最新のスクリプトローダーを再インストールしてください。

## 設定
[`about:config`](https://support.mozilla.org/kb/about-config-editor-firefox) を開いて、`userChromeJS.multiTabRows@Merci.chao.` で始まる設定項目を検索してください。グレー表示の項目は他の設定との関係で無効化されています。

`user.js` で設定する場合（※非推奨）、接頭辞 `userChromeJS.multiTabRows@Merci.chao.` を含めてください。例：`user_pref("userChromeJS.multiTabRows@Merci.chao.maxTabRows", 5);`。<br>
**🚨 ※注意：他の設定との依存関係により、これらの設定の多くが反映されない可能性があります。`user.js` を使用するのではなく、`about:config` 経由で直接設定することを強く推奨します。**

| 設定項目（※接頭辞あり） | 説明 |
| ------------- | ------------- |
| `animationDuration` | アニメーションの時間（ミリ秒、`0`～`1000` ※長すぎるとパフォーマンスに影響します）。 |
| `autoCollapse` | **🧪 実験的機能 🚨**<br>ホバーしていない時にタブを折りたたむ。`tabsUnderControlButtons` は無効化され、固定タブも解除されます。Firefox 115 では `layout.css.has-selector.enabled` を `true` にする必要あり。 |
| `autoCollapseDelayCollapsing` | カーソルが離れてから折りたたむまでの遅延（ミリ秒）。 |
| `autoCollapseDelayExpanding` | ホバー後に展開されるまでの遅延（ミリ秒）。 |
| `checkUpdate` | Firefox 起動時や新しいウィンドウを開くたびにスクリプトの新バージョンを確認します。`0` で無効、`2` 以上で有効。値は最後に確認した時刻で更新されます。`1` は初回インストールと見なされるため設定しないでください。<br><b>💡 有効化を強く推奨します。古いスクリプトは新しい Firefox では正常に動作しない可能性があります。</b> |
| `checkUpdateFrequency` | 新バージョンの確認頻度（日単位）。最小値は `1`。 |
| `compactControlButtons` | ウィンドウ制御ボタンをコンパクトに表示します。Windows 10 と 11 でのみ対応。 |
| `debugMode` | ⛔ デバッグモード。一般向けではありません。 |
| `dragToGroupTabs` | タブを他のタブにドラッグした際にグループ化を有効化します。`browser.tabs.dragDrop.moveOverThresholdPercent` が `50` 以下の場合の動作と異なり、この設定を無効にすると順序を変更せずグループに追加／削除できます。Firefox 115 または `browser.tabs.groups.enabled` が `false` の場合は未対応。 |
| `dynamicMoveOverThreshold` | ピン留めやグループ化されたタブのドラッグ時の移動を滑らかにします。Firefox 115 または `dragToGroupTabs` や `browser.tabs.groups.enabled` が無効な場合は未対応。 |
| `dynamicThemeImageSize` | テーマ使用時、背景画像のサイズが現在の段数に応じて変化します。 |
| `floatingBackdropBlurriness` | スクロール時にタブを覆う要素の背景ぼかし強度を設定します。`tabsUnderControlButtons` が `2` かつ `floatingBackdropClip`、`nativeWindowStyle` が `false` のときのみ有効。Firefox 115 では未対応。 |
| `floatingBackdropClip` | スクロール時にタブバーを覆う要素の領域をクリップします。`tabsUnderControlButtons` が `2` のときのみ有効。 |
| `floatingBackdropOpacity` | スクロール時にタブを覆う要素の背景の不透明度を設定します。`tabsUnderControlButtons` が `2` かつ `floatingBackdropClip` が `false` のとき有効。値は `0`〜`100`。 |
| `gapAfterPinned` | ピン留めされたタブと通常のタブの間の隙間。最小値は `0`。 |
| `hideAllTabs` | 「タブの一覧を表示」ボタンを非表示にします。Firefox 115 のみ有効。新しい Firefox バージョンでは、ボタンを右クリックして「ツールバーから削除」で対応可能。 |
| `hideDragPreview` | ドラッグ中のプレビューを非表示。設定値：<ul><li>`0` - 常に表示</li><li>`1` - グループのみ</li><li>`2` - タブのみ</li><li>`3` - 両方</li></ul> |
| `hideEmptyPlaceholderWhenScrolling` | 左上に何もない場合、スクロール時にその空白を非表示にします。`tabsUnderControlButtons` が `2` のときのみ有効。 |
| `hideScrollButtonsWhenDragging` | ドラッグ中にスクロールボタンを非表示。 |
| `linesToDragScroll` | タブを上端／下端へドラッグしたときのスクロール段数。最小値は `1`。 |
| `linesToScroll` | マウスホイール操作によるスクロール段数。最小値は `1`。 |
| `maxTabRows` | 表示可能な最大段数。最小値は `1`。 |
| `nativeWindowStyle` | タブバーに Windows ネイティブスタイル（DWMツールのエフェクト等）を表示します。Windows 11 の `widget.windows.mica` や、テーマ未使用時は `browser.theme.windows.accent-color-in-tabs.enabled` と類似。Firefox 115 またはテーマ使用時は未対応。 |
| `rowIncreaseEvery` | ウィンドウ幅がこの値だけ増加するたびに、表示可能段数が 1 段増加します。`0` にすると最大段数が常に表示されます。 |
| `rowStartIncreaseFrom` | ウィンドウ幅がこの値＋`rowIncreaseEvery` より大きくなったとき、多段表示が可能になります。 |
| `scrollbarThumbColor` | スクロールバーのつまみ部分の色。CSS カラー、変数、`auto` キーワードのいずれか。 |
| `scrollbarTrackColor` | スクロールバーの軌道部分の色。CSS カラー、変数、`auto` キーワードのいずれか。 |
| `spaceAfterTabs` | ウィンドウ制御ボタンの前にある空白スペース。最小値は `0`。 |
| `spaceAfterTabsOnMaximizedWindow` | 最大化時のウィンドウ制御ボタン前の空白スペース。最小値は `0`。 |
| `spaceBeforeTabs` | ウィンドウ左端の空白スペース。最小値は `0`。 |
| `spaceBeforeTabsOnMaximizedWindow` | 最大化時の左端空白スペース。最小値は `0`。 |
| `tabMaxWidth` | タブの最大幅を指定。最小幅は `browser.tabs.tabMinWidth` を設定。 |
| `tabsAtBottom` | タブバーの位置を変更：<ul><li>`0` - デフォルト</li><li>`1` - ナビゲーションツールバー下</li><li>`2` - ブックマークツールバー下（「新しいタブのみ表示する」の場合 `1` と同じ）</li></ul>Firefox 115 では未対応。 |
| `tabsbarItemsAlign` | タブバー内の項目の配置：<ul><li>`start` – 上</li><li>`center` – 中</li><li>`end` – 下</li></ul>これらが指定可能。`tabsUnderControlButtons` が `0` または `1` で段スクロール時のみ有効。 |
| `tabsUnderControlButtons` | <a name="tabsUnderControlButtons"></a>**🧪 実験的機能 🚨**<br>多段表示時にウィンドウ制御ボタンの下にタブを配置：<ul><li>`0` – 非表示</li><li>`1` – スクロールしない場合のみ表示</li><li>`2` – 常に表示</li></ul>不具合が出る場合は `0` または `1` に設定してください。 |
| `thinScrollbar` | 上下ボタンなしの細いスクロールバーを使用。 |

## 高度な調整
[`userChrome.css`（Google 翻訳）](http://translate.google.com/translate?tl=ja&u=https://support.mozilla.org/kb/contributors-guide-firefox-advanced-customization)を使用することで、タブのサイズや間隔を制御するための以下のパラメータを調整できます。下記の値はデフォルト設定です。

🪧 **注意**：`px`（ピクセル）以外の単位や小数点の値は使用しないでください。

```css
:root {
    /* タブ間の水平間隔 */
    --tab-overflow-clip-margin: 2px !important;
    
    /* タブの左右の余白 */
    --tab-inline-padding: 8px !important;
    
    /* タブのコンテンツの高さ：
     * コンパクト-29px、通常-36px、タッチ-41px；
     * 24px 未満には設定しないこと。また、ピクセル単位の整数値を使うことで表示の不具合を防ぎます。*/
    --tab-min-height: 36px !important;
    
    /* タブ間の垂直間隔 */
    --tab-block-margin: 4px !important;
}

.tab-content[pinned] {
    /* ピン留めされたタブの左右余白 */
    padding-inline: 10px !important;
}

tab-group {
    /* タブグループ内の左右余白 */
    --group-line-padding: 3px !important;
}

.tab-group-label {
    /* タブグループラベルの最大幅、ピクセル以外でもOK */
    max-width: 10em;
}
```
`about:config` には、タブのレイアウトに関するいくつかの Firefox 設定項目があります：

| 設定項目（接頭辞なし） | 説明 |
| ------------- | ------------- |
| `browser.tabs.tabClipWidth` | このサイズを超えるタブには閉じるボタンが表示されます。 |
| `browser.tabs.tabMinWidth` | 通常のタブの最小幅（周囲の余白を含む）を指定します。 |
| `widget.windows.mica` | タブバーに Windows 11 のネイティブスタイルを適用します。 |
| `widget.windows.mica.toplevel-backdrop` | 背景効果を選択します（Windows 11）：<ul><li>`0` – 自動</li><li>`1` – Mica</li><li>`2` – Acrylic</li><li>`3` – Mica Alt</li></ul> |
| `browser.theme.windows.accent-color-in-tabs.enabled` | Windows 10 のタブバーにシステムのアクセントカラーを適用します。 |

## 変更履歴
**Version 3.1**
- `autoCollapse` と関連オプション追加: ホバーしていないときにタブを1行に折りたたむ。Firefox 115 では `layout.css.has-selector.enabled` を有効にする必要があります。（実験的）
- `tabsAtBottom` 追加：タブバーを下部に配置（1: ナビゲーションツールバーの下、2: ブックマークツールバーの下）。Firefox 115 では未対応。
- `hideDragPreview` 追加：タブやグループをドラッグ中にプレビューを非表示。値の例：`0`（常に表示）、`1`（グループのみ）、`2`（タブのみ）、`3`（両方）。
- `animationDuration` 追加：アニメーションの長さ（ミリ秒、`0`～`1000`）。※長すぎるとパフォーマンスに影響します。
- `tabMaxWidth` 追加：タブの最大幅を指定。最小幅は `browser.tabs.tabMinWidth` を使ってください。
- `hideScrollButtonsWhenDragging` 追加：ドラッグ時にスクロールボタンを非表示にする設定。
- タブグループからタブ全体をドラッグする際、ドロップするまではグループを維持。
- Firefox 142 に対応。
- タブを上下端にドラッグしてスクロールする際の不具合を修正。
- `compactControlButtons` は Windows 11 では常に利用可能。
- 一部テーマでの表示崩れを修正。
- その他、軽微なバグ修正。

**Version 3.0**
- タブグループに完全対応。
- タブ関連の動作にアニメーションを導入。
- タブを他のタブにドラッグしてグループ化する機能 `dragToGroupTabs` を追加。
- ピン留めやグループ化されたタブのドラッグを滑らかにする `dynamicMoveOverThreshold` を追加。
- Windows のネイティブテーマスタイルをタブバーに表示する `nativeWindowStyle` を追加。
- Firefox 141 対応。
- バグ修正と改善。

**Version 2.6**
- 音声再生／ミュートなどが行われているタブがある場合のレイアウトの問題を修正。
- UI 密度が「Touch」の場合のレイアウト問題を修正。

**Version 2.5.1**
- 前バージョン以降、タブ以外の要素をタブバーにドロップできないバグを修正。

**Version 2.5**
- 非連続のタブをドラッグする際の体験を改善。
- バージョンチェック機能を追加。`checkUpdateFrequency` に日数を設定、`checkUpdate` を `0` にすれば無効化可能。

**Version 2.4**
- Firefox 138 対応。
- タブドラッグアニメーションの改善とバグ修正。

**Version 2.3.5.1**
- Firefox 115 でスクリプトが機能しない不具合を修正。

**Version 2.3.5**
- Firefox 137 対応。

**Version 2.3.4.2**
- 特定条件下でタブを最初の行にドラッグできないバグを修正。

**Version 2.3.3**
- ウィンドウが非常に狭くなり、1 行のみ表示可能な状態で発生する複数のバグを修正。

**Version 2.3.2.3**
- Firefox 136 対応。

**Version 2.3.1**
- ネイティブのタブグループ機能に対応。
- ピン留めされたタブを複数移動しつつスクロールする際の視覚的な不具合を修正。

**Version 2.2**
- Windows 11 におけるスクロールバーの外観を更新。
- 表示スケーリングが 100% でない場合のレイアウト崩れを修正。
- 特定条件でタブが跳ねるように動くバグを修正。

**Version 2.1.3.1**
- ピン留めタブが多数あると発生する跳ねる挙動の不具合を修正。
- `browser.tabs.groups.enabled` が `true` の場合、`tabsUnderControlButtons` が強制的に `0` になります。

**Version 2.1.2**
- バージョン 2.1 以降、「1 行のみ表示」時にタブ前のボタンがクリックできないバグを修正。

**Version 2.1.1**
- 特定条件でタブが跳ねるバグを修正。

**Version 2.1**
- タブを閉じる際の挙動を改善。

**Version 2.0.1**
- 設定変更やテーマ変更を複数ウィンドウで行った際に Firefox がフリーズまたはラグが発生する問題を修正。

**Version 2.0**
- `tabsUnderControlButtons = 2`（デフォルト）を実装。
- 新設定追加：`floatingBackdropClip`, `floatingBackdropBlurriness`, `floatingBackdropOpacity`, `hideEmptyPlaceholderWhenScrolling`
- `scrollbarTrackColor`, `scrollbarThumbColor` のデフォルト値を `auto` に変更。
- 設定が即時適用されるように改善。
- タブのスクロール体験を向上。
- Firefox 134 対応。
- 多数の改善およびバグ修正。

**Version 1.0**
- 初期リリース。

## 対応しない互換性問題
- 他のタブ関連ユーザースクリプト、スタイル、旧式拡張（例：[Tab Mix Plus](https://onemen.github.io/tabmixplus-docs)）
- Firefox Nightly
- Firefox 116～最新版以前のリリース
- macOS および Ubuntu（Linux）
- 垂直タブ（当然）

# [History Submenus II](https://github.com/Merci-chao/userChrome.js/blob/main/HistorySubmenus2%40Merci.chao.uc.js)
履歴メニューに、前日分の履歴を表示するサブメニューを追加。  
[アドオンページ（ウェブアーカイブ）](https://web.archive.org/web/20181102024750/https://addons.mozilla.org/en-US/firefox/addon/history-submenus-2/)

![screenshot](https://web.archive.org/web/20181007203210if_/https://addons.cdn.mozilla.net/user-media/previews/full/134/134638.png?modified=1530208752)
![screenshot](https://web.archive.org/web/20181007203207if_/https://addons.cdn.mozilla.net/user-media/previews/full/63/63969.png?modified=1530208752)

## 設定
設定パネルは存在しません。`about:config` を開いて `extensions.HistorySubmenus2@Merci.chao` で始まる項目を検索してください。設定を変更すると Firefox 再起動後に反映されます。

| 設定項目 | 説明 |
| --- | --- |
| `submenuCount` | 履歴メニュー内に直接表示される項目数。 |
| `historyCount` | 履歴サブメニューの数。 |
| `dateFormat` | サブメニューの名前に使用する日付のフォーマット。 |

---

# [Page Title in URL Bar](https://github.com/Merci-chao/userChrome.js/blob/main/PageTitle%40Merci.chao.uc.js)
URL バーにページタイトルを表示。  
[アドオンページ（ウェブアーカイブ）](https://web.archive.org/web/20181101232504/https://addons.mozilla.org/en-US/firefox/addon/page-title/)

![screenshot](https://web.archive.org/web/20181009205610if_/https://addons.cdn.mozilla.net/user-media/previews/full/165/165890.png?modified=1530208887)

## 設定
`about:config` を開き、`extensions.PageTitle@Merci.chao` で始まる設定項目を検索してください。設定を変更した後、Firefox を再起動すると反映されます。

| 設定項目 | 説明 |
| --- | --- |
| `showDomain` | 鍵アイコンの近くにドメインを表示。 |
| `showSubTitle` | ページタイトルの後に URL のパス部分を表示。 |
| `showUriOnHover` | マウスホバー時に一時的に URL を表示。 |
| `decodeHashAndSearch` | ハッシュやクエリ部分をデコード表示。例: `/index.html#hello%20world` → `/index.html#hello world` |
| `hideWww` | `www` サブドメインを非表示。 |
| `highlightIdentityBox` | ドメイン表示部分（Identity Box）に背景色を追加（`showDomain` が `true` の場合のみ有効）。 |
| `formattingEnabled` | ドメインをハイライト表示（`showDomain` が `false` の場合のみ有効）。 |

---

# [Semi-Full Screen / Picture-in-Picture Mode](https://github.com/Merci-chao/userChrome.js/blob/main/SemiFullScreen%40Merci.chao.uc.js)
タスクバーを残したまま全画面表示をしたり、最大化されていない状態でツールバーを非表示にする（ピクチャインピクチャ風）モード。  
[アドオンページ（ウェブアーカイブ）](https://web.archive.org/web/20181102230042/https://addons.mozilla.org/en-US/firefox/addon/semi-full-screen/)

**注意: この Semi-Full Screen のバージョンは macOS と Ubuntu（Linux）では未検証です。バグがある、または動作しない可能性があります。**

![screenshot](https://web.archive.org/web/20181013030904if_/https://addons.cdn.mozilla.net/user-media/previews/full/173/173740.png?modified=1530209326)

## ホットキー

| ホットキー | 機能 |
| --- | --- |
| `F11` または「フルスクリーンボタン」 | ツールバーを非表示にしてピクチャインピクチャモードに移行。 |
| `Ctrl + F11` または `Ctrl + フルスクリーンボタン` | ウィンドウを最大化して Semi-Full Screen モードに移行。タスクバーやサイドバーは表示されたまま。 |
| `Shift + F11` または `Shift + フルスクリーンボタン` | 通常のフルスクリーンモードに移行。 |

## 設定
`about:config` を開き、`extensions.SemiFullScreen@Merci.chao` で始まる設定項目を検索してください。設定は新しいウィンドウに適用されます。

| 設定項目 | 説明 |
| --- | --- |
| `reverse` | `F11` で Semi-Full Screen、`Ctrl + F11` でピクチャインピクチャモードに切り替え。 |

---

# [Float Toolbars in Full Screen](https://github.com/Merci-chao/userChrome.js/blob/main/FloatToolbarsInFullScreen%40Merci.chao.uc.js)
フルスクリーン時、ツールバーをページの上にフロートさせ、表示／非表示のたびにページが跳ねるのを防ぐ。  
[アドオンページ（ウェブアーカイブ）](https://web.archive.org/web/20181017035437/https://addons.mozilla.org/en-US/firefox/addon/float-toolbars-in-full-screen/)

**注意: このバージョンは macOS および Ubuntu（Linux）では未検証です。動作に不具合があるか、まったく動作しない可能性があります。**

![screenshot](https://web.archive.org/web/20181012014653if_/https://addons.cdn.mozilla.net/user-media/previews/full/180/180636.png?modified=1530209532)

---

# [undoCloseTab.uc.js](https://github.com/Merci-chao/userChrome.js/blob/main/undoCloseTab.uc.js)
タブバーのコンテキストメニュー上部に「閉じたタブを元に戻す」「最近閉じたタブ」「最近閉じたウィンドウ」「以前のセッションを復元」などの項目を表示。

---

# [restart-button.uc.js](https://github.com/Merci-chao/userChrome.js/blob/main/restart-button.uc.js)
アプリケーションメニューの「終了」ボタンを中クリックすると Firefox を再起動。

---

# [showScrollbarInMenus.uc.js](https://github.com/Merci-chao/userChrome.js/blob/main/showScrollbarInMenus.uc.js)
長いメニュー（ブックマークメニューなど）にスクロールバーを表示し、上下の矢印による移動を置き換える。
