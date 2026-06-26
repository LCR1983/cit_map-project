package com.example.dsproject.controller;

import com.example.dsproject.entity.Rating;
import com.example.dsproject.repository.RatingRepository;
import com.example.dsproject.service.AdminSessionService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class RatingController {

    @Autowired
    private RatingRepository ratingRepository;

    @Autowired
    private AdminSessionService adminSessionService;

    @Value("${ollama.api.url}")
    private String ollamaApiUrl;

    // --- 認証ユーティリティ ---
    private boolean checkAuth(HttpServletRequest request) {
        if (request.getCookies() == null) return false;
        for (Cookie cookie : request.getCookies()) {
            if ("ADMIN_SESSION".equals(cookie.getName())) {
                return adminSessionService.isValidSession(cookie.getValue());
            }
        }
        return false;
    }

    private boolean checkCsrf(HttpServletRequest request) {
        String csrfHeader = request.getHeader("X-CSRF-Token");
        if (csrfHeader == null || csrfHeader.isEmpty()) return false;
        if (request.getCookies() == null) return false;
        
        for (Cookie cookie : request.getCookies()) {
            if ("ADMIN_SESSION".equals(cookie.getName())) {
                return adminSessionService.isValidCsrfToken(cookie.getValue(), csrfHeader);
            }
        }
        return false;
    }

    // --- 一般公開API ---
    // 新規評価の送信
    @PostMapping("/ratings")
    public ResponseEntity<?> addRating(@RequestBody Map<String, Object> payload) {
        try {
            if (!payload.containsKey("rating")) {
                return ResponseEntity.badRequest().body(Map.of("error", "評価（星の数）は必須です。"));
            }
            
            int ratingValue;
            try {
                ratingValue = Integer.parseInt(payload.get("rating").toString());
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body(Map.of("error", "評価は数値である必要があります。"));
            }

            if (ratingValue < 1 || ratingValue > 5) {
                return ResponseEntity.badRequest().body(Map.of("error", "評価は1〜5の間で指定してください。"));
            }

            String comment = (String) payload.get("comment");
            if (comment != null && comment.length() > 1000) {
                return ResponseEntity.badRequest().body(Map.of("error", "コメントは1000文字以内で入力してください。"));
            }

            Rating rating = new Rating();
            rating.setRating(ratingValue);
            rating.setComment(comment != null ? comment.trim() : "");
            rating.setCreatedAt(Instant.now());

            ratingRepository.save(rating);
            System.out.println("✅ [監査ログ] 新しい評価が登録されました。星: " + ratingValue);

            return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("message", "評価を保存しました。"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "サーバーエラーが発生しました。"));
        }
    }

    // --- 管理者専用API ---
    // 評価一覧の取得
    @GetMapping("/ratings")
    public ResponseEntity<?> getAllRatings(HttpServletRequest request) {
        if (!checkAuth(request)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "認証が必要です。"));
        }
        
        List<Rating> ratings = ratingRepository.findAll();
        // 降順（新しい順）に並べ替え（必要であればService層やRepositoryでOrderByCreatedAtDescとする方が良いが、今回はここで対応可）
        ratings.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        return ResponseEntity.ok(ratings);
    }

    // 評価の削除
    @DeleteMapping("/ratings/{id}")
    public ResponseEntity<?> deleteRating(@PathVariable Long id, HttpServletRequest request) {
        if (!checkAuth(request)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "認証が必要です。"));
        }
        if (!checkCsrf(request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "CSRFトークンが無効です。"));
        }

        if (!ratingRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "指定されたデータが見つかりません。"));
        }

        ratingRepository.deleteById(id);
        System.out.println("✅ [監査ログ] 評価ID " + id + " が管理者により削除されました。");
        return ResponseEntity.ok(Map.of("message", "評価を削除しました。"));
    }

    // AI（Gemma2）による評価分析
    @PostMapping("/admin/ratings/analyze")
    public ResponseEntity<?> analyzeRatings(HttpServletRequest request) {
        if (!checkAuth(request)) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "認証が必要です。"));
        }
        if (!checkCsrf(request)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "CSRFトークンが無効です。"));
        }

        List<Rating> ratings = ratingRepository.findAll();
        if (ratings.isEmpty()) {
            return ResponseEntity.ok(Map.of("report", "現在、分析対象となる評価データがありません。"));
        }

        StringBuilder dataContext = new StringBuilder();
        int totalRating = 0;
        int[] counts = new int[6]; // index 1-5
        
        for (Rating r : ratings) {
            totalRating += r.getRating();
            counts[r.getRating()]++;
            if (r.getComment() != null && !r.getComment().trim().isEmpty()) {
                dataContext.append(String.format("- 星%d: %s\n", r.getRating(), r.getComment()));
            }
        }
        
        double average = (double) totalRating / ratings.size();
        
        String promptInstruction = String.format(
            "あなたはプロのデータアナリストです。以下のアプリ評価データを分析し、簡潔かつ魅力的な日本語のレポートをMarkdown形式で作成してください。\n\n" +
            "【要件】\n" +
            "以下の4つのセクションで構成してください。\n" +
            "1. 📊 全体サマリー: ユーザーの全体的な満足度や傾向を2-3文で。\n" +
            "2. 🟢 ポジティブな意見: 高評価の理由や好評な点を箇条書きで3点程度。\n" +
            "3. 🔴 ネガティブ・改善点: 不満点や改善要望を箇条書きで2点程度（無い場合は「特になし」でOK）。\n" +
            "4. 💡 AIからの総合アドバイス: 今後の開発・改善に向けた具体的なアクションプランを1文で。\n\n" +
            "【統計データ】\n" +
            "- 総評価数: %d件\n" +
            "- 平均評価: %.1f / 5.0\n" +
            "- 星5: %d件, 星4: %d件, 星3: %d件, 星2: %d件, 星1: %d件\n\n" +
            "【実際のユーザーコメント】\n" +
            "%s\n\n" +
            "Markdownレポートを出力してください。",
            ratings.size(), average, counts[5], counts[4], counts[3], counts[2], counts[1],
            dataContext.toString().isEmpty() ? "コメントはありません。" : dataContext.toString()
        );

        try {
            RestTemplate restTemplate = new RestTemplate();
            Map<String, Object> ollamaRequest = new HashMap<>();
            ollamaRequest.put("model", "gemma2:2b");
            ollamaRequest.put("prompt", promptInstruction);
            ollamaRequest.put("stream", false);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(ollamaRequest, headers);

            ResponseEntity<Map> ollamaResponse = restTemplate.postForEntity(ollamaApiUrl, entity, Map.class);

            if (ollamaResponse.getStatusCode() == HttpStatus.OK && ollamaResponse.getBody() != null) {
                String aiReply = (String) ollamaResponse.getBody().get("response");
                return ResponseEntity.ok(Map.of("report", aiReply));
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Gemmaからの応答が正しくありませんでした。"));
            }

        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Gemmaとの通信エラーが発生しました。Ollamaが起動しているか確認してください。"));
        }
    }
}
