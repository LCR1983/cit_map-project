package com.example.dsproject.controller;

import com.example.dsproject.entity.Specialty;
import com.example.dsproject.repository.SpecialtyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
public class RouteController {

    @Autowired
    private SpecialtyRepository specialtyRepository;

    @Value("${ollama.api.url}")
    private String ollamaApiUrl;

    @PostMapping("/route/suggest")
    public Map<String, Object> suggestRoute(@RequestBody Map<String, String> request) {
        String startLocation = request.get("startLocation");
        String theme = request.get("theme");

        Map<String, Object> response = new HashMap<>();

        if (startLocation == null || startLocation.trim().isEmpty()) {
            response.put("error", "出発地を入力してください。");
            return response;
        }

        // テーマの日本語マッピング
        String themeText = "おまかせ";
        switch (theme) {
            case "solo": themeText = "一人旅・お一人様グルメ"; break;
            case "couple": themeText = "恋人・夫婦でゆっくり"; break;
            case "friends": themeText = "友人とワイワイ・カフェ巡り"; break;
            case "family": themeText = "家族で収穫体験・ドライブ"; break;
            case "business": themeText = "出張ついでにサクッとご当地"; break;
            case "tourist": themeText = "外国人旅行者向け・王道名所"; break;
        }

        // データベースから全特産品情報を取得 (カンニングペーパー作成)
        List<Specialty> allSpecialties = specialtyRepository.findAll();
        StringBuilder dbContext = new StringBuilder();
        dbContext.append("【データベースに登録されている特産品・観光スポットリスト】\n");
        for (Specialty s : allSpecialties) {
            dbContext.append(String.format("- 都道府県: %s, 季節: %s, 名称: %s, 概要: %s, グルメ情報: %s\n",
                    s.getPrefecture(), s.getSeason(), s.getName(), s.getDescription(), s.getLocalDish()));
        }

        // 強力なプロンプトを作成（ハルシネーション完全シャットアウト）
        String promptInstruction = String.format(
                "あなたはプロの旅行プランナーです。\n" +
                "以下の【出発地】と【旅行テーマ】に合わせて、日帰りまたは1泊2日のツアープランを提案してください。\n\n" +
                "【超厳格ルール】\n" +
                "必ず、以下の【データベースに登録されている特産品・観光スポットリスト】に記載されている場所と食材\"のみ\"を目的地（立ち寄りスポット）として組み合わせてルートを作成してください。\n" +
                "リストにない観光名所、飲食店、特産品を勝手に創作したり、あなたの事前知識から補完することは絶対に禁止します。どうしても足りない場合は、移動や風景を楽しむ時間を多めに設定してください。\n\n" +
                "%s\n" +
                "【出発地】: %s\n" +
                "【旅行テーマ】: %s\n\n" +
                "魅力的なプランをタイムスケジュール形式のMarkdownで出力してください。タイトルは「🚗 あなたの特製ツアープラン」などのように目を引くものにしてください。",
                dbContext.toString(), startLocation, themeText);

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
                response.put("report", aiReply);
            } else {
                response.put("error", "AIからの応答が正しくありませんでした。");
            }
        } catch (Exception e) {
            e.printStackTrace();
            response.put("error", "AI（Ollama）との通信エラーが発生しました。Ollamaが起動しているか確認してください。 (エラー: " + e.getMessage() + ")");
        }

        return response;
    }
}
