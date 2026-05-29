package com.example.dsproject.controller;

import com.example.dsproject.entity.Specialty;
import com.example.dsproject.repository.SpecialtyRepository;
import com.example.dsproject.service.AdminSessionService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.ResponseEntity;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api")
public class SpecialtyController {

    // データベースの窓口（Repository）を呼び出せるように繋ぎます
    @Autowired
    private SpecialtyRepository specialtyRepository;

    // 管理者セッションサービス（認証チェック用）
    @Autowired
    private AdminSessionService sessionService;

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 一般ユーザー向けAPI（既存 ─ 変更なし）
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    @PostMapping("/search")
    public ResponseEntity<List<Map<String, Object>>> searchSpecialties(@RequestBody SearchRequest request) {
        String season = request.getSeason();
        String pref = request.getPrefecture();

        System.out.println("検索リクエスト受信: 季節=" + season + ", 地域=" + pref);

        // 1. データベースから条件に合う特産品を取得します
        List<Specialty> dbResults;

        if ("all".equals(season) && "all".equals(pref)) {
            // 両方「すべて」なら、全件取得
            dbResults = specialtyRepository.findAll();
        } else if ("all".equals(season)) {
            // 季節が「すべて」なら、都県だけで検索
            dbResults = specialtyRepository.findByPrefecture(pref);
        } else if ("all".equals(pref)) {
            // 都県が「すべて」なら、季節だけで検索
            dbResults = specialtyRepository.findBySeason(season);
        } else {
            // 両方指定されているなら、都県と季節で検索
            dbResults = specialtyRepository.findByPrefectureAndSeason(pref, season);
        }

        // 2. 取得したデータを、フロント（画面）が読める形に綺麗に並び替えます
        List<Map<String, Object>> responseList = new ArrayList<>();
        for (Specialty s : dbResults) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", s.getId());
            item.put("name", s.getName());
            item.put("description", s.getDescription());
            // 画面側は「imageSrc」という名前で画像を探すので、ここで「imageUrl」を入れ替えます
            item.put("imageSrc", s.getImageUrl());
            item.put("localDish", s.getLocalDish());
            item.put("prefecture", s.getPrefecture());
            item.put("season", s.getSeason());

            responseList.add(item);
        }

        return ResponseEntity.ok(responseList);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 管理者専用API（認証必須）
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    /**
     * 全特産品の一覧取得（管理画面のデータテーブル用）
     * GET /api/specialties
     * ※ 認証チェック済みの管理者のみアクセス可能
     */
    @GetMapping("/specialties")
    public ResponseEntity<?> getAllSpecialties(HttpServletRequest request) {
        // 認証チェック
        ResponseEntity<?> authError = checkAuth(request);
        if (authError != null) return authError;

        List<Specialty> all = specialtyRepository.findAll();
        return ResponseEntity.ok(all);
    }

    /**
     * 特産品の新規追加
     * POST /api/specialties
     * ※ 認証チェック＋CSRF検証＋入力バリデーション＋監査ログ
     */
    @PostMapping("/specialties")
    public ResponseEntity<?> createSpecialty(@RequestBody SpecialtyRequest req, HttpServletRequest request) {
        // 認証チェック
        ResponseEntity<?> authError = checkAuth(request);
        if (authError != null) return authError;

        // CSRF検証
        ResponseEntity<?> csrfError = checkCsrf(request);
        if (csrfError != null) return csrfError;

        // 入力バリデーション
        ResponseEntity<?> validationError = validateSpecialtyRequest(req);
        if (validationError != null) return validationError;

        // データ作成
        Specialty s = new Specialty();
        s.setName(req.getName().trim());
        s.setDescription(req.getDescription().trim());
        s.setPrefecture(req.getPrefecture());
        s.setSeason(req.getSeason());
        s.setLocalDish(req.getLocalDish() != null ? req.getLocalDish().trim() : null);
        s.setImageUrl(req.getImageUrl() != null ? req.getImageUrl().trim() : null);

        Specialty saved = specialtyRepository.save(s);

        // 監査ログ出力
        auditLog("CREATE", saved.getName(), saved.getId());

        return ResponseEntity.ok(Map.of("message", "特産品を登録しました", "id", saved.getId()));
    }

