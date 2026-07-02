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

tokyo_foods = re.findall(r"'([^']+)'", seed_str[seed_str.find('tokyo:'):seed_str.find('kanagawa:')])

matches = 0
for f in tokyo_foods:
    if f'tokyo_{f}' in mapping:
        matches += 1
    else:
        print(f"Missing: tokyo_{f}")
print(f'Tokyo foods in seed: {len(tokyo_foods)}')
print(f'Tokyo exact matches in mapping: {matches}')
