package com.example.dsproject.controller;

import com.example.dsproject.entity.Specialty;
import com.example.dsproject.repository.SpecialtyRepository;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;

@RestController
@RequestMapping("/api")
public class ChatController {

    @Autowired
    private SpecialtyRepository specialtyRepository;

    @Value("${ollama.api.url}")
    private String ollamaApiUrl;

    @PostMapping("/chat")
    public Map<String, Object> chat(@RequestBody Map<String, Object> request) {
        String userMessage = (String) request.get("message");
        List<Map<String, String>> history = (List<Map<String, String>>) request.get("history");
        Map<String, Object> response = new HashMap<>();

        // 1. 今回の質問から都県と季節を検知
        String targetPref = detectPrefecture(userMessage);
        String targetSeason = detectSeason(userMessage);

        // もし今回の質問だけで見つからない場合、過去の会話履歴からもキーワードを探してみる（賢い機能！）
        if (targetPref == null && history != null) {
            for (Map<String, String> msg : history) {
                String pref = detectPrefecture(msg.get("content"));
                if (pref != null) {
                    targetPref = pref;
                    break;
                }
            }
        }
        if (targetSeason == null && history != null) {
            for (Map<String, String> msg : history) {
                String season = detectSeason(msg.get("content"));
                if (season != null) {
                    targetSeason = season;
                    break;
                }
            }
        }

        // 2. 過去の会話履歴を綺麗なテキストにする
        StringBuilder historyContext = new StringBuilder();
        if (history != null && !history.isEmpty()) {
            historyContext.append("【これまでの会話履歴】\n");
            for (Map<String, String> msg : history) {
                String role = "user".equals(msg.get("role")) ? "ユーザー" : "アシスタント";
                historyContext.append(String.format("%s: %s\n", role, msg.get("content")));
            }
            historyContext.append("\n");
        }

        // 3. データベースのカンニングペーパー作成
        StringBuilder dbContext = new StringBuilder();
        List<Specialty> dbResults;

        if (targetPref != null || targetSeason != null) {
            if (targetPref != null && targetSeason != null) {
                dbResults = specialtyRepository.findByPrefectureAndSeason(targetPref, targetSeason);
            } else if (targetPref != null) {
                dbResults = specialtyRepository.findByPrefecture(targetPref);
            } else {
                dbResults = specialtyRepository.findBySeason(targetSeason);
            }
        } else {
            // 🧠 県や季節が指定されていない曖昧な質問の場合は、MySQL内の全特産品リストをカンニングペーパーとして渡す！
            dbResults = specialtyRepository.findAll();
        }

        dbContext.append("【データベースおよび紹介Webページから取得した本物の情報】\n");
        if (dbResults == null || dbResults.isEmpty()) {
            dbContext.append("該当する特産品はデータベースにまだ登録されていません。\n");
        } else {
            int count = 0;
            for (Specialty s : dbResults) {
                // タイムアウトを防ぐため、全件取得の場合は最大15件程度に制限して簡潔に渡す
                if (targetPref == null && targetSeason == null && count >= 15) {
                    break;
                }
                dbContext.append(String.format("- 食材名: %s, 都県: %s, 季節: %s, 説明: %s, 郷土料理: %s\n",
                        s.getName(), s.getPrefecture(), s.getSeason(), s.getDescription(), s.getLocalDish()));
                count++;
            }
        }
        dbContext.append("\n");

        // 4. Gemmaへ送る最終プロンプト（食以外のシャットアウトを行う鉄壁ガードレールを追加！）
        // 4. Gemmaへ送る最終プロンプト（データベース（MySQL）内の情報のみで解答する超厳格ルール！）
        // 4. Gemmaへ送る最終プロンプト（超強力なグラウンディング指示！）
        String promptInstruction = String.format(
                "あなたは関東の旬の特産品、および食体験に関する専門案内AI（食材ソムリエ）です。\n" +
                        "【超厳格ルール】必ず、提供された【データベースおよび紹介Webページから取得した本物の情報】に記載されている食材・特産品情報のみを使用して回答を作成してください。二郎系ラーメンなど、そこに記載されていない食材やお店について、あなたの事前知識から勝手にでっち上げて提案することは絶対に禁止します。記載がない食材については『当アプリのデータベースには登録がありません』とスマートに断ってください。\n\n"
                        +
                        "これまでの【これまでの会話履歴】をよく理解し、最新のユーザーの質問に対して、提供された【データベースおよび紹介Webページから取得した本物の情報】をベースにして自然に回答を作成してください。嘘の情報は絶対に作らないでください。\n\n"
                        +
                        "%s" +
                        "%s" +
                        "【最新の質問】\nユーザー: %s\nアシスタント:",
                historyContext.toString(),
                dbContext.toString(),
                userMessage);

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
                response.put("reply", aiReply);
            } else {
                response.put("reply", "Gemmaからの応答が正しくありませんでした。");
            }

        } catch (Exception e) {
            e.printStackTrace();
            response.put("reply", "Gemmaとの通信エラーが発生しました。Ollamaが起動しているか確認してください。 (エラー: " + e.getMessage() + ")");
        }

        return response;
    }

    private String detectPrefecture(String text) {
        if (text == null)
            return null;
        if (text.contains("茨城"))
            return "ibaraki";
        if (text.contains("栃木"))
            return "tochigi";
        if (text.contains("群馬"))
            return "gunma";
        if (text.contains("埼玉"))
            return "saitama";
        if (text.contains("千葉"))
            return "chiba";
        if (text.contains("東京"))
            return "tokyo";
        if (text.contains("神奈川"))
            return "kanagawa";
        return null;
    }

    private String detectSeason(String text) {
        if (text == null)
            return null;
        if (text.contains("春"))
            return "spring";
        if (text.contains("夏"))
            return "summer";
        if (text.contains("秋"))
            return "autumn";
        if (text.contains("冬"))
            return "winter";
        return null;
    }
}