    /**
     * 特産品の更新
     * PUT /api/specialties/{id}
     * ※ 認証チェック＋CSRF検証＋入力バリデーション＋監査ログ
     */
    @PutMapping("/specialties/{id}")
    public ResponseEntity<?> updateSpecialty(@PathVariable Long id, @RequestBody SpecialtyRequest req,
                                              HttpServletRequest request) {
        // 認証チェック
        ResponseEntity<?> authError = checkAuth(request);
        if (authError != null) return authError;

        // CSRF検証
        ResponseEntity<?> csrfError = checkCsrf(request);
        if (csrfError != null) return csrfError;

        // 入力バリデーション
        ResponseEntity<?> validationError = validateSpecialtyRequest(req);
        if (validationError != null) return validationError;

        // 対象データの存在確認
        Optional<Specialty> existing = specialtyRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "ID=" + id + " の特産品が見つかりません。"));
        }

        // データ更新
        Specialty s = existing.get();
        s.setName(req.getName().trim());
        s.setDescription(req.getDescription().trim());
        s.setPrefecture(req.getPrefecture());
        s.setSeason(req.getSeason());
        s.setLocalDish(req.getLocalDish() != null ? req.getLocalDish().trim() : null);
        s.setImageUrl(req.getImageUrl() != null ? req.getImageUrl().trim() : null);

        specialtyRepository.save(s);

        // 監査ログ出力
        auditLog("UPDATE", s.getName(), s.getId());

        return ResponseEntity.ok(Map.of("message", "特産品を更新しました", "id", s.getId()));
    }

    /**
     * 特産品の削除
     * DELETE /api/specialties/{id}
     * ※ 認証チェック＋CSRF検証＋監査ログ
     */
    @DeleteMapping("/specialties/{id}")
    public ResponseEntity<?> deleteSpecialty(@PathVariable Long id, HttpServletRequest request) {
        // 認証チェック
        ResponseEntity<?> authError = checkAuth(request);
        if (authError != null) return authError;

        // CSRF検証
        ResponseEntity<?> csrfError = checkCsrf(request);
        if (csrfError != null) return csrfError;

        // 対象データの存在確認
        Optional<Specialty> existing = specialtyRepository.findById(id);
        if (existing.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "ID=" + id + " の特産品が見つかりません。"));
        }

        String deletedName = existing.get().getName();
        specialtyRepository.deleteById(id);

        // 監査ログ出力
        auditLog("DELETE", deletedName, id);

        return ResponseEntity.ok(Map.of("message", "特産品「" + deletedName + "」を削除しました"));
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // セキュリティ検証ヘルパー
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    /**
     * Cookie内のセッショントークンを検証します。
     * 未認証の場合は 401 エラーを返します。
     */
    private ResponseEntity<?> checkAuth(HttpServletRequest request) {
        String sessionToken = AdminController.extractSessionToken(request);
        if (!sessionService.isValidSession(sessionToken)) {
            return ResponseEntity.status(401).body(Map.of("error", "認証が必要です。ログインしてください。"));
        }
        return null; // 認証OK
    }

    /**
     * CSRFトークンを検証します（ダブルサブミットパターン）。
     * ヘッダー「X-CSRF-Token」とセッションに紐づくCSRFトークンが一致しなければ 403 エラーを返します。
     */
    private ResponseEntity<?> checkCsrf(HttpServletRequest request) {
        String sessionToken = AdminController.extractSessionToken(request);
        String csrfToken = request.getHeader("X-CSRF-Token");

        if (!sessionService.isValidCsrfToken(sessionToken, csrfToken)) {
            System.out.println("[SECURITY] CSRF検証失敗: 不正なリクエストをブロックしました。");
            return ResponseEntity.status(403).body(Map.of("error", "不正なリクエストです（CSRF検証失敗）。"));
        }
        return null; // CSRF OK
    }

    /**
     * 入力データのバリデーション（セキュリティ＋データ品質）
     * ・名前: 必須、100文字以内
     * ・説明: 必須、2000文字以内
     * ・都県: 必須
     * ・季節: 必須
     * ・画像URL: 任意、URLの場合は http:// or https:// で始まること
     */
    private ResponseEntity<?> validateSpecialtyRequest(SpecialtyRequest req) {
        List<String> errors = new ArrayList<>();

        if (req.getName() == null || req.getName().trim().isEmpty()) {
            errors.add("食材名は必須です。");
        } else if (req.getName().trim().length() > 100) {
            errors.add("食材名は100文字以内で入力してください。");
        }

        if (req.getDescription() == null || req.getDescription().trim().isEmpty()) {
            errors.add("説明は必須です。");
        } else if (req.getDescription().trim().length() > 2000) {
            errors.add("説明は2000文字以内で入力してください。");
        }

        if (req.getPrefecture() == null || req.getPrefecture().trim().isEmpty()) {
            errors.add("都県を選択してください。");
        }

        if (req.getSeason() == null || req.getSeason().trim().isEmpty()) {
            errors.add("季節を選択してください。");
        }

        // 画像URLのフォーマットチェック（任意項目だが、入力されたら形式を検証）
        if (req.getImageUrl() != null && !req.getImageUrl().trim().isEmpty()) {
            String url = req.getImageUrl().trim();
            if (!url.startsWith("http://") && !url.startsWith("https://")) {
                errors.add("画像URLは http:// または https:// で始まる必要があります。");
            }
        }

        if (!errors.isEmpty()) {
            return ResponseEntity.status(400).body(Map.of("errors", errors));
        }
        return null; // バリデーションOK
    }

    /**
     * 監査ログ（Audit Log）の出力
     * 「いつ」「何を」「どうしたか」をサーバーログに記録します。
     * セキュリティの3大原則の1つ「非否認性」を担保します。
     */
    private void auditLog(String action, String name, Long id) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        System.out.println("[ADMIN ACTION] " + timestamp + " - Specialty '" + name + "' (ID=" + id + ") was " + action);
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // リクエストボディ用の内部クラス
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    static class SearchRequest {
        private String season;
        private String prefecture;

        public String getSeason() {
            return season;
        }

        public void setSeason(String season) {
            this.season = season;
        }

        public String getPrefecture() {
            return prefecture;
        }

        public void setPrefecture(String prefecture) {
            this.prefecture = prefecture;
        }
    }

    static class SpecialtyRequest {
        private String name;
        private String description;
        private String prefecture;
        private String season;
        private String localDish;
        private String imageUrl;

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public String getPrefecture() { return prefecture; }
        public void setPrefecture(String prefecture) { this.prefecture = prefecture; }
        public String getSeason() { return season; }
        public void setSeason(String season) { this.season = season; }
        public String getLocalDish() { return localDish; }
        public void setLocalDish(String localDish) { this.localDish = localDish; }
        public String getImageUrl() { return imageUrl; }
        public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    }
}
