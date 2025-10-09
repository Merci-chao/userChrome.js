**🌐 [English Version](README.md)**

---

💡🐞 ご提案やバグ報告は[こちら](https://github.com/Merci-chao/userChrome.js/issues/new)にどうぞ（日本語歓迎）。

---

# [Multi Tab Rows（多段タブ）](https://github.com/Merci-chao/userChrome.js/blob/main/MultiTabRows%40Merci.chao.uc.js)
Firefox に多段タブ表示をサポートさせる。

![screenshot](https://raw.githubusercontent.com/Merci-chao/userChrome.js/refs/heads/main/screenshots/scrolling.png)

## 注目ポイント
- **🗂️ タブグループ対応：** 多段でもタブグループに完全対応！マウス操作をフルサポートし、より滑らかで洗練された操作体験を実現。
- **🎞️ 強化されたタブアニメーション：** タブに関連する各種動作にスムーズなアニメーションを追加。
- **📐 スペース活用の最適化：** ウィンドウ制御ボタン下のスペースも含め、UI 領域を最大限に活用。
- **🖱️ 滑らかなタブドラッグアニメーション：** 多段でもドラッグのアニメーションをサポート。
- **📌 ピン留めタブのグリッド表示：** タブバーがスクロール可能際、ピン留めされたタブをコンパクトなグリッドに固定。
- **🦊 Firefox にネイティブ統合：** Firefox の動作とシームレスに連携し、まるで標準機能のように多段タブに対応。
- **🎨 テーマとの互換性：** 段数に関係なく様々なテーマに完全対応。

## 対応環境
- Firefox 115、143〜145（128 を除く）、Windows 7〜11 に対応。
- 一般的なスクリプトローダーに対応。

## 注意事項
**🚨 ご使用の前に、以下の注意点をよくお読みください：**
- ❗ **Firefox に最適化されたレイアウト計算を多く含むため、タブやタブバー関連の旧式拡張（例：[Tab Mix Plus](https://onemen.github.io/tabmixplus-docs)）、スクリプト（`userChrome.js`）、CSS スタイル（`userChrome.css`）によって不具合が発生する可能性がある。スクリプト適用前後にそれらを確認するか、[`tabsUnderControlButtons`](#tabsUnderControlButtons) を無効にしてください。**
- 非公式かつ複雑なスクリプトで、個人によって管理されている。このスクリプトには予期しないバグが含まれている可能性があり、Firefox の最新バージョンとの互換性は保証されていない。予期せぬ問題が発生した場合は、Firefox を再起動する必要があるかもしれない。特に、古いバージョンのスクリプトを最新の Firefox で使用した場合、ブラウザが使用不能になり、過去の閲覧セッションが永久に失われる可能性がある。そのような場合には、スクリプトの無効化が必要になることがある。このスクリプトは、これらのリスクに対応できる準備がある方のみご使用ください。
- 本スクリプトは Windows 専用。Ubuntu（Linux）および macOS では動作しない、あるいは不具合が生じる恐れがある。
- Firefox の関数を上書きする必要があるため、Firefox 139 以降では [`security.allow_unsafe_dangerous_privileged_evil_eval`](https://bugzilla.mozilla.org/show_bug.cgi?id=1958232) の設定が必要。この設定はスクリプト適用時に自動で有効化されるが、スクリプト削除時には `about:config` で手動無効化が必要。

## インストール方法
1. ほかのスクリプトを使用していない場合は、📘 [Tab Mix Plus - ドキュメント（Google 翻訳）](http://translate.google.com/translate?tl=ja&u=https://onemen.github.io/tabmixplus-docs/other/installation/#install-firefox-scripts) に従ってスクリプトローダー（Firefox スクリプト）をインストールする。すでに他のスクリプトローダー（例：[alice0775 氏の userChrome.js](https://github.com/alice0775/userChrome.js)）を使用している場合はこの手順を省略できる。  
![screenshot](https://raw.githubusercontent.com/Merci-chao/userChrome.js/refs/heads/main/screenshots/installscriptloader.jp.png)

2. 📥 [スクリプトファイル](https://github.com/Merci-chao/userChrome.js/raw/refs/heads/main/MultiTabRows@Merci.chao.uc.js)をダウンロードし、`chrome` フォルダーに配置する。<br>
3. Firefox を再起動して反映する。

**🚨 注意：**
- 他のタブバー関連スクリプトや CSS が有効になっていないことを確認してください。念のため、他の `.js`（`userChrome.js`以外）と `.css` ファイルを一時的に `chrome` フォルダーから移動し、Firefox を再起動してこのスクリプトの動作を確認してください。問題なければ、ファイルを戻し、衝突しているスクリプトやスタイルルールがあれば調整してください。
- Firefox 更新後にスクリプトローダーが動作しなくなった場合は、上記ページから最新のスクリプトローダーを再インストールしてください。

## 設定
[`about:config`](https://support.mozilla.org/kb/about-config-editor-firefox) を開いて、`userChromeJS.multiTabRows@Merci.chao.` で始まる設定項目を検索してください。グレー表示の項目は他の設定との関係で無効化されている。

`user.js` で設定する場合（※非推奨）、接頭辞 `userChromeJS.multiTabRows@Merci.chao.` を含めてください。例：
```js
user_pref("userChromeJS.multiTabRows@Merci.chao.maxTabRows", 5);
```

**🚨 注意：他の設定との依存関係により、これらの設定の多くが反映されない可能性がある。`user.js` を使用するのではなく、`about:config` 経由で直接設定することを強く推奨。**

### 操作

| 項目（接頭辞あり） | 説明 |
| ------------- | ------------- |
| `animateTabMoveMaxCount` | ドラッグされたタブの数がこの値を超えると、ドラッグアニメーションは無効化され、代わりにドロップ位置のインジケーターが表示される。最小値は `0`。多数のタブをドラッグした際に動作が重くなる場合は、この値を下げてください。<br>📝 備考：タブグループの一部の操作が使用できない場合がある。最終的なドロップ位置は Firefox のネイティブな挙動によって決まり、特定の状況では期待どおりに動作しない場合がある（Firefox バグ：[#1985434](https://bugzilla.mozilla.org/show_bug.cgi?id=1985434)、[#1988159](https://bugzilla.mozilla.org/show_bug.cgi?id=1988159)、[#1988162](https://bugzilla.mozilla.org/show_bug.cgi?id=1988162)、[#1988194](https://bugzilla.mozilla.org/show_bug.cgi?id=1988194)）。 |
| `animationDuration` | アニメーションの時間（ミリ秒、`0`～`1000` ※長すぎるとパフォーマンスに影響する）。 |
| `dragToGroupTabs` | タブを他のタブにドラッグした際にグループ化を有効化。`browser.tabs.dragDrop.moveOverThresholdPercent` が `50` 以下の場合の動作と異なり、この設定を無効にすると順序を変更せずグループに追加／削除できる。Firefox 115 または `browser.tabs.groups.enabled` が `false` の場合は未対応。 |
| `disableDragToPinOrUnpin` | 同じウィンドウにドラッグ＆ドロップによるピン留め・外すの動作を無効化（Firefox 115 では未対応）。公式設定が追加された場合、このオプションは削除される。 |
| `dynamicMoveOverThreshold` | ピン留めやグループ化されたタブのドラッグ時の移動を滑らかにする。Firefox 115 または `dragToGroupTabs` や `browser.tabs.groups.enabled` が無効な場合は未対応。 |
| `hideDragPreview` | ドラッグ中のプレビューを非表示：<ul><li>`0` - 常に表示</li><li>`1` - グループのみ</li><li>`2` - タブのみ</li><li>`3` - 両方</li></ul> |
| `hidePinnedDropIndicator` | ピン留めされたタブが存在しない場合に、タブをドラッグしてピン留めに変換する際に表示されるインジケーターを非表示（Firefox 115 では未対応）。 |
| `hideScrollButtonsWhenDragging` | ドラッグ中にスクロールボタンを視覚的に非表示。 |
| `linesToDragScroll` | タブを上端／下端へドラッグしたときのスクロール段数。最小値は `1`。 |
| `linesToScroll` | マウスホイール操作によるスクロール段数。最小値は `1`。 |
| `scrollButtonsSize` | ドラッグ中のスクロールボタンのサイズ（ピクセル単位）。最小値は `0` だが、表示上は少なくとも 2 デバイスピクセルの高さになる。最大値はタブの高さの半分までに制限される。 |

### レイアウト

| 項目（接頭辞あり） | 説明 |
| ------------- | ------------- |
| `autoCollapse` | **🚨 実験的機能 🧪**<br>ホバーしていない時にタブを折りたたむ。`tabsUnderControlButtons` は無効化され、固定タブも解除される。Firefox 115 では `layout.css.has-selector.enabled` を `true` にする必要あり。 |
| `autoCollapseDelayCollapsing` | カーソルが離れてから折りたたむまでの遅延（ミリ秒）。 |
| `autoCollapseDelayExpanding` | ホバー後に展開されるまでの遅延（ミリ秒）。 |
| `compactControlButtons` | ウィンドウ制御ボタンをコンパクトに表示。Windows 10 と 11 でのみ対応。 |
| `gapAfterPinned` | ピン留めされたタブと通常のタブの間の隙間。最小値は `0`。 |
| `hideAllTabs` | 「タブの一覧を表示」ボタンを非表示。Firefox 115 のみ対応。新しい Firefox バージョンでは、ボタンを右クリックして「ツールバーから削除」で対応可能。 |
| `hideEmptyPlaceholderWhenScrolling` | 左上に何もない場合、タブバーがスクロール可能時にその空白を非表示。`tabsUnderControlButtons` が `2` のときのみ有効。 |
| `justifyCenter` | タブを水平方向に中央揃えする設定：<ul><li>`0` - 無効</li><li>`1` - 1 段のみの場合</li><li>`2` - 常に有効</li></ul>中央揃え時には、タブの閉じ方やグループの折りたたみ動作が若干異なる場合がある。 |
| `maxTabRows` | 表示可能な最大段数。最小値は `1`。 |
| `pinnedTabsFlexWidth` | **🚨 実験的機能 🧪**<br>ピン留めしたタブのサイズを通常のタブと同様に扱う。なお、タブバーがスクロール可能な場合でも位置が固定されなくなる。 |
| `rowIncreaseEvery` | ウィンドウ幅がこの値だけ増加するたびに、表示可能段数が 1 段増加。`0` にすると最大段数が常に表示される。 |
| `rowStartIncreaseFrom` | ウィンドウ幅がこの値＋`rowIncreaseEvery` より大きくなったとき、多段表示が可能になる。 |
| `spaceAfterTabs` | ウィンドウ制御ボタンの前にある空白スペース。最小値は `0`。 |
| `spaceAfterTabsOnMaximizedWindow` | 最大化時のウィンドウ制御ボタン前の空白スペース。最小値は `0`。 |
| `spaceBeforeTabs` | ウィンドウ左端の空白スペース。最小値は `0`。 |
| `spaceBeforeTabsOnMaximizedWindow` | 最大化時の左端空白スペース。最小値は `0`。 |
| `tabMaxWidth` | タブの最大幅（周囲の余白を含む）を指定。最小幅は `browser.tabs.tabMinWidth` で設定。 |
| `tabsAtBottom` | タブバーの位置を変更：<ul><li>`0` - デフォルト</li><li>`1` - ナビゲーションツールバー下</li><li>`2` - ブックマークツールバー下</li></ul>Firefox 115 では未対応。 |
| `tabsbarItemsAlign` | 多段モードでタブバー内の項目の配置：<ul><li>`start` – 上</li><li>`center` – 中</li><li>`end` – 下</li></ul>`tabsUnderControlButtons` が `0` または `1` でタブバーがスクロール可能時のみ有効。 |
| `tabsUnderControlButtons` | <a name="tabsUnderControlButtons"></a>**🚨 実験的機能 🧪**<br>多段表示時にウィンドウ制御ボタンの下にタブを配置：<ul><li>`0` – 無効</li><li>`1` – タブバーがスクロール不可能場合のみ</li><li>`2` – 常に有効</li></ul>不具合が出る場合は `0` または `1` に設定してください。 |
| `thinScrollbar` | 上下ボタンなしの細いスクロールバーを使用。 |

### 外観

| 項目（接頭辞あり） | 説明 |
| ------------- | ------------- |
| `dynamicThemeImageSize` | テーマ使用時、背景画像のサイズが現在の段数に応じて変化する。 |
| `floatingBackdropBlurriness` | タブバーがスクロール可能時にタブを覆う要素の背景ぼかし強度を設定する。`tabsUnderControlButtons` が `2` かつ `floatingBackdropClip`、`nativeWindowStyle` が `false` のときのみ有効。Firefox 115 では未対応。 |
| `floatingBackdropClip` | タブバーがスクロール可能時にタブバーを覆う要素の領域をクリップする。`tabsUnderControlButtons` が `2` のときのみ有効。 |
| `floatingBackdropOpacity` | タブバーがスクロール可能時にタブを覆う要素の背景の不透明度を設定する。`tabsUnderControlButtons` が `2` かつ `floatingBackdropClip` が `false` のとき有効。値は `0`〜`100`。 |
| `nativeWindowStyle` | タブバーに Windows ネイティブスタイル（例えば、[DWMBlurGlass](https://github.com/Maplespe/DWMBlurGlass) などのツールによる視覚効果）を表示。Windows 11 で完全な視覚効果を得るには、`widget.windows.mica` を有効にする必要がある場合がある。Windows 10 で DWM ツールを使用していない場合、この設定は `browser.theme.windows.accent-color-in-tabs.enabled` と似た動作をする。Firefox 115 または背景画像付きテーマでは非対応。 |
| `scrollbarThumbColor` | スクロールバーのつまみ部分の色。CSS カラー、変数、`auto` キーワードのいずれか。 |
| `scrollbarTrackColor` | スクロールバーの軌道部分の色。CSS カラー、変数、`auto` キーワードのいずれか。 |

### その他

| 項目（接頭辞あり） | 説明 |
| ------------- | ------------- |
| `checkUpdate` | Firefox 起動時や新しいウィンドウを開くたびにスクリプトの新バージョンを確認。`0` で無効、`1` 以上で有効。値は最後に確認した時刻（例：`1759911972`）で更新される。<br><b>💡 有効化を強く推奨。古いスクリプトは新しい Firefox では正常に動作しない可能性がある。</b><br>📝 備考：Firefox の旧バージョン（115 を除く）を使用している場合、このスクリプトの更新は通知されない。 |
| `checkUpdateAutoApply` | 新しいバージョンがある場合にスクリプトファイルを自動更新（上書き）：<ul><li>`0` - 無効</li><li>`1` - 確認する</li><li>`2` - 常に更新</li><li>`3` - 常に更新（通知なし）、通知されない軽微な変更や修正の更新も自動的に受け取り</li></ul> |
| `checkUpdateFrequency` | 新バージョンの確認頻度（日単位）。最小値は `1`。 |
| `debugMode` | ⛔ デバッグモード。一般向けではない。 |

## 高度な調整
[`userChrome.css`（Google 翻訳）](http://translate.google.com/translate?tl=ja&u=https://support.mozilla.org/kb/contributors-guide-firefox-advanced-customization)を使用することで、タブのサイズや間隔を制御するための以下のパラメータを調整できる。下記の値はデフォルト設定。

🚨 **注意**：`px`（ピクセル）以外の単位や小数点の値は使用しないでください。

```css
:root {
  /* タブ間の水平間隔 */
  --tab-overflow-clip-margin: 2px !important;

  /* タブの左右の余白 */
  --tab-inline-padding: 8px !important;

  /* タブ間の垂直間隔 */
  --tab-block-margin: 4px !important;

  /* タブのコンテンツの高さ：コンパクト-29px、通常-36px、タッチ-41px；24px 未満には設定しないこと */
  --tab-min-height: 36px !important;
}

/*
  このルールが必要になる条件：(--tab-min-height) + (--tab-block-margin) * 2 < 33px
  なぜ 33px か？.tab-label-container のデフォルト高さは2.7em、フォントサイズが12pxの場合は32.4px
  タブは .tab-label-container より高くする必要がある
  そうしないと、タブの高さに小数点を含むことで不具合が発生
  例：
  - --tab-min-height = 25px
  - --tab-block-margin = 1px
  → 合計：25 + 1×2 = 27px
  27px < 33px となるため、レイアウト崩れを防ぐためにこのルールが必要
  副作用がないようなので、いつでもこのルールを適用できる
*/
.tab-label-container {
  height: auto !important;
}

.tab-content[pinned] {
  /* ピン留めされたタブの左右余白 */
  padding-inline: 10px !important;
}

#tabbrowser-tabs {
  /* タブグループ内の左右余白 */
  --group-line-padding: 3px !important;

  /* タブグループ名の最大幅、ピクセル以外でもOK */
  --group-label-max-width: 10em !important;
}
```
`about:config` には、タブのレイアウトに関するいくつかの Firefox 設定項目がある：

| 設定項目（接頭辞なし） | 説明 |
| ------------- | ------------- |
| `browser.tabs.tabClipWidth` | このサイズを超えるタブには閉じるボタンが表示される。 |
| `browser.tabs.tabMinWidth` | 通常のタブの最小幅（周囲の余白を含む）を指定。 |
| `widget.windows.mica` | タブバーに Windows 11 のネイティブスタイルを適用。 |
| `widget.windows.mica.toplevel-backdrop` | 背景効果の選択肢（Windows 11）：<ul><li>`0` – 自動</li><li>`1` – Mica</li><li>`2` – Acrylic</li><li>`3` – Mica Alt</li></ul> |
| `browser.theme.windows.accent-color-in-tabs.enabled` | Windows 10 のタブバーにシステムのアクセントカラーを適用。 |

## 変更履歴
📥 [最新版をダウンロード](https://github.com/Merci-chao/userChrome.js/raw/refs/heads/main/MultiTabRows@Merci.chao.uc.js)

**Version 3.5.1**
- `disableDragToPinOrUnpin` を追加：同じウィンドウにドラッグ＆ドロップによるピン留め・外すの動作を無効化（Firefox 115 では未対応）。公式設定が追加された場合、この設定は削除される。
- タブのドロップアニメーション中にウィンドウがドラッグされるのを防止。

**Version 3.5**
- Firefox 145 に対応。
- タブを別のウィンドウに移動する際にアニメーションを追加。
- 背景画像なしのテーマで `nativeWindowStyle` が使えるようになる。
- CSS 変数を調整：グループラベルのサイズを制御するために、`#tabbrowser-tabs` に `--group-label-max-width` と `--group-line-padding` を追加（参照：[高度な調整](#高度な調整)）。
- メニューがタブと重なっている場合、そこから項目をドラッグすると常にメニューを閉じるようにする。
- バグ修正：`tabsAtBottom` 使用時の背景画像の不具合。
- バグ修正：一部設定が予期せず無効になった。
- バグ修正：タブをドラッグしてピン留め・外す後に不具合が発生。
- バグ修正：タブをドラッグして別のウィンドウにコピーした後に不具合が発生。
- バグ修正：タブグループをウィンドウ外に素早くドラッグした後に不具合が発生。
- 軽微なバグの修正。
- 可読性向上のためコードスタイルを改善。

**Version 3.4.2**
- バグ修正：`hidePinnedDropIndicator` を有効にするとタブのドラッグ＆ドロップができなくなった。
- バグ修正：新しく開いたウィンドウでタブが不自然に移動する場合があった。
- バグ修正：タブの閉じるボタンが正しく表示／非表示されない場合があった。
- バグ修正：特殊な状況で発生していた `tabsUnderControlButtons` のレイアウト問題。
- Firefox の旧バージョン（115 を除く）を使用している場合、このスクリプトの更新は通知されなくなる。
 
<details>
<summary>軽微な更新</summary>

**Version 3.4.1.3**
- ドロップインジケーター付きでドラッグ＆ドロップすると、アニメーションが実行されるようになる。

**Version 3.4.1.1**
- バグ修正：タブ以外の項目を固定タブ上にドラッグした際、ドロップインジケーターの位置が誤って表示された。
</details>

**Version 3.4.1**
- バグ修正：タブバーにタブ以外の項目をドロップすると、不具合が発生。
- バグ修正：`hideEmptyPlaceholderWhenScrolling` がプライベートウィンドウで正常に動作しない場合があった。
- `checkUpdateAutoApply` が `3` に設定されている場合、通知が表示されない軽微な変更や修正の更新も受信するようになる。

**Version 3.4**
- `animateTabMoveMaxCount` を追加：ドラッグされたタブの数がこの値を超えると、ドラッグアニメーションは無効化され、代わりにドロップ位置のインジケーターが表示。最小値は `0`。多数のタブをドラッグした際に動作が重くなる場合は、この値を下げてください。備考：タブグループの一部の操作が使用できない場合があり、最終的なドロップ位置は Firefox のネイティブな挙動によって決まり、特定の状況では期待どおりに動作しない場合がある。
- `hidePinnedDropIndicator` を追加：ピン留めされたタブが存在しない場合に、タブをドラッグしてピン留めに変換できる際に表示されるインジケーターを非表示（Firefox 143 以降に対応）。
- アニメーションの処理を見直して、動作を改善。
- `tabsAtBottom` を `2` にすると、ブックマークツールバーを「新しいタブのみ表示する」に設定していても、タブバーはブックマークツールバーの下に表示。
- `autoCollapse` の改善：右クリックメニューが表示されている間、タブバーは展開されたままになる。
- `autoCollapse` における 2 つの遅延パラメータのデフォルト値を引き上げた。
- バグ修正：タブグループが複数行にまたがる場合、一部の状況下でグループの折りたたみやドラッグ操作がスムーズに動作しないことがあった。
- バグ修正：ドラッグ中に Esc キーを押すと、問題が発生する場合があった。
- バグ修正：Ctrl キーで複数のタブを選択してコピーする操作が、時々うまく機能しなかった（Firefox バグ #1987160）。
- バグ修正：最後のタブをショートカットで閉じると、タブが上にスクロールすることがある問題を修正。
- このスクリプトはポップアップウィンドウには適用されない。
- Firefox 143 と 144 に対応。
- 複数の軽微なバグの修正。

<details>

<summary>旧バージョン</summary>

**Version 3.3**
- `pinnedTabsFlexWidth` を追加：ピン留めしたタブのサイズを通常のタブと同様に扱う。なお、タブバーがスクロール可能な場合でも位置が固定されなくなる（試験的機能）。
- `checkUpdateAutoApply` を追加：新しいバージョンがある場合にスクリプトファイルを自動更新（上書き）。`0` - 無効、`1` - 確認する、`2` - 常に更新、`3` - 常に更新（通知なし）。
- バグ修正：Firefox 142 において、閉じたピン留めタブを開きなおすとタブ機能が正常に動作しなくなった。
- 全画面表示に関連する軽微な不具合を修正。
- `nativeWindowStyle` は全画面表示でも有効。
- タブバーサイズのロック動作を改善。
- 軽微な不具合の修正。

**Version 3.2.1**
- バグ修正：アニメーション中にタブがたまに不自然に揺れる。
- バグ修正：「ドラッグでグループ作成」がたまにうまく動かない。
- バグ修正：前のバージョン以降、開いたグループのドラッグが滑らかでない。
- Firefox 143 に対応。

**Version 3.2**
- `justifyCenter` を追加：タブを中央揃えにする設定。`0` - 無効、`1` - 1 段のみの場合、`2` - 常に有効。タブが中央揃えされている場合、タブの閉じ方やグループの折りたたみ動作が若干異なる場合がある。
- `scrollButtonsSize` を追加：ドラッグ中のスクロールボタンのサイズ（ピクセル単位）。最小値は `2`、最大値はタブの高さの半分までに制限される。
- Firefox 143 に対応。
- 一部の環境でタブをブックマークツールバーにドロップできない問題を修正。
- その他の不具合修正。

**Version 3.1**
- `autoCollapse` と関連オプションを追加: ホバーしていないときにタブを1行に折りたたむ。Firefox 115 では `layout.css.has-selector.enabled` を有効にする必要がある。（実験的）
- `tabsAtBottom` を追加：タブバーを下部に配置（1: ナビゲーションツールバーの下、2: ブックマークツールバーの下）。Firefox 115 では未対応。
- `hideDragPreview` を追加：タブやグループをドラッグ中にプレビューを非表示。値の例：`0`（常に表示）、`1`（グループのみ）、`2`（タブのみ）、`3`（両方）。
- `animationDuration` を追加：アニメーションの長さ（ミリ秒、`0`～`1000`）。※長すぎるとパフォーマンスに影響する。
- `tabMaxWidth` を追加：タブの最大幅を指定。最小幅は `browser.tabs.tabMinWidth` を使ってください。
- `hideScrollButtonsWhenDragging` を追加：ドラッグ時にスクロールボタンを非表示にする設定。
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
- `browser.tabs.groups.enabled` が `true` の場合、`tabsUnderControlButtons` が強制的に `0` になる。

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
  
</details>

## 対応しない互換性問題
- 他のタブ関連ユーザースクリプト、スタイル、旧式拡張（例：[Tab Mix Plus](https://onemen.github.io/tabmixplus-docs)）
- Firefox Nightly
- Firefox 116～最新版以前のリリース
- タッチ操作 
- macOS および Ubuntu（Linux）
- 垂直タブ（当然）

# [History Submenus II](https://github.com/Merci-chao/userChrome.js/blob/main/HistorySubmenus2%40Merci.chao.uc.js)
履歴メニューに、前日分の履歴を表示するサブメニューを追加。  
[アドオンページ（ウェブアーカイブ）](https://web.archive.org/web/20181102024750/https://addons.mozilla.org/en-US/firefox/addon/history-submenus-2/)

![screenshot](https://web.archive.org/web/20181007203210if_/https://addons.cdn.mozilla.net/user-media/previews/full/134/134638.png?modified=1530208752)
![screenshot](https://web.archive.org/web/20181007203207if_/https://addons.cdn.mozilla.net/user-media/previews/full/63/63969.png?modified=1530208752)

## 設定
設定パネルは存在しません。`about:config` を開いて `extensions.HistorySubmenus2@Merci.chao.` で始まる項目を検索してください。

🔔 設定は新しいウィンドウに適用される。

| 設定項目 | 説明 |
| --- | --- |
| `checkUpdate` | Firefox 起動時や新しいウィンドウを開くたびにスクリプトの新バージョンを確認する。`0` で無効、`1` 以上で有効。値は最後に確認した時刻で更新される。<br><b>💡 有効化を強く推奨。古いスクリプトは新しい Firefox では正常に動作しない可能性がある。</b> |
| `checkUpdateFrequency` | 新バージョンの確認頻度（日単位）。最小値は `1`。 |
| `historyCount` | 履歴メニュー内に直接表示される項目数。 |
| `submenuCount` | 履歴サブメニューの数。 |
| `dateFormat` | サブメニューの名前に使用する日付のフォーマット。 |

## 変更履歴
**Version 2025-08-14**
- Firefox 143 に対応。
- バージョンチェック機能を追加。

---

# [Page Title in URL Bar](https://github.com/Merci-chao/userChrome.js/blob/main/PageTitle%40Merci.chao.uc.js)
URL バーにページタイトルを表示。  
[アドオンページ（ウェブアーカイブ）](https://web.archive.org/web/20181101232504/https://addons.mozilla.org/en-US/firefox/addon/page-title/)

![screenshot](https://web.archive.org/web/20181009205610if_/https://addons.cdn.mozilla.net/user-media/previews/full/165/165890.png?modified=1530208887)

## 設定
`about:config` を開き、`extensions.PageTitle@Merci.chao.` で始まる設定項目を検索してください。

🔔 設定は新しいウィンドウに適用される。

| 設定項目 | 説明 |
| --- | --- |
| `showDomain` | 鍵アイコンの近くにドメインを表示。 |
| `showSubTitle` | ページタイトルの後に URL のパス部分を表示。 |
| `showUriOnHover` | マウスホバー時に一時的に URL を表示。 |
| `decodeHashAndSearch` | ハッシュやクエリ部分をデコード表示。例: `/index.html#hello%20world` → `/index.html#hello world` |
| `hideWww` | `www` サブドメインを非表示。 |
| `highlightIdentityBox` | ドメイン表示部分（Identity Box）に背景色を追加（`showDomain` が `true` の場合のみ有効）。 |
| `formattingEnabled` | ドメインをハイライト表示（`showDomain` が `false` の場合のみ有効）。 |
| `checkUpdate` | Firefox 起動時や新しいウィンドウを開くたびにスクリプトの新バージョンを確認する。`0` で無効、`1` 以上で有効。値は最後に確認した時刻で更新される。<br><b>💡 有効化を強く推奨。古いスクリプトは新しい Firefox では正常に動作しない可能性がある。</b> |
| `checkUpdateFrequency` | 新バージョンの確認頻度（日単位）。最小値は `1`。 |

## 変更履歴
**Version 2025-09-09**
- バージョンチェック機能を追加。

---

# [Semi-Full Screen / Picture-in-Picture Mode](https://github.com/Merci-chao/userChrome.js/blob/main/SemiFullScreen%40Merci.chao.uc.js)
タスクバーを残したまま全画面表示をしたり、最大化されていない状態でツールバーを非表示にする（ピクチャインピクチャ風）モード。  
[アドオンページ（ウェブアーカイブ）](https://web.archive.org/web/20181102230042/https://addons.mozilla.org/en-US/firefox/addon/semi-full-screen/)

🚨 **注意：この Semi-Full Screen のバージョンは macOS と Ubuntu（Linux）では未検証である。バグがあり、または動作しない可能性がある。**

![screenshot](https://web.archive.org/web/20181013030904if_/https://addons.cdn.mozilla.net/user-media/previews/full/173/173740.png?modified=1530209326)

## ホットキー

| ホットキー | 機能 |
| --- | --- |
| `F11` または`「全画面表示」ボタン` | ツールバーを非表示にしてピクチャインピクチャモードに移行。 |
| `Ctrl + F11` または `Ctrl + 「全画面表示」ボタン` | ウィンドウを最大化して Semi-Full Screen モードに移行。タスクバーやサイドバーは表示されたまま。 |
| `Shift + F11` または `Shift + 「全画面表示」ボタン` | 通常の全画面表示モードに移行。 |

## 設定
`about:config` を開き、`extensions.SemiFullScreen@Merci.chao.` で始まる設定項目を検索してください。

🔔 設定は新しいウィンドウに適用される。

| 設定項目 | 説明 |
| --- | --- |
| `autoHideToolbarDelay` | マウスがウィンドウ端から外れ、ウィンドウ内に戻らなかった場合に、ツールバーを自動的に非表示にするまでの遅延時間（ミリ秒）。 |
| `checkUpdate` | Firefox 起動時や新しいウィンドウを開くたびにスクリプトの新バージョンを確認する。`0` で無効、`1` 以上で有効。値は最後に確認した時刻で更新される。<br><b>💡 有効化を強く推奨。古いスクリプトは新しい Firefox では正常に動作しない可能性がある。</b> |
| `checkUpdateFrequency` | 新バージョンの確認頻度（日単位）。最小値は `1`。 |
| `reverse` | `F11` で Semi-Full Screen、`Ctrl + F11` でピクチャインピクチャモードに切り替え。 |

## 変更履歴
**Version 2025-08-24**
- Windows 7/8 で欠けていたウィンドウ枠を復元。
- `autoHideToolbarDelay` を追加：マウスがウィンドウ端から外れ、ウィンドウ内に戻らなかった場合に、ツールバーを自動的に非表示にするまでの遅延時間（ミリ秒）。

**Version 2025-08-20**
- タブバー非表示モードでドラッグ用スペースが隠されない。

**Version 2025-08-16**
- タブバーの意図しないスペースを修正。
- バージョンチェック機能を追加。

---

# [Float Toolbars in Full Screen](https://github.com/Merci-chao/userChrome.js/blob/main/FloatToolbarsInFullScreen%40Merci.chao.uc.js)
全画面表示モードで、ツールバーをページの上にフロートさせ、表示／非表示のたびにページが跳ねるのを防ぐ。  
[アドオンページ（ウェブアーカイブ）](https://web.archive.org/web/20181017035437/https://addons.mozilla.org/en-US/firefox/addon/float-toolbars-in-full-screen/)

**注意: このバージョンは macOS および Ubuntu（Linux）では未検証である。動作に不具合があるか、まったく動作しない可能性があります。**

![screenshot](https://web.archive.org/web/20181012014653if_/https://addons.cdn.mozilla.net/user-media/previews/full/180/180636.png?modified=1530209532)

## 設定
`about:config` を開いて `extensions.FloatToolbarsInFullScreen@Merci.chao.` で始まる項目を検索してください。

🔔 設定は新しいウィンドウに適用される。

| 設定項目 | 説明 |
| --- | --- |
| `checkUpdate` | Firefox 起動時や新しいウィンドウを開くたびにスクリプトの新バージョンを確認する。`0` で無効、`1` 以上で有効。値は最後に確認した時刻で更新される。<br><b>💡 有効化を強く推奨。古いスクリプトは新しい Firefox では正常に動作しない可能性がある。</b> |
| `checkUpdateFrequency` | 新バージョンの確認頻度（日単位）。最小値は `1`。 |

## 変更履歴
**Version 2025-08-16**
- タブバーが全画面表示時にネイティブのウィンドウスタイルで表示。
- バージョンチェック機能を追加。

---

# [undoCloseTab.uc.js](https://github.com/Merci-chao/userChrome.js/blob/main/undoCloseTab.uc.js)
タブバーの右クリックメニューに「閉じたタブを元に戻す」「最近閉じたタブ」「最近閉じたウィンドウ」「以前のセッションを復元」などの項目を表示。

---

# [restart-button.uc.js](https://github.com/Merci-chao/userChrome.js/blob/main/restart-button.uc.js)
アプリケーションメニューの「終了」ボタンを中クリックすると Firefox を再起動。

---

# [autoTitleBar@Merci.chao.uc.js](https://github.com/Merci-chao/userChrome.js/blob/main/autoTitleBar%40Merci.chao.uc.js)
ウィンドウの上端にカーソルが到達したときにタイトルバーを表示し、ページコンテンツ上にカーソルがある間は非表示にします。

---

# [showScrollbarInMenus.uc.js](https://github.com/Merci-chao/userChrome.js/blob/main/showScrollbarInMenus.uc.js)
長いメニュー（ブックマークメニューなど）にスクロールバーを表示し、上下の矢印による移動を置き換える。
