# Daily Block Puzzle — プロジェクトコンテキスト

> このファイルは Claude Code が自動で読み込むプロジェクト指示書です。
> アプリの方針・設計・実装状況を一元管理し、どの端末・セッションでも作業コンテキストを維持します。

---

## アプリコンセプト

| 項目 | 内容 |
|------|------|
| ジャンル | 毎日1回のデイリーブロックパズル |
| ターゲット | 大人・通勤時間・リラックスタイム |
| コアループ | 毎日1〜3問 → 全問クリア → ストリーク継続 |
| 差別化 | 落ち着いた配色・非ゲーム的UI・広告で収益化 |

**ゲームルール（ブレてはいけない核心）**
- 8×8 のボードにピースをすべて配置できれば成功
- 行・列がすべて埋まると消去 → ボーナス得点
- 有効手がなくなると失敗（1回だけ Revival = 最後のピーススキップ、要広告視聴）
- 毎日同じ日付からシードされた同一パズルが配信される（不正防止・グローバル共通体験）

---

## アプリ名（検討中）

現在 `app.json` の `name` は **"Daily Block Puzzle"** だが、AdMob 登録に向け以下の3案を検討中。

| 案 | 名前 | 理由 |
|----|------|------|
| ★ 推奨 | **Block Zen** | 世界観と一致・ASO強・品がある |
| 案2 | **Blokku** | ユニーク・ロゴ映え・固有名詞として強い |
| 案3 | **PieceDay** | 日課感・英語として自然・国際展開向け |

> **決定したら `app.json` の `name` / `slug`、iOS `bundleIdentifier`、Android `package` を更新すること。**

---

## デザイン方針（絶対に変えない）

### 基本姿勢
- **「落ち着いた・大人向け・禅」** — 派手なアニメーション・原色・子供向けUIは NG
- フォントは OS デフォルト（System Font）。カスタムフォント導入の際はセリフ系で温かみのあるものに限定
- アイコン・ボタンは小さめ・余白多め・情報密度を低く保つ

### カラーパレット（`src/theme/index.ts` が唯一の真実）

```
Background  #F5F0E8  ウォームクリーム（全画面の地色）
Surface     #FFFFFF  カード背景
Board BG    #DDD8CF  ボードの地色
Empty Cell  #EDE8DF  空セル
Cell Border #C8C3BA  セル境界

Text Primary   #2C2A26  ほぼ黒（見出し・本文）
Text Secondary #7A756C  グレー（補助情報）
Text Muted     #A8A39A  薄グレー（プレースホルダ等）

ピースカラー（7色・すべてミュートトーン）
  1: #6B8FAB  スレートブルー
  2: #7BA99C  セージグリーン
  3: #B08A6E  ウォームブラウン
  4: #9B7EB8  ミュートパープル
  5: #C97B6A  テラコッタ
  6: #8BAA7A  モスグリーン
  7: #A89060  タン

Accent   #6B8FAB  （スレートブルー＝ハイライト・選択中）
Success  #7BA99C  （セージグリーン）
Error    #C97B6A  （テラコッタ）
Warning  #D4A853  （マスタード）
```

---

## 技術スタック

| レイヤー | 採用技術 | 備考 |
|---------|---------|------|
| フレームワーク | React Native 0.83.2 + Expo ~55 | EAS Build でストア配信 |
| 言語 | TypeScript（strict） | すべて型付き |
| 状態管理 | Zustand ^5 | `src/store/gameStore.ts` |
| ナビゲーション | React Navigation v7（Native Stack） | |
| 永続化 | AsyncStorage ^3 | 進捗・ストリーク・チュートリアルフラグ |
| 広告 | Google Mobile Ads（AdMob）※スタブ実装中 | `src/ads/AdManager.ts` |
| 分析 | Firebase Analytics ※スタブ実装中 | `src/analytics/index.ts` |

---

## ファイル構成

```
AppFromIphone/
├── CLAUDE.md                    ← このファイル
├── app.json                     ← Expo設定（名前・Bundle ID等）
├── index.ts                     ← エントリーポイント
├── assets/
│   ├── icon.png                 ← 1024×1024 ダーク背景アイコン
│   ├── splash-icon.png          ← 1024×1024 スプラッシュ（ライト背景）
│   ├── android-icon-foreground.png
│   └── favicon.png
├── scripts/
│   └── generate-assets.js      ← PNGアセット生成（依存ゼロ）
└── src/
    ├── App.tsx                  ← StatusBar + AppNavigator
    ├── navigation/
    │   └── AppNavigator.tsx     ← 4画面のスタックナビ
    ├── screens/
    │   ├── HomeScreen.tsx       ← ホーム（進捗・スタート）
    │   ├── GameScreen.tsx       ← ゲームプレイ（メイン）
    │   ├── DailyCompleteScreen.tsx ← 全問クリア祝福
    │   └── HowToPlayScreen.tsx  ← チュートリアル
    ├── components/
    │   ├── BoardView.tsx        ← 8×8 インタラクティブグリッド
    │   ├── PieceSelector.tsx    ← ピース選択UI
    │   ├── PiecePreview.tsx     ← ピース形状プレビュー
    │   ├── ScoreBar.tsx         ← スコア・ライン数・問題順表示
    │   └── ResultModal.tsx      ← 成功/失敗オーバーレイ
    ├── game/
    │   ├── board.ts             ← ゲームロジック（配置・消去・判定）
    │   └── pieces.ts            ← ピース形状定義（全22種）
    ├── store/
    │   └── gameStore.ts         ← Zustand ストア（全状態・アクション）
    ├── data/
    │   └── dailyPuzzles.ts      ← 手作りパズルDB + 手続き型ジェネレーター
    ├── theme/
    │   └── index.ts             ← カラー・タイポ・スペーシング（唯一の真実）
    └── utils/
        ├── date.ts              ← 日付フォーマット（日本語対応）
        └── storage.ts           ← AsyncStorage ラッパー
```

