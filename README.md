# Calm Blokku

大人向けの落ち着いたデイリーブロックパズルゲーム。毎日配信されるパズルを解き、ストリークを繋げていく React Native (Expo) アプリ。

---

## コンセプト

| 項目 | 内容 |
|------|------|
| ジャンル | デイリーブロックパズル + エンドレスモード |
| ターゲット | 大人・通勤時間・リラックスタイム |
| コアループ | 毎日1〜3問 → 全問クリア → ストリーク継続 |
| 世界観 | 禅・ミニマル・非ゲーム的UI |
| 収益モデル | AdMob（インタースティシャル + リワード広告） |

---

## ゲームルール

1. **8×8 のボード**上に、あらかじめ一部のセルが埋まった状態でパズルが出題される
2. 与えられた**ピース**をドラッグ＆ドロップでボード上に配置する
3. **行・列がすべて埋まると消去**され、ボーナス得点が加算される
4. すべてのピースを配置できれば**クリア**
5. 有効手がなくなると**失敗**（1回だけ Revival = 広告視聴でリトライ可能）
6. 毎日同じ日付からシードされた**同一パズル**が全ユーザーに配信される

### スコア計算

```
配置スコア = ピースのマス数 × 10
ライン消去ボーナス = 消去ライン数 × 100 × 消去数（コンボ）
```

---

## ゲームモード

### デイリーモード
- 毎日3問（EASY → MEDIUM → HARD）のパズルが配信される
- 全問クリアでストリーク+1
- **過去1週間分**のパズルにも挑戦可能
- カレンダー画面で履歴とユーザーランクを確認

### エンドレスモード
- 失敗するまでパズルを解き続ける
- レベルに応じて難易度が段階的に上昇（初級 → 中級 → 上級 → 達人 → 極）
- ハイスコアと最高到達レベルを記録

| レベル | 難易度 | ターゲット行数 | ピース数 |
|--------|--------|-------------|---------|
| 1-3 | 初級 (easy) | 2行 | 2個 |
| 4-7 | 中級 (medium) | 3行 | 3個 |
| 8-14 | 上級 (hard) | 4行 | 5個 |
| 15-25 | 達人 (expert) | 5行 | 6個 |
| 26+ | 極 (master) | 6行 | 7個 |

---

## 画面構成（8画面）

```
起動
 └─ HomeScreen（ホーム・進捗・過去問題・エンドレス）
     ├─ [初回] HowToPlayScreen（チュートリアル）
     ├─ [デイリー] GameScreen
     │    ├─ 成功 → 次のパズル
     │    ├─ 全問クリア → [広告] → DailyCompleteScreen
     │    ├─ 失敗 → Revival（広告視聴）→ リトライ
     │    └─ 失敗 → リトライ
     ├─ [エンドレス] EndlessGameScreen
     │    ├─ 成功 → 次レベル（難易度変更時はアナウンス表示）
     │    ├─ 失敗 → Revival（広告視聴）→ リトライ
     │    └─ 失敗 → ゲームオーバー画面
     ├─ RecordScreen（カレンダー記録・ランク表示）
     └─ SettingsScreen（バイブレーション・効果音ON/OFF）
```

---

## 広告設計（AdMob）

| 広告タイプ | タイミング | 備考 |
|-----------|-----------|------|
| インタースティシャル | デイリー全問クリア後（DailyComplete 遷移前に1回） | パズル間には挟まず、テンポを維持 |
| リワード動画 | 失敗時の Revival（デイリー・エンドレス共通） | 広告視聴で1回だけリトライ可能 |

- 広告ユニット ID は `app.json` の `extra` フィールドで管理
- 開発時（`__DEV__`）および TestFlight ビルドでは Google テスト広告 ID を自動使用
- 本番ビルドのみ本番 ID を使用
- iOS では ATT（App Tracking Transparency）同意後に SDK を初期化

---

## 技術スタック

