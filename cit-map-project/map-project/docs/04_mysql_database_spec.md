# 🗄️ データベース仕様書 (MySQL)

## 1. データベース基盤設計
本システムは、オープンソースのリレーショナルデータベースである **MySQL 8.0** を採用しています。
Spring Boot (Hibernate / Spring Data JPA) の `ddl-auto` 機能を利用せず、本番環境を見据えた堅牢なスキーマ設計に基づき、SQLインジェクション脆弱性のない PreparedStatement 経由で操作されます。

---

## 2. データベース エンジン ＆ 文字コード
*   **データベースエンジン:** `InnoDB` (ACIDトランザクション、行レベルロックを完全サポート)
*   **文字コード (Charset):** `utf8mb4` (絵文字「🌟」などの4バイトUnicode文字を欠落なく保存可能)
*   **照合順序 (Collation):** `utf8mb4_unicode_ci`

---

## 3. テーブル定義 (Schema Definition)

### 3.1 `ratings` テーブル（システム評価）
ユーザーから寄せられた特産品マップシステム全体に対する評価データとコメントを格納するメインテーブルです。

| カラム名 (Column) | データ型 (Type) | 制約 (Constraint) | 説明 (Description) |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | `PRIMARY KEY`, `AUTO_INCREMENT` | 評価データのユニーク識別ID (サロゲートキー) |
| `rating` | `INT` | `NOT NULL` | 星評価数 (1〜5 の整数) |
| `comment` | `VARCHAR(2000)` | `DEFAULT NULL` | ユーザーからの評価コメント（最大2000文字許容） |
| `created_at` | `TIMESTAMP(6)` | `NOT NULL` | 投稿日時 (世界標準時 UTC で絶対時間を保存。マイクロ秒精度) |

*   **セキュリティ観点:** `comment` カラムにはユーザー入力がそのまま格納されますが、フロントエンドでの描画時にHTML特殊文字がエスケープ（無害化）されるため、DB内にスクリプトタグ等が存在しても安全です。

### 3.2 `specialties` テーブル（特産品マスタ）
マップ上にピンとして表示される特産品（店舗、料理など）のマスターデータです。

| カラム名 (Column) | データ型 (Type) | 制約 (Constraint) | 説明 (Description) |
| :--- | :--- | :--- | :--- |
| `id` | `BIGINT` | `PRIMARY KEY`, `AUTO_INCREMENT` | 特産品のユニーク識別ID |
| `prefecture` | `VARCHAR(255)` | `NOT NULL` | 対象の都道府県名（例: 千葉県） |
| `season` | `VARCHAR(255)` | `DEFAULT NULL` | 旬の季節（例: 秋〜冬） |
| `name` | `VARCHAR(255)` | `NOT NULL` | 特産品名（例: 落花生） |
| `description` | `TEXT` | `DEFAULT NULL` | 特産品に関する詳細な説明文 |
| `local_dish` | `TEXT` | `DEFAULT NULL` | 郷土料理やアレンジレシピに関する説明 |
| `image_url` | `TEXT` | `DEFAULT NULL` | 写真画像のURLまたはファイルパス |

---

## 4. セキュリティ ＆ インジェクション対策 (SQL Injection Protection)
本システムにおいて、開発者が生のSQL（Raw SQL）を直接文字列結合して記述する箇所は一切存在しません。
*   すべてのクエリは Spring Data JPA が提供するメソッド（例: `repository.save()`, `repository.findAll()`）を通じて実行されます。
*   背後でJDBCの **`PreparedStatement` (プレースホルダ方式)** に自動変換されるため、ユーザーがコメント欄に `' OR '1'='1` などの攻撃コードを入力しても、純粋な「文字列データ」として扱われ、SQL命令として実行される余地はありません。

---

## 5. 今後の正規化・拡張計画 (Future Normalization Plan)
現在立案されている「フェーズ1実用レベルアップデート」において、以下のDB構造拡張が計画されています。

1.  **`users` テーブルの新規作成**: 
    一般ユーザーのアカウント（`id`, `username`, `password(hash)`）を管理。
2.  **外部キー (Foreign Key) の導入**:
    `ratings` テーブルに `user_id` および `specialty_id` を追加し、「どのユーザーが」「どの特産品を」評価したかを厳密に紐付ける **完全な第3正規形（3NF）** へ進化させる予定です。
