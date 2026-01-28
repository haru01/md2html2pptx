/**
 * Tests for ! prefix support in slide type declarations
 *
 * The ! prefix is optional for certain slide types to make the syntax
 * consistent with other declarations like !リスト:, !コード:, etc.
 *
 * Supported types:
 * - リーンキャンバス / !リーンキャンバス
 * - ジャベリンボード / !ジャベリンボード
 * - カスタマージャーニー / !カスタマージャーニー
 */

import { describe, test, expect } from 'vitest';
import { parseMarkdown } from '../md2html/parser/index.js';

describe('! prefix support for slide types', () => {
  describe('Lean Canvas', () => {
    test('parses リーンキャンバス without ! prefix', () => {
      const markdown = `## リーンキャンバス: テストタイトル
### 日付:
- 202401
### 課題:
- テスト課題
### ソリューション:
- テスト解決策
### 独自の価値提案:
- テスト価値
### 圧倒的な優位性:
- テスト優位性
### 顧客セグメント:
- テスト顧客
### 主要指標:
- テスト指標
### チャネル:
- テストチャネル
### コスト構造:
- テストコスト
### 収益の流れ:
- テスト収益
`;

      const slides = parseMarkdown(markdown);

      expect(slides).toHaveLength(1);
      expect(slides[0].type).toBe('leanCanvas');
      expect(slides[0].title).toBe('テストタイトル');
    });

    test('parses !リーンキャンバス with ! prefix', () => {
      const markdown = `## テストスライド
- !リーンキャンバス:
### 日付:
- 202401
### 課題:
- テスト課題
### ソリューション:
- テスト解決策
### 独自の価値提案:
- テスト価値
### 圧倒的な優位性:
- テスト優位性
### 顧客セグメント:
- テスト顧客
### 主要指標:
- テスト指標
### チャネル:
- テストチャネル
### コスト構造:
- テストコスト
### 収益の流れ:
- テスト収益
`;

      const slides = parseMarkdown(markdown);

      expect(slides).toHaveLength(1);
      expect(slides[0].type).toBe('leanCanvas');
      expect(slides[0].name).toBe('テストスライド');
    });
  });

  describe('Javelin Board', () => {
    test('parses ジャベリンボード without ! prefix (legacy)', () => {
      const markdown = `## ジャベリンボード: テストボード
- ジャベリンボード:
### 2024-01: テスト実験
#### 顧客の行動仮説:
- テスト行動
#### 課題仮説:
- テスト課題
#### 価値/解決法仮説:
- テスト解決策
#### 前提:
- テスト前提
#### 検証方法と達成基準:
- テスト検証
#### 結果:
- テスト結果
#### 学びと判断:
- 継続
`;

      const slides = parseMarkdown(markdown);

      expect(slides).toHaveLength(1);
      expect(slides[0].type).toBe('javelinBoard');
      expect(slides[0].javelinBoardData).toBeDefined();
      expect(slides[0].javelinBoardData.experiments).toHaveLength(1);
      expect(slides[0].javelinBoardData.experiments[0].label).toBe('2024-01');
      expect(slides[0].javelinBoardData.experiments[0].subtitle).toBe('テスト実験');
    });

    test('parses !ジャベリンボード with ! prefix (new)', () => {
      const markdown = `## テストボード
- !ジャベリンボード:
### 2024-01: 実験1
#### 顧客の行動仮説:
- 行動1
#### 課題仮説:
- 課題1
#### 価値/解決法仮説:
- 解決策1
#### 前提:
- 前提1
#### 検証方法と達成基準:
- 検証1
#### 結果:
- 結果1
#### 学びと判断:
- 継続

### 2024-02: 実験2
#### 顧客の行動仮説:
- 行動2
#### 課題仮説:
- 課題2
#### 価値/解決法仮説:
- 解決策2
#### 前提:
- 前提2
#### 検証方法と達成基準:
- 検証2
#### 結果:
- 結果2
#### 学びと判断:
- ピボット
`;

      const slides = parseMarkdown(markdown);

      expect(slides).toHaveLength(1);
      expect(slides[0].type).toBe('javelinBoard');
      expect(slides[0].name).toBe('テストボード');
      expect(slides[0].javelinBoardData).toBeDefined();
      expect(slides[0].javelinBoardData.experiments).toHaveLength(2);
      expect(slides[0].javelinBoardData.experiments[0].label).toBe('2024-01');
      expect(slides[0].javelinBoardData.experiments[0].subtitle).toBe('実験1');
      expect(slides[0].javelinBoardData.experiments[0].status).toBe('continue');
      expect(slides[0].javelinBoardData.experiments[1].label).toBe('2024-02');
      expect(slides[0].javelinBoardData.experiments[1].subtitle).toBe('実験2');
      expect(slides[0].javelinBoardData.experiments[1].status).toBe('pivot');
    });
  });

  describe('Customer Journey', () => {
    test('parses カスタマージャーニー without ! prefix (legacy)', () => {
      const markdown = `## カスタマージャーニー: テストジャーニー
- カスタマージャーニー:
### 認知
#### 行動:
- SNSで閲覧
#### タッチポイント:
- 広告
#### ペイン:
- 不便
#### ゲイン:
- 興味
`;

      const slides = parseMarkdown(markdown);

      expect(slides).toHaveLength(1);
      expect(slides[0].type).toBe('customerJourney');
      expect(slides[0].customerJourneyData).toBeDefined();
      expect(slides[0].customerJourneyData.phases).toEqual(['認知']);
    });

    test('parses !カスタマージャーニー with ! prefix (new)', () => {
      const markdown = `## テストジャーニー
- !カスタマージャーニー:
### 認知
#### 行動:
- SNSで投稿を閲覧
- 友人から話を聞く
#### タッチポイント:
- SNS広告
- 友人の口コミ
#### ペイン:
- 複数SNS見るの大変
#### ゲイン:
- 効率化できそう

### 検討
#### 行動:
- レビュー確認
- 公式サイトチェック
#### タッチポイント:
- アプリストア
- 公式サイト
#### ペイン:
- 使いやすいか不安
#### ゲイン:
- 評判が良さそう

### 利用
#### 行動:
- 毎日アプリを起動
- 通知を確認
#### タッチポイント:
- アプリ
- プッシュ通知
#### ペイン:
- たまに見逃す
#### ゲイン:
- 便利で満足
`;

      const slides = parseMarkdown(markdown);

      expect(slides).toHaveLength(1);
      expect(slides[0].type).toBe('customerJourney');
      expect(slides[0].name).toBe('テストジャーニー');
      expect(slides[0].customerJourneyData).toBeDefined();
      expect(slides[0].customerJourneyData.phases).toEqual(['認知', '検討', '利用']);
      expect(slides[0].customerJourneyData.rows).toHaveLength(4);
      expect(slides[0].customerJourneyData.rows[0].label).toBe('行動');
      expect(slides[0].customerJourneyData.rows[1].label).toBe('タッチポイント');
      expect(slides[0].customerJourneyData.rows[2].label).toBe('ペイン');
      expect(slides[0].customerJourneyData.rows[3].label).toBe('ゲイン');
    });
  });

  describe('Real-world example from sample.md', () => {
    test('parses customer journey with ! prefix from sample.md', () => {
      const markdown = `## 推し活サポートアプリジャーニ
- !カスタマージャーニー:
### 認知
#### 行動:
- SNSで投稿を閲覧
- 友人から話を聞く
#### タッチポイント:
- SNS広告
- 友人の口コミ
#### ペイン:
- 複数SNS見るの大変
#### ゲイン:
- 効率化できそう

### 検討
#### 行動:
- レビュー確認
- 公式サイトチェック
#### タッチポイント:
- アプリストア
- 公式サイト
#### ペイン:
- 使いやすいか不安
#### ゲイン:
- 評判が良さそう

### 購入/利用
#### 行動:
- 毎日推しの情報をチェック
- グッズを飾ったり身につけたり
- 推しの出演番組を録画・視聴
- ファンコミュニティに参加
- 自分の推し語りを投稿
- 他のファンと交流
#### タッチポイント:
- 公式SNSアカウント
- 推し活専用の部屋・スペース
- 録画機器・配信サービス
- ファンコミュニティ（SNS、掲示板）
- オフ会・ファンミーティング
- ファン同士のDM
#### ペイン:
- 推し活に時間とお金を使いすぎて本業がおろそかに
- 「にわかは黙ってて」と言われて傷つく
#### ゲイン:
- 毎日推しを見られて幸せ 充実感
- 予算と時間を決めて計画的に管理
- 同じ推しの人と繋がれる ワクワク
- 同じペースの仲間や優しい先輩に出会う
`;

      const slides = parseMarkdown(markdown);

      expect(slides).toHaveLength(1);
      expect(slides[0].type).toBe('customerJourney');
      expect(slides[0].name).toBe('推し活サポートアプリジャーニ');
      expect(slides[0].customerJourneyData).toBeDefined();
      expect(slides[0].customerJourneyData.phases).toEqual(['認知', '検討', '購入/利用']);

      // 認知フェーズのデータ確認
      expect(slides[0].customerJourneyData.rows[0].cells[0]).toEqual([
        'SNSで投稿を閲覧',
        '友人から話を聞く'
      ]);

      // 購入/利用フェーズのデータ確認（複数行）
      expect(slides[0].customerJourneyData.rows[0].cells[2]).toHaveLength(6);
      expect(slides[0].customerJourneyData.rows[1].cells[2]).toHaveLength(6);
      expect(slides[0].customerJourneyData.rows[2].cells[2]).toHaveLength(2);
      expect(slides[0].customerJourneyData.rows[3].cells[2]).toHaveLength(4);
    });

    test('parses javelin board with ! prefix from sample.md', () => {
      const markdown = `## 推し活サポートジャベリンボード
- !ジャベリンボード:
### 2024-01: SNS巡回の負担
#### 顧客の行動仮説:
- 推しの情報を毎日チェック
#### 課題仮説:
- 複数SNSの巡回が大変
#### 価値/解決法仮説:
- 一括通知で見逃し防止
#### 前提:
- 3つ以上のSNSを利用
#### 検証方法と達成基準:
- 10人インタビュー、7人共感
#### 結果:
- 8/10人共感
#### 学びと判断:
- 継続

### 2024-02: グッズ購入の機会損失
#### 顧客の行動仮説:
- グッズ購入に月1万円以上
#### 課題仮説:
- 発売日を忘れて買い逃す
#### 価値/解決法仮説:
- カレンダー連携でリマインド
#### 前提:
- スマホカレンダーを利用
#### 検証方法と達成基準:
- MVP提供、継続率50%
#### 結果:
- 継続率65%
#### 学びと判断:
- 継続

### 2024-03: ファン同士の交流場
#### 顧客の行動仮説:
- 同担と情報交換したい
#### 課題仮説:
- 既存SNSでは荒れやすい
#### 価値/解決法仮説:
- クローズドコミュニティ
#### 前提:
- 安全な交流を求めている
#### 検証方法と達成基準:
- β版100人、DAU30%
#### 結果:
- DAU12%、情報共有のみ活発
#### 学びと判断:
- ピボット

### 2024-04: 推し活仲間とのグッズ共有
#### 顧客の行動仮説:
- グッズ情報を仲間と共有したい
#### 課題仮説:
- 個別連絡が手間
#### 価値/解決法仮説:
- グループ共有機能
#### 前提:
- 3人以上の推し活仲間
#### 検証方法と達成基準:
- β版50人、週次投稿率60%
#### 結果:
- 週次投稿率85%、NPS70
#### 学びと判断:
- 本開発へ
`;

      const slides = parseMarkdown(markdown);

      expect(slides).toHaveLength(1);
      expect(slides[0].type).toBe('javelinBoard');
      expect(slides[0].name).toBe('推し活サポートジャベリンボード');
      expect(slides[0].javelinBoardData).toBeDefined();
      expect(slides[0].javelinBoardData.experiments).toHaveLength(4);

      // 各実験の詳細確認
      const exp1 = slides[0].javelinBoardData.experiments[0];
      expect(exp1.label).toBe('2024-01');
      expect(exp1.subtitle).toBe('SNS巡回の負担');
      expect(exp1.customerJob).toBe('推しの情報を毎日チェック');
      expect(exp1.problemHypothesis).toBe('複数SNSの巡回が大変');
      expect(exp1.status).toBe('continue');

      const exp2 = slides[0].javelinBoardData.experiments[1];
      expect(exp2.label).toBe('2024-02');
      expect(exp2.status).toBe('continue');

      const exp3 = slides[0].javelinBoardData.experiments[2];
      expect(exp3.label).toBe('2024-03');
      expect(exp3.status).toBe('pivot');

      const exp4 = slides[0].javelinBoardData.experiments[3];
      expect(exp4.label).toBe('2024-04');
      expect(exp4.subtitle).toBe('推し活仲間とのグッズ共有');
      expect(exp4.status).toBe('develop');
    });
  });
});