| レイヤー | 技術 | バージョン | 備考 |
|---------|------|-----------|------|
| フレームワーク | React Native + Expo | RN 0.83.2 / Expo ~55 | EAS Build でストア配信 |
| 言語 | TypeScript (strict) | ~5.9 | 全ファイル型付き |
| 状態管理 | Zustand | ^5 | セレクターパターンで最適化 |
| ナビゲーション | React Navigation v7 | Native Stack | 8画面スタック |
| 永続化 | AsyncStorage | ^3 | 進捗・ストリーク・設定・パズルキャッシュ |
| 広告 | react-native-google-mobile-ads | ^16 | AdMob（ATT対応・TestFlight対応済み） |
| 音声 | expo-audio | ~55 | 5種類の効果音（WAV生成） |
| トラッキング | expo-tracking-transparency | ~55 | iOS ATT 対応 |
| 分析 | Firebase Analytics | ― | スタブ実装中 |
| テスト | Jest + ts-jest | ^29 | 113テスト |

---

## ディレクトリ構成

```
AppFromIphone/
├── README.md                     ← このファイル
├── CLAUDE.md                     ← Claude Code 用プロジェクト指示書
├── app.json                      ← Expo 設定（Bundle ID・AdMob ID 等）
├── eas.json                      ← EAS Build / Submit 設定
├── jest.config.js                ← Jest テスト設定
├── index.ts                      ← エントリーポイント
├── assets/
│   ├── icon.png                  ← アプリアイコン（1024×1024）
│   ├── splash-icon.png           ← スプラッシュ画面
│   ├── android-icon-foreground.png
│   ├── favicon.png
│   └── sounds/                   ← 効果音 WAV ファイル（5種）
│       ├── place.wav             ← ピース配置音
│       ├── line-clear.wav        ← ライン消去音
│       ├── success.wav           ← クリア音
│       ├── level-up.wav          ← 難易度上昇音
│       └── fail.wav              ← 失敗音
├── scripts/
│   ├── generate-assets.js        ← PNG アセット生成（依存ゼロ）
│   ├── generate-sounds.js        ← WAV 効果音生成（依存ゼロ）
│   └── generate-screenshots.js   ← スクリーンショット生成
└── src/
    ├── App.tsx                   ← StatusBar + AppNavigator + サービス初期化
    ├── navigation/
    │   ├── AppNavigator.tsx      ← 8画面のスタックナビゲーター
    │   └── types.ts              ← RootStackParamList 型定義
    ├── screens/
    │   ├── HomeScreen.tsx        ← ホーム（進捗・過去問題・エンドレス・ATTプロンプト）
    │   ├── GameScreen.tsx        ← デイリーゲームプレイ
    │   ├── EndlessGameScreen.tsx ← エンドレスモード（難易度アップ演出付き）
    │   ├── DailyCompleteScreen.tsx ← 全問クリア祝福画面
    │   ├── RecordScreen.tsx      ← カレンダー記録・ユーザーランク
    │   ├── SettingsScreen.tsx    ← バイブレーション・効果音設定
    │   └── HowToPlayScreen.tsx   ← チュートリアル（初回のみ自動表示）
    ├── ads/
    │   ├── AdManager.ts          ← AdMob 広告管理（ATT連携・テスト/本番ID自動切替）
    │   └── adPolicy.ts           ← 広告表示ポリシー（タイミング制御）
    ├── audio/
    │   └── SoundManager.ts       ← 効果音再生シングルトン（設定連動）
    ├── analytics/
    │   └── index.ts              ← Firebase Analytics スタブ
    ├── privacy/
    │   └── tracking.ts           ← ATT（App Tracking Transparency）管理
    ├── components/
    │   ├── OverlayModal.tsx      ← Animated.View ベースのモーダル（VC競合回避）
    │   ├── BoardView.tsx         ← 8×8 インタラクティブグリッド
    │   ├── PieceSelector.tsx     ← ピース選択・ドラッグ起点 UI
    │   ├── PiecePreview.tsx      ← ピース形状プレビュー
    │   ├── ScoreBar.tsx          ← スコア・ライン消去数・問題順表示
    │   └── ResultModal.tsx       ← 成功/失敗オーバーレイ
    ├── game/
    │   ├── board.ts              ← ゲームロジック（配置・消去・判定）
    │   ├── pieces.ts             ← ピース形状定義（全22種）
    │   └── types.ts              ← Board, Piece, GameState 等の型定義
    ├── store/
    │   └── gameStore.ts          ← Zustand ストア（デイリー + エンドレス全状態）
    ├── data/
    │   └── dailyPuzzles.ts       ← 手作りパズル DB + 手続き型ジェネレーター
    ├── theme/
    │   └── index.ts              ← カラー・タイポ・スペーシング（唯一の真実）
    ├── __tests__/
    │   ├── board.test.ts         ← ボードロジックのユニットテスト
    │   └── dailyPuzzles.test.ts  ← パズル生成・解答可能性テスト
    └── utils/
        ├── date.ts               ← 日付フォーマット（日本語対応）
        └── storage.ts            ← AsyncStorage ラッパー（永続化層）
```

