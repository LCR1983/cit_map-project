import json, re

with open('map-project/frontend/data.js', 'r', encoding='utf-8') as f:
    content = f.read()

start_idx = content.find('const IMAGE_MAPPING = {')
end_idx = content.find('};', start_idx)
mapping_str = content[start_idx + 21 : end_idx + 1]
mapping = json.loads(mapping_str)

start_seed = content.find('const FOOD_SEED = {')
end_seed = content.find('  };', start_seed)
seed_str = content[start_seed + 18 : end_seed + 2]

saitama_foods = re.findall(r"'([^']+)'", seed_str[seed_str.find('saitama:'):seed_str.find('chiba:')])
matches = 0
for f in saitama_foods:
    if f'saitama_{f}' in mapping:
        matches += 1
print(f'Saitama foods in seed: {len(saitama_foods)}')
print(f'Saitama exact matches: {matches}')

kanagawa_foods = re.findall(r"'([^']+)'", seed_str[seed_str.find('kanagawa:'):])
k_matches = 0
for f in kanagawa_foods:
    if f'kanagawa_{f}' in mapping:
        k_matches += 1
print(f'Kanagawa foods in seed: {len(kanagawa_foods)}')
print(f'Kanagawa exact matches: {k_matches}')
