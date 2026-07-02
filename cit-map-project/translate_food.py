import re
import json
import time
from deep_translator import GoogleTranslator

def main():
    sql_file = "map-project/insert_specialties.sql"
    output_js = "map-project/frontend/food_translations.js"

    # 1. Parse SQL
    print("Reading SQL file...")
    with open(sql_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Match rows like: ('pref', 'season', 'name', 'desc', 'dish', 'url')
    # Because descriptions can have commas, we use regex carefully.
    pattern = r"\('([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)'\)"
    matches = re.findall(pattern, content)

    if not matches:
        print("No matches found in SQL!")
        return

    print(f"Found {len(matches)} items to translate.")
    
    translator = GoogleTranslator(source='ja', target='en')
    translations = {}

    batch_size = 10
    total_batches = (len(matches) + batch_size - 1) // batch_size

    for i in range(0, len(matches), batch_size):
        batch = matches[i:i+batch_size]
        print(f"Translating batch {i//batch_size + 1}/{total_batches}...")
        
        # We need to translate names and descriptions.
        # To save API calls, we join them with a delimiter ' ||| '
        texts_to_translate = []
        for match in batch:
            pref, season, name, desc, dish, url = match
            texts_to_translate.append(name)
            texts_to_translate.append(desc)
            
        combined_text = " ||| ".join(texts_to_translate)
        
        try:
            translated_combined = translator.translate(combined_text)
            translated_parts = [p.strip() for p in translated_combined.split("|||")]
            
            # If the split didn't return the exact number, fallback to individual translation
            if len(translated_parts) != len(texts_to_translate):
                print(f"Batch split mismatch (expected {len(texts_to_translate)}, got {len(translated_parts)}). Falling back to individual.")
                for j, match in enumerate(batch):
                    pref, season, name, desc, dish, url = match
                    id_val = i + j + 1
                    t_name = translator.translate(name)
                    time.sleep(0.1)
                    t_desc = translator.translate(desc)
                    time.sleep(0.1)
                    translations[str(id_val)] = {"name": t_name, "description": t_desc}
            else:
                for j, match in enumerate(batch):
                    id_val = i + j + 1
                    t_name = translated_parts[j*2]
                    t_desc = translated_parts[j*2+1]
                    translations[str(id_val)] = {"name": t_name, "description": t_desc}
                    
        except Exception as e:
            print(f"Error in batch {i//batch_size + 1}: {e}")
            print("Falling back to individual translations for this batch...")
            for j, match in enumerate(batch):
                pref, season, name, desc, dish, url = match
                id_val = i + j + 1
                try:
                    t_name = translator.translate(name)
                    t_desc = translator.translate(desc)
                    translations[str(id_val)] = {"name": t_name, "description": t_desc}
                except Exception as ex:
                    print(f"Failed completely for ID {id_val}: {ex}")
                    translations[str(id_val)] = {"name": name, "description": desc}
                    
        time.sleep(0.5)

    print("Translation complete! Writing to JS file...")
    js_content = f"// Auto-generated translations for food database\nconst foodTranslations = {json.dumps(translations, ensure_ascii=False, indent=4)};\n"
    
    with open(output_js, 'w', encoding='utf-8') as f:
        f.write(js_content)
        
    print(f"Saved to {output_js}!")

if __name__ == "__main__":
    main()
