**🌐 [English Version](README.md)**

---

💡🐞 ご提案やバグ報告は[こちら](https://github.com/Merci-chao/userChrome.js/issues/new)にどうぞ。スクリーン録画やスクリーンショットの添付を強く推奨。

---

# [Multi Tab Rows（多段タブ）](https://github.com/Merci-chao/userChrome.js/blob/main/MultiTabRows@Merci.chao.uc.js)
Firefox に多段タブ表示をサポートさせる。

![screenshot](https://cdn.jsdelivr.net/gh/Merci-chao/userChrome.js@main/screenshots/tabsAtBottom.ja.png)

![screenshot](https://cdn.jsdelivr.net/gh/Merci-chao/userChrome.js@main/screenshots/preview-jp.png)

## 紹介
注目ポイントは、スクリーンショットや詳しい説明とともに[紹介ページ](https://merci-chao.github.io/userChrome.js/multitabrows/ja/)にまとめていますので、ぜひご覧ください。

## 互換性
- Firefox 154〜156、ESR（115、140、153）

- Windows 7〜11

- 一般的なスクリプトローダーに対応、例：
	- [MrOtherGuy/fx-autoconfig](https://github.com/MrOtherGuy/fx-autoconfig)
	- [onemen/firefox-scripts](https://onemen.github.io/tabmixplus-docs/other/installation/#install-firefox-scripts)
 	- [alice0775/userChrome.js](https://github.com/alice0775/userChrome.js)
 	- [BSTweaker/UserChromeJS](https://bitbucket.org/BSTweaker/userchromejs/src/master/loader/)
 	- [Endor8/userChrome.js](https://github.com/Endor8/userChrome.js)

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

2. スクリプトローダー（userChrome.js）をインストールする。すでに使用している場合は、手順 3 に進む。使えるスクリプトローダーはいくつかある：
	- [MrOtherGuy/fx-autoconfig](https://github.com/MrOtherGuy/fx-autoconfig) <details><summary>インストール手順</summary><p>📝 注意：これは簡易な参考用の手順なので、正確で詳細な情報は上記の公式ページ（英語）を確認してください。</p><ol><li><p>導入に必要なファイルを[直接リンク（`fx-autoconfig-master.zip`）](https://github.com/MrOtherGuy/fx-autoconfig/archive/refs/heads/master.zip)か上記のページから入手：</p><ul><li>緑の「Code」ボタンをクリック。</li><li>「Download ZIP」を選ぶ。</li></ul></li><li><p>Firefox で [about:support](https://support.mozilla.org/kb/use-troubleshooting-information-page-fix-firefox) を開き、プログラムフォルダーとプロファイルフォルダーを確認：</p><ul><li>「プログラムの実行ファイル」のところで `firefox.exe` の場所を確認（例：`C:\Program Files\Mozilla Firefox`）。</li><li>「プロファイルフォルダー」のところで「フォルダーを開く」をクリック。</li></ul></li><li><p>`fx-autoconfig-master.zip` を展開して、必要なファイルを正しいフォルダーに置く：</p><ul><li>`fx-autoconfig-master\program` から `config.js` と `defaults` をプログラムフォルダーに置く（管理者権限が必要な場合あり）。</li><li>`fx-autoconfig-master\profile` から `chrome` をプロファイルフォルダーに置く。</li></ul></li><li><p>すでにスクリプトを使っている場合：</p><ul><li>選択肢 A：`chrome` フォルダーの `*.uc.js` ファイルを全部 `chrome\JS` サブフォルダーに移動。</li><li>選択肢 B：`chrome\utils\chrome.manifest` を編集して <code>content userscripts <mark>../JS/</mark></code> を <code>content userscripts <mark>../</mark></code> に変更。これで `chrome` フォルダーから直接読み込む。</li></ul></li><li><p>about:support の右上にある「起動時キャッシュを消去...」ボタンをクリックして Firefox を再起動。</p></li><li><p>導入が正しく動いているか確認：</p><ul><li>ツールメニュー（`Alt`+`T`）に userScripts という新しいメニュー項目が追加されているかチェック。</li></ul></li><li><p>さらに、自動更新確認機能を有効： </p><ul><li>[about:config](https://support.mozilla.org/kb/about-config-editor-firefox) を開き、検索ボックスに `userChromeJS.updates.update-check.enabled` を貼り付けて追加ボタン（✚）をクリックし、値を真偽値で `true` に設定して作成。</li></ul></li></ol></details>
	- [onemen/firefox-scripts](https://onemen.github.io/tabmixplus-docs/other/installation/#install-firefox-scripts) <details><summary>インストール手順</summary><p>📝 注意：これは簡易な参考用の手順なので、正確で詳細な情報は上記の公式ページ（英語）を確認してください。</p><ol><li><p>導入に必要なファイルを以下の直接リンクか上記のページから入手：</p><ul><li>[Configuration files（`fx-folder.zip`）](https://github.com/onemen/TabMixPlus/releases/download/dev-build/fx-folder.zip)</li><li>[Utils（`utils.zip`）](https://github.com/onemen/TabMixPlus/releases/download/dev-build/utils.zip)</li></ul></li><li><p>Firefox で [about:support](https://support.mozilla.org/kb/use-troubleshooting-information-page-fix-firefox) を開き、プログラムフォルダーとプロファイルフォルダーを確認：</p><ul><li>「プログラムの実行ファイル」のところで `firefox.exe` の場所を確認（例：`C:\Program Files\Mozilla Firefox`）。</li><li>「プロファイルフォルダー」のところで「フォルダーを開く」をクリック。</li></ul></li><li><p>必要なファイルを正しいフォルダーに展開：</p><ul><li>`fx-folder.zip` を開き、`fx-folder` から `config.js` と `defaults` をプログラムフォルダーに直接展開（管理者権限が必要な場合あり）。</li><li>プロファイルフォルダーに `chrome` フォルダーがなければ作成。</li><li>`chrome` フォルダーに `utils` フォルダーがなければ作成。</li><li>`utils.zip` を開き、すべてのファイルを `utils` フォルダーに直接展開。</li></ul></li><li><p>about:support の右上にある「起動時キャッシュを消去...」ボタンをクリックして Firefox を再起動。</p></li><li><p>導入が正しく動いているか確認：</p><ul><li><p>[about:config](https://support.mozilla.org/kb/about-config-editor-firefox) を開き、`userChromeJS.enabled` を検索。設定が存在し、右側に削除ボタン（🗑️）がないことを確認。もし削除ボタンがある場合はクリックして設定を削除し、Firefox を再起動して再確認。</p></li></ul></li></ol><p>⛔ Tab Mix Plus をインストールすると競合が発生するため導入しないこと。</p></details>
	- [alice0775/userChrome.js](https://github.com/alice0775/userChrome.js) <details><summary>インストール手順</summary><p>📝 注意：これは簡易な参考用の手順なので、正確で詳細な情報は上記の公式ページを確認してください。</p><ol><li><p>Firefox で [about:support](https://support.mozilla.org/kb/use-troubleshooting-information-page-fix-firefox) を開き、プログラムフォルダーとプロファイルフォルダーを確認：</p><ul><li>「プログラムの実行ファイル」のところで `firefox.exe` の場所を確認（例：`C:\Program Files\Mozilla Firefox`）。</li><li>「プロファイルフォルダー」のところで「フォルダーを開く」をクリック。</li></ul></li><li><p>[GitHub ページ](https://github.com/alice0775/userChrome.js)を開き、緑の Code ボタンの左にある Go to file 検索ボックスを探すか、`T` キーを押してフォーカス：</p><ul><li>`userChrome.js` と入力して最新バージョン（通常は `xxx/userChrome.js`）を選び、ダウンロードボタンをクリックして保存。<br><img src="https://cdn.jsdelivr.net/gh/Merci-chao/userChrome.js@main/screenshots/github-download-file.png"></li><li>`install_folder` と入力して最新バージョン（通常は `xxx/install_folder`）を選び、`config.js` と `defaults/pref/config-prefs.js` をダウンロード。</li></ul><p>⚠️ コピーして貼り付けやその他の方法で作成すると、誤ったファイルエンコードが発生する可能性がある。</p></li><li><p>必要なファイルをプログラムフォルダーに配置：</p><ul><li>`config.js` をプログラムフォルダーに置く（管理者権限が必要な場合あり）。</li><li>`config-prefs.js` をプログラムフォルダー内の `defaults\pref` サブフォルダーに置く。</li></ul></li><li><p>必要なファイルをプロファイルフォルダーに配置：</p><ul><li>プロファイルフォルダーに `chrome` フォルダーがなければ作成。</li><li>`userChrome.js` を `chrome` フォルダーに置く。</li></ul></li><li><p>about:support の右上にある「起動時キャッシュを消去...」ボタンをクリックして Firefox を再起動。</p></li><li><p>導入が正しく動いているか確認：</p><ul><li><p>`Ctrl`+`Shift`+`J` を押して「ブラウザーコンソール」を開き、「ログ」フィルターを有効にして Filter Output に `getScripts` を入力し、関連ログが表示されるか確認。</p><img src="https://cdn.jsdelivr.net/gh/Merci-chao/userChrome.js@main/screenshots/alice-scriptloader-ja.png"></li></ul></li></ol></details>
 	- [BSTweaker/UserChromeJS](https://bitbucket.org/BSTweaker/userchromejs/src/master/loader/) <details><summary>インストール手順</summary><p>📝 注意：これは簡易な参考用の手順なので、正確で詳細な情報は上記の公式ページを確認してください。</p><ol><li><p>Firefox で [about:support](https://support.mozilla.org/kb/use-troubleshooting-information-page-fix-firefox) を開き、プログラムフォルダーとプロファイルフォルダーを確認：</p><ul><li>「プログラムの実行ファイル」のところで `firefox.exe` の場所を確認（例：`C:\Program Files\Mozilla Firefox`）。</li><li>「プロファイルフォルダー」のところで「フォルダーを開く」をクリック。</li></ul></li><li><p>必要なファイルを準備：</p><ul><li><p>[Bitbucket ページ](https://bitbucket.org/BSTweaker/userchromejs/src/master/loader/)を開き、表示されているソースコードをコピーして `config.js` という名前で保存（UTF-8 BOM なしで保存）。</p><img src="https://cdn.jsdelivr.net/gh/Merci-chao/userChrome.js@main/screenshots/BSTweaker-config-js.png"></li><li><p>`config-prefs.js` という名前のファイルを作成し、以下の内容を記述（UTF-8 BOM なしで保存）：</p><pre>pref("general.config.obscure_value", 0);<br>pref("general.config.filename", "config.js");<br>pref("general.config.sandbox_enabled", false);</pre></li><li><p>[`UserChromeJSLoader.mjs`](https://bitbucket.org/BSTweaker/userchromejs/src/master/loader/UserChromeJSLoader.mjs) をダウンロード：</p><img src="https://cdn.jsdelivr.net/gh/Merci-chao/userChrome.js@main/screenshots/BSTweaker-save-file.ja.png"></li></ul></li><li><p>必要なファイルをプログラムフォルダーに配置：</p><ul><li>`config.js` をプログラムフォルダーに置く（管理者権限が必要な場合あり）。</li><li>`config-prefs.js` をプログラムフォルダー内の `defaults\pref` サブフォルダーに置く。</li></ul></li><li><p>必要なファイルをプロファイルフォルダーに配置：</p><ul><li>プロファイルフォルダーに `chrome` フォルダーがなければ作成。</li><li>`UserChromeJSLoader.mjs` を `chrome` フォルダーに置く。</li></ul></li><li><p>about:support の右上にある「起動時キャッシュを消去...」ボタンをクリックして Firefox を再起動。</p></li><li><p>導入が正しく動いているか確認：</p><ul><li>ツールメニュー（`Alt`+`T`）に UserChromeJSLoader という新しいメニュー項目が追加されていることを確認。</li></ul></li></ol></details>
 	- [Endor8/userChrome.js](https://github.com/Endor8/userChrome.js) <details><summary>インストール手順</summary><p>📝 注意：これは簡易な参考用の手順なので、正確で詳細な情報は上記の公式ページ（ドイツ語）を確認してください。</p><ol><li><p>Firefox で [about:support](https://support.mozilla.org/kb/use-troubleshooting-information-page-fix-firefox) を開き、プログラムフォルダーとプロファイルフォルダーを確認：</p><ul><li>「プログラムの実行ファイル」のところで `firefox.exe` の場所を確認（例：`C:\Program Files\Mozilla Firefox`）。</li><li>「プロファイルフォルダー」のところで「フォルダーを開く」をクリック。</li></ul></li><li><p>[`userChrome.js`](https://github.com/Endor8/userChrome.js/blob/master/userChrome.js) ファイルをダウンロードボタンから保存：</p><img src="https://cdn.jsdelivr.net/gh/Merci-chao/userChrome.js@main/screenshots/github-download-file.png"><p>⚠️ コピーして貼り付けやその他の方法で作成すると、誤ったファイルエンコードが発生する可能性がある。</p></li><li><p>[GitHub ページ](https://github.com/Endor8/userChrome.js) を開き、以下のファイルの最新バージョンを探してダウンロード：</p><ul><li>`config.js`</li><li>`config-prefs.js`</li><li>`userChromeJS\main.js`</li><li>`userChromeJS\utilities.js`</li></ul></li><li><p>必要なファイルをプログラムフォルダーに配置：</p><ul><li>`config.js` をプログラムフォルダーに置く（管理者権限が必要な場合あり）。</li><li>`config-prefs.js` をプログラムフォルダー内の `defaults\pref` サブフォルダーに置く。</li><li>プログラムフォルダーに `userChromeJS` フォルダーがなければ作成。</li><li>`main.js` と `utilities.js` を `userChromeJS` フォルダーに置く。</li></ul></li><li><p>必要なファイルをプロファイルフォルダーに配置：</p><ul><li>プロファイルフォルダーに `chrome` フォルダーがなければ作成。</li><li>`userChrome.js` を `chrome` フォルダーに置く。</li></ul></li><li><p>about:support の右上にある「起動時キャッシュを消去...」ボタンをクリックして Firefox を再起動。</p></li></ol></details>
    <p>どのローダーを使っても、このスクリプトを適用する上で実質的な違いはない。好きなものを選べばいい。特に希望がなければ、更新確認機能を提供する MrOtherGuy/fx-autoconfig を試すことができる。</p>
	<p><strong>🚨 重要：</strong>Firefox のアップデート後にスクリプトローダーが動作しなくなるのは非常によくあるケース。その場合は、使用しているスクリプトローダーの新しいバージョンを上記のページで確認してください。</p>

3. 他のタブ関連スクリプトやカスタマイズスタイルが有効になっていないことを確認してください。念のため、他の `*.uc.js` と `userChrome.css` ファイルを一時的に `chrome` フォルダーから移動する。
   <p>⚠️ <code>userChrome.css</code> のカスタマイズスタイルとの競合による問題が多数報告されており、まずタブやタブバーに関連するすべてのスタイルを削除し、以下の設定でカバーできない場合は、必要に応じて後から書き直すことを強く推奨。</p>

4. 📥 [スクリプトファイル](https://github.com/Merci-chao/userChrome.js/raw/refs/heads/main/MultiTabRows@Merci.chao.uc.js)をダウンロードし（右クリックして保存）、`chrome` フォルダーに配置する（MrOtherGuy/fx-autoconfig 使用時は `chrome\JS` サブフォルダー）。
   <p>⚠️ コピーして貼り付けやその他の方法で作成すると、誤ったファイルエンコードが発生する可能性がある。</p>
   <p>⛔ 保存中または保存後にファイル名を変更しないでください。</p>

5. Firefox を再起動して適用する。

6. 手順 3 で一部のファイルを `chrome` フォルダーの外に移動した場合は、まずこのスクリプトが正常に動作することを確認してください。動作が確認できたら、ファイルを戻してください。もし競合が発生した場合は、そのスクリプトや `userChrome.css` 内のルールを調整してください。お困りの際は、🛟 [こちら](https://github.com/Merci-chao/userChrome.js/issues/new)に情報をご提供ください。

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
| `animateTabMoveShiftKeyToPause` | <p>🔸 **Shift キーでドラッグアニメ一時停止**</p><p>`Shift` キーを押している間、ドラッグ＆ドロップのアニメーションを一時停止して代わりにドロップインジケーターを表示し、他の段の特定アイテムの隣に移動しづらい特別な状況で役立つ。</p> |
| `animateTabMoveUnderLimit` | <p>🔸 **タブ数上限でドラッグアニメ停止**</p><p>表示されているタブ数がこの値に達すると、ドラッグ＆ドロップのアニメーションを無効化し、代わりにドロップインジケーターを表示する。多くのタブでドラッグ操作が重くなる場合は、この値を下げることを検討。もし常にインジケーターを使ってタブを移動したいのであれば、値を `3` 未満に設定することでインジケーターモードを強制的に有効化できる。</p> |
| `animationDuration` | <p>🔸 **アニメーション時間**</p><p>アニメーションの時間（ミリ秒）、値は `0`～`1000`。`0` に設定すると、タブに関連するすべてのアニメーションが無効になる。</p><p>📝 備考：長すぎるとパフォーマンスに影響する可能性がある。</p> |
| `dragStackPreceding` | <p>🔸 **ドラッグ時に前タブもスタック**</p><p>ドラッグしたタブの前の選択したタブをスタックする（[`browser.tabs.dragDrop.multiselectStacking`](#multiselectStacking) を参照）。選択したタブの中央をドラッグすると、後続のタブが意図せず前に移動してしまう問題が発生するため、この設定を無効にすることで回避可能。</p> |
| `dynamicMoveOverThreshold` | <p>🔸 **ドラッグ動作を滑らかに**</p><p>ピン留めやグループ化されたタブのドラッグ時の移動を滑らかにする。Firefox 115 または `browser.tabs.dragDrop.createGroup.enabled` が無効な場合は非対応。</p> |
| `hideDragPreview` | <p>🔸 **ドラッグプレビューを非表示**</p><p>ドラッグ中にカーソルの傍に表示されるドラッグプレビューを非表示：</p><ul><li>`0`－常に表示</li><li>`1`－グループのみ</li><li>`2`－タブのみ</li><li>`3`－両方</li></ul> |
| `hidePinnedDropIndicator` | <p id="hidePinnedDropIndicator">🔸 **ピン留めインジケーター非表示**</p><p>ピン留めされたタブが存在しない場合に、タブをドラッグしてピン留めに変換する際に表示されるインジケーターを非表示。Firefox 115 と 140 では非対応。</p> |
| `hideScrollButtonsWhenDragging` | <p>🔸 **ドラッグ中スクロールボタン非表示**</p><p>ドラッグ中にスクロールボタンを視覚的に非表示。</p> |
| `linesToDragScroll` | <p>🔸 **ドラッグでスクロール段数**</p><p>タブを上端・下端へドラッグしたときのスクロール段数。最小値：`1`。</p> |
| `linesToScroll` | <p>🔸 **ホイールスクロール段数**</p><p>マウスホイール操作によるスクロール段数。最小値：`1`。</p> |
| `previewPanelNoteEditable` | <p>🔸 **プレビュー内ノート編集**</p><p>Firefox のタブノート機能が有効になっている場合、タブプレビューパネルにカーソルを合わせると、内部のノートを編集可能。Firefox 115 と 140 では非対応。</p> |
| `previewPanelShifted` | <p>🔸 **プレビューパネルをシフト**</p><p>多段がある場合にプレビューパネルをシフトし、下の段の項目が使いにくくなる影響を軽減。`previewPanelNoteEditable` が `true` の場合のみタブに影響。Firefox 115 と 140 では非対応。</p><ul><li>`0`－無効</li><li>`1`－グループ用</li><li>`2`－タブ用</li><li>`3`－両方用</li></ul> |
| `previewPanelShiftedAlways` | <p>🔸 **常時プレビューパネルをシフト**</p><p>一段しかない場合でもプレビューパネルをシフト。</p> |
| `scrollButtonsSize` | <p>🔸 **スクロールボタンの高さ**</p><p>ドラッグ中のスクロールボタンの高さ（ピクセル単位）。最小値：`0` だが、表示上は少なくとも 2 デバイスピクセルの高さになる。最大値はタブの高さの半分までに制限される。</p> |

### タブバーレイアウト

| 項目（接頭辞あり） | 説明 |
| ------------- | ------------- |
| `autoCollapse`<span title="実験的な機能">🧪</span> | <p>🔸 **自動折りたたみ**</p><p>ホバーしていない時は、一段に折りたたむ。有効化すると、`tabsUnderControlButtons` と `positionPinnedTabs` は強制的に無効化される。Firefox 115 では `layout.css.has-selector.enabled` を `true` にする必要がある。</p> |
| `autoCollapseDelayCollapsing` | <p>🔸 **折りたたみまでの遅延**</p><p>カーソルが離れてから折りたたむまでの遅延（ミリ秒）。最小値：`0`。</p> |
| `autoCollapseDelayExpanding` | <p>🔸 **展開までの遅延**</p><p>ホバー後に展開されるまでの遅延（ミリ秒）。最小値：`0`。</p> |
| `compactControlButtons` | <p>🔸 **操作ボタンをコンパクト表示**</p><p>ウィンドウ操作ボタンをコンパクトに表示。タイトルバーが非表示のとき、Windows 10 以降で利用可能。メニューバーが表示されているとき、ウェブアプリのみに影響。</p> |
| `controlButtonsAutoHide` | <p>🔸 **操作ボタンを自動非表示**</p><p>ウィンドウの操作ボタンを隠し、カーソルが右上隅に入ったときに表示する：</p><ul><li>`0`－無効</li><li>`1`－最大化ウィンドウのみ</li><li>`2`－すべてのウィンドウ</li></ul><p>タイトルバーが非表示のとき、Windows 10 以降で利用可能。メニューバーが表示されているとき、ウェブアプリのみに影響。</p> |
| `controlButtonsAutoHideTriggerHeight` | <p>🔸 **操作ボタン表示のトリガー高さ**</p><p>操作ボタンの表示トリガー領域の高さ。</p> |
| `hamburgerMenuOnTabBar` | <p>🔸 **スマートウィンドウ時のタブバー上メニューボタン**</p><p>`false` に設定すると、スマートウィンドウ使用時に Firefox のメニューボタン（☰）がナビゲーションツールバーに戻される。`tabsAtBottom` が有効な場合は強制的に無効化される。Firefox 115 と 140 では非対応。</p> |
| `hideAllTabs` | <p>🔸 **タブ一覧ボタンを非表示**</p><p>「タブの一覧を表示」ボタンを非表示。Firefox 115 のみ対応。新バージョンの Firefox では、ボタンを右クリックして「ツールバーから削除」で非表示。</p> |
| `hideEmptyPlaceholderWhenScrolling` | <p>🔸 **スクロール時の空白な浮動領域を非表示**</p><p>左上に何もない場合、タブバーがスクロール可能時にその空白な浮動領域を非表示。`tabsUnderControlButtons` が `2` のときのみ有効。</p> |
| `justifyCenter` | <p>🔸 **タブを中央揃え**</p><p>タブを水平方向に中央揃えする設定：</p><ul><li>`0`－無効</li><li>`1`－一段のみの場合</li><li>`2`－常に有効（タブの閉じ方やグループの折りたたみ動作が若干異なる場合がある）</li></ul> |
| `maxTabRows` | <p>🔸 **表示可能な最大段数**</p><p>表示可能な最大段数。最小値：`1`。</p><p>📝 備考：実際のカウントはウィンドウの幅によって変わり、`rowIncreaseEvery` を参照。</p> |
| `newTabButtonAfterLastTab` | <p>🔸 **最後のタブ後に新規タブボタン**</p><p>「新しいタブ」ボタンを最後のタブの後に配置。無効化されている場合、ツールバーのカスタマイズで指定された位置に従う。</p><p>📝 備考：タブの直後に置かれた場合のみ最後のタブの後に固定される。</p> |
| `positionPinnedTabs` | <p>🔸 **ピン留めタブ固定位置**</p><p>タブバーがスクロール可能な時、ピン留めされたタブを通常タブの前にグリッドとして配置。</p> |
| `privateBrowsingIconOnNavBar` | <p>🔸 **プライベートアイコンをナビバーへ移動**</p><p>プライベートウィンドウアイコンをナビゲーションツールバーに移動。Firefox 115 では非対応。`tabsAtBottom` が有効な場合は強制的に有効化される。</p> |
| `rowIncreaseEvery` | <p>🔸 **幅ごとに段を追加**</p><p>ウィンドウ幅が広がるたびに表示可能な段数が 1 ずつ増える。幅が狭いウィンドウでは、同時に表示可能な段数が少なくなる。最小値 `0` に設定すると、最大段数が常に表示可能になる。</p> |
| `rowStartIncreaseFrom` | <p>🔸 **段増加開始の幅**</p><p>ウィンドウ幅がこの値＋`rowIncreaseEvery` より大きくなったとき、多段表示が可能になる。</p> |
| `smartWindowButtonOnNavBar` | <p>🔸 **スマートウィンドウ切替ボタンをナビバーへ移動**</p><p>クラシックウィンドウ上で、Firefox スマートウィンドウ切り替えボタンをナビゲーションツールバーに移動。`tabsAtBottom` が有効な場合は強制的に有効化される。Firefox 149 から 153 で利用可能。Firefox 154 以降では、カスタマイズツールバーを使ってボタンを直接移動。</p> |
| `spaceAfterTabs` | <p>🔸 **右上スペース**</p><p>ウィンドウ操作ボタンの前にある空白スペース。最小値：`0`。タイトルバーが非表示のとき利用可能。メニューバーが表示されているとき、ウェブアプリのみに影響。</p> |
| `spaceAfterTabsOnMaximizedWindow` | <p>🔸 **最大化時の右上スペース**</p><p>最大化時のウィンドウ操作ボタン前の空白スペース。最小値：`0`。タイトルバーが非表示のとき利用可能。メニューバーが表示されているとき、ウェブアプリのみに影響。</p> |
| `spaceBeforeTabs` | <p>🔸 **左上スペース**</p><p>ウィンドウの左上隅の空白スペース。最小値：`0`。タイトルバーが非表示のとき利用可能。メニューバーが表示されているとき、ウェブアプリのみに影響。</p> |
| `spaceBeforeTabsOnMaximizedWindow` | <p>🔸 **最大化時の左上スペース**</p><p>最大化時のウィンドウの左上隅の空白スペース。最小値：`0`。タイトルバーが非表示のとき利用可能。メニューバーが表示されているとき、ウェブアプリのみに影響。</p> |
| `tabsAtBottom` | <p>🔸 **タブバーの表示位置**</p><p>タブバーの位置を変更：</p><ul><li>`0`－メニューバー下</li><li>`1`－ナビゲーションツールバー下</li><li>`2`－ブックマークツールバー下</li><li>`-1`－ブラウザコンテンツ下</li></ul><p>Firefox 115 では非対応。</p> |
| `tabsbarItemsAlign` | <p>🔸 **タブバー項目の縦位置**</p><p>多段モードでタブバー内の項目（主にボタン）の配置：</p><ul><li>`start`－上</li><li>`center`－中</li><li>`end`－下</li></ul>`tabsUnderControlButtons` が `0` または `1` でタブバーがスクロール可能時のみ有効。 |
| `tabsUnderControlButtons` | <p>🔸 **タブバー全幅使用**</p><p>2 段目からタブバー全体の幅を使用：</p><ul><li>`0`－無効</li><li>`1`－タブバーがスクロール不可能時のみ（旧式オプション、非推奨）</li><li>`2`－常に有効</li></ul> |
| `thinScrollbar` | <p>🔸 **細いスクロールバー**</p><p>タブバーがスクロール可能な時、上下ボタンなしの細いスクロールバーを使用。</p> |

### タブサイズ

📝 備考：デフォルト値より狭く設定するのは推奨されない。Firefox は既定のオプション以上にコンパクトに動作するよう設計されていないため、予期しない不具合が起こる可能性がある。これらの設定は `userChrome.css` のルールで上書きされ、効果がなくなる場合がある。

| 項目（接頭辞あり） | 説明 |
| ------------- | ------------- |
| `gapAfterPinned` | <p>🔸 **ピン留めタブと通常タブの間隔**</p><p>最小値：`0`。</p> |
| `lastRowTabsFlexibe` | <p>🔸 **最後の段のタブ幅伸縮**</p><p>多段がある場合、最後の段のタブ幅を伸縮自在にする。`justifyCenter` が `2` の場合は強制的に有効化される。</p> |
| `pinnedTabsFlexWidth` | <p>🔸 **ピン留めタブを通常幅扱い**</p><p>ピン留めされたタブのサイズを通常のタブと同様に扱う。有効化すると、`positionPinnedTabs` は強制的に無効化される。</p> |
| `pinnedTabsFlexWidthIndicator` | <p>🔸 **ピン留めタブ背景**</p><p>`pinnedTabsFlexWidth` が有効の場合、ピン留めされたタブ上に淡い背景を表示。</p> |
| `tabCornerRadius` | <p>🔸 **タブ角丸半径**</p><p>`-1` に設定すると既定値が適用される。</p> |
| `tabContentHeight` | <p>🔸 **タブ内容部分の高さ**</p><p>最小値：`16`。</p> |
| `tabContentHeightCompact` | <p>🔸 **自動コンパクトでの高さ**</p><p>Firefox 154 以降で Nova の自動ウィンドウ密度機能を有効化した際のコンパクトモードのサイズ。値は通常モードの値に制限される。</p> |
| `tabHorizontalMargin` | <p>🔸 **タブ外側の水平余白**</p><p>最小値：`0`。</p> |
| `tabHorizontalPadding` | <p>🔸 **タブ内側の水平余白**</p><p>最小値：`0`。</p> |
| `tabHorizontalPaddingCompact` | <p>🔸 **自動コンパクトでの水平余白**</p><p>Firefox 154 以降で Nova の自動ウィンドウ密度機能を有効化した際のコンパクトモードのサイズ。値は通常モードの値に制限される。</p> |
| `tabMaxWidth` | <p>🔸 **タブ最大幅**</p><p>タブの最大幅（周囲の余白を含む）。最小幅には `browser.tabs.tabMinWidth` を使用し、実際の最大幅は必ずこの値より小さくなることはない。</p> |
| `tabVerticalMargin` | <p>🔸 **タブ外側の垂直余白**</p><p>最小値：`0`。</p> |
| `tabVerticalMarginCompact` | <p>🔸 **自動コンパクトでの垂直余白**</p><p>Firefox 154 以降で Nova の自動ウィンドウ密度機能を有効化した際のコンパクトモードのサイズ。値は通常モードの値に制限される。</p> |

### 外観

| 項目（接頭辞あり） | 説明 |
| ------------- | ------------- |
| `floatingBackdropBlurriness` | <p>🔸 **浮動領域の背景ぼかし強度**</p><p>タブバーがスクロール可能時に浮動領域の背景ぼかし強度を設定する。`tabsUnderControlButtons` が `2` のときのみ有効。Firefox 115 では、またはぼかし効果が効かない場合には非対応。</p> |
| `floatingBackdropClip` | <p>🔸 **浮動領域の後ろ側を切り取る**</p><p>タブバーがスクロール可能時に、浮動領域が覆う部分をクリップする。`tabsUnderControlButtons` が `2` のときのみ有効。</p> |
| `floatingBackdropOpacity` | <p>🔸 **浮動領域の背景不透明度**</p><p>タブバーがスクロール可能時に浮動領域の背景の不透明度を設定する。`tabsUnderControlButtons` が `2` かつ `floatingBackdropClip` が `false` のとき有効。値は `0`〜`100`。</p> |
| `nativeWindowStyle` | <p>🔸 **ネイティブスタイル表示**</p><p>背景を削除し、ウィンドウのネイティブなシステムスタイルを表示。例えば、Windows 11 の透明効果や [DWMBlurGlass](https://github.com/Maplespe/DWMBlurGlass) などのツールによる視覚効果。Windows 11 で完全な視覚効果を得るには、`widget.windows.mica` を有効にする必要がある場合がある。Windows 10 で DWM ツールを使用していない場合、この設定は `browser.theme.windows.accent-color-in-tabs.enabled` と似た動作をする。また、透過パターンでデザインされたテーマの背景色を除去可能。</p><p>📝 Windows 7 と 8 でテーマを使用している場合、この設定を有効にすると、ウィンドウの操作ボタンがテーマの背景画像に覆われる可能性がある。</p> |
| `nativeWindowStyleToolbarColorOpacity` | <p>🔸 **ツールバー背景色の不透明度**</p><p>ツールバーの背景色と、ナビゲーションツールバーとタブバーの間にある区切り線の不透明度。値は `0`〜`100`。元の色に透明度が含まれている場合、この設定を変更しても不透明度を高めることはできない。タブバーが上部にある場合、または Firefox Nova が有効になっている場合に利用可能。</p> |
| `nativeWindowStyleToolboxGradientOpacity` | <p>🔸 **グラデーション不透明度**</p><p>テーマのグラデーション画像の不透明度。値は `0`〜`100`。元の画像に透明度が含まれている場合、この設定を変更しても不透明度を高めることはできない。ツールバー領域にグラデーション画像を適用するテーマを使用している場合にのみ利用可能（例：Firefox 155+ 用 Nova テーマ）。</p> |
| `nativeWindowStyleURLBarColorOpacity` | <p>🔸 **アドレスバー背景色の不透明度**</p><p>アドレスバーと検索バーの背景色の不透明度。値は `0`〜`100`。元の色に透明度が含まれている場合、この設定を変更しても不透明度を高めることはできない。</p> |
| `scrollbarThumbColor` | <p>🔸 **スクロールバーつまみ色**</p><p>スクロールバーのつまみ部分の色。CSS カラー、変数、`auto` キーワードのいずれか。</p> |
| `scrollbarTrackColor` | <p>🔸 **スクロールバー軌道色**</p><p>スクロールバーの軌道部分の色。CSS カラー、変数、`auto` キーワードのいずれか。</p> |
| `showScrollShadow` | <p>🔸 **スクロール端のシャドウ表示**</p><p>タブバーがスクロール可能な場合、上下の端にシャドウを表示。</p> |
| `themeImageSize` | <p>🔸 **テーマ背景画像サイズ**</p><p>背景画像付きのテーマを使用する場合、その画像のサイズは以下に基づいて決定される：</p><ul><li>`-1`－画像の元のサイズ</li><li>`0`－許可されている最大段数</li><li>`1`－現在のウィンドウ幅で許可されている最大段数</li><li>`2`－現在の段数</li></ul><p>最適な選択は好みとテーマのデザインに依存。画像の高さが段数を収容できるほど十分に大きい場合は、違いはない。</p> |

### その他

| 項目（接頭辞あり） | 説明 |
| ------------- | ------------- |
| `checkUpdate` | <p>🔸 **更新チェック**</p><p>Firefox 起動時や新しいウィンドウを開くたびにスクリプトの新バージョンを確認。`1` で有効化、`0` で無効化。値は最後に確認した時刻（例：`1759911972`）で更新される。`1` にリセットすると、新しいウィンドウで即時チェックが実行される。</p><p>💡 有効化を強く推奨。古いスクリプトは新しい Firefox では正常に動作しない可能性がある。</p><p>📝 備考：Firefox の旧バージョン（115 と 140 を除く）を使用している場合、このスクリプトの更新は通知されない。</p> |
| `checkUpdateAutoApply` | <p>🔸 **更新の自動適用**</p><p>新しいバージョンがある場合にスクリプトファイルを自動更新（上書き）：</p><ul><li>`1`－無効</li><li>`2`－有効</li><li>`3`－有効（通知なし）、通知されない軽微な変更や修正の更新も自動的に受け取り</li></ul> |
| `checkUpdateFrequency` | <p>🔸 **更新チェック頻度**</p><p>新バージョンの確認頻度（日単位）。最小値：`1`。</p> |
| `currentVersion` | <p>🔸 **現在のバージョン**</p><p>現在使用しているバージョン。</p> |
| `debugMode`<span title="使用禁止">⛔</span> | <p>🔸 **デバッグモード**</p><p>一般向けではない。</p> |
| `incompatible` | <p>🔸 **互換性警告**</p><p>この項目は互換性のないバージョンの Firefox を実行している場合にのみ表示される。変更すると、Firefox の起動時に再び互換性警告が表示される。</p> |

### Firefox の組み込み設定
| 項目（接頭辞なし） | 説明 |
| ------------- | ------------- |
| `browser.compactmode.auto.threshold` | <p>🔸 **自動コンパクト閾値**</p><p>コンパクトモードでのタブ段の高さをウィンドウコンテンツの高さで割った比率がこの値を超える場合、コンパクトモードに切り替わる。Firefox 154 以降で Nova の自動ウィンドウ密度機能が有効なときのみ作用。</p><p>📝 高さ以外の要因でも切り替えが発生する。</p> |
| `browser.nova.enabled` | <p>🔸 **Nova デザイン**</p><p>Nova デザイン（開発中）を適用。Firefox 152 以降で利用可能。</p> |
| `browser.tabs.dragDrop.createGroup.delayMS` | <p>🔸 **ドラッグでグループ化遅延**</p><p>ドラッグしてグループ化を開始するま遅延時間（ミリ秒）。Firefox 115 では非対応。</p> |
| `browser.tabs.dragDrop.createGroup.enabled` | <p>🔸 **ドラッグでグループ化**</p><p>タブを他のタブにドロップした際にグループ化。Firefox 140 では、この名前で新しい真偽設定を作成し切り替える。Firefox 115 では非対応。</p> |
| `browser.tabs.dragDrop.dragToPin.enabled` | <p>🔸 **ドラッグでピン留め操作**</p><p>同じウィンドウにドラッグ＆ドロップによるピン留め・外すの動作を有効化。例：タブをピン留めされたタブにドロップするとピン留めされる。この名前で新しい真偽設定を作成し切り替える。</p> |
| `browser.tabs.dragDrop.moveOverThresholdPercent` | <p>🔸 **ドラッグ移動の重なり閾値**</p><p>ドラッグして移動する際に必要な重なりの割合。`100 - n` がグループ化のしきい値を定義する。例えば値が `80` の場合、20% 以上重なればグループ化され、80% 以上重なれば移動される。値は `0`〜`100`。以下の場合は値が `50` に固定される：<ul><li>別の段へ移動する場合</li><li>Firefox 115 を使用している場合</li><li>ドラッグによるグループ化が無効化されている場合</li><li>`dynamicMoveOverThreshold` が有効な特定のシナリオ</li></ul></p> |
| `browser.tabs.dragDrop.multiselectStacking` | <p id="multiselectStacking">🔸 **ドラッグ時のスタッキング**</p><p>タブのドラッグ時にスタッキング（積み重ね）を有効化。この名前で新しい真偽設定を作成し切り替える。</p> |
| `browser.tabs.dragDrop.pinInteractionCue.delayMS` | <p>🔸 **ピン留めインジケーター表示遅延**</p><p><a href="#hidePinnedDropIndicator">ピン留めインジケーター</a>を表示するま遅延時間（ミリ秒）。Firefox 115 と 140 では非対応。</p> |
| `browser.tabs.tabClipWidth` | <p>🔸 **閉じるボタン表示幅**</p><p>このサイズを超えるタブには閉じるボタンを表示。変更後、新しいウィンドウで有効になる。値が：<ul><li>`tabMaxWidth` 以上の場合－非選択タブには閉じるボタンを非表示</li><li>`browser.tabs.tabMinWidth` 未満の場合－非選択タブには常に閉じるボタンを表示</li></ul></p> |
| `browser.tabs.tabMinWidth` | <p>🔸 **タブ最小幅**</p><p>通常タブの最小幅（周囲の余白を含む）を指定。最小値：`50`。</p> |
| `browser.theme.windows.accent-color-in-tabs.enabled` | <p>🔸 **アクセントカラー適用**</p><p>Windows 10 のタブバーにシステムのアクセントカラーを適用。</p> |
| `widget.windows.mica` | <p>🔸 **Mica スタイル**</p><p>Windows 11 の透明スタイルを適用。</p> |
| `widget.windows.mica.toplevel-backdrop` | <p>🔸 **Mica 背景効果選択**</p><p>ウィンドウ背景効果の選択肢（Windows 11）：<ul><li>`0`－自動</li><li>`1`－Mica</li><li>`2`－Acrylic</li><li>`3`－Mica Alt</li></ul></p> |

## 変更履歴
📥 [最新版をダウンロード](https://github.com/Merci-chao/userChrome.js/raw/refs/heads/main/MultiTabRows@Merci.chao.uc.js)

<details>
<summary>軽微な更新</summary>

[**Version 4.11.2.1**](https://github.com/Merci-chao/userChrome.js/raw/b8846ab17bd779b41c1b1cf1f20a8dad463b22c5/MultiTabRows@Merci.chao.uc.js)
- Firefox 155 における Nova の軽微な表示上の不具合を修正。
</details>

[**Version 4.11.2**](https://github.com/Merci-chao/userChrome.js/raw/87bb5aed31a006dfe1cfc007db0a532e02b130a3/MultiTabRows@Merci.chao.uc.js)
- Firefox 156 への更新。
- インジケーターを使ってタブを移動する際に発生する軽微な表示上の不具合を修正。

[**Version 4.11.1**](https://github.com/Merci-chao/userChrome.js/raw/45dca2a1c86c8afd1bd857b8bb44ad2054284e1f/MultiTabRows@Merci.chao.uc.js)
- `rowIncreaseEvery` を `0` に設定し、ウィンドウ幅が `rowStartIncreaseFrom` より狭い場合に不正な挙動が発生するリグレッションを修正。
- Firefox 156 への更新。

[**Version 4.11**](https://github.com/Merci-chao/userChrome.js/raw/d3da1d1faa0891d107bad3b9708c342044b5d152/MultiTabRows@Merci.chao.uc.js)
- 追加
	- `nativeWindowStyleToolboxGradientOpacity` を追加：テーマのグラデーション画像の不透明度。ツールバー領域にグラデーション画像を適用するテーマを使用している場合にのみ利用可能（例：Firefox 155+ 用 Nova テーマ）。
	- Windows 7 および 8 で `nativeWindowStyle` を使用できるようにした。
- 改善
	- Firefox 155 への更新。
	- 特殊なケースで、タブを前の行の先頭までドラッグした際の挙動が改善された。
	- アニメーション関連のコードをリファクタリングした。
- 修正
	- 一部の状況で、ピン留めされたタブのサイズが公式デザインと異なっていた。
	- 唯一のはみ出したタブを閉じた後でも、タブバーが意図せずスクロール可能なままになる場合があった。
	- 最後のタブを閉じる際、`prefs.tabsUnderControlButtons` が `2` に設定されていない場合、直前のタブが正しくリサイズされず、閉じるボタンがカーソルの下に残らない場合があった。
	- 新しいタブボタンの角丸半径が制限され、ある時点以降タブと一致しなくなった。
	- タブバーをブラウザコンテンツの下に配置した場合、プレビューパネル内の「ノート追加」ボタンの操作が困難になることがあった。
	- 軽微なアニメーションの不具合。
- 回帰バグ修正
	- タブを閉じた後、カーソルがタブバーから外れると、タブがロックされたサイズを解除しない場合があった。

[**Version 4.10.1**](https://github.com/Merci-chao/userChrome.js/raw/636cb568f5219aa8339a0b0c2a316e6da1c5e551/MultiTabRows@Merci.chao.uc.js)
- `Error.stackTraceLimit` が読み取り専用のケースを処理するようにした。

[**Version 4.10**](https://github.com/Merci-chao/userChrome.js/raw/00f690f1d47437e3c31acdc25a18488ad6829931/MultiTabRows@Merci.chao.uc.js)
- 追加
	- `tabCornerRadius` を追加：タブの角丸半径を調整。`-1` に設定すると既定値が適用される。
	- Firefox 154 以降の Nova 自動ウィンドウ密度機能をサポートするために、`tabContentHeightCompact`、`tabHorizontalPaddingCompact`、`tabVerticalMarginCompact` を追加。
- 改修
	- `pinnedTabsFlexWidthIndicator` はデフォルトで `true` となり、垂直タブモードのスタイルに合わせて、ピンアイコンの代わりにタブ上に淡い背景を表示。
	- `hamburgerMenuOnTabBar` を `false` に設定すると、スマートウィンドウ使用時に Firefox のメニューボタンがナビゲーションツールバーに固定されるようになった。
	- `autoCollapseDelayCollapsing`、`floatingBackdropOpacity`、`scrollButtonsSize` のデフォルト値が調整された。
	- `tabsAtBottom` が有効な場合に、`hideEmptyPlaceholderWhenScrolling` を無効化できるようになった。
- 改善
	- `floatingBackdropClip` を有効化した際、浮動領域に角丸が適用されるようになった（Firefox 148+）。
	- Nova への更新。
	- Firefox 153 と 154 への更新。
	- 特定の状況でタブを閉じる、またはグループを折りたたむ際の操作性を改善。
	- ツールバーをカスタマイズする際、タブが 1 段に折りたたまれるようになり、操作性が向上した。
	- 「タブを先頭・末尾へ移動」ショートカットにアニメーションを追加。
	- ピン留めされたタブを右側の空き領域へドラッグすると、ピン留めを外すことができるようになった。
- 修正
	- 複数のタブをウィンドウからドラッグし、別のウィンドウにドロップしなかった場合にタブが消えてしまった。
	- タブをタブバーから垂直にドラッグして分離する際に必要な距離が、公式設計通りに動作しなかった。
	- タブバーをブラウザーコンテンツの下に配置した際、全画面動画の下に余白が表示された。
	- 古いバージョンの Firefox で、コンテナーラインの位置が正しくなかった。
	- `autoCollapse` 関連：
		- Firefox 140 で、アドレスバーが展開されたタブバーを覆ってしまった。
		- 全画面表示モードでタブバーをブラウザーコンテンツの下に配置した際、タブが完全に表示されなかった。
	- レイアウト、アニメーション、ドラッグ＆ドロップに関する軽微な不具合。

- 回帰バグ修正
	- 全画面表示モードでテーマの背景画像が正しく表示されなかった。
	- タブバーがブラウザーコンテンツの下に表示された際、一部テーマが正しく表示されなかった。
	- オーディオボタン関連：
		- `pinnedTabsFlexWidth` を有効化した際、ピン留めされたタブ上の位置が正しくなかった。
		- テーマと併用して `nativeWindowStyle` を有効化した際、背景色が欠落。

## トラブルシューティング
スクリプトが正常に動作しない場合、次を確認してください：

1. 最新版の Firefox を使用しているか確認：
   - Firefox メニュー (☰) をクリック；
   - 「ヘルプと報告 → Firefox について」を選択；
   - バージョンを確認；
   - [最新版](https://www.firefox.com/releases)と一致しているか確認。
   - 一致していなければ[最新版をインストール](https://www.firefox.com)。

2. 最新版のスクリプトローダーを使用しているか確認：
   - 不明なら[インストール手順](#インストール手順)に従って最新版をインストール。
   - どのローダーを使っているか分からない場合は、好みのものを選んで上書きインストール。

3. 最新版の Multi Tab Rows を使用しているか確認：
   - [最新スクリプト](#変更履歴)に更新；
   - Firefox を再起動；
   - about:config を開き、`userChromeJS.multiTabRows@Merci.chao.currentVersion` を検索；
   - バージョン番号が最新版と一致しているか確認。

4. 競合を確認：
   - 全て更新しても直せない場合は、[新しい Firefox プロファイル](https://support.mozilla.org/kb/profile-manager-create-and-remove-firefox-profiles)にスクリプトローダーとスクリプトをインストール。
   - 新しいプロファイルで正常に動作する場合は、`*.us.js` や `userChrome.css` のスタイルが原因か確認。

5. まだ正常に動作しない場合：
   - 新しいプロファイルで問題のスクリーン録画（推奨）またはスクリーンショットを取り、再現手順を[こちら](https://github.com/Merci-chao/userChrome.js/issues/new)に提供。

## 対応しない互換性問題
- 他のタブ関連スクリプト、スタイル、旧式拡張（例：[Tab Mix Plus](https://onemen.github.io/tabmixplus-docs)）
- Firefox Nightly
- 最新リリース版の Firefox の過去バージョン（ESR 版を除く）
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

[**Version 2026-07-14**](https://github.com/Merci-chao/userChrome.js/raw/3d653904e81287d5123e2a8a7ef3c64f9df9a587/PageTitle%40Merci.chao.uc.js)
- Firefox 154 への更新。
- テキストの角が切り取られてしまう不具合を修正。

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

[**Version 2026-07-15**](https://github.com/Merci-chao/userChrome.js/raw/e77f049f86230a54a887ae51af7da26a09ed5361/SemiFullScreen%40Merci.chao.uc.js)
- Firefox 154 への更新。

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

[**Version 2026-07-29**](https://github.com/Merci-chao/userChrome.js/raw/2cf37bc894c58adb320bd02b2b326588c9085fa8/FloatToolbarsInFullScreen%40Merci.chao.uc.js)
- 修正
	- Firefox メニューから全画面表示モードを終了できなかった。
	- Nova を有効にした際にテーマ背景画像が欠落していた。
	- カーソルがブラウザコンテンツ上にあるとき、ツールバーが非表示にならない場合があった。

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

---

# [BookmarksMenuItemIconClickable@Merci.chao.uc.js](https://github.com/Merci-chao/userChrome.js/blob/main/showScrollbarInMenus.uc.js)
ブックマークメニュー内のブックマークアイコンをクリックすると、新しいタブで開き、メニューは開いたままになる。