---

## ゲームロジック詳細

### ボード
- 8×8 の2次元配列 `number[][]`
- `0` = 空、`1〜7` = ピース色インデックス

### ピース種類（`src/game/pieces.ts`）
- 1マス: DOT
- 2マス: H2, V2
- 3マス: H3, V3, L3, J3, T3
- 4マス: H4, V4, SQ2x2, L4, J4, T4, S4, Z4
- 5マス: PLUS, H5, V5, SQ2x3

### スコア計算
```
配置スコア = ピースのマス数 × 10
ライン消去ボーナス = 消去ライン数 × 100 × 消去数
```

### パズル配信（`src/data/dailyPuzzles.ts`）
- 直近3日分は手作りパズル（2026-03-20〜2026-03-22）
- それ以外は日付文字列をシードにした xorshift32 RNG で手続き生成
- 難易度: EASY（2行2ピース）/ MEDIUM（3行3ピース）/ HARD（4行3-4ピース）

---

## 画面フロー

```
起動
 └─ HomeScreen
     ├─ [初回] HowToPlayScreen（チュートリアル）
     └─ [スタート] GameScreen
         ├─ 成功 → 次のパズル or DailyCompleteScreen
         ├─ 失敗（Revival）→ 広告視聴 → Revival → 継続
         └─ 失敗（リトライ）→ GameScreen 再起動
```

---

## 広告設計（AdMob）

| 広告タイプ | タイミング | 実装状況 |
|-----------|-----------|---------|
| インタースティシャル | パズル間（最終問題以外） | スタブ（1s遅延モック） |
| リワード動画 | Revival（失敗時の救済） | スタブ（1s遅延モック） |

> `src/ads/AdManager.ts` を実際の `react-native-google-mobile-ads` に差し替える。
> AdMob アプリID・広告ユニットIDは環境変数または `app.json` の `extra` に入れること。

---

## 現在の実装状況

### 完了
- [x] 全4画面の UI 実装（Home / Game / DailyComplete / HowToPlay）
- [x] ゲームロジック（配置・消去・失敗判定・Revival）
- [x] Zustand ストア + AsyncStorage 永続化
- [x] デイリーパズルDB（手作り3日分 + 手続き型ジェネレーター）
- [x] ストリーク管理
- [x] チュートリアル（初回のみ表示）
- [x] アイコン・スプラッシュスクリーン（`scripts/generate-assets.js`）
- [x] 広告スタブ実装（モック）

### 未完了（次のタスク候補）
- [ ] アプリ名の最終決定 → `app.json` 更新
- [ ] iOS Bundle ID / Android Package Name の確定
- [ ] AdMob アカウント登録 → 実広告への差し替え
- [ ] Firebase Analytics の実装
- [ ] EAS Build 設定・App Store / Play Store 申請
- [ ] パズルコンテンツの拡充（手作りパズルを増やす）
- [ ] iPad 非対応の確認（`supportsTablet: false` 設定済み）

---

## 開発ルール（この方針を守る）

1. **テーマは `src/theme/index.ts` だけを参照する** — 色・スペーシングをハードコードしない
2. **日本語 UI を維持する** — 英語テキストを UI に混在させない
3. **シンプルに保つ** — 要求されていない機能を追加しない
4. **広告はスタブを差し替える形で実装する** — `AdManager.ts` のインターフェースを変えない
5. **アイコン・スプラッシュを変更したい場合は `scripts/generate-assets.js` を編集し `npm run generate-assets` を実行する**

---

## よく使うコマンド

```bash
npm start                # Expo Go で開発サーバー起動
npm run ios              # iOS シミュレーター起動
npm run android          # Android エミュレーター起動
npm run generate-assets  # アイコン・スプラッシュを再生成
```

---

## Git ブランチ

- 開発ブランチ: `claude/daily-puzzle-mvp-uuGZp`
- Push 先: `origin/claude/daily-puzzle-mvp-uuGZp`
