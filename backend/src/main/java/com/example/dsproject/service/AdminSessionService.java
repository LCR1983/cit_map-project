package com.example.dsproject.service;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 管理者セッション管理サービス
 *
 * ── 役割 ──
 * ログインに成功した管理者に対して「セッショントークン（身分証明メモ）」を発行し、
 * 以降のリクエストで送られてくるトークンが本物かどうかを検証します。
 *
 * ── セキュリティ設計 ──
 * ・トークンは暗号的に安全な乱数（SecureRandom）で生成します（予測不可能）。
 * ・セッションには有効期限（デフォルト2時間）を設け、期限切れトークンは自動で無効化します。
 * ・パスワードはBCryptハッシュと照合し、平文（そのまま）では一切保存しません。
 * ・CSRFトークンもセッションごとに発行し、ダブルサブミットパターンで検証します。
 */
@Service
public class AdminSessionService {

    // ── 管理者のIDを設定ファイルから読み込みます ──
    @Value("${admin.username:admin}")
    private String adminUsername;

    // ── 平文パスワード（起動時にBCryptハッシュ化されてメモリに保持） ──
    @Value("${admin.password.raw:changeme}")
    private String adminPasswordRaw;

    // ── セッションの有効期限（秒）── デフォルト2時間 = 7200秒
    @Value("${admin.session.timeout:7200}")
    private long sessionTimeoutSeconds;

    // ── BCryptハッシュ化されたパスワード（起動後にメモリ上にのみ存在） ──
    private String adminPasswordHash;

    // ── BCryptエンコーダ（コスト10、業界標準の推奨値） ──
    private final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(10);

    // ── アクティブなセッションを保持するメモリマップ ──
    // Key: セッショントークン, Value: セッション情報
    private final ConcurrentHashMap<String, SessionInfo> activeSessions = new ConcurrentHashMap<>();

    // ── 暗号的に安全な乱数生成器 ──
    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * Spring Boot起動時に自動実行される初期化処理。
     * 平文パスワードをBCryptハッシュに変換してメモリに保持し、
     * 平文のパスワードへの参照を破棄します。
     */
    @PostConstruct
    public void init() {
        // 平文パスワードをBCryptでハッシュ化
        this.adminPasswordHash = encoder.encode(adminPasswordRaw);
        System.out.println("[ADMIN AUTH] 管理者パスワードをBCryptハッシュ化しました（安全にメモリ保持）。");
        // 平文パスワードの参照をクリア（GC対象にする）
        this.adminPasswordRaw = null;
    }

    /**
     * セッション情報を保持する内部クラス
     */
    private static class SessionInfo {
        final String csrfToken;    // このセッション専用のCSRFトークン
        final Instant expiresAt;   // セッションの有効期限

        SessionInfo(String csrfToken, Instant expiresAt) {
            this.csrfToken = csrfToken;
            this.expiresAt = expiresAt;
        }
    }

    /**
     * 管理者のユーザー名を検証します。
     * @param username 入力されたユーザー名
     * @return 一致すれば true
     */
    public boolean isValidUsername(String username) {
        return adminUsername.equals(username);
    }

    /**
     * 入力されたパスワードをBCryptハッシュと照合します。
     * ※ BCryptPasswordEncoderを使い、平文同士の比較は絶対に行いません。
     * @param rawPassword 入力された生パスワード
     * @return 一致すれば true
     */
    public boolean checkPassword(String rawPassword) {
        return encoder.matches(rawPassword, adminPasswordHash);
    }

    /**
     * 新しいセッションを作成し、セッショントークンとCSRFトークンのペアを返します。
     * @return Map("sessionToken" -> "...", "csrfToken" -> "...")
     */
    public Map<String, String> createSession() {
        // 1. 暗号的に安全な32バイトのランダムトークンを生成
        String sessionToken = generateSecureToken();
        String csrfToken = generateSecureToken();

        // 2. 有効期限を計算
        Instant expiresAt = Instant.now().plusSeconds(sessionTimeoutSeconds);

        // 3. セッション情報をメモリに保存
        activeSessions.put(sessionToken, new SessionInfo(csrfToken, expiresAt));

        // 4. 古い期限切れセッションをお掃除（メモリリーク防止）
        cleanExpiredSessions();

        System.out.println("[ADMIN AUTH] 新しい管理者セッションを発行しました。有効期限: " + expiresAt);

        return Map.of(
                "sessionToken", sessionToken,
                "csrfToken", csrfToken
        );
    }

    /**
     * セッショントークンが有効かどうかを検証します。
     * @param sessionToken Cookie から受け取ったセッショントークン
     * @return 有効なら true、無効/期限切れなら false
     */
    public boolean isValidSession(String sessionToken) {
        if (sessionToken == null || sessionToken.isBlank()) {
            return false;
        }

        SessionInfo info = activeSessions.get(sessionToken);
        if (info == null) {
            return false;
        }

        // 有効期限チェック
        if (Instant.now().isAfter(info.expiresAt)) {
            // 期限切れ → 自動で破棄
            activeSessions.remove(sessionToken);
            System.out.println("[ADMIN AUTH] セッションが期限切れのため無効化しました。");
            return false;
        }

        return true;
    }

    /**
     * CSRFトークンを検証します（ダブルサブミットパターン）。
     * @param sessionToken Cookie から受け取ったセッショントークン
     * @param csrfToken    リクエストヘッダー（X-CSRF-Token）から受け取ったCSRFトークン
     * @return 両方が正しく一致すれば true
     */
    public boolean isValidCsrfToken(String sessionToken, String csrfToken) {
        if (sessionToken == null || csrfToken == null) {
            return false;
        }

        SessionInfo info = activeSessions.get(sessionToken);
        if (info == null) {
            return false;
        }

        // セッションに紐づくCSRFトークンと、リクエストヘッダーのCSRFトークンを比較
        return info.csrfToken.equals(csrfToken);
    }

    /**
     * セッションを破棄します（ログアウト処理）。
     * @param sessionToken 破棄するセッショントークン
     */
    public void invalidateSession(String sessionToken) {
        if (sessionToken != null) {
            activeSessions.remove(sessionToken);
            System.out.println("[ADMIN AUTH] 管理者セッションを破棄しました（ログアウト）。");
        }
    }

    /**
     * セッションに紐づくCSRFトークンを取得します。
     * @param sessionToken セッショントークン
     * @return CSRFトークン文字列（セッションが無効なら null）
     */
    public String getCsrfToken(String sessionToken) {
        SessionInfo info = activeSessions.get(sessionToken);
        return (info != null) ? info.csrfToken : null;
    }

    // ── private メソッド ──

    /**
     * 暗号的に安全な32バイト（256ビット）のランダムトークンを生成します。
     * SecureRandom を使うため、予測は不可能です。
     */
    private String generateSecureToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /**
     * 有効期限が切れたセッションをメモリから一括削除します。
     * メモリリークを防ぐための定期クリーニングです。
     */
    private void cleanExpiredSessions() {
        Instant now = Instant.now();
        activeSessions.entrySet().removeIf(entry -> now.isAfter(entry.getValue().expiresAt));
    }
}
