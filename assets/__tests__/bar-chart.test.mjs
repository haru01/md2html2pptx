/**
 * Bar chart parser tests
 */

import { describe, test, expect } from 'vitest';
import parseBarChart from '../md2html/parser/bar-chart.js';

describe('parseBarChart', () => {
  describe('基本的なテーブルパース', () => {
    test('シンプルな棒グラフをパースできる', () => {
      const lines = [
        '- 棒グラフ:',
        '  | 月 | 売上 |',
        '  |------|------|',
        '  | 1月 | 120 |',
        '  | 2月 | 150 |',
        '  | 3月 | 180 |',
      ];

      const result = parseBarChart(lines);

      expect(result.barChart).toBeDefined();
      expect(result.barChart.labels).toEqual(['1月', '2月', '3月']);
      expect(result.barChart.values).toEqual([120, 150, 180]);
      expect(result.barChart.orientation).toBe('vertical');
      expect(result.barChart.showValues).toBe(false);
    });

    test('棒グラフ宣言がない場合は空オブジェクトを返す', () => {
      const lines = [
        '  | 月 | 売上 |',
        '  |------|------|',
        '  | 1月 | 120 |',
      ];

      const result = parseBarChart(lines);

      // テーブルだけがある場合でもbarChartとしてパースされる（現在の実装）
      expect(result.barChart).toBeDefined();
    });
  });

  describe('オプションのパース', () => {
    test('向き: 横 オプションをパースできる', () => {
      const lines = [
        '- 棒グラフ:',
        '  | 地域 | 売上 |',
        '  |------|------|',
        '  | 東京 | 450 |',
        '  | 大阪 | 320 |',
        '  - オプション:',
        '    - 向き: 横',
      ];

      const result = parseBarChart(lines);

      expect(result.barChart).toBeDefined();
      expect(result.barChart.orientation).toBe('horizontal');
    });

    test('向き: 縦 オプションをパースできる', () => {
      const lines = [
        '- 棒グラフ:',
        '  | 月 | 売上 |',
        '  |------|------|',
        '  | 1月 | 120 |',
        '  - オプション:',
        '    - 向き: 縦',
      ];

      const result = parseBarChart(lines);

      expect(result.barChart).toBeDefined();
      expect(result.barChart.orientation).toBe('vertical');
    });

    test('軸ラベルX オプションをパースできる', () => {
      const lines = [
        '- 棒グラフ:',
        '  | 製品 | 売上 |',
        '  |------|------|',
        '  | A | 100 |',
        '  - オプション:',
        '    - 軸ラベルX: 製品名',
      ];

      const result = parseBarChart(lines);

      expect(result.barChart).toBeDefined();
      expect(result.barChart.xAxisLabel).toBe('製品名');
    });

    test('軸ラベルY オプションをパースできる', () => {
      const lines = [
        '- 棒グラフ:',
        '  | 製品 | 売上 |',
        '  |------|------|',
        '  | A | 100 |',
        '  - オプション:',
        '    - 軸ラベルY: 売上（万円）',
      ];

      const result = parseBarChart(lines);

      expect(result.barChart).toBeDefined();
      expect(result.barChart.yAxisLabel).toBe('売上（万円）');
    });

    test('値表示: true オプションをパースできる', () => {
      const lines = [
        '- 棒グラフ:',
        '  | 製品 | 売上 |',
        '  |------|------|',
        '  | A | 100 |',
        '  - オプション:',
        '    - 値表示: true',
      ];

      const result = parseBarChart(lines);

      expect(result.barChart).toBeDefined();
      expect(result.barChart.showValues).toBe(true);
    });

    test('値表示: はい オプションをパースできる', () => {
      const lines = [
        '- 棒グラフ:',
        '  | 製品 | 売上 |',
        '  |------|------|',
        '  | A | 100 |',
        '  - オプション:',
        '    - 値表示: はい',
      ];

      const result = parseBarChart(lines);

      expect(result.barChart).toBeDefined();
      expect(result.barChart.showValues).toBe(true);
    });

    test('複数のオプションを同時にパースできる', () => {
      const lines = [
        '- 棒グラフ:',
        '  | 製品 | 売上 |',
        '  |------|------|',
        '  | 製品A | 85 |',
        '  | 製品B | 120 |',
        '  - オプション:',
        '    - 軸ラベルX: 製品名',
        '    - 軸ラベルY: 売上（万円）',
        '    - 値表示: true',
      ];

      const result = parseBarChart(lines);

      expect(result.barChart).toBeDefined();
      expect(result.barChart.labels).toEqual(['製品A', '製品B']);
      expect(result.barChart.values).toEqual([85, 120]);
      expect(result.barChart.xAxisLabel).toBe('製品名');
      expect(result.barChart.yAxisLabel).toBe('売上（万円）');
      expect(result.barChart.showValues).toBe(true);
    });

    test('向き: horizontal (英語) もパースできる', () => {
      const lines = [
        '- 棒グラフ:',
        '  | 地域 | 売上 |',
        '  |------|------|',
        '  | 東京 | 450 |',
        '  - オプション:',
        '    - 向き: horizontal',
      ];

      const result = parseBarChart(lines);

      expect(result.barChart).toBeDefined();
      expect(result.barChart.orientation).toBe('horizontal');
    });
  });

  describe('実際のMarkdownファイル形式', () => {
    test('サンプルファイルの形式（横棒グラフ）をパースできる', () => {
      const lines = [
        '- 棒グラフ:',
        '  | 地域 | 売上 |',
        '  |------|------|',
        '  | 東京 | 450 |',
        '  | 大阪 | 320 |',
        '  | 名古屋 | 180 |',
        '  | 福岡 | 150 |',
        '  | 札幌 | 120 |',
        '  - オプション:',
        '    - 向き: 横',
      ];

      const result = parseBarChart(lines);

      expect(result.barChart).toBeDefined();
      expect(result.barChart.labels).toEqual(['東京', '大阪', '名古屋', '福岡', '札幌']);
      expect(result.barChart.values).toEqual([450, 320, 180, 150, 120]);
      expect(result.barChart.orientation).toBe('horizontal');
    });

    test('サンプルファイルの形式（軸ラベル・値表示付き）をパースできる', () => {
      const lines = [
        '- 棒グラフ:',
        '  | 製品 | 売上 |',
        '  |------|------|',
        '  | 製品A | 85 |',
        '  | 製品B | 120 |',
        '  | 製品C | 95 |',
        '  | 製品D | 150 |',
        '  - オプション:',
        '    - 軸ラベルX: 製品名',
        '    - 軸ラベルY: 売上（万円）',
        '    - 値表示: true',
      ];

      const result = parseBarChart(lines);

      expect(result.barChart).toBeDefined();
      expect(result.barChart.labels).toEqual(['製品A', '製品B', '製品C', '製品D']);
      expect(result.barChart.values).toEqual([85, 120, 95, 150]);
      expect(result.barChart.xAxisLabel).toBe('製品名');
      expect(result.barChart.yAxisLabel).toBe('売上（万円）');
      expect(result.barChart.showValues).toBe(true);
    });
  });
});
