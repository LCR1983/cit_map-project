# ⚙️ バックエンド 仕様書 (Spring Boot / Java)

## 1. バックエンド アーキテクチャ
本システムのバックエンドは、Java 21 と **Spring Boot 3.2.x** をベースに構築された堅牢な RESTful API サーバーです。
`Controller` ➔ `Service` ➔ `Repository` ➔ `Entity` の標準的な多層レイヤードアーキテクチャを採用し、高い保守性とテスト容易性を確保しています。

---

## 2. コア・コンポーネント (Layered Architecture)

### 2.1 エンドポイント層 (Controllers)
フロントエンド (Nginx) から転送されたHTTPリクエストを処理します。
*   **`RatingController.java`**: 一般公開向けの評価投稿エンドポイント（`POST /api/ratings`）および、管理者向けの評価データ取得（`GET /api/ratings`）、削除（`DELETE /api/ratings/{id}`）を担当。
*   **`AdminController.java`**: 管理者のログイン認証（`POST /api/admin/login`）、ログアウト処理を担当。
*   **`ChatController.java`**: Ollama (Gemma2) へのAIリクエストを中継し、レシピ生成や評価分析レポートの生成処理を担当。

### 2.2 ビジネスロジック層 (Services)
*   **`AdminSessionService.java`**: 管理者のログイン状態をサーバーメモリ（`ConcurrentHashMap`）上で安全に管理。セッションの有効期限チェックや、セッションCookie（`ADMIN_SESSION`）の発行を担う。

### 2.3 データアクセス層 (Repositories & Entities)
*   **`RatingRepository.java`**: Spring Data JPAのインターフェース。メソッド名を定義するだけで背後のHibernateが自動でSQLを生成。
*   **`Rating.java`**: 評価データのエンティティ。`@Entity` アノテーションにより、データベーステーブルとマッピング。

---

## 3. セキュリティ設計 (Security Design)

### 3.1 認証 ＆ セッションハイジャック対策
Spring Security等の重厚なフレームワークに依存せず、軽量かつセキュアな独自セッション管理を実装。
*   ログイン成功時、バックエンドは `UUID.randomUUID()` で生成したセッショントークンを **`HttpOnly`** および **`SameSite=Strict`** 属性を持つ `Set-Cookie` ヘッダーとして発行。
*   これにより、クライアント側の悪意あるJavaScript（XSS）からセッションIDを盗み出されることを完全に防御。

### 3.2 CSRF (クロスサイトリクエストフォージェリ) 防御
全ての書き込み系API（POST, DELETE等）に対して **ダブルサブミットトークン検証** を強制。
*   Cookie内に保存されたセッションから期待されるCSRFトークンと、フロントエンドがリクエストヘッダー（`X-CSRF-Token`）に明示的にセットして送ってきたトークンが**完全一致**するかを検証。
*   不一致の場合は即座に `403 Forbidden` を返却して処理を遮断。

---

## 4. タイムゾーン ＆ 日時管理設計
グローバルに展開可能な「ロケーション・インディペンデント」な設計。
*   **Java側の型:** 日時を扱う変数には `LocalDateTime` ではなく **`java.time.Instant`** を採用。
*   **処理フロー:** 
    1. 評価投稿時、サーバーは `Instant.now()` を呼び出し、現在の絶対時間（UTC）を取得してDBに保存。
    2. APIからJSONを返す際、標準の ISO-8601 形式（例: `2026-05-22T13:49Z` - ZはUTCを表す）でシリアライズ。
    3. クライアント側（ブラウザ）で現地時間に変換して表示。サーバー側では一切のタイムゾーン変換を行わない堅牢な設計。

---

## 5. 外部AI (Ollama / Gemma2) 連携仕様
`ChatController` 内の `RestTemplate` を使用して、ホストOS上で稼働するOllamaサーバーと通信します。

*   **APIエンドポイント:** `POST /api/admin/ratings/analyze`
*   **プロンプトエンジニアリング:**
    バックエンド側で、データベースから全評価レコードを取得し、以下のような強力なコンテキストを動的生成してGemma2に投下。
    ```text
    あなたはプロのデータアナリストです。以下のシステム利用者の評価統計とコメントリストを分析し、
    ①全体サマリー、②ポジティブな意見、③改善点、④AIアドバイス の4セクションのMarkdownを作成してください。
    【統計】平均点: 4.8 / 総評価数: 15件
    【コメント】 ... (DBから抽出した生の声)
    ```
*   これにより、AIに正確な事実データを注入し（RAGの基礎概念）、ハルシネーションを極力抑えた高精度な分析レポートを生成します。
