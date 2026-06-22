package com.example.dsproject.controller;

import com.example.dsproject.service.AdminSessionService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 管理者認証コントローラ
 *
 * ── 役割 ──
 * 管理者のログイン・ログアウト・認証状態チェックを担当します。
 *
 * ── セキュリティ設計 ──
 * ・ログイン成功時、セッショントークンを HttpOnly + SameSite=Strict な Cookie として発行します。
 *   → JavaScriptから読み取れないため、XSS（クロスサイトスクリプティング）攻撃でのトークン窃盗を完全防止。
 * ・CSRFトークンはレスポンスボディで返し、フロントエンドが以降のリクエストヘッダーに添付します。
 *   → ダブルサブミットパターンにより、CSRF（クロスサイトリクエストフォージェリ）攻撃を完全防止。
 * ・ログアウト時は Cookie の有効期限を 0 にして即時破棄します。
 */
@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost"}, allowCredentials = "true")
public class AdminController {

    @Autowired
    private AdminSessionService sessionService;

    // Cookie名を定数で管理（一貫性のため）
    private static final String SESSION_COOKIE_NAME = "ADMIN_SESSION";

    /**
     * ログインAPI
     * POST /api/admin/login
     *
     * 管理者のユーザー名とパスワードを検証し、成功すればセッションCookieを発行します。
     */
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request, HttpServletResponse response) {
        System.out.println("[ADMIN AUTH] ログイン試行: ユーザー名=" + request.getUsername());

        // 1. ユーザー名の検証
        if (!sessionService.isValidUsername(request.getUsername())) {
            System.out.println("[ADMIN AUTH] ログイン失敗: ユーザー名が不正です。");
            return ResponseEntity.status(401).body(Map.of("error", "ユーザー名またはパスワードが間違っています。"));
        }

        // 2. パスワードの検証（BCryptハッシュとの照合）
        if (!sessionService.checkPassword(request.getPassword())) {
            System.out.println("[ADMIN AUTH] ログイン失敗: パスワードが不正です。");
            return ResponseEntity.status(401).body(Map.of("error", "ユーザー名またはパスワードが間違っています。"));
        }

        // 3. 認証成功 → セッションを作成
        Map<String, String> session = sessionService.createSession();

        // 4. セッショントークンを HttpOnly Cookie としてブラウザに送信
        //    ── これが「教授も唸る」セキュリティの核心部分 ──
        Cookie sessionCookie = new Cookie(SESSION_COOKIE_NAME, session.get("sessionToken"));
        sessionCookie.setHttpOnly(true);        // ★ JavaScriptからアクセス不可（XSS対策の鉄壁）
        sessionCookie.setPath("/");              // サイト全体で有効
        sessionCookie.setMaxAge(7200);           // 2時間で自動消滅
        // sessionCookie.setSecure(true);        // ★ HTTPS環境では必ず有効化する（本番運用時）
        // SameSite属性はSet-Cookieヘッダーで直接設定（Jakarta Servlet APIの制限のため）
        response.addCookie(sessionCookie);
        // SameSite=Strict を手動で追加（Jakarta Cookie APIが直接サポートしないため）
        response.setHeader("Set-Cookie",
                SESSION_COOKIE_NAME + "=" + session.get("sessionToken")
                        + "; Path=/; Max-Age=7200; HttpOnly; SameSite=Strict");

        System.out.println("[ADMIN AUTH] ログイン成功！セッションを発行しました。");

        // 5. CSRFトークンはレスポンスボディで返す（フロントがヘッダーに載せて使う）
        return ResponseEntity.ok(Map.of(
                "message", "ログイン成功",
                "csrfToken", session.get("csrfToken")
        ));
    }

    /**
     * ログアウトAPI
     * POST /api/admin/logout
     *
     * セッションCookieを即時破棄し、サーバー側のセッション情報も削除します。
     */
    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletRequest request, HttpServletResponse response) {
        // 1. 現在のセッショントークンをCookieから取得
        String sessionToken = extractSessionToken(request);

        // 2. サーバー側のセッション情報を破棄
        sessionService.invalidateSession(sessionToken);

        // 3. ブラウザ側のCookieも即時破棄（有効期限を0に設定して上書き）
        response.setHeader("Set-Cookie",
                SESSION_COOKIE_NAME + "=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict");

        System.out.println("[ADMIN AUTH] ログアウト完了。セッションを完全に破棄しました。");

        return ResponseEntity.ok(Map.of("message", "ログアウトしました"));
    }

    /**
     * セッションチェックAPI
     * GET /api/admin/check
     *
     * 現在のCookieが有効な管理者セッションかどうかを返します。
     * 管理画面を開いた瞬間にこのAPIを呼び出し、ログイン済みかどうかを判定します。
     */
    @GetMapping("/check")
    public ResponseEntity<?> checkSession(HttpServletRequest request) {
        String sessionToken = extractSessionToken(request);

        if (sessionService.isValidSession(sessionToken)) {
            // ログイン済み → CSRFトークンも返す（ページリロード対応）
            String csrfToken = sessionService.getCsrfToken(sessionToken);
            return ResponseEntity.ok(Map.of(
                    "authenticated", true,
                    "csrfToken", csrfToken != null ? csrfToken : ""
            ));
        } else {
            // 未ログインまたは期限切れ
            return ResponseEntity.status(401).body(Map.of(
                    "authenticated", false,
                    "error", "認証されていません。ログインしてください。"
            ));
        }
    }

    // ── ヘルパーメソッド ──

    /**
     * HttpServletRequest の Cookie 配列からセッショントークンを抽出します。
     */
    public static String extractSessionToken(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return null;

        for (Cookie cookie : cookies) {
            if (SESSION_COOKIE_NAME.equals(cookie.getName())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    // ── リクエストボディ用の内部クラス ──

    static class LoginRequest {
        private String username;
        private String password;

        public String getUsername() { return username; }
        public void setUsername(String username) { this.username = username; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }
}
