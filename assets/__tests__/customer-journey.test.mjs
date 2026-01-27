/**
 * Customer Journey parser tests
 * Tests parsing of customer journey data with 4 rows: 行動, タッチポイント, ペイン, ゲイン
 */

import { describe, test, expect } from 'vitest';
import parseCustomerJourney from '../md2html/parser/customer-journey.js';

describe('parseCustomerJourney', () => {
  describe('basic parsing', () => {
    test('parses a simple customer journey with one phase', () => {
      const lines = [
        '### 認知',
        '#### 行動:',
        '- SNSで投稿を閲覧',
        '- 友人から話を聞く',
        '#### タッチポイント:',
        '- Twitter広告',
        '#### ペイン:',
        '- 情報が散らばっている',
        '#### ゲイン:',
        '- 便利そう',
      ];

      const result = parseCustomerJourney(lines);

      expect(result.customerJourneyData).toBeDefined();
      expect(result.customerJourneyData.phases).toEqual(['認知']);
      expect(result.customerJourneyData.rows).toHaveLength(4);
      expect(result.customerJourneyData.rows[0].label).toBe('行動');
      expect(result.customerJourneyData.rows[0].cells[0]).toEqual(['SNSで投稿を閲覧', '友人から話を聞く']);
      expect(result.customerJourneyData.rows[1].label).toBe('タッチポイント');
      expect(result.customerJourneyData.rows[1].cells[0]).toEqual(['Twitter広告']);
      expect(result.customerJourneyData.rows[2].label).toBe('ペイン');
      expect(result.customerJourneyData.rows[2].cells[0]).toEqual(['情報が散らばっている']);
      expect(result.customerJourneyData.rows[3].label).toBe('ゲイン');
      expect(result.customerJourneyData.rows[3].cells[0]).toEqual(['便利そう']);
    });

    test('parses multiple phases', () => {
      const lines = [
        '### 認知',
        '#### 行動:',
        '- SNSで閲覧',
        '#### タッチポイント:',
        '- 広告',
        '#### ペイン:',
        '- 面倒',
        '#### ゲイン:',
        '- 興味',
        '### 情報収集',
        '#### 行動:',
        '- レビュー確認',
        '#### タッチポイント:',
        '- アプリストア',
        '#### ペイン:',
        '- 不安',
        '#### ゲイン:',
        '- 期待',
      ];

      const result = parseCustomerJourney(lines);

      expect(result.customerJourneyData.phases).toEqual(['認知', '情報収集']);
      expect(result.customerJourneyData.rows[0].cells).toHaveLength(2);
      expect(result.customerJourneyData.rows[0].cells[0]).toEqual(['SNSで閲覧']);
      expect(result.customerJourneyData.rows[0].cells[1]).toEqual(['レビュー確認']);
    });

    test('handles empty sections gracefully', () => {
      const lines = [
        '### 認知',
        '#### 行動:',
        '- SNSで閲覧',
        '#### タッチポイント:',
        '#### ペイン:',
        '- 不便',
        '#### ゲイン:',
      ];

      const result = parseCustomerJourney(lines);

      expect(result.customerJourneyData.phases).toEqual(['認知']);
      expect(result.customerJourneyData.rows[0].cells[0]).toEqual(['SNSで閲覧']);
      expect(result.customerJourneyData.rows[1].cells[0]).toEqual([]);
      expect(result.customerJourneyData.rows[2].cells[0]).toEqual(['不便']);
      expect(result.customerJourneyData.rows[3].cells[0]).toEqual([]);
    });

    test('handles missing sections gracefully', () => {
      const lines = [
        '### 認知',
        '#### 行動:',
        '- SNSで閲覧',
        // タッチポイント section missing
        '#### ペイン:',
        '- 困る',
        // ゲイン section missing
      ];

      const result = parseCustomerJourney(lines);

      expect(result.customerJourneyData.phases).toEqual(['認知']);
      expect(result.customerJourneyData.rows[0].cells[0]).toEqual(['SNSで閲覧']);
      expect(result.customerJourneyData.rows[1].cells[0]).toEqual([]);
      expect(result.customerJourneyData.rows[2].cells[0]).toEqual(['困る']);
      expect(result.customerJourneyData.rows[3].cells[0]).toEqual([]);
    });
  });

  describe('row label order', () => {
    test('rows are always in order: 行動, タッチポイント, ペイン, ゲイン', () => {
      const lines = [
        '### フェーズ1',
        '#### ゲイン:',
        '- 最初にゲイン',
        '#### 行動:',
        '- 次に行動',
        '#### ペイン:',
        '- その次にペイン',
        '#### タッチポイント:',
        '- 最後にタッチポイント',
      ];

      const result = parseCustomerJourney(lines);

      expect(result.customerJourneyData.rows[0].label).toBe('行動');
      expect(result.customerJourneyData.rows[1].label).toBe('タッチポイント');
      expect(result.customerJourneyData.rows[2].label).toBe('ペイン');
      expect(result.customerJourneyData.rows[3].label).toBe('ゲイン');
      expect(result.customerJourneyData.rows[0].cells[0]).toEqual(['次に行動']);
      expect(result.customerJourneyData.rows[1].cells[0]).toEqual(['最後にタッチポイント']);
      expect(result.customerJourneyData.rows[2].cells[0]).toEqual(['その次にペイン']);
      expect(result.customerJourneyData.rows[3].cells[0]).toEqual(['最初にゲイン']);
    });
  });

  describe('actual markdown format', () => {
    test('parses sample file format correctly', () => {
      const lines = [
        '### 認知',
        '#### 行動:',
        '- SNSで推し活関連の投稿を閲覧',
        '- 友人から推し活の苦労を聞く',
        '#### タッチポイント:',
        '- Twitter/Instagram広告',
        '- 友人の口コミ',
        '#### ペイン:',
        '- 複数SNS見るの大変',
        '- グッズ情報を見逃して後悔',
        '#### ゲイン:',
        '- 効率的な方法がありそう',
        '### 情報収集',
        '#### 行動:',
        '- アプリストアでレビュー確認',
        '- 公式サイトで機能をチェック',
        '#### タッチポイント:',
        '- アプリストア',
        '- 公式Webサイト',
        '#### ペイン:',
        '- 本当に使いやすいのか不安',
        '#### ゲイン:',
        '- 評判が良さそう',
      ];

      const result = parseCustomerJourney(lines);

      expect(result.customerJourneyData.phases).toEqual(['認知', '情報収集']);
      expect(result.customerJourneyData.rows[0].cells[0]).toHaveLength(2); // 行動: 認知
      expect(result.customerJourneyData.rows[0].cells[1]).toHaveLength(2); // 行動: 情報収集
      expect(result.customerJourneyData.rows[1].cells[0]).toHaveLength(2); // タッチポイント: 認知
      expect(result.customerJourneyData.rows[1].cells[1]).toHaveLength(2); // タッチポイント: 情報収集
      expect(result.customerJourneyData.rows[2].cells[0]).toHaveLength(2); // ペイン: 認知
      expect(result.customerJourneyData.rows[2].cells[1]).toHaveLength(1); // ペイン: 情報収集
      expect(result.customerJourneyData.rows[3].cells[0]).toHaveLength(1); // ゲイン: 認知
      expect(result.customerJourneyData.rows[3].cells[1]).toHaveLength(1); // ゲイン: 情報収集
    });
  });
});
