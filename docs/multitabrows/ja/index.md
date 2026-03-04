# Multi Tab Rows

![screenshot](https://cdn.jsdelivr.net/gh/Merci-chao/userChrome.js@main/screenshots/preview-jp.png)

**Multi Tab Rows**（`MultiTabRows@Merci.chao.uc.js`）は、**Firefox 多段タブ**の包括的な実装であり、`userChrome.js` スクリプトとして開発されています。
クラシックな [MultiRowTabLiteforFx.uc.js（Izheil 氏による改修版）](https://github.com/Izheil/Quantum-Nox-Firefox-Customizations/tree/master/Multirow%20and%20other%20functions/)や多機能な [Tab Mix Plus](https://onemen.github.io/tabmixplus-docs) に着想を得て、最適化された使いやすさを提供し、一番の多段タブを目指しています。

---

## 🧩 互換性
- **Firefox 115 および最新リリース版**に対応
- **Windows 7 から Windows 11** までサポート

---

## 🌟 注目ポイント

### 📐 スペース活用の最適化

Multi Tab Rows はスペースを最大限に活用し、ウィンドウ制御ボタン下の領域まで拡張します。

![ウィンドウ制御ボタン下の領域まで拡張](https://cdn.jsdelivr.net/gh/Merci-chao/userChrome.js@main/screenshots/spaceUsage.ja.png)

クラシックな見た目を好む場合は、タブバーをナビゲーションバーの下に配置することもできます。

![タブバーを下に配置](https://cdn.jsdelivr.net/gh/Merci-chao/userChrome.js@main/screenshots/tabsAtBottom.ja.png)

### 🖱️ ドラッグ＆ドロップ操作

専用のドラッグ＆ドロップ機能により、タブ管理は直感的でスムーズ。インジケーターに頼らず、多段モードでも自然に動作します。

![本格的なドラッグ＆ドロップ](https://cdn.jsdelivr.net/gh/Merci-chao/userChrome.js@main/screenshots/dragging.ja.png)

### 🆕 最新機能のサポート

**タブグループ**や**分割ビュー**を使用していても、Multi Tab Rows は Firefox の最新機能に完全対応。タブや分割ビューをグループ化するドラッグ操作は、従来通りの自然な動作を維持しています。

![ドラッグ＆ドロップでグループ化](https://cdn.jsdelivr.net/gh/Merci-chao/userChrome.js@main/screenshots/grouping.ja.png)

### ✨ 洗練された操作感

Firefox 本来のタブ挙動を改善し、不具合を修正し不足を補うことで、よりスムーズで完成度の高い体験を提供します。すべての操作は、まるで Firefox にネイティブ実装されているかのように自然です。

![ネイティブの Firefox と比較した洗練された操作性](https://cdn.jsdelivr.net/gh/Merci-chao/userChrome.js@main/screenshots/polishedInteractions.ja.png)

### 📌 ピン留めタブのグリッド配置

ピン留めされたタブはコンパクトに整理され、グリッド状に並ぶため、タブバーがスクロール可能になっても簡単にアクセスできます。

![ピン留めタブのグリッド表示](https://cdn.jsdelivr.net/gh/Merci-chao/userChrome.js@main/screenshots/pinnedGrid.ja.png)

通常のタブのようにスクロールで流れる挙動を好む場合は、この機能を無効化してスペースを節約できます。

![ピン留めタブがスクロールに追従](https://cdn.jsdelivr.net/gh/Merci-chao/userChrome.js@main/screenshots/pinnedStatic.ja.png)

### 🛠️ お好きなように調整

デフォルト設定はすでに最適化されており、すぐに使えますが、Multi Tab Rows はタブサイズからレイアウト、操作まで幅広い設定を提供し、お好みに合わせて体験を細かく調整できる。

![豊富なカスタマイズ](https://cdn.jsdelivr.net/gh/Merci-chao/userChrome.js@main/screenshots/customizing.ja.png)

設定一覧を探索して、自分好みにさらにカスタマイズできます。

### 🔄 自動アップデート確認

- 新バージョンの Firefox に切り替えたあと、スクリプトが急に壊れる心配や、更新を探し回る煩わしさはありません。自動アップデート確認機能を備えており、ワンクリックで最新の改善や互換性をゲットできます。より細かくコントロールしたい場合は、手動更新や無効化も可能です。

![アップデート通知](https://cdn.jsdelivr.net/gh/Merci-chao/userChrome.js@main/screenshots/update.ja.png)

### ♾️ 継続的な開発

Multi Tab Rows は熱意と長期的な献身によって開発されています。Firefox 拡張機能開発の豊富な経験に支えられ、今後も適切なメンテナンスを続けていきます。

---

## 👤 開発者について

<img src="https://avatars.githubusercontent.com/u/18614572" alt="Merci chao" width="200">

2007 年以来、私はいくつかの Firefox 拡張機能を開発してきました：
- [Personal Menu](https://web.archive.org/web/20150726222027/https://addons.mozilla.org/en-us/firefox/addon/personal-menu/)
- [Pick & Save Images](https://web.archive.org/web/20161220000058/https://addons.mozilla.org/en-US/firefox/addon/picknsave/)
- [History Submenus II](https://web.archive.org/web/20170424025533/https://addons.mozilla.org/en-US/firefox/addon/history-submenus-2/)

最初の拡張機能 **Personal Menu** はピーク時に **165,000 ユーザー**を超え、10 年間にわたり積極的にメンテナンスされました。他の 2 つのプロジェクトも幸い AMO（addons.mozilla.org）により[おすすめ拡張機能として取り上げられました](https://web.archive.org/web/20170901023746/https://addons.mozilla.org/en-uS/firefox/user/mercichao/)。これらの拡張機能は Quantum 時代（Firefox 57+）を生き延びることはできませんでしたが、その一部の機能は `userChrome.js` を通じて今も生き続けています。[私の GitHub](https://github.com/Merci-chao/userChrome.js/blob/main/README.jp.md) を訪れてご覧ください。

現在の焦点は **Multi Tab Rows** にあり、数千時間を注ぎ込んできました。できる限り続けていきます。

---

## 🚀 今すぐ導入！
📥 [インストール手順](https://github.com/Merci-chao/userChrome.js/blob/main/README.jp.md#注意事項) に従ってダウンロードと導入を行ってください。

（注意事項とインストール手順は長くて細かく書きましたが、きちんと説明して慎重に対応していただきたいので、ご理解くださいね。🙈）

Firefox で **洗練され多段タブ体験**を今日から楽しみましょう。

---

## 🔎 キーワード
- Firefox 多段タブ
- Firefox タブのカスタマイズ
- Multi Tab Rows Firefox
- Firefox ドラッグ＆ドロップ タブ
- Firefox タブ管理
- Firefox 用 userChrome.js スクリプト
