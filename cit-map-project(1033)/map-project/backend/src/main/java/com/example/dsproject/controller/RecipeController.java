package com.example.dsproject.controller;

import com.example.dsproject.entity.Specialty;
import com.example.dsproject.repository.SpecialtyRepository;
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
public class RecipeController {

    @Autowired
    private SpecialtyRepository specialtyRepository;

    @Value("${ollama.api.url}")
    private String ollamaApiUrl;

    @PostMapping("/recipe")
    public Map<String, Object> generateRecipe(@RequestBody Map<String, String> request) {
        String specialtyName = request.get("name");
        Map<String, Object> response = new HashMap<>();

        // 1. データベースから食材情報を検索（RAG用の補強情報）
        List<Specialty> dbResults = specialtyRepository.findByName(specialtyName);
        StringBuilder specialtyContext = new StringBuilder();

        if (dbResults != null && !dbResults.isEmpty()) {
            Specialty s = dbResults.get(0);
            specialtyContext.append(String.format("説明: %s\n", s.getDescription()));
            if (s.getLocalDish() != null && !s.getLocalDish().isEmpty()) {
                specialtyContext.append(String.format("関連する郷土料理: %s\n", s.getLocalDish()));
            }
        }

        // 2. Gemmaへのプロンプト指示書を組み立て（爆速化のために文字数を超厳しく制限！）
        String promptInstruction = String.format(
                "あなたは関東地方の旬の特産品を使った料理を提案する、一流のAIシェフです。\n" +
                        "以下の食材について、実在する定番の家庭料理や郷土料理のレシピを【極めて簡潔に短く】考案してください。\n" +
                        "出力は、以下の【指定フォーマット】の項目名を必ずそのまま使用し、余計な見出し（##など）や解説は一切省いてください。\n\n" +
                        "【対象の食材】\n" +
                        "食材名: %s\n" +
                        "%s\n" +
                        "※タイムアウト（504エラー）を防ぐため、材料と手順の要点を【合計150文字以内で超シンプルに】回答してください。\n\n" +
                        "【指定フォーマット】\n" +
                        "■ レシピ名： [実在する一般的な料理名]\n" +
                        "■ 材料： [要点のみ]\n" +
                        "■ 作り方： [簡潔なステップ]\n\n" +
                        "簡潔なレシピ:",
                specialtyName,
                specialtyContext.toString());

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
                String aiRecipe = (String) ollamaResponse.getBody().get("response");
                response.put("recipe", aiRecipe);
            } else {
                response.put("recipe", "Gemmaからのレシピ応答が正しくありませんでした。");
            }

        } catch (Exception e) {
            e.printStackTrace();
            response.put("recipe", "Gemmaとの通信エラーが発生しました。Ollamaが起動しているか確認してください。 (エラー: " + e.getMessage() + ")");
        }

        return response;
    }

    @PostMapping("/recipe/chat")
    public Map<String, Object> chatAboutRecipe(@RequestBody Map<String, String> request) {
        String recipe = request.get("recipe");
        String question = request.get("question");
        Map<String, Object> response = new HashMap<>();

        // Gemmaへのプロンプト指示（100文字以内で一瞬で爆速回答させる！）
        String promptInstruction = String.format(
                "あなたは先ほど特産品を使った以下のレシピを考案した、一流のAIシェフです。\n" +
                        "ユーザーからこのレシピに関する質問が届きました。親切、丁寧、かつ【100文字以内で極めて簡潔に】答えてください。\n\n" +
                        "【あなたが提案したレシピ】\n" +
                        "%s\n\n" +
                        "【ユーザーからの質問】\n" +
                        "%s\n\n" +
                        "シェフの回答（簡潔に）:",
                recipe,
                question);

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
                response.put("reply", "レシピに関する回答を作成できませんでした。");
            }

        } catch (Exception e) {
            e.printStackTrace();
            response.put("reply", "通信エラーが発生しました。(エラー: " + e.getMessage() + ")");
        }

        return response;
    }
}