---

## アーキテクチャ概要

### 状態管理（Zustand）

`src/store/gameStore.ts` が全ゲーム状態を一元管理する。各画面は**セレクターパターン**で必要なスライスのみを購読し、不要な再レンダリングを防止。

```
GameStore
├── daily: DailyState          ← 今日のパズル群・進捗・完了状態
├── endless: EndlessState      ← エンドレスモードの現在レベル・スコア
├── currentGame: GameState     ← 現在プレイ中のパズルの盤面・ピース・状態
├── selectedPieceIndex         ← 選択中のピース
├── streak / isLoading / mode
└── Actions
    ├── loadDailyState()       ← 3段キャッシュ（メモリ→AsyncStorage→生成）
    ├── startCurrentPuzzle()   ← パズルからGameState初期化
    ├── placePieceByIndex()    ← 配置→消去→判定→アニメ情報返却
    ├── advanceToNextPuzzle()  ← 次問題 or デイリー完了
    ├── startEndless()         ← エンドレス開始
    ├── advanceEndless()       ← 次レベル生成（非同期・ローディング付き）
    └── endEndlessRun()        ← ハイスコア保存・ゲームオーバー
```

### パズル生成（`src/data/dailyPuzzles.ts`）

1. **手作りパズル**: `PUZZLE_DATABASE` に日付ごとの固定パズルを格納（10日分30問）
2. **手続き型生成**: 手作りパズルがない日付は xorshift32 RNG でシード生成
   - 「満杯の行からピース形状を刳り抜く」アプローチ
   - DFS で解法を検証し、必ず解けるパズルのみを採用
   - 初期状態で行・列が完成済みのパズルは除外
3. **3段キャッシュ**: メモリ → AsyncStorage → 生成（UX改善のため）

### 永続化（`src/utils/storage.ts`）

AsyncStorage をラップし、以下のデータを管理:

| キー | 用途 |
|------|------|
| `daily_progress_{date}` | 日付ごとのパズル進捗 |
| `daily_records` | カレンダー表示用の日別記録 |
| `puzzle_cache_{date}` | 生成済みパズルのキャッシュ |
| `streak` | 連続プレイ記録 |
| `endless_high_score` | エンドレスハイスコア |
| `endless_best_level` | エンドレス最高レベル |
| `app_settings` | バイブレーション・効果音設定 |
| `has_seen_howto` | チュートリアル表示済みフラグ |
| `tracking_prompt_handled` | ATTプロンプト表示済みフラグ |

### 広告（`src/ads/AdManager.ts`）

- ATT（App Tracking Transparency）同意後に AdMob SDK を初期化（iOS 14.5+ 準拠）
- 広告ユニット ID は `app.json` の `extra` フィールドで管理（`expo-constants` で読み取り）
- `__DEV__` または TestFlight ビルド（`EXPO_PUBLIC_APP_VARIANT=testflight`）ではテスト広告 ID を自動使用
- コールバック方式: `onRewardedReadyChange(listener)` で広告準備状態をリアクティブに取得
- `settle()` パターンで広告 VC dismiss 後の安全なコールバック実行を保証

