# 🛡️ セキュリティ要件および実装手順ガイド

本ドキュメントは、Spring Boot (Java) + Vanilla JS + MySQL で構築された特産品検索Webアプリケーションを一般公開するにあたり、各開発フェーズで必要となるセキュリティ対策と実装手順を定めたものです。

---

## 📖 1. 前提知識：開発者が理解しておくべき用語と概念

セキュリティ対策を実装する上で、以下の概念の理解が必須となります。

*   **XSS (クロスサイトスクリプティング)**: 攻撃者が悪意のあるJavaScriptをコメント欄などに混入させ、他のユーザーのブラウザ上で実行させる攻撃。クッキーの盗難などに繋がる。
*   **CSRF (クロスサイトリクエストフォージェリ)**: ログイン済みのユーザーに罠リンクを踏ませ、意図しない操作（退会や不正書き込みなど）を強制させる攻撃。
*   **SQLインジェクション**: 入力フォームにSQLの断片を入力し、データベースを不正に操作したりデータを盗み出す攻撃。
*   **Bcrypt (ビークリプト)**: パスワードをデータベースに保存する際に用いられる強力なハッシュ関数。「ソルト（ランダムな文字列）」を自動追加するため、同じパスワードでも異なるハッシュ値になり非常に安全。
*   **HttpOnly / Secure 属性**: クッキーの設定値。`HttpOnly`をつけるとJavaScriptからクッキーを読み取れなくなり（XSS対策）、`Secure`をつけるとHTTPS通信時のみクッキーが送信されるようになる。

---

## 🟢 2. フェーズ1（現状の公開: 閲覧・検索・評価メイン）

会員登録がない「誰でも閲覧・評価できる状態」で最低限必須となる対策です。

### 📌 セキュリティ要件
1.  **XSS対策 (エスケープ処理)**: ユーザーが入力した「評価コメント」を画面に表示する際、HTMLタグを無効化する。
2.  **SQLインジェクション対策**: 検索や評価投稿時、文字列結合ではなく必ず **PreparedStatement（プレースホルダ）** を使用する。
3.  **CORS (Cross-Origin Resource Sharing) 制御**: フロントエンドとバックエンドの通信を許可するドメインを厳密に絞る、または Nginx のリバースプロキシを用いて同一オリジンとして扱う。
4.  **レートリミット (Rate Limiting) / スパム対策**: 短時間に大量の評価を投稿したり、AI（Ollama）へ連続リクエストを送るDoS攻撃を防ぐ。

### 🛠️ 実装方針 (現在の環境)
*   **SQLインジェクション**: 現在 `Spring Data JPA` を使用しているため、自動的にPreparedStatementが使われており対策済みです。
*   **XSS**: Vanilla JSでDOMを操作する際、`innerHTML` ではなく `textContent` を使用することで対策可能です（現在もほぼ対策済み）。

---

## 🟡 3. フェーズ2（会員登録・ログイン機能追加）

ユーザーが個人のアカウントを持ち、自分だけのデータ（お気に入り、評価履歴）を管理する際に必須となる対策です。

### 📌 セキュリティ要件
1.  **パスワードの不可逆暗号化**: パスワードは絶対に平文でDBに保存せず、Bcrypt等でハッシュ化する。
2.  **セキュアなセッション・認証管理**: ログイン成功時に発行するセッションIDは推測不可能なUUIDとし、`HttpOnly` および `SameSite=Strict` クッキーに格納する。
3.  **認可 (Authorization) とアクセス制御**: 「他人の評価を削除できない」「自分のお気に入りしか見られない」というサーバー側での厳格な権限チェック。
4.  **CSRF対策**: 状態を変更するAPI (POST, PUT, DELETE) に対して、CSRFトークンの検証を必須とする。

---

## 🔴 4. フェーズ3（堅牢化・本番運用向け）

サービスを大規模に公開し、悪意ある攻撃者からシステムを完全に守るための応用対策です。

### 📌 セキュリティ要件
1.  **完全HTTPS化 (SSL/TLS)**: Let's Encrypt等を利用し、すべての通信を暗号化（中間者攻撃の防止）。
2.  **WAF (Web Application Firewall) の導入**: AWS WAFやCloudflare等を前段に配置し、不審なアクセスを自動ブロック。
3.  **CSP (Content Security Policy) の導入**: 許可したドメイン以外のスクリプトや画像の読み込みをブラウザレベルで禁止するHTTPヘッダーの設定。
4.  **アカウントロック機能**: パスワードの連続入力失敗時にアカウントを一時凍結し、ブルートフォース攻撃を防ぐ。

---

## 💻 5. 実装手順 (フェーズ1・2 をSpring Bootに組み込むステップ)

会員登録とセキュアな認証基盤を構築するためには、**Spring Security** を導入するのが最も確実で標準的な手法です。

### ステップ1: Spring Security の依存関係を追加
`backend/pom.xml` に以下を追加し、プロジェクトをリロードします。
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
```

### ステップ2: ユーザーテーブル（Entity）の作成
`User.java` エンティティを作成し、データベースに `users` テーブルを構築します。
```java
@Entity
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true, nullable = false)
    private String username;
    
    @Column(nullable = false)
    private String password; // ハッシュ化されたパスワードを保存
}
```

### ステップ3: UserDetailsService の実装
Spring Securityに「どのようにDBからユーザーを探すか」を教えるためのサービスを作ります。
```java
@Service
public class CustomUserDetailsService implements UserDetailsService {
    @Autowired private UserRepository userRepository;
    
    @Override
    public UserDetails loadUserByUsername(String username) {
        User user = userRepository.findByUsername(username)
            .orElseThrow(() -> new UsernameNotFoundException("User not found"));
        return new org.springframework.security.core.userdetails.User(
            user.getUsername(), user.getPassword(), new ArrayList<>()
        );
    }
}
```

### ステップ4: セキュリティ設定クラス (`SecurityConfig.java`) の作成
CSRFの有効化、Bcryptの指定、APIごとのアクセス権限を設定します。
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(); // パスワードハッシュ化にBcryptを使用
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            // 閲覧用APIは誰でもアクセス可能、投稿やマイページは認証必須
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.GET, "/api/specialties/**", "/api/ratings/**").permitAll()
                .requestMatchers("/api/route/suggest", "/api/recipe/**").permitAll() // AI機能も公開
                .requestMatchers("/api/auth/**").permitAll() // ログイン・登録API
                .anyRequest().authenticated()
            )
            // CSRF対策: SPA(Vanilla JS)向けにCookieからトークンを発行する設定
            .csrf(csrf -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
            )
            // HTTP基本認証・フォーム認証を無効化し、JSONベースのAPI認証とする
            .httpBasic(AbstractHttpConfigurer::disable)
            .formLogin(AbstractHttpConfigurer::disable);

        return http.build();
    }
}
```

### ステップ5: フロントエンドの対応 (JavaScript)
APIにリクエストを送る際、Cookieにセットされた `XSRF-TOKEN` を読み取り、ヘッダーに付与して送信するロジックを `script.js` に追加します。
```javascript
// CSRFトークンをCookieから取得する関数
function getCsrfToken() {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; XSRF-TOKEN=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
}

// データ送信時のFetch設定例
fetch('/api/ratings', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'X-XSRF-TOKEN': getCsrfToken() // これがないとSpring Securityに弾かれる
    },
    body: JSON.stringify(data)
});
```

このステップに沿って実装することで、現状のシステムを強固な会員制Webアプリケーションへと安全にアップグレードすることが可能です。
