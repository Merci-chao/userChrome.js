**🌐 [English Version](README.md)**

---

💡🐞 ご提案やバグ報告は[こちら](https://github.com/Merci-chao/userChrome.js/issues/new)にどうぞ。

---

# [Multi Tab Rows（多段タブ）](https://github.com/Merci-chao/userChrome.js/blob/main/MultiTabRows@Merci.chao.uc.js)
Firefox に多段タブ表示をサポートさせる。

![screenshot](https://cdn.jsdelivr.net/gh/Merci-chao/userChrome.js@main/screenshots/tabsAtBottom.ja.png)

![screenshot](https://cdn.jsdelivr.net/gh/Merci-chao/userChrome.js@main/screenshots/preview-jp.png)

## 紹介
注目ポイントは、スクリーンショットや詳しい説明とともに[紹介ページ](https://merci-chao.github.io/userChrome.js/multitabrows/ja/)にまとめていますので、ぜひご覧ください。

## 互換性
- Firefox 115、140、151〜153

- Windows 7〜11

- 一般的なスクリプトローダーに対応、例：
	- [MrOtherGuy/fx-autoconfig](https://github.com/MrOtherGuy/fx-autoconfig)
	- [xiaoxiaoflood/firefox-scripts](https://github.com/xiaoxiaoflood/firefox-scripts)
 	- [alice0775/userChrome.js](https://github.com/alice0775/userChrome.js)
 	- [Endor8/userChrome.js](https://github.com/Endor8/userChrome.js)
 	- [BSTweaker/UserChromeJS](https://bitbucket.org/BSTweaker/userchromejs/src/master/loader/)

## 注意事項
**🚨 ご使用の前に、以下の注意点をよくお読みください：**
- このスクリプトは Windows 向けに作られ、Ubuntu（Linux）で簡単なテストをしていた。macOS では試していないので、動かないか不具合が出る可能性がある。Firefox をベースとしたその他の派生ブラウザーはサポート対象外。

- Firefox に最適化されたレイアウト計算を多く含むため、タブ関連の旧式拡張（例：[Tab Mix Plus](https://onemen.github.io/tabmixplus-docs)）、スクリプト（`*.uc.js`）、カスタマイズスタイル（`userChrome.css`）との競合によって、不具合が発生する可能性がある。
  <p>⚠️ 以下のインストール手順をよく読んで、慎重に進めてください。</p>

- このスクリプトは非公式かつ複雑で、管理者は私一人のみ。予期しないバグが含まれる可能性があり、問題が発生した場合は Firefox を再起動する必要があるかもしれない。特に、旧バージョンのスクリプトを最新の Firefox で使用したとき、最悪の場合ブラウザーが使用不能になり、以前のセッションが永久に失われる可能性もある。そのような場合には、スクリプトの無効化が必要になることがある。これらのリスクに対応できる準備がある方のみご使用ください。

- このスクリプトは単純な調整というより、綿密なタブ拡張に近い。一万程度の行に及ぶロジックとスタイルをひとつのファイルにまとめており、典型的なスクリプトと同じくらい扱いやすいままになっている。完璧さとパフォーマンスを意識した本格的な実装であり、開発では行数は気にする点ではない⸺Tab Mix Plus が中途半端な千行ほどだけで実現できることは決してないのと同じ。ただし、もしコードがシンプルで完全に理解しやすく、より強い安心感を与え、さらに自由に改修できるものを好むなら、これは好ましい選択にはならないかもしれない。

- 信頼できるソースからのスクリプトやファイルのみを使用してください。悪意のあるコードは深刻な被害を引き起こす可能性があり、ファイルの破損、アカウントへの不正侵入、銀行やクレジットカードなどの個人情報の盗難につながる恐れがある。しかも、これらはまったく気づかないうちに発生することもある。

## インストール手順
1. 上記の[互換性リスト](#互換性)に記載されている Firefox のバージョンを使用しているか確認してください。それ以外の Firefox バージョンや OS は、サポート対象外となる可能性がある。

2. スクリプトローダー（userChrome.js）をインストールする。すでに使用している場合は、手順 4 に進む。使えるスクリプトローダーはいくつかある：
	- [MrOtherGuy/fx-autoconfig](https://github.com/MrOtherGuy/fx-autoconfig)（英語）
	- [Firefox Scripts](https://onemen.github.io/tabmixplus-docs/other/installation/#install-firefox-scripts)（英語、xiaoxiaoflood/firefox-scripts の派生版）
	- [alice0775/userChrome.js](https://github.com/alice0775/userChrome.js)
 	- [Endor8/userChrome.js](https://github.com/Endor8/userChrome.js)（ドイツ語）
 	- [BSTweaker/UserChromeJS](https://bitbucket.org/BSTweaker/userchromejs/src/master/loader/)
    <p>どのローダーを使っても、このスクリプトを適用する上で実質的な違いはない。好きなものを選べばいい。特に希望がなければ、<a href="https://github.com/MrOtherGuy/fx-autoconfig/commit/8453c45dc67496864aeb593dabb8d991a5785989">更新チェック機能</a>を提供する MrOtherGuy/fx-autoconfig を試すか、<a href="https://kamehiyo.com/firefox_multitub_new/">bunji_ 氏の記事</a>を参考にして Firefox Scripts をインストールすることができる。</p>
	<p><strong>🚨 重要：</strong>Firefox のアップデート後にスクリプトローダーが動作しなくなるのは非常によくあるケース。その場合は、使用しているスクリプトローダーの新しいバージョンを上記のページで確認してください。</p>

3. Firefox を完全に終了（`Ctrl`+`Shift`+`Q`）し、再起動する（または [about:support](https://support.mozilla.org/kb/use-troubleshooting-information-page-fix-firefox) の「起動時キャッシュを消去」ボタンを使用して再起動）、スクリプトローダーが正しく動作しているか確認する。使用するローダーによって確認方法が異なる：
   <table>
	   <tr>
		   <td>MrOtherGuy/fx-autoconfig</td>
		   <td>初回起動時に「fx-autoconfig: Firefox is being modified with custom autoconfig scripting」という通知メッセージが表示される。さらに、ツールメニュー（<code>Alt</code>+<code>T</code>）に userScripts という新しい項目が表示される。</td>
	   </tr>
	   <tr>
		   <td width="230">Firefox Scripts</td>
		   <td><a href="https://support.mozilla.org/kb/about-config-editor-firefox">about:config</a> を開き、<code>userChromeJS.enabled</code> を検索する。設定が存在し、右側に削除ボタン（🗑）が表示されていなければインストール成功。</td>
	   </tr>
	   <tr>
		   <td>alice0775/userChrome.js</td>
		   <td><code>Ctrl</code>+<code>Shift</code>+<code>J</code> を押してブラウザーコンソールを開く。「ログ」フィルターを有効にし、 「出力を絞り込み」に <code>getScripts</code> を入力して、関連ログが表示されるか確認。<details><summary>スクリーンショット</summary><img src="https://cdn.jsdelivr.net/gh/Merci-chao/userChrome.js@main/screenshots/alice-scriptloader-ja.png"></details></td>
	   </tr>
	   <tr>
		   <td>Endor8/userChrome.js</td>
		   <td>検証する簡単な方法はない。</td>
	   </tr>
	   <tr>
		   <td>BSTweaker/UserChromeJS</td>
		   <td>ツールメニュー（<code>Alt</code>+<code>T</code>）に UserChromeJSLoader という新しい項目が表示される。</td>
	   </tr>
   </table>

4. 他のタブ関連スクリプトやカスタマイズスタイルが有効になっていないことを確認してください。念のため、他の `*.uc.js` と `userChrome.css` ファイルを一時的に `chrome` から移動する。
   <p>⚠️ <code>userChrome.css</code> のカスタマイズスタイルとの競合による問題が多数報告されており、まずタブやタブバーに関連するすべてのスタイルを削除し、以下の設定でカバーできない場合は、必要に応じて後から書き直すことを強く推奨。</p>

5. 📥 [スクリプトファイル](https://github.com/Merci-chao/userChrome.js/raw/refs/heads/main/MultiTabRows@Merci.chao.uc.js)をダウンロードし（右クリックして保存）、`chrome` に配置する（MrOtherGuy/fx-autoconfig 使用時は `chrome/JS`）。
   <p>⚠️ コピーして貼り付けやその他の方法で作成すると、誤ったファイルエンコードが発生する可能性がある。</p>
   <p>⛔ 保存中または保存後にファイル名を変更しないでください。</p>

6. Firefox を再起動して適用する。

7. 手順 4 で一部のファイルを `chrome` の外に移動した場合は、まずこのスクリプトが正常に動作することを確認してください。動作が確認できたら、ファイルを戻してください。もし競合が発生した場合は、そのスクリプトや `userChrome.css` 内のルールを調整してください。お困りの際は、🛟 [こちら](https://github.com/Merci-chao/userChrome.js/issues/new)に情報をご提供ください。

## 設定
[about:config](https://support.mozilla.org/kb/about-config-editor-firefox) を開いて、`userChromeJS.multiTabRows@Merci.chao.` で始まる設定項目を検索してください。グレー表示の項目は他の設定との関係で無効化されている。

user.js で設定する場合（※非推奨）、接頭辞 `userChromeJS.multiTabRows@Merci.chao.` を含めてください。例：
```js
user_pref("userChromeJS.multiTabRows@Merci.chao.maxTabRows", 5);
```

⚠️ 注意：他の設定との依存関係により、これらの設定の多くが反映されない可能性がある。user.js を使用するのではなく、about:config 経由で直接設定することを強く推奨。

### 操作

| 項目（接頭辞あり） | 説明 |
| ------------- | ------------- |
| ~~`animateTabMoveMaxCount`~~<span title="削除された">🗑</span> | `animateTabMoveUnderLimit` に置き換えた。 |
| `animateTabMoveShiftKeyToPause` | `Shift` キーを押している間、ドラッグ＆ドロップのアニメーションを一時停止して代わりにドロップインジケーターを表示し、他の段の特定アイテムの隣に移動しづらい特別な状況で役立つ。 |
| `animateTabMoveUnderLimit` | 表示されているタブ数がこの値に達すると、ドラッグ＆ドロップのアニメーションを無効化し、代わりにドロップインジケーターを表示する。値を `3` 未満に設定すると、移動にインジケーターが強制的に使われる。タブが多すぎてドラッグで遅延が発生する場合は、この値を下げることを検討。 |
| `animationDuration` | アニメーションの時間（ミリ秒、`0`～`1000` ※長すぎるとパフォーマンスに影響する可能性がある）。 |
| ~~`disableDragToPinOrUnpin`~~<span title="削除された">🗑</span> | 組み込み設定 [`browser.tabs.dragDrop.dragToPin.enabled`](#dragToPinEnabled) を使用してください。 |
| `dragStackPreceding` | ドラッグしたタブの前の選択したタブをスタックする（[`browser.tabs.dragDrop.multiselectStacking`](#multiselectStacking) を参照）。選択したタブの中央をドラッグすると、後続のタブが意図せず前に移動してしまう問題が発生するため、この設定を無効にすることで回避可能。 |
| ~~`dragToGroupTabs`~~<span title="削除された">🗑</span> | 組み込み設定 [`browser.tabs.dragDrop.createGroup.enabled`](#dragToGroupTabs) を使用してください。 |
| `dynamicMoveOverThreshold` | ピン留めやグループ化されたタブのドラッグ時の移動を滑らかにする。Firefox 115 または `browser.tabs.dragDrop.createGroup.enabled` が無効な場合は非対応。 |
| `hideDragPreview` | ドラッグ中にカーソルの傍に表示されるドラッグプレビューを非表示：<ul><li>`0`－常に表示</li><li>`1`－グループのみ</li><li>`2`－タブのみ</li><li>`3`－両方</li></ul> |
| <span id="hidePinnedDropIndicator">`hidePinnedDropIndicator`</span> | ピン留めされたタブが存在しない場合に、タブをドラッグしてピン留めに変換する際に表示されるインジケーターを非表示。Firefox 115 と 140 では非対応。 |
| `hideScrollButtonsWhenDragging` | ドラッグ中にスクロールボタンを視覚的に非表示。 |
| `linesToDragScroll` | タブを上端・下端へドラッグしたときのスクロール段数。最小値：`1`。 |
| `linesToScroll` | マウスホイール操作によるスクロール段数。最小値：`1`。 |
| `previewPanelNoteEditable` | Firefox のタブノート機能が有効になっている場合、タブプレビューパネルにカーソルを合わせると、内部のノートを編集可能。Firefox 115 と 140 では非対応。 |
| `previewPanelShifted` | 多段がある場合にプレビューパネルをシフトし、下の段の項目が使いにくくなる影響を軽減。`previewPanelNoteEditable` が `true` の場合のみタブに影響。Firefox 115 と 140 では非対応。<ul><li>`0`－無効</li><li>`1`－グループ用</li><li>`2`－タブ用</li><li>`3`－両方用</li></ul> |
| `previewPanelShiftedAlways` | 一段しかない場合でもプレビューパネルをシフト。 |
| `scrollButtonsSize` | ドラッグ中のスクロールボタンのサイズ（ピクセル単位）。最小値：`0` だが、表示上は少なくとも 2 デバイスピクセルの高さになる。最大値はタブの高さの半分までに制限される。 |

### タブバーレイアウト

| 項目（接頭辞あり） | 説明 |
| ------------- | ------------- |
| `autoCollapse`<span title="実験的な機能">🧪</span> | ホバーしていない時は、一段に折りたたむ。有効化すると、`tabsUnderControlButtons` と `positionPinnedTabs` は強制的に無効化される。Firefox 115 では `layout.css.has-selector.enabled` を `true` にする必要がある。 |
| `autoCollapseDelayCollapsing` | カーソルが離れてから折りたたむまでの遅延（ミリ秒）。最小値：`0`。 |
| `autoCollapseDelayExpanding` | ホバー後に展開されるまでの遅延（ミリ秒）。最小値：`0`。 |
| `compactControlButtons` | ウィンドウ操作ボタンをコンパクトに表示。タイトルバーが非表示のとき、Windows 10 以降で利用可能。メニューバーが表示されているとき、ウェブアプリのみに影響。 |
| `controlButtonsAutoHide` | ウィンドウの操作ボタンを隠し、カーソルが右上隅に入ったときに表示する：<ul><li>`0`－無効</li><li>`1`－最大化ウィンドウのみ</li><li>`2`－すべてのウィンドウ</li></ul><p>タイトルバーが非表示のとき、Windows 10 以降で利用可能。メニューバーが表示されているとき、ウェブアプリのみに影響。</p> |
| `controlButtonsAutoHideTriggerHeight` | トリガー領域の高さ。 |
| `hamburgerMenuOnTabBar` | Firefox Smart Window が利用可能な場合に、`false` に設定すると、クラシックウィンドウ上で Firefox メニューボタン（☰）をナビゲーションツールバーに戻す。`tabsAtBottom` が有効な場合は強制的に無効化される。Firefox 153 のみ対応。 |
| `hideAllTabs` | 「タブの一覧を表示」ボタンを非表示。Firefox 115 のみ対応。新バージョンの Firefox では、ボタンを右クリックして「ツールバーから削除」で非表示。 |
| `hideEmptyPlaceholderWhenScrolling` | 左上に何もない場合、タブバーがスクロール可能時にその空白を非表示。`tabsUnderControlButtons` が `2` のときのみ有効。 |
| `justifyCenter` | タブを水平方向に中央揃えする設定：<ul><li>`0`－無効</li><li>`1`－一段のみの場合</li><li>`2`－常に有効（タブの閉じ方やグループの折りたたみ動作が若干異なる場合がある）</li></ul> |
| `maxTabRows` | <p>表示可能な最大段数。最小値：`1`。</p><p>📝 備考：実際のカウントはウィンドウの幅によって変わり、`rowIncreaseEvery` を参照。</p> |
| `newTabButtonAfterLastTab` | <p>「新しいタブ」ボタンを最後のタブの後に配置。無効化されている場合、ツールバーのカスタマイズで指定された位置に従う。<p><p>📝 備考：タブの直後に置かれた場合のみ最後のタブの後に固定される。</p> |
| `positionPinnedTabs` | タブバーがスクロール可能な時、ピン留めされたタブを通常タブの前にグリッドとして配置。 |
| `privateBrowsingIconOnNavBar` | プライベートウィンドウアイコンをナビゲーションツールバーに移動。Firefox 115 では非対応。`tabsAtBottom` が有効な場合は強制的に有効化される。 |
| `rowIncreaseEvery` | ウィンドウの幅がこの幅広がるたびに、表示される段が一段追加される。幅が狭いウィンドウでは、同時に表示できる行数が少なくなる。`0` にすると最大段数が常に表示される。 |
| `rowStartIncreaseFrom` | ウィンドウ幅がこの値＋`rowIncreaseEvery` より大きくなったとき、多段表示が可能になる。 |
| `smartWindowButtonOnNavBar` | クラシックウィンドウ上で、Firefox Smart Window 切り替えボタンをナビゲーションツールバーに移動。`tabsAtBottom` が有効な場合は強制的に有効化される。Firefox 115 と 140 では非対応。 |
| `spaceAfterTabs` | ウィンドウ操作ボタンの前にある空白スペース。最小値：`0`。タイトルバーが非表示のとき利用可能。メニューバーが表示されているとき、ウェブアプリのみに影響。 |
| `spaceAfterTabsOnMaximizedWindow` | 最大化時のウィンドウ操作ボタン前の空白スペース。最小値：`0`。タイトルバーが非表示のとき利用可能。メニューバーが表示されているとき、ウェブアプリのみに影響。 |
| `spaceBeforeTabs` | ウィンドウ左端の空白スペース。最小値：`0`。タイトルバーが非表示のとき利用可能。メニューバーが表示されているとき、ウェブアプリのみに影響。 |
| `spaceBeforeTabsOnMaximizedWindow` | 最大化時の左端空白スペース。最小値：`0`。タイトルバーが非表示のとき利用可能。メニューバーが表示されているとき、ウェブアプリのみに影響。 |
| `tabsAtBottom` | タブバーの位置を変更：<ul><li>`0`－メニューバー下</li><li>`1`－ナビゲーションツールバー下</li><li>`2`－ブックマークツールバー下</li><li>`-1`－ブラウザコンテンツ下</li></ul><p>Firefox 115 では非対応。</p> |
| `tabsbarItemsAlign` | 多段モードでタブバー内の項目（主にボタン）の配置：<ul><li>`start`－上</li><li>`center`－中</li><li>`end`－下</li></ul>`tabsUnderControlButtons` が `0` または `1` でタブバーがスクロール可能時のみ有効。 |
| `tabsUnderControlButtons` | <a name="tabsUnderControlButtons"></a>多段表示時にウィンドウ操作ボタンの下にタブを配置：<ul><li>`0`－無効</li><li>`1`－タブバーがスクロール不可能場合のみ（旧式オプション、非推奨）</li><li>`2`－常に有効</li></ul> |
| `thinScrollbar` | タブバーがスクロール可能な時、上下ボタンなしの細いスクロールバーを使用。 |

### タブサイズ

⚠️ 注意：デフォルト値より狭く設定するのは推奨されない。Firefox はコンパクト用に設計されていないため、予期しない不具合が起こる可能性がある。これらの設定は `userChrome.css` のルールで上書きされ、効果がなくなる場合がある。

| 項目（接頭辞あり） | 説明 |
| ------------- | ------------- |
| `gapAfterPinned` | ピン留めされたタブと通常タブの間の隙間。最小値：`0`。 |
| `lastRowTabsFlexibe` | 多段がある場合、最後の段のタブ幅を伸縮自在にする。`justifyCenter` が `2` の場合は強制的に有効化される。 |
| `pinnedTabsFlexWidth` | ピン留めされたタブのサイズを通常のタブと同様に扱う。有効化すると、`positionPinnedTabs` は強制的に無効化される。 |
| `pinnedTabsFlexWidthIndicator` | `pinnedTabsFlexWidth` が有効の場合、ピン留めされたタブにアイコンを表示。 |
| `tabContentHeight` | タブ内容部分の高さ。最小値：`16`。 |
| `tabHorizontalMargin` | タブ周囲の水平余白。最小値：`0`。 |
| `tabHorizontalPadding` | タブ内側の水平余白。最小値：`0`。 |
| `tabMaxWidth` | タブの最大幅（周囲の余白を含む）。最小幅には `browser.tabs.tabMinWidth` を使用し、実際の最大幅は必ずこの値より小さくなることはない。 |
| `tabVerticalMargin` | タブ周囲の垂直余白。最小値：`0`。 |

### 外観

| 項目（接頭辞あり） | 説明 |
| ------------- | ------------- |
| ~~`dynamicThemeImageSize`~~<span title="削除された">🗑</span> | `themeImageSize` に置き換えた。 |
| `floatingBackdropBlurriness` | タブバーがスクロール可能時に浮動領域の背景ぼかし強度を設定する。`tabsUnderControlButtons` が `2` のときのみ有効。Firefox 115 では、またはぼかし効果が効かない場合には非対応。 |
| `floatingBackdropClip` | タブバーがスクロール可能時に、浮動領域が覆う部分をクリップする。`tabsUnderControlButtons` が `2` のときのみ有効。 |
| `floatingBackdropOpacity` | タブバーがスクロール可能時に浮動領域の背景の不透明度を設定する。`tabsUnderControlButtons` が `2` かつ `floatingBackdropClip` が `false` のとき有効。値は `0`〜`100`。 |
| `nativeWindowStyle` | タブバーに Windows ネイティブスタイル（例えば、Windows 11 の透明効果や [DWMBlurGlass](https://github.com/Maplespe/DWMBlurGlass) などのツールによる視覚効果）を表示。Windows 11 で完全な視覚効果を得るには、`widget.windows.mica` を有効にする必要がある場合がある。Windows 10 で DWM ツールを使用していない場合、この設定は `browser.theme.windows.accent-color-in-tabs.enabled` と似た動作をする。また、透過パターンでデザインされたテーマの背景色を除去可能。Firefox 115 では非対応。 |
| `nativeWindowStyleToolbarColorOpacity` | ツールバーの背景色と、ナビゲーションツールバーとタブバーの間にある区切り線の不透明度。。最小値：`0`、最大値：`100`。元の色に透明度が含まれている場合、この設定を変更しても不透明度を高めることはできない。タブバーが上部にある場合、または Firefox Nova が有効になっている場合に利用可能。 |
| `nativeWindowStyleURLBarColorOpacity` | アドレスバーと検索バーの背景色の不透明度。最小値：`0`、最大値：`100`。元の色に透明度が含まれている場合、この設定を変更しても不透明度を高めることはできない。 |
| `scrollbarThumbColor` | スクロールバーのつまみ部分の色。CSS カラー、変数、`auto` キーワードのいずれか。 |
| `scrollbarTrackColor` | スクロールバーの軌道部分の色。CSS カラー、変数、`auto` キーワードのいずれか。 |
| `showScrollShadow` | タブバーがスクロール可能な場合、上下の端にシャドウを表示。 |
| `themeImageSize` | 背景画像付きのテーマを使用する場合、その画像のサイズは以下に基づいて決定される：<ul><li>`-1`－画像の元のサイズ</li><li>`0`－許可されている最大段数</li><li>`1`－現在のウィンドウ幅で許可されている最大段数</li><li>`2`－現在の段数</li></ul><p>最適な選択は好みとテーマのデザインに依存。画像の高さが段数を収容できるほど十分に大きい場合は、違いはない。</p> |

### その他

| 項目（接頭辞あり） | 説明 |
| ------------- | ------------- |
| `checkUpdate` | <p>Firefox 起動時や新しいウィンドウを開くたびにスクリプトの新バージョンを確認。`1` で有効化、`0` で無効化。値は最後に確認した時刻（例：`1759911972`）で更新される。`1` にリセットすると、新しいウィンドウで即時チェックが実行される。</p><p>💡 有効化を強く推奨。古いスクリプトは新しい Firefox では正常に動作しない可能性がある。</p><p>📝 備考：Firefox の旧バージョン（115 と 140 を除く）を使用している場合、このスクリプトの更新は通知されない。</p> |
| `checkUpdateAutoApply` | 新しいバージョンがある場合にスクリプトファイルを自動更新（上書き）：<ul><li>`1`－無効</li><li>`2`－有効</li><li>`3`－有効（通知なし）、通知されない軽微な変更や修正の更新も自動的に受け取り</li></ul> |
| `checkUpdateFrequency` | 新バージョンの確認頻度（日単位）。最小値：`1`。 |
| `currentVersion` | 現在使用しているバージョン。 |
| `debugMode`<span title="使用禁止">⛔</span> | デバッグモード。一般向けではない。 |
| `incompatible` | この項目は互換性のないバージョンの Firefox を実行している場合にのみ表示される。変更すると、Firefox の起動時に再び互換性警告が表示される。 |

### Firefox の組み込み設定
| 項目（接頭辞なし） | 説明 |
| ------------- | ------------- |
| `browser.nova.enabled` | Nova デザイン（開発中）を適用。Firefox 152 以降で利用可能。 |
| `browser.tabs.dragDrop.createGroup.delayMS` | ドラッグしてグループ化を開始するまでの遅延時間（ミリ秒）。Firefox 115 では非対応。 |
| <span id="dragToGroupTabs">`browser.tabs.dragDrop.createGroup.enabled`</span> | タブを他のタブにドロップした際にグループ化。Firefox 140 では、この名前で新しい真偽設定を作成し切り替える。Firefox 115 では非対応。 |
| <span id="dragToPinEnabled">`browser.tabs.dragDrop.dragToPin.enabled`</span> | 同じウィンドウにドラッグ＆ドロップによるピン留め・外すの動作を有効化。例：タブをピン留めされたタブにドロップすると、ピン留めされるかどうか。この名前で新しい真偽設定を作成し切り替える。 |
| `browser.tabs.dragDrop.moveOverThresholdPercent` | ドラッグして移動する際に必要な重なりの割合。`100 - n` がグループ化のしきい値を定義する。例えば値が `80` の場合、20% 以上重なればグループ化され、80% 以上重なれば移動される。最小値：`0`、最大値：`100`。以下の場合は値が `50` に固定される：<ul><li>別の段へ移動する場合</li><li>Firefox 115 を使用している場合</li><li>ドラッグによるグループ化が無効化されている場合</li><li>`dynamicMoveOverThreshold` が有効な特定のシナリオ</li></ul> |
| <span id="multiselectStacking">`browser.tabs.dragDrop.multiselectStacking`</span> | タブのドラッグ時にスタッキング（積み重ね）を有効化。この名前で新しい真偽設定を作成し切り替える。 |
| `browser.tabs.dragDrop.pinInteractionCue.delayMS` | <a href="#hidePinnedDropIndicator">ピン留めインジケーター</a>を表示するまでの遅延時間（ミリ秒）。Firefox 115 と 140 では非対応。 |
| `browser.tabs.tabClipWidth` | このサイズを超えるタブには閉じるボタンを表示。変更後、新しいウィンドウで有効になる。値が：<ul><li>`tabMaxWidth` 以上の場合－非選択タブには閉じるボタンを非表示</li><li>`browser.tabs.tabMinWidth` 未満の場合－非選択タブには常に閉じるボタンを表示</li></ul> |
| `browser.tabs.tabMinWidth` | 通常タブの最小幅（周囲の余白を含む）を指定。最小値：`50`。 |
| `browser.theme.windows.accent-color-in-tabs.enabled` | Windows 10 のタブバーにシステムのアクセントカラーを適用。 |
| `widget.windows.mica` | タブバーに Windows 11 のネイティブスタイルを適用。 |
| `widget.windows.mica.toplevel-backdrop` | 背景効果の選択肢（Windows 11）：<ul><li>`0`－自動</li><li>`1`－Mica</li><li>`2`－Acrylic</li><li>`3`－Mica Alt</li></ul> |

## 変更履歴
📥 [最新版をダウンロード](https://github.com/Merci-chao/userChrome.js/raw/refs/heads/main/MultiTabRows@Merci.chao.uc.js)

[**Version 4.9.2**](https://github.com/Merci-chao/userChrome.js/raw/e98e4168878018501e916ee53e8a57475fde5d62/MultiTabRows@Merci.chao.uc.js)
- 改善
	- テーマカスタマイズ拡張との互換性を改善。
	- Nova への更新。

[**Version 4.9.1**](https://github.com/Merci-chao/userChrome.js/raw/de38d8381282d4097ac7a0c83dbaf9bb169246a0/MultiTabRows@Merci.chao.uc.js)
- 回帰バグ修正
	- リンクやブックマークをタブバーにドロップしてタブを開くことができなかった。
	- Windows 7 と 8 でタブバーの背景が不透明になった。

[**Version 4.9**](https://github.com/Merci-chao/userChrome.js/raw/dcd1edf80d34213cc10beb57c702a38fa3818197/MultiTabRows@Merci.chao.uc.js)
- 追加
	- `nativeWindowStyle` に新しいサブ設定を追加：
		- `nativeWindowStyleToolbarColorOpacity`：ツールバーの背景色と、ナビゲーションツールバーとタブバーの間にある区切り線の不透明度。タブバーが上部にある場合、または Firefox Nova が有効になっている場合に利用可能。
		- `nativeWindowStyleURLBarColorOpacity`：アドレスバーと検索バーの背景色の不透明度。
	- `hamburgerMenuOnTabBar` を追加（Firefox 153）：`false` に設定すると、Firefox Smart Window が利用可能な場合に Firefox メニューボタン（☰）をナビゲーションツールバーに戻す。
- 改善
	- テーマとのサポートと互換性を改善：
		- 繰り返し背景画像を持つテーマに対して `themeImageSize` が利用可能になった。非表示のメニューバーのためにサイズを確保する必要もなくなった。
		- 背景画像を持つテーマに対して `nativeWindowStyle` が利用可能になった。これにより、透過パターンでデザインされたテーマの背景色を削除できる。
		- 複数の画像レイヤーを持つテーマをサポート。
		- タブバーがブラウザーコンテンツの下に表示されている場合、一部のテーマの表現が改善された。
		- Firefox 152 以降の Nova UI デザインへの更新。
	- 非互換の Firefox バージョンで実行している場合に警告を表示。
- 修正
	- 特殊なケースや複数タブをドラッグする際のアニメーションの不具合。
	- 軽微な表示上の問題。

[**Version 4.8.1**](https://github.com/Merci-chao/userChrome.js/raw/7b465c52edf88e2175afe29c35996cd4f71aa1b9/MultiTabRows@Merci.chao.uc.js)
- Firefox ESR バージョン（140）へのサポート。

[**Version 4.8.0.1**](https://github.com/Merci-chao/userChrome.js/raw/802f2c376de9b24ff6708a4607c3545f850714bb/MultiTabRows@Merci.chao.uc.js)
- `currentVersion` を追加：現在のバージョンを表示。

[**Version 4.8**](https://github.com/Merci-chao/userChrome.js/raw/9a9c6cd694b60b8f4ae6069e468450cc4d2f26e4/MultiTabRows@Merci.chao.uc.js)
- 追加
	- `controlButtonsAutoHide` および関連設定を追加：ウィンドウの操作ボタンを非表示にし、カーソルが右上隅に入ったときに表示されるようにする。
- 変更
	- `security.allow_unsafe_dangerous_privileged_evil_eval` が有効化されていることに依存しなくなった。他のスクリプトで必要ない場合は、`false` にリセットしてください。
- 改善
	- Firefox 152 の Nova UI デザインへのサポート。
	- `tabsAtBottom` を `-1` に設定した場合：
		- 全画面表示モードでタブバーを非表示にできるようになった。
		- タブバー項目のメニューはデフォルトで上方向に開く。
	- Firefox 152 への更新。
	- メディアボタンのレイアウトを細かく改善。
- 修正
	- 潜在的なメモリリークの問題。
	- `tabsAtBottom` が有効化されているとき、サイドバーの背景色とアイコンの色が正しく表示されなかった。
	- 特殊なケースで発生するアニメーションの問題。
	- 一部のテーマでタブをドラッグ中に、積み重ね表示が乱れて見える問題。
	- 軽微な表示上とレイアウトの問題。

<details>
<summary>旧バージョン</summary>

[**Version 4.7.2**](https://github.com/Merci-chao/userChrome.js/raw/e907a3752a237595c93c9c6b69f228b612af1569/MultiTabRows@Merci.chao.uc.js)
- 「閉じたタブをひらきなおす」機能が動作しなくなる問題を修正。 

[**Version 4.7.1**](https://github.com/Merci-chao/userChrome.js/raw/d684754c50e71e0c0d4159948837e099a02f323a/MultiTabRows@Merci.chao.uc.js)
- 折りたたまれたタブグループ内のタブとの間で切り替える際、いずれかが分割ビューに属している場合に発生していた問題を修正。
- タブバーがスクロール可能・不可能に切り替わる際、新しいタブボタンにアニメーションを追加。

[**Version 4.7**](https://github.com/Merci-chao/userChrome.js/raw/798b230f25123a0556f0fc0c80ed156fd497f600/MultiTabRows@Merci.chao.uc.js)
- 改善
	- インジケーターで移動するとき、タブをグループ化するためのドラッグ操作に対応。`browser.tabs.dragDrop.createGroup.enabled` または `browser.tabs.dragDrop.createGroup.delayMS` を変更して挙動を調整。
- 変更
	- `animateTabMoveMaxCount` を `animateTabMoveUnderLimit` に置き換え：表示されているタブ数が指定数に達したときは、インジケーターで移動する。
- 修正
	- 一部のスクリプトローダー使用時に更新を直接適用できなかった。
	- `tabsAtBottom` が有効な場合に、ウェブアプリに関連する問題。
	- インジケーターで移動するとき：
		- 特殊なケースでタブが揺れることがあった。
		- タブバーがスクロール可能なとき、新しいタブボタンが隠れなかった。
	- 特殊なケースで発生する軽微な表示上の不具合。

<details>
<summary>軽微な更新</summary>

[**Version 4.6.1.1**](https://github.com/Merci-chao/userChrome.js/raw/4e12d4cda2b3d4239901a72fe0786aa12f20883f/MultiTabRows@Merci.chao.uc.js)
- Firefox 151 への更新。
- タブノートを有効にした直後に「ノートを追加」項目が表示されない不具合を修正。
</details>

[**Version 4.6.1**](https://github.com/Merci-chao/userChrome.js/raw/05a819fa133b8814693f2cbe2300770657311fc6/MultiTabRows@Merci.chao.uc.js)
- `themeImageSize` に新しいオプションを追加：`-1`－画像の元のサイズ。

[**Version 4.6**](https://github.com/Merci-chao/userChrome.js/raw/10479eb67e6851bb17cbade0aa3861e353bcc942/MultiTabRows@Merci.chao.uc.js)
- 追加
	- ブラウザ下部にタブバーを配置できるようになった（`tabsAtBottom` を `-1` に設定することで有効）。
	- `dynamicThemeImageSize` を `themeImageSize` に置き換え、新しいオプションを提供。
- 改善
	- インジケーターを使って移動する時が Firefox ネイティブ関数に依存せず、正しい結果を返すようになった（`animateTabMoveMaxCount` と `animateTabMoveShiftKeyToPause` に関連）。
	- 不要なアニメーションを減らしてパフォーマンスを向上。
	- 最後の段で唯一のタブを閉じる際の挙動を改善。
	- Firefox 150 と 151 への対応。
	- ネットワークエラーが発生した場合、アップデートチェックは翌日に再試行される。
- 修正
	- 1 段だけ許可されている場合の不具合。
	- インジケーターを使ったタブ移動の不具合。
	- 背景画像を繰り返し使用したテーマが正しく動作しなかった。
	- タブバーが極端に狭いときに Firefox がフリーズする可能性があった。
	- `gapAfterPinned` は一部のケースでは動作しなかった。
	- 特殊なケースで発生する軽微なレイアウトと表示上の不具合。

[**Version 4.5.1**](https://github.com/Merci-chao/userChrome.js/raw/e109f1131ea71e4d94e5c99f8f8d977af9ceba8a/MultiTabRows@Merci.chao.uc.js)
- 改善
	- タブバー内のボタンとタブの角の丸みは、タブの内容部分の高さと水平余白が一定の水準まで減ると減り始める。
	- Firefox 150 への更新。
	- 分割ビューの区切り線を微調整。
- 修正
	- タブノート機能を無効にした際、タブプレビューパネルが誤ってシフトされた。
	- タブをドラッグした後、オーディオアイコンと閉じるボタンが更新されなかった。
	- 特殊なケースでの起動時に発生した軽微なレイアウト問題。

<details>
<summary>軽微な更新</summary>
	
[**Version 4.5.0.1**](https://github.com/Merci-chao/userChrome.js/raw/1f0f7f439884512fc882c308452b3a504f9489c9/MultiTabRows@Merci.chao.uc.js)
- 特殊なケースでの軽微なレイアウト問題を修正。

</details>

[**Version 4.5**](https://github.com/Merci-chao/userChrome.js/raw/4aaf427455b1873ac386f7c2074c7c0474564a30/MultiTabRows@Merci.chao.uc.js)
- 変更
	- `disableDragToPinOrUnpin` を削除し、代わりに組み込みの設定 `browser.tabs.dragDrop.dragToPin.enabled` を使用。
	- `dragToGroupTabs` を削除し、代わりに組み込みの設定 `browser.tabs.dragDrop.createGroup.enabled` を使用。
- 改善
	- ドラッグ時のパフォーマンスを改善。
	- Firefox 149 と 150 への更新。
	- タブグループのドラッグ＆ドロップの挙動に軽微な調整。
	- スクロールボタンとシャドウの幅を調整。
- 修正
	- 複数のタブをまとめてドラッグすると、順序が正しくない場合があった。
	- ウィンドウをリサイズした際、選択したタブへスクロールされなかった。
	- `autoCollapse` 機能の軽微なバグ。
	- ドラッグ中にスクロールすると発生する軽微な問題。
	- `showScrollShadow` は Firefox 115 で動作しなかった。
	- 特殊なケースで発生する軽微な表示不具合。

[**Version 4.4**](https://github.com/Merci-chao/userChrome.js/raw/1cd561a9b926abe7d6ee00f39c8347efed860133/MultiTabRows@Merci.chao.uc.js)
- 追加
	- `showScrollShadow` を追加：タブバーがスクロール可能な場合、上下の端にシャドウを表示し、Firefox のインターフェースデザインに合わせる。
	- `animateTabMoveShiftKeyToPause` を追加：`Shift` キーを押している際、ドラッグ＆ドロップのアニメーションを一時停止し、代わりにドロップインジケーターを表示する。備考：Firefox のバグにより、特定のシナリオではドロップ位置が期待通りに動作しない可能性がある。
	- `smartWindowButtonOnNavBar` を追加（Firefox 149 以降）：Firefox Smart Window 切り替えボタンをナビゲーションツールバーに移動。`tabsAtBottom` が有効な場合は強制的に有効化される。
- 改善
	- スクロールやドラッグをより容易にするため、タブバー上方にドラッグスペースを追加（タブバーが最上部でない場合のみ）。
	- 互換性の更新：
		- Firefox Smart Window 機能；
		- Firefox 149。
	- `tabsAtBottom` が有効な場合：
		- タブバー下の追加ドラッグスペースが確保されている；
		- DLP ボタンをナビゲーションツールバーへ移動。
- 修正
	- 特定の状況ごとに発生する複数のドラッグ＆ドロップの問題。

[**Version 4.3.1**](https://github.com/Merci-chao/userChrome.js/raw/4393a0f31b062811872d658884fe1f4803a5eb03/MultiTabRows@Merci.chao.uc.js)
- 改善
	- ドロップインジケーターの横にピン留め・外すアイコンを表示し、ドラッグ操作でピン留め・外すを識別できるようになった。
	- Firefox 149 に対応。
- 修正
	- ピン留めされたタブが多数ありウィンドウが狭い場合、Firefox はドラッグ＆ドロップした後にフリーズする可能性があった。
	- タブバーがスクロール可能な場合、一部の状況でピン留めされたタブを並べ替えることができなかった。
	- 不要なレイアウト更新が行われた問題。
	- 特殊な場合にドラッグ＆ドロップした際の軽微な表示上の問題。
	- 特別な場合における外観上の軽微な問題。

[**Version 4.3**](https://github.com/Merci-chao/userChrome.js/raw/8e58bd0162eefb9f258257249dcd10172943826a/MultiTabRows@Merci.chao.uc.js)
- 新規
	- `lastRowTabsFlexible` を追加：多段がある場合、最後の段のタブ幅を伸縮自在にする。`justifyCenter` が `2` の場合は強制的に有効化される。
	- `positionPinnedTabs` を追加：タブバーがスクロール可能な時、ピン留めされたタブを通常タブの前にグリッドとして配置。
	- `newTabButtonAfterLastTab` を追加：「新しいタブ」ボタンを最後のタブの後に配置。無効化されている場合、ツールバーのカスタマイズで指定された位置に従う。備考：タブの直後に置かれた場合のみ最後のタブの後に固定される。
	- `previewPanelShiftedAlways` を追加：一段しかない場合でもプレビューパネルをシフト。
- 改善
	- `justifyCenter` が `1` の時、タブを閉じたりグループを折りたたむ際にタブサイズを固定できるようになった。
	- タブグループのアニメーションを改善。
	- 細かな操作上の詳細を微調整。
	- Firefox 149 に対応。
	- タブノート関連の更新。
- 修正
	- 一時的なレイアウト問題：
		- 完全に折りたたまれていないグループをウィンドウ外へドラッグした時；
		- 段の最初または最後のタブを閉じた時；
		- タブをドラッグしてグループ化した時。
	- 特殊ケースのドラッグやアニメーションにおける軽微な問題。

[**Version 4.2**](https://github.com/Merci-chao/userChrome.js/raw/00c0f19da45e1a391a96c5d7203c4a2413cd9360/MultiTabRows@Merci.chao.uc.js)
- 新規
	- `previewPanelShifted` を追加：多段がある場合にプレビューパネルをシフトし、下の段の項目が使いにくくなる影響を軽減。`previewPanelNoteEditable` が `true` の場合のみタブに影響。Firefox 115 では非対応。
		- `0`－無効
		- `1`－グループ用
		- `2`－タブ用
		- `3`－両方用
	- `previewPanelNoteEditable` を追加（Firefox 148 以降）：タブプレビューパネルにカーソルを合わせると、内部のノートを編集可能。
- 修正
	- タブを連続かつ高速で閉じるとウィンドウが最大化・復元されていた問題。
	- 非選択タブのオーディオボタンをドラッグすると発生していた不具合。
	- 特定のケースで最後のタブを閉じた際のタブサイズ固定の問題。
	- 分割ビューの外観を元のデザインに合わせて調整。
	- タブ一覧から未選択のタブをドラッグしてタブバーにドロップした際、誤ったタブが移動。
	- Ctrl キーを押して分割ビューのドラッグを開始した際に発生していた問題。
	- 旧バージョンの Firefox におけるタブグループラベルのレイアウト問題。
	- レイアウトとアニメーションの軽微な不具合。

[**Version 4.1.3**](https://github.com/Merci-chao/userChrome.js/raw/6c0a12ca3fb872c3f5b4c644454b6b7b69b38eef/MultiTabRows@Merci.chao.uc.js)
- 修正
	- 特定のケースで、ピン留めされたタブがありタブバーがスクロール可能になると、Firefox がフリーズする可能性があった。
	- Firefox 115 において、ピン留めされたタブで `tabHorizontalMargin` が機能しなかった。
	- 特定のケースで、`tabContentHeight` を変更するとレイアウトの問題が発生。
	- 特定のケースで、about:config で `tabVerticalMargin` が欠落する可能性があった。

<details>
<summary>軽微な更新</summary>

[**Version 4.1.2.5**](https://github.com/Merci-chao/userChrome.js/raw/c6e59860ed977aec878ce0550c5a7f0b8327d0b9/MultiTabRows@Merci.chao.uc.js)
- ミニオーディオボタンの余白を調整し、タブラベルとの重なりを防止。

[**Version 4.1.2.4**](https://github.com/Merci-chao/userChrome.js/raw/d6f43131d380eb5159fdd6a845ed184d20618ccb/MultiTabRows@Merci.chao.uc.js)
- スクロール可能なタブバーでピン留めされたタブを別ウィンドウに移動した際に発生するレイアウトの問題を修正。
- ピン留めされたタブを閉じる際に発生する表示上の問題を修正。

[**Version 4.1.2.3**](https://github.com/Merci-chao/userChrome.js/raw/3c4e92e7733abd23a720d91687ee84121b716407/MultiTabRows@Merci.chao.uc.js)
- `tabContentHeight` が `30` 未満の場合（コンパクトモード）にタブのセカンダリラベルを非表示（外国語版のみ）。
- 分割ビューでタブの高さがコンパクトすぎる場合に調整。
- `checkUpdateAutoApply` のデフォルト値は `1` に変更されたが、`0` と同じ効果がある。

[**Version 4.1.2.2**](https://github.com/Merci-chao/userChrome.js/raw/2f2ed90bffb0d8c36ed9ad1a9e93030a4b2e7390/MultiTabRows@Merci.chao.uc.js)
- 前回バージョン以降、Firefox 115 でオーディオボタンのビジュアル問題を修正。

[**Version 4.1.2.1**](https://github.com/Merci-chao/userChrome.js/raw/e1897daad71fb35903eb129f90f7799ae1a0bead/MultiTabRows@Merci.chao.uc.js)
- 分割ビューでタブを閉じる際、`tabMaxWidth` がある一定値より小さい場合に発生する表示上の不具合を修正。
- Firefox 147 以降におけるタブノートアイコンのサポートを更新。
</details>

[**Version 4.1.2**](https://github.com/Merci-chao/userChrome.js/raw/d7accbd33d613703bbf3f88bf085369b5aa43072/MultiTabRows@Merci.chao.uc.js)
- 修正
	- `tabMaxWidth` が Firefox 146 以降で動作しない問題。

[**Version 4.1.1**](https://github.com/Merci-chao/userChrome.js/raw/2605d71e35fe3d3811ff795695581d3d957ab54d/MultiTabRows@Merci.chao.uc.js)
- 改善
	- Firefox 148 への対応を更新。
- 修正
	- v4.1 以降、`pinnedTabsFlexWidth` を有効化した際のピン留めされたタブの余白の不具合を修正。

<details>
<summary>軽微な更新</summary>

[**Version 4.1.0.7**](https://github.com/Merci-chao/userChrome.js/raw/4f41b6419194e5be3883ebd9c332386573459ccd/MultiTabRows@Merci.chao.uc.js)
- v4.1 以降、他のスクリプトと競合する可能性のある問題を修正。

[**Version 4.1.0.6**](https://github.com/Merci-chao/userChrome.js/raw/131ae1fe0a6893515a238d4e996e0346f0587e5e/MultiTabRows@Merci.chao.uc.js)
- スクリプトローダーによって `security.allow_unsafe_dangerous_privileged_evil_eval` がロックされたケースを処理。

[**Version 4.1.0.2**](https://github.com/Merci-chao/userChrome.js/raw/d4ba5f8d43c6e68e42ada1cd8f2108b55d7c444c/MultiTabRows@Merci.chao.uc.js)
- `tabVerticalMargin` の値に合わせてグループラインのサイズを調整し、見栄えを改良。

</details>

[**Version 4.1**](https://github.com/Merci-chao/userChrome.js/raw/915d87a20b0dbaacbb1b3ac5709dede2bc02cbd0/MultiTabRows@Merci.chao.uc.js)
- 新規
	- タブの高さと間隔を制御するために `tabContentHeight`、`tabVerticalMargin`、`tabHorizontalPadding`、`tabHorizontalMargin` を追加。デフォルト値より狭く設定するのは推奨されない。Firefox はコンパクト用に設計されていないため、予期しない不具合が起こる可能性がある。これらの設定は `userChrome.css` のルールで上書きされ、効果がなくなる場合がある。
- 改善
	- タブバーが過度にコンパクトな時のレイアウトを調整。
	- アップデート通知 UI を調整。
- 修正
	- `tabsAtBottom` を有効にした時に通知バーの位置が誤っていた。

<details>
<summary>軽微な更新</summary>

[**Version 4.0.2.3**](https://github.com/Merci-chao/userChrome.js/raw/5b908e70e03a724c9c7bee6208ede691498e6f13/MultiTabRows@Merci.chao.uc.js)
- about:config 内の設定の依存関係を更新。

[**Version 4.0.2.2**](https://github.com/Merci-chao/userChrome.js/raw/6fe214ec244687756c2f238c8af21a2864c1e81d/MultiTabRows@Merci.chao.uc.js)
- タブグループに関連する軽微なアニメーションを修正。

[**Version 4.0.2.1**](https://github.com/Merci-chao/userChrome.js/raw/8b5df9cd8f39e2a19405f53d18cd87df8d7a0485/MultiTabRows@Merci.chao.uc.js)
- Firefox のバグ修正 [#1997096](https://bugzilla.mozilla.org/show_bug.cgi?id=1997096) をフォローアップ。

</details>

[**Version 4.0.2**](https://github.com/Merci-chao/userChrome.js/raw/fcc877abb73d14e2be2743d4c056ca7881d40c32/MultiTabRows@Merci.chao.uc.js)
- 修正
	- v4.0 以降、オーディオボタン付きのタブがあるときにレイアウトの問題が発生する場合があった。

[**Version 4.0.1**](https://github.com/Merci-chao/userChrome.js/raw/03f755577005868ecb0960c77189d28d56336974/MultiTabRows@Merci.chao.uc.js)
- 修正
	- 新規インストール時にスクリプトが失敗。
	- v4.0 以降、ウィンドウ間でタブを移動できなくなった。

[**Version 4.0**](https://github.com/Merci-chao/userChrome.js/raw/ea2ce83a7cbfabae30c0e3f873769b62619e2894/MultiTabRows@Merci.chao.uc.js)
- 新規
	- Firefox 146 で実装された分割ビュー機能に対応。`browser.tabs.splitView.enabled` を `true` に設定することで有効化可能。
	- 複数のタブをドラッグする際のスタッキング（積み重ね）に対応。Firefox 146 では、`browser.tabs.dragDrop.multiselectStacking` を `true` に設定することで有効化可能。Firefox 145 以下（115 も含む）では、その名で新規真偽値設定の作成が必要ある。
	- `dragStackPreceding` を追加：ドラッグしたタブの前の選択したタブをスタックする。選択したタブの中央をドラッグすると、後続のタブが意図せず前に移動してしまう問題が発生するため、この設定を無効にすることで回避可能。
	- Firefox 115 でピン留め・外すのドラッグ操作をサポート。`disableDragToPinOrUnpin` を `false` に設定すると有効化。
	- `privateBrowsingIconOnNavBar` を追加：プライベートウィンドウアイコンをナビゲーションツールバーに移動。Firefox 115 では非対応。`tabsAtBottom` が有効な場合は強制的に有効化される。
- 変更
	- Firefox の元のデザインに従い、`tabsAtBottom` が有効な場合、`spaceAfterTabs`、`spaceAfterTabsOnMaximizedWindow`、`spaceBeforeTabs`、および `spaceBeforeTabsOnMaximizedWindow` がナビゲーションツールバーの端のスペースに影響するようになった。
	- Firefox の元のデザインに従い、Firefox 143 以降では、`gapAfterPinned` のデフォルト値が `0` になる。
- 改善
	- タブを閉じる際やタブグループを折りたたむ際のタブサイズ固定の挙動を改良。
	- 特定のシナリオにおいて、アイテムを段端へドラッグする際の困難を回避するために、ドラッグ動作を改良。
	- レイアウトの不具合を防ぐために、「新しいタブ」ボタンのサイズを固定。
	- Firefox 147 に対応。
	- スクロール中はグループのホバープレビューパネル（hover preview panel）を非表示。
	- `toolkit.tabbox.switchByScrolling` に対応。
- 修正
	- グループを折りたたむ際に、ホバープレビューパネルが誤って表示される場合があった。
	- グループを展開してタブバーがスクロールし始めると、スクロールが滑らかじゃなかった。
	- バージョン 3.5 から、ドロップインジケーター付きのドラッグ＆ドロップのアニメーションが欠落。
	- 水平スクロールホイールを使用した後、タブバーがスクロールできなくなった。
	- `pinnedTabsFlexWidth` が有効な場合、オーディオボタンはピン留めされたタブで一貫した外観を持っていなかった。
	- UI 密度をタッチに設定した際の最小タブ幅の不正とレイアウトの不具合。
	- いろんな軽微なバグや不具合。

<details>
<summary>軽微な更新</summary>

[**Version 3.6.1.1**](https://github.com/Merci-chao/userChrome.js/raw/c78381b0d0d5d8c95cc881021d1329f907bec051/MultiTabRows@Merci.chao.uc.js)
- バグ修正：バージョン 3.6.0.1 以降で発生した、段数を減らした際にタブサイズが予期せず解除された問題。

</details>

[**Version 3.6.1**](https://github.com/Merci-chao/userChrome.js/raw/0fc2766a8e4df89944cb82088fcb2b4e69c5ccea/MultiTabRows@Merci.chao.uc.js)
- `autoCollapse` の更新：
	- タブバーは現在のウィンドウに対してのみ展開されるようになった。
	- アドレスバーにフォーカスがある場合、タブバーが展開されないようにする。
	- クリックまたは `Esc` キーを押すことで、まれにタブバーが折りたたまれない場合でも折りたたむようになった。
	- バグ修正：一段しかない状態でドラッグすると発生する問題。
	- バグ修正：タブバー展開時にグループ線の一部が消える問題。
- Firefox の軽微な表示バグ [#1995909](https://bugzilla.mozilla.org/show_bug.cgi?id=1995909) を修正。

<details>
<summary>軽微な更新</summary>

[**Version 3.6.0.2**](https://github.com/Merci-chao/userChrome.js/raw/a3399b69e7f91e34f62a1fce4e61515c663d309e/MultiTabRows@Merci.chao.uc.js)
- 前回の軽微な更新で行ったスクロールバー関連のコード変更を一部元に戻す。

[**Version 3.6.0.1**](https://github.com/Merci-chao/userChrome.js/raw/6172e2fc2e47088803b839a12c2f05358a736365/MultiTabRows@Merci.chao.uc.js)
- バグ修正：タブを閉じた直後にウィンドウサイズを変更すると、一時的に空の行が表示されることがあった。

</details>

[**Version 3.6**](https://github.com/Merci-chao/userChrome.js/raw/f8527bad286d272b7ef74faaf1196c87a13a0329/MultiTabRows@Merci.chao.uc.js)
- `pinnedTabsFlexWidthIndicator` を追加：`pinnedTabsFlexWidth` が有効な場合、ピン留めされたタブにアイコンを表示。
- 更新通知の「チェックを停止」オプションを「スクリプトファイルを直接更新」に変更。
- タブをドラッグして段の端に押し付けることで、別の行の項目とグループ化したり、既存のグループから除外したりする操作の挙動を改良。
- `dragToGroupTabs` が `false` の場合、タブをグループに追加・除外する際のドラッグ挙動を改良。
- ピン留めされたタブが存在し、タブバーがスクロール可能な場合のアニメーションを改良。
- タブを段の端に押し付けながらドラッグする際のアニメーションを改良。
- タブをピン留め・外しようとする際に、ドラッグアニメーションを一時停止。
- このスクリプトによって影響が増幅される Firefox のバグ [#1994643](https://bugzilla.mozilla.org/show_bug.cgi?id=1994643) に対する回避策を適用。
- バグ修正：`pinnedTabsFlexWidth` を有効にした際、ピン留めされたタブにページアイコンがない場合の不具合。
- 軽微な表示上の不具合を修正。

[**Version 3.5.2**](https://github.com/Merci-chao/userChrome.js/raw/6e0aeaec8a9deb2275f00d8f2c0d4078543f2384/MultiTabRows@Merci.chao.uc.js)
- バグ修正：タブをドラッグした際、端に押し付けられると意図した位置に移動しない場合があった。

[**Version 3.5.1**](https://github.com/Merci-chao/userChrome.js/raw/f8754c538d7912ac4f246594f0e99418753ce49c/MultiTabRows@Merci.chao.uc.js)
- `disableDragToPinOrUnpin` を追加：同じウィンドウにドラッグ＆ドロップによるピン留め・外すの動作を無効化（Firefox 115 では非対応）。公式設定が追加された場合、この設定は削除されるようになる。
- タブのドロップアニメーション中にウィンドウがドラッグされるのを防止。

[**Version 3.5**](https://github.com/Merci-chao/userChrome.js/raw/04835a0ae05f8af40aa88b2be69811d3f8d2874d/MultiTabRows@Merci.chao.uc.js)
- Firefox 145 に対応。
- タブを別のウィンドウに移動する際にアニメーションを追加。
- 背景画像なしのテーマで `nativeWindowStyle` が使えるようになった。
- CSS 変数を調整：グループラベルのサイズを制御するために、`#tabbrowser-tabs` に `--group-label-max-width` と `--group-line-padding` を追加。
- メニューがタブと重なっている場合、そこから項目をドラッグすると常にメニューを閉じるようにする。
- バグ修正：`tabsAtBottom` 使用時の背景画像の不具合。
- バグ修正：一部設定が予期せず無効になった。
- バグ修正：タブをドラッグしてピン留め・外す後に不具合が発生。
- バグ修正：タブをドラッグして別のウィンドウにコピーした後に不具合が発生。
- バグ修正：タブグループをウィンドウ外に素早くドラッグした後に不具合が発生。
- 軽微なバグの修正。
- 可読性向上のためコードスタイルを改良。
  
[**Version 3.4.2**](https://github.com/Merci-chao/userChrome.js/raw/d81d597c10eecb899817c42e7686eb9dde020fed/MultiTabRows@Merci.chao.uc.js)
- バグ修正：`hidePinnedDropIndicator` を有効にするとタブのドラッグ＆ドロップができなくなった。
- バグ修正：新しく開いたウィンドウでタブが不自然に移動する場合があった。
- バグ修正：タブの閉じるボタンが正しく表示・非表示されない場合があった。
- バグ修正：特殊な状況で発生していた `tabsUnderControlButtons` のレイアウト問題。
- Firefox の旧バージョン（115 を除く）を使用している場合、このスクリプトの更新は通知されなくなる。
 
<details>
<summary>軽微な更新</summary>

[**Version 3.4.1.3**](https://github.com/Merci-chao/userChrome.js/raw/2770e1cd7330b6ad59cddc9184ad1e967b65f7ce/MultiTabRows@Merci.chao.uc.js)
- ドロップインジケーター付きでドラッグ＆ドロップすると、アニメーションが実行されるようになった。

[**Version 3.4.1.1**](https://github.com/Merci-chao/userChrome.js/raw/e07d6395a0d8c19e3a3a2cb1772106e7c95c3f99/MultiTabRows@Merci.chao.uc.js)
- バグ修正：タブ以外の項目を固定タブ上にドラッグした際、ドロップインジケーターの位置が誤って表示された。
</details>

[**Version 3.4.1**](https://github.com/Merci-chao/userChrome.js/raw/537abb84e34ae05f49fee5934b0ae85ed6f1b89d/MultiTabRows@Merci.chao.uc.js)
- バグ修正：タブバーにタブ以外の項目をドロップすると、不具合が発生。
- バグ修正：`hideEmptyPlaceholderWhenScrolling` がプライベートウィンドウで正常に動作しない場合があった。
- `checkUpdateAutoApply` が `3` に設定されている場合、通知が表示されない軽微な変更や修正の更新も受信するようになった。

[**Version 3.4**](https://github.com/Merci-chao/userChrome.js/raw/24a669b235a4ef2eda7ffc2575e73939c68fd28d/MultiTabRows@Merci.chao.uc.js)
- `animateTabMoveMaxCount` を追加：ドラッグされたタブの数がこの値を超えると、ドラッグアニメーションは無効化され、代わりにドロップ位置のインジケーターが表示。最小値：`0`。多数のタブをドラッグした際に動作が重くなる場合は、この値を下げてください。備考：タブグループの一部の操作が使用できない場合があり、最終的なドロップ位置は Firefox のネイティブな挙動によって決まり、特定の状況では期待どおりに動作しない場合がある。
- `hidePinnedDropIndicator` を追加：ピン留めされたタブが存在しない場合に、タブをドラッグしてピン留めに変換できる際に表示されるインジケーターを非表示（Firefox 143 以降に対応）。
- アニメーションの処理を見直して、動作を改良。
- `tabsAtBottom` を `2` にすると、ブックマークツールバーを「新しいタブのみ表示する」に設定していても、タブバーはブックマークツールバーの下に表示。
- `autoCollapse` の改良：右クリックメニューが表示されている間、タブバーは展開されたままになる。
- `autoCollapse` における 2 つの遅延パラメータのデフォルト値を引き上げた。
- バグ修正：タブグループが複数行にまたがる場合、一部の状況下でグループの折りたたみやドラッグ操作がスムーズに動作しないことがあった。
- バグ修正：ドラッグ中に Esc キーを押すと、問題が発生する場合があった。
- バグ修正：Ctrl キーで複数のタブを選択してコピーする操作が、時々うまく機能しなかった（Firefox バグ #1987160）。
- バグ修正：最後のタブをショートカットで閉じると、タブが上にスクロールすることがある問題を修正。
- このスクリプトはポップアップウィンドウには適用されない。
- Firefox 143 と 144 に対応。
- 複数の軽微なバグの修正。

[**Version 3.3**](https://github.com/Merci-chao/userChrome.js/raw/2094baff3cc4802583d6b6013d406929f117c67a/MultiTabRows@Merci.chao.uc.js)
- `pinnedTabsFlexWidth` を追加：ピン留めされたタブのサイズを通常のタブと同様に扱う。なお、タブバーがスクロール可能な場合でも位置が固定されなくなる（試験的機能）。
- `checkUpdateAutoApply` を追加：新しいバージョンがある場合にスクリプトファイルを自動更新（上書き）。`0`－無効、`1`－確認する、`2`－常に更新、`3`－常に更新（通知なし）。
- バグ修正：Firefox 142 において、閉じたピン留めされたタブを開きなおすとタブ機能が正常に動作しなくなった。
- 全画面表示に関連する軽微な不具合を修正。
- `nativeWindowStyle` は全画面表示でも有効。
- タブバーサイズのロック動作を改良。
- 軽微な不具合の修正。

[**Version 3.2.1**](https://github.com/Merci-chao/userChrome.js/raw/ff2876589433550df6128c3091a1cd51fb17e8b7/MultiTabRows@Merci.chao.uc.js)
- バグ修正：アニメーション中にタブがたまに不自然に揺れる。
- バグ修正：「ドラッグでグループ作成」がたまにうまく動かない。
- バグ修正：前のバージョン以降、開いたグループのドラッグが滑らかでない。
- Firefox 143 に対応。

[**Version 3.2**](https://github.com/Merci-chao/userChrome.js/raw/950eb48e30775f8f8656f71ddcc68a88020919b3/MultiTabRows@Merci.chao.uc.js)
- `justifyCenter` を追加：タブを中央揃えにする設定。`0`－無効、`1`－1 段のみの場合、`2`－常に有効。タブが中央揃えされている場合、タブの閉じ方やグループの折りたたみ動作が若干異なる場合がある。
- `scrollButtonsSize` を追加：ドラッグ中のスクロールボタンのサイズ（ピクセル単位）。最小値は `2`、最大値はタブの高さの半分までに制限される。
- Firefox 143 に対応。
- 一部の環境でタブをブックマークツールバーにドロップできない問題を修正。
- その他の不具合修正。

[**Version 3.1**](https://github.com/Merci-chao/userChrome.js/raw/9401e40c4c7b7d4ec9338a81750dfb89210f9438/MultiTabRows@Merci.chao.uc.js)
- `autoCollapse` と関連オプションを追加: ホバーしていないときにタブを1行に折りたたむ。Firefox 115 では `layout.css.has-selector.enabled` を有効にする必要がある。（実験的）
- `tabsAtBottom` を追加：タブバーを下部に配置（1: ナビゲーションツールバーの下、2: ブックマークツールバーの下）。Firefox 115 では非対応。
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

[**Version 3.0**](https://github.com/Merci-chao/userChrome.js/raw/45cbb07d406c1ae9c53c100533836c8c008f60bb/MultiTabRows@Merci.chao.uc.js)
- タブグループに完全対応。
- タブ関連の動作にアニメーションを導入。
- タブを他のタブにドラッグしてグループ化する機能 `dragToGroupTabs` を追加。
- ピン留めやグループ化されたタブのドラッグを滑らかにする `dynamicMoveOverThreshold` を追加。
- Windows のネイティブテーマスタイルをタブバーに表示する `nativeWindowStyle` を追加。
- Firefox 141 対応。
- バグ修正と改良。

[**Version 2.6**](https://github.com/Merci-chao/userChrome.js/raw/8482a3baaa85b59ac68fbbd604d98cc36e5480a0/MultiTabRows@Merci.chao.uc.js)
- 音声再生・ミュートなどが行われているタブがある場合のレイアウトの問題を修正。
- UI 密度が「Touch」の場合のレイアウト問題を修正。

[**Version 2.5.1**](https://github.com/Merci-chao/userChrome.js/raw/29c6c200b979bde17232b9eb231c0b2cc57b8d69/MultiTabRows@Merci.chao.uc.js)
- 前バージョン以降、タブ以外の要素をタブバーにドロップできないバグを修正。

[**Version 2.5**](https://github.com/Merci-chao/userChrome.js/raw/a3a0b4f574821a9c7b85441f15d8e921c8d87e19/MultiTabRows@Merci.chao.uc.js)
- 非連続のタブをドラッグする際の体験を改良。
- バージョンチェック機能を追加。`checkUpdateFrequency` に日数を設定、`checkUpdate` を `0` にすれば無効化可能。

[**Version 2.4**](https://github.com/Merci-chao/userChrome.js/raw/39998cf614f7ba2abd0933e72a0628009afd608c/MultiTabRows@Merci.chao.uc.js)
- Firefox 138 対応。
- タブドラッグアニメーションの改良とバグ修正。

[**Version 2.3.5.1**](https://github.com/Merci-chao/userChrome.js/raw/bcbd6da374d913b17ccb0a59e4d4179d5ab53839/MultiTabRows@Merci.chao.uc.js)
- Firefox 115 でスクリプトが機能しない不具合を修正。

[**Version 2.3.5**](https://github.com/Merci-chao/userChrome.js/raw/1258248ebcfcea275df749bfed7ba3dc1124dc5c/MultiTabRows@Merci.chao.uc.js)
- Firefox 137 対応。

[**Version 2.3.4.2**](https://github.com/Merci-chao/userChrome.js/raw/ea0d771e6e4b0bea68ce81b1e59a16c4710fc34a/MultiTabRows@Merci.chao.uc.js)
- 特定条件下でタブを最初の行にドラッグできないバグを修正。

[**Version 2.3.3**](https://github.com/Merci-chao/userChrome.js/raw/14387581e5fee5898182738e0e37bc53cec6a025/MultiTabRows@Merci.chao.uc.js)
- ウィンドウが非常に狭くなり、1 行のみ表示可能な状態で発生する複数のバグを修正。

[**Version 2.3.2.3**](https://github.com/Merci-chao/userChrome.js/raw/636331c8b2b31f3688c96f5dcba197b0bea599e9/MultiTabRows@Merci.chao.uc.js)
- Firefox 136 対応。

[**Version 2.3.1**](https://github.com/Merci-chao/userChrome.js/raw/c901f71a1b61851e8d1782184a39b75caefe1572/MultiTabRows@Merci.chao.uc.js)
- ネイティブのタブグループ機能に対応。
- ピン留めされたタブを複数移動しつつスクロールする際の視覚的な不具合を修正。

[**Version 2.2**](https://github.com/Merci-chao/userChrome.js/raw/f16a647ba27288eaf6b3aadbed0b5418c1866cbe/MultiTabRows@Merci.chao.uc.js)
- Windows 11 におけるスクロールバーの外観を更新。
- 表示スケーリングが 100% でない場合のレイアウト崩れを修正。
- 特定条件でタブが跳ねるように動くバグを修正。

[**Version 2.1.3.1**](https://github.com/Merci-chao/userChrome.js/raw/af7757559d7549297640572070099897bcf87734/MultiTabRows@Merci.chao.uc.js)
- ピン留めされたタブが多数あると発生する跳ねる挙動の不具合を修正。
- `browser.tabs.groups.enabled` が `true` の場合、`tabsUnderControlButtons` が強制的に `0` になる。

[**Version 2.1.2**](https://github.com/Merci-chao/userChrome.js/raw/1983caf3eee3844a5d0e0a28e95580ef23d128ff/MultiTabRows@Merci.chao.uc.js)
- バージョン 2.1 以降、「1 行のみ表示」時にタブ前のボタンがクリックできないバグを修正。

[**Version 2.1.1**](https://github.com/Merci-chao/userChrome.js/raw/c3f78eee83c336425402eaec9df7e9f8a70508eb/MultiTabRows@Merci.chao.uc.js)
- 特定条件でタブが跳ねるバグを修正。

[**Version 2.1**](https://github.com/Merci-chao/userChrome.js/raw/3f24205a522a586451683d49625c42b897df8bba/MultiTabRows@Merci.chao.uc.js)
- タブを閉じる際の挙動を改良。

[**Version 2.0.1**](https://github.com/Merci-chao/userChrome.js/raw/4893ce6eac6d5df54af6c0eea51561110249a17d/MultiTabRows@Merci.chao.uc.js)
- 設定変更やテーマ変更を複数ウィンドウで行った際に Firefox がフリーズまたはラグが発生する問題を修正。

[**Version 2.0**](https://github.com/Merci-chao/userChrome.js/raw/0ac08cc86ba14d0db05d618163b84892560594f3/MultiTabRows@Merci.chao.uc.js)
- `tabsUnderControlButtons = 2`（デフォルト）を実装。
- 新設定追加：`floatingBackdropClip`, `floatingBackdropBlurriness`, `floatingBackdropOpacity`, `hideEmptyPlaceholderWhenScrolling`
- `scrollbarTrackColor`, `scrollbarThumbColor` のデフォルト値を `auto` に変更。
- 設定が即時適用されるように改良。
- タブのスクロール体験を向上。
- Firefox 134 対応。
- 多数の改良およびバグ修正。

[**Version 1.0**](https://github.com/Merci-chao/userChrome.js/raw/6156d334bffb877a85d8561bb401c620d3209304/MultiTabRows@Merci.chao.uc.js)
- 初期リリース。
  
</details>

## 対応しない互換性問題
- 他のタブ関連スクリプト、スタイル、旧式拡張（例：[Tab Mix Plus](https://onemen.github.io/tabmixplus-docs)）
- Firefox Nightly
- Firefox 116～最新版以前のリリース
- Firefox をベースとしたその他の派生ブラウザー
- タッチ操作 
- macOS
- 垂直タブ（当然）

# [History Submenus II](https://github.com/Merci-chao/userChrome.js/blob/main/HistorySubmenus2@Merci.chao.uc.js)
履歴メニューに、前日分の履歴を表示するサブメニューを追加。  
[アドオンページ（ウェブアーカイブ）](https://web.archive.org/web/20181102024750/https://addons.mozilla.org/en-US/firefox/addon/history-submenus-2/)

![screenshot](https://web.archive.org/web/20181007203210if_/https://addons.cdn.mozilla.net/user-media/previews/full/134/134638.png?modified=1530208752)
![screenshot](https://web.archive.org/web/20181007203207if_/https://addons.cdn.mozilla.net/user-media/previews/full/63/63969.png?modified=1530208752)

## 設定
設定パネルは存在しない。about:config を開いて `extensions.HistorySubmenus2@Merci.chao.` で始まる項目を検索してください。

| 設定項目 | 説明 |
| --- | --- |
| `checkUpdate` | Firefox 起動時や新しいウィンドウを開くたびにスクリプトの新バージョンを確認する。`0` で無効、`1` 以上で有効。値は最後に確認した時刻で更新される。<br><b>💡 有効化を強く推奨。古いスクリプトは新しい Firefox では正常に動作しない可能性がある。</b> |
| `checkUpdateAutoApply` | 新しいバージョンがある場合にスクリプトファイルを自動更新（上書き）：<ul><li>`1`－無効</li><li>`2`－有効</li><li>`3`－有効（通知なし）</li></ul> |
| `checkUpdateFrequency` | 新バージョンの確認頻度（日単位）。最小値は `1`。 |
| `dateFormat` | サブメニューの名前に使用する日付のフォーマット。 |
| `historyCount` | 履歴メニュー内に直接表示される項目数。 |
| `submenuCount` | 履歴サブメニューの数。 |

## 変更履歴
📥 [最新版をダウンロード](https://github.com/Merci-chao/userChrome.js/raw/refs/heads/main/HistorySubmenus2@Merci.chao.uc.js)

[**Version 2026-05-06**](https://github.com/Merci-chao/userChrome.js/raw/a6c1cf1ca95ad2535edac611efdef41a78adeaa3/HistorySubmenus2%40Merci.chao.uc.js)
- 設定の変更が即時に反映されるようになった。
- `security.allow_unsafe_dangerous_privileged_evil_eval` が有効化されていることに依存しなくなった。他のスクリプトで必要ない場合は、`false` にリセットしてください。

[**Version 2026-05-04-1**](https://github.com/Merci-chao/userChrome.js/raw/f2f62fafc822d003c21e826a8cd6f314735154cd/HistorySubmenus2%40Merci.chao.uc.js)
- Firefox 152 への更新。

[**Version 2026-05-04**](https://github.com/Merci-chao/userChrome.js/raw/ed561f60c44227f176847cb224f5f08bf71c5bb5/HistorySubmenus2%40Merci.chao.uc.js)
- 一部のスクリプトローダーとの互換性を改善。

[**Version 2025-08-14**](https://github.com/Merci-chao/userChrome.js/raw/ed74f043645ef8c91211aaf5f593ee2bc536fe0d/HistorySubmenus2%40Merci.chao.uc.js)
- Firefox 143 に対応。
- バージョンチェック機能を追加。

---

# [Page Title in URL Bar](https://github.com/Merci-chao/userChrome.js/blob/main/PageTitle@Merci.chao.uc.js)
アドレスバーにページタイトルを表示。  
[アドオンページ（ウェブアーカイブ）](https://web.archive.org/web/20181101232504/https://addons.mozilla.org/en-US/firefox/addon/page-title/)

![screenshot](https://web.archive.org/web/20181009205610if_/https://addons.cdn.mozilla.net/user-media/previews/full/165/165890.png?modified=1530208887)

## 設定
about:config を開き、`extensions.PageTitle@Merci.chao.` で始まる設定項目を検索してください。

🔔 設定は新しいウィンドウに適用される。

| 設定項目 | 説明 |
| --- | --- |
| `checkUpdate` | Firefox 起動時や新しいウィンドウを開くたびにスクリプトの新バージョンを確認する。`0` で無効、`1` 以上で有効。値は最後に確認した時刻で更新される。<br><b>💡 有効化を強く推奨。古いスクリプトは新しい Firefox では正常に動作しない可能性がある。</b> |
| `checkUpdateAutoApply` | 新しいバージョンがある場合にスクリプトファイルを自動更新（上書き）：<ul><li>`1`－無効</li><li>`2`－有効</li><li>`3`－有効（通知なし）</li></ul> |
| `checkUpdateFrequency` | 新バージョンの確認頻度（日単位）。最小値は `1`。 |
| `decodeHashAndSearch` | ハッシュやクエリ部分をデコード表示。例: `/index.html#hello%20world` → `/index.html#hello world` |
| `formattingEnabled` | ドメインをハイライト表示（`showDomain` が `false` の場合のみ有効）。 |
| `hideWww` | `www` サブドメインを非表示。 |
| `highlightIdentityBox` | ドメイン表示部分（Identity Box）に背景色を追加（`showDomain` が `true` の場合のみ有効）。 |
| `showDomain` | 鍵アイコンの近くにドメインを表示。 |
| `showSubTitle` | ページタイトルの後に URL のパス部分を表示。 |
| `showUnicodeDomain` | ドメインのユニコード文字を表示。 |
| `showUriOnHover` | マウスホバー時に一時的に URL を表示。 |

## 変更履歴
📥 [最新版をダウンロード](https://github.com/Merci-chao/userChrome.js/raw/refs/heads/main/PageTitle@Merci.chao.uc.js)

[**Version 2026-06-17**](https://github.com/Merci-chao/userChrome.js/raw/47d3a4b9c2cbfc539be1112c5d623068b585978b/PageTitle%40Merci.chao.uc.js)
- Firefox 153 への更新。

[**Version 2026-05-04-1**](https://github.com/Merci-chao/userChrome.js/raw/e17abacd2975c2b71b912702f69112c206fdb92f/PageTitle%40Merci.chao.uc.js)
- Firefox 152 への更新。

[**Version 2026-05-04**](https://github.com/Merci-chao/userChrome.js/raw/9a0ee009101ca89dd15188677e51731e7bff79f5/PageTitle%40Merci.chao.uc.js)
- 一部のスクリプトローダーとの互換性を改善。

[**Version 2026-04-16**](https://github.com/Merci-chao/userChrome.js/raw/1d73ef36bd4e4ca88f5106560d66b752ea45bf29/PageTitle%40Merci.chao.uc.js)
- Firefox 151 への更新。

[**Version 2026-01-09**](https://github.com/Merci-chao/userChrome.js/raw/cff7e5f0cc0f930ee3216790876fe8b8da827321/PageTitle%40Merci.chao.uc.js)
- Trust Panel によって軽微なレイアウトの問題を修正。

[**Version 2025-12-16**](https://github.com/Merci-chao/userChrome.js/raw/0a74ea21813d6fb5aa4c24b583c5850ad3fad64c/PageTitle%40Merci.chao.uc.js)
- `showUnicodeDomain` を追加：ドメインのユニコード文字を表示。

[**Version 2025-12-12**](https://github.com/Merci-chao/userChrome.js/raw/dfcd52a73eb79e9e9a7db2b5d2a25872d4c736e7/PageTitle%40Merci.chao.uc.js)
- Trust Panel 機能をサポート。
- アップデートチェック機能を更新。
- `checkUpdateAutoApply` を追加：新しいバージョンがある場合にスクリプトファイルを自動更新（上書き）、`1`－無効、`2`－有効、`3`－有効（通知なし）。

[**Version 2025-11-28**](https://github.com/Merci-chao/userChrome.js/raw/6d6b2481f653efee2432134088713fc70729bf81/PageTitle%40Merci.chao.uc.js)
- Firefox 147 に対応。

[**Version 2025-11-16-01**](https://github.com/Merci-chao/userChrome.js/raw/1a5106bb79819ce02b7b23d58e1e1cff8ace156e/PageTitle%40Merci.chao.uc.js)
- Firefox 147 に対応。

[**Version 2025-09-09**](https://github.com/Merci-chao/userChrome.js/raw/cb188806fef8b365d8761ad2609a59055ac885e6/PageTitle%40Merci.chao.uc.js)
- バージョンチェック機能を追加。

---

# [Semi-Full Screen / ツールバー自動隠し](https://github.com/Merci-chao/userChrome.js/blob/main/SemiFullScreen@Merci.chao.uc.js)
タスクバーを残したまま全画面表示をしたり、最大化されていない状態でツールバーを非表示にする。
[アドオンページ（ウェブアーカイブ）](https://web.archive.org/web/20181102230042/https://addons.mozilla.org/en-US/firefox/addon/semi-full-screen/)

🚨 **注意：この Semi-Full Screen のバージョンは macOS と Ubuntu（Linux）では未検証である。バグがあり、または動作しない可能性がある。**

![screenshot](https://web.archive.org/web/20181013030904if_/https://addons.cdn.mozilla.net/user-media/previews/full/173/173740.png?modified=1530209326)

## ホットキー

| ホットキー<br>（`⤢`－「全画面表示」ボタン） | 機能 |
| --- | --- |
| `F11` または `⤢` | ツールバーを非表示にしてピクチャインピクチャモードに移行。 |
| `Ctrl`+`F11` または `Ctrl`+`⤢` | ウィンドウを最大化して Semi-Full Screen モードに移行。タスクバーやサイドバーは表示されたまま。 |
| `Shift`+`F11` または `Shift`+`⤢` | 通常の全画面表示モードに移行。 |

## 設定
about:config を開き、`extensions.SemiFullScreen@Merci.chao.` で始まる設定項目を検索してください。

🔔 設定は新しいウィンドウに適用される。

| 設定項目 | 説明 |
| --- | --- |
| `autoHideToolbarDelay` | マウスがウィンドウ端から外れ、ウィンドウ内に戻らなかった場合に、ツールバーを自動的に非表示にするまでの遅延時間（ミリ秒）。 |
| `checkUpdate` | Firefox 起動時や新しいウィンドウを開くたびにスクリプトの新バージョンを確認する。`0` で無効、`1` 以上で有効。値は最後に確認した時刻で更新される。<br><b>💡 有効化を強く推奨。古いスクリプトは新しい Firefox では正常に動作しない可能性がある。</b> |
| `checkUpdateAutoApply` | 新しいバージョンがある場合にスクリプトファイルを自動更新（上書き）：<ul><li>`1`－無効</li><li>`2`－有効</li><li>`3`－有効（通知なし）</li></ul> |
| `checkUpdateFrequency` | 新バージョンの確認頻度（日単位）。最小値は `1`。 |
| `reverse` | `F11` で Semi-Full Screen、`Ctrl + F11` でピクチャインピクチャモードに切り替え。 |

## 変更履歴
📥 [最新版をダウンロード](https://github.com/Merci-chao/userChrome.js/raw/refs/heads/main/SemiFullScreen@Merci.chao.uc.js)

[**Version 2026-05-04**](https://github.com/Merci-chao/userChrome.js/raw/edd0d7a00b737dde1103dd012a23c9683833dae3/SemiFullScreen%40Merci.chao.uc.js)
- 一部のスクリプトローダーとの互換性を改善。

[**Version 2025-08-24**](https://github.com/Merci-chao/userChrome.js/raw/b1a644af37a53705909283b9bfd1459446596a88/SemiFullScreen%40Merci.chao.uc.js)
- Windows 7/8 で欠けていたウィンドウ枠を復元。
- `autoHideToolbarDelay` を追加：マウスがウィンドウ端から外れ、ウィンドウ内に戻らなかった場合に、ツールバーを自動的に非表示にするまでの遅延時間（ミリ秒）。

[**Version 2025-08-20**](https://github.com/Merci-chao/userChrome.js/raw/c9807aa1d1004f9ec3b7c95b6f5ec3979be9a70c/SemiFullScreen%40Merci.chao.uc.js)
- タブバー非表示モードでドラッグ用スペースが隠されない。

[**Version 2025-08-16**](https://github.com/Merci-chao/userChrome.js/raw/47a3bd1a4b2c93fbab83a6917926d71ed535e00a/SemiFullScreen%40Merci.chao.uc.js)
- タブバーの意図しないスペースを修正。
- バージョンチェック機能を追加。

---

# [Float Toolbars in Full Screen](https://github.com/Merci-chao/userChrome.js/blob/main/FloatToolbarsInFullScreen@Merci.chao.uc.js)
全画面表示モードで、ツールバーをページの上にフロートさせ、表示・非表示のたびにページが跳ねるのを防ぐ。  
[アドオンページ（ウェブアーカイブ）](https://web.archive.org/web/20181017035437/https://addons.mozilla.org/en-US/firefox/addon/float-toolbars-in-full-screen/)

**注意: このバージョンは macOS および Ubuntu（Linux）では未検証である。動作に不具合があるか、まったく動作しない可能性があります。**

![screenshot](https://web.archive.org/web/20181012014653if_/https://addons.cdn.mozilla.net/user-media/previews/full/180/180636.png?modified=1530209532)

## 設定
about:config を開いて `extensions.FloatToolbarsInFullScreen@Merci.chao.` で始まる項目を検索してください。

🔔 設定は新しいウィンドウに適用される。

| 設定項目 | 説明 |
| --- | --- |
| `checkUpdate` | Firefox 起動時や新しいウィンドウを開くたびにスクリプトの新バージョンを確認する。`0` で無効、`1` 以上で有効。値は最後に確認した時刻で更新される。<br><b>💡 有効化を強く推奨。古いスクリプトは新しい Firefox では正常に動作しない可能性がある。</b> |
| `checkUpdateAutoApply` | 新しいバージョンがある場合にスクリプトファイルを自動更新（上書き）：<ul><li>`1`－無効</li><li>`2`－有効</li><li>`3`－有効（通知なし）</li></ul> |
| `checkUpdateFrequency` | 新バージョンの確認頻度（日単位）。最小値は `1`。 |

## 変更履歴
📥 [最新版をダウンロード](https://github.com/Merci-chao/userChrome.js/raw/refs/heads/main/FloatToolbarsInFullScreen@Merci.chao.uc.js)

[**Version 2026-05-04**](https://github.com/Merci-chao/userChrome.js/raw/655fe2c483e74d3ec6c68c2055faa9d1ec8fc4c6/FloatToolbarsInFullScreen%40Merci.chao.uc.js)
- 一部のスクリプトローダーとの互換性を改善。

[**Version 2025-08-16**](https://github.com/Merci-chao/userChrome.js/raw/30ece47b652ffa9ec8af996595c3c128c1b4e85d/FloatToolbarsInFullScreen%40Merci.chao.uc.js)
- タブバーが全画面表示時にネイティブのウィンドウスタイルで表示。
- バージョンチェック機能を追加。

---

# [undoCloseTab.uc.js](https://github.com/Merci-chao/userChrome.js/blob/main/undoCloseTab.uc.js)
タブバーの右クリックメニューに「閉じたタブを元に戻す」「最近閉じたタブ」「最近閉じたウィンドウ」「以前のセッションを復元」などの項目を表示。

---

# [lockBookmarksDefaultLocation.uc.js](https://github.com/Merci-chao/userChrome.js/blob/main/lockBookmarksDefaultLocation.uc.js)
新しく追加したブックマークの場所を設定して固定し、Firefox に変えられないようにする。

このスクリプトを適用する前に、アドレスバーのスターボタンをクリックして新しいブックマークを作成し、フォルダーをデフォルトの保存先として設定してください。

---

# [restart-button.uc.js](https://github.com/Merci-chao/userChrome.js/blob/main/restart-button.uc.js)
アプリケーションメニューの「終了」ボタンを中クリックすると Firefox を再起動。

---

# [autoTitleBar@Merci.chao.uc.js](https://github.com/Merci-chao/userChrome.js/blob/main/autoTitleBar%40Merci.chao.uc.js)
ウィンドウの上端にカーソルが到達したときにタイトルバーを表示し、ページコンテンツ上にカーソルがある間は非表示にします。

---

# [showScrollbarInMenus.uc.js](https://github.com/Merci-chao/userChrome.js/blob/main/showScrollbarInMenus.uc.js)
長いメニュー（ブックマークメニューなど）にスクロールバーを表示し、上下の矢印による移動を置き換える。