### モーダル（`src/components/OverlayModal.tsx`）

- React Native の `<Modal>` ではなく `Animated.View` ベースのオーバーレイを使用
- ネイティブ `UIViewController` を生成しないため、広告 VC との競合が発生しない
- fade in/out アニメーション + Android BackHandler 対応

### 効果音（`src/audio/SoundManager.ts`）

- `expo-audio` によるシングルトン管理
- WAV ファイルは `scripts/generate-sounds.js` で純粋な PCM 合成（外部依存ゼロ）
- 設定画面の `soundEnabled` に連動し、OFF 時は無音

---

## デザイン方針

### 基本原則
- **「落ち着いた・大人向け・禅」** — 派手なアニメーション・原色・子供向けUI は NG
- フォントは OS デフォルト（System Font）
- 余白多め・情報密度を低く保つ

### カラーパレット

`src/theme/index.ts` が**唯一の真実**。色・スペーシングのハードコード禁止。

| 用途 | カラー | 説明 |
|------|--------|------|
| Background | `#F5F0E8` | ウォームクリーム |
| Surface | `#FFFFFF` | カード背景 |
| Board BG | `#DDD8CF` | ボードの地色 |
| Empty Cell | `#EDE8DF` | 空セル |
| Cell Border | `#C8C3BA` | セル境界 |
| Text Primary | `#2C2A26` | ほぼ黒 |
| Text Secondary | `#7A756C` | グレー |
| Text Muted | `#A8A39A` | 薄グレー |
| Accent | `#6B8FAB` | スレートブルー |
| Success | `#7BA99C` | セージグリーン |
| Error | `#C97B6A` | テラコッタ |
| Warning | `#D4A853` | マスタード |

ピースカラーは7色のミュートトーン:

| # | カラー | 名前 |
|---|--------|------|
| 1 | `#6B8FAB` | スレートブルー |
| 2 | `#7BA99C` | セージグリーン |
| 3 | `#B08A6E` | ウォームブラウン |
| 4 | `#9B7EB8` | ミュートパープル |
| 5 | `#C97B6A` | テラコッタ |
| 6 | `#8BAA7A` | モスグリーン |
| 7 | `#A89060` | タン |

---

## ピース種類（22種）

`src/game/pieces.ts` で定義。各ピースは `[row, col]` オフセット配列。

| サイズ | ピース名 |
|--------|---------|
| 1マス | DOT |
| 2マス | H2, V2 |
| 3マス | H3, V3, L3, J3, T3 |
| 4マス | H4, V4, SQ2x2, L4, J4, T4, S4, Z4 |
| 5マス | PLUS, H5, V5, SQ2x3 |

---

## ユーザーランク（RecordScreen）

カレンダー画面で表示。全クリア日数に応じてランクが上昇。

| ランク | 必要日数 |
|--------|---------|
| 初心者 | 0日 |
| 見習い | 3日 |
| 中級者 | 7日 |
| 上級者 | 15日 |
| 達人 | 30日 |
| 伝説 | 50日 |

---

## 開発コマンド

```bash
# 開発サーバー起動
npm start

# iOS シミュレーター
npm run ios

# Android エミュレーター
npm run android

# アイコン・スプラッシュ再生成
npm run generate-assets

# 効果音再生成
node scripts/generate-sounds.js

# TypeScript 型チェック
npx tsc --noEmit

# ユニットテスト実行（113テスト）
npm test
```

---

## ビルド・配信

### 設定情報

| 項目 | 値 |
|------|-----|
| アプリ名 | Calm Blokku |
| iOS Bundle ID | `com.koya1104.blockzen` |
| EAS Project ID | `b5f508d8-f8b6-4794-9f04-9ce8f12c1b29` |
| AdMob iOS App ID | `ca-app-pub-4570439660764279~5272068272` |
| Apple ID | `kouya114@outlook.jp` |
| ASC App ID | `6761009357` |

### EAS ビルドプロファイル

| プロファイル | 用途 | コマンド |
|-------------|------|---------|
| `preview` | シミュレーター用 | `eas build --profile preview --platform ios` |
| `testflight` | TestFlight 実機テスト（テスト広告ID使用） | `eas build --profile testflight --platform ios` |
| `production` | App Store 提出用（本番広告ID使用） | `eas build --profile production --platform ios` |

### App Store Connect へのアップロード

```bash
# ビルド → アップロード を一括実行
eas build --platform ios --profile production && eas submit --platform ios --profile production
```

### 手順

1. **プロダクションビルド**: `eas build --platform ios --profile production`
   - 初回は Apple Developer アカウント連携が必要
   - 証明書・Provisioning Profile は EAS が自動管理
   - ビルド番号は `autoIncrement: true` で自動増加
2. **App Store Connect 提出**: `eas submit --platform ios --profile production`
3. **TestFlight / 審査提出**: App Store Connect → TestFlight タブ → テスターグループに追加

### TestFlight での広告テスト

```bash
# TestFlight 用ビルド（Google テスト広告ID を使用）
eas build --profile testflight --platform ios
```

TestFlight ビルドでは `EXPO_PUBLIC_APP_VARIANT=testflight` が設定され、Google 公式テスト広告が表示される。

### トラブルシューティング

| 問題 | 対処 |
|------|------|
| `Missing Compliance` 警告 | App Store Connect で「暗号化を使用していない」を選択 |
| ビルド番号の重複 | `eas.json` の `autoIncrement: true` を確認 |
| 証明書エラー | `eas credentials` で証明書を再設定 |
| App 用パスワードが求められる | [appleid.apple.com](https://appleid.apple.com) で生成 |

---

## 実装状況

### 完了
- [x] 全8画面の UI（Home / Game / EndlessGame / DailyComplete / Record / Settings / HowToPlay）
- [x] ゲームロジック（配置・消去・クリア判定・失敗判定・Revival）
- [x] ドラッグ＆ドロップ操作（ゴースト表示・スナップ・アニメーション）
- [x] デイリーパズル（手作り10日分30問 + 手続き型ジェネレーター + DFS 検証）
- [x] エンドレスモード（5段階難易度・難易度変更演出・一時停止/再開・TOP10スコア履歴）
- [x] Zustand ストア + AsyncStorage 永続化 + 3段キャッシュ
- [x] ストリーク管理・カレンダー記録・ユーザーランク
- [x] 過去1週間分パズルへのアクセス
- [x] バイブレーション・効果音（5種WAV）+ 設定画面
- [x] AdMob 統合（インタースティシャル + リワード・ATT対応・TestFlight対応）
- [x] ATT（App Tracking Transparency）プロンプト（許可/スキップ対応）
- [x] チュートリアル（初回のみ自動表示）
- [x] アイコン・スプラッシュスクリーン
- [x] EAS Build + TestFlight 配信
- [x] ユニットテスト（Jest: 113テスト — ボードロジック・パズル生成・解答可能性検証）

### 未完了
- [ ] Firebase Analytics の実装（スタブ → 実装）
- [ ] App Store 本番申請
- [ ] Android 向け AdMob 本番広告ユニット ID の設定（現在はテスト ID）
- [ ] Play Store 申請

---

## 開発ルール

1. **テーマは `src/theme/index.ts` だけを参照** — 色・スペーシングをハードコードしない
2. **日本語 UI を維持** — 英語テキストを UI に混在させない
3. **シンプルに保つ** — 要求されていない機能を追加しない
4. **広告は `AdManager.ts` のインターフェースを守る** — `initialize`, `showRewarded`, `showInterstitial`
5. **アセット変更時はスクリプト実行** — `generate-assets.js` / `generate-sounds.js`
6. **不変性を守る** — オブジェクトは新規生成、既存を直接変更しない
7. **モーダルは `OverlayModal` を使用** — React Native の `<Modal>` はネイティブ VC 競合を起こすため使わない
