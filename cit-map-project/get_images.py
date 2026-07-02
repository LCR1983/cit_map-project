import re, json, os

sql_path = 'map-project/insert_specialties.sql'
with open(sql_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove all newlines before running regex
content_clean = content.replace('\n', '').replace('\r', '')

pattern = r"\('([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)'\)"
matches = re.findall(pattern, content_clean)
mapping = {f"{p}_{n}": img.replace(' ', '') for p, season, n, desc, dish, img in matches}

img_dir = 'map-project/frontend/images'
files = os.listdir(img_dir)
actual_files = {f.split('.')[0].lower(): f for f in files if os.path.isfile(os.path.join(img_dir, f))}

updated_mapping = {}
missed = []
for key, val in mapping.items():
    expected_basename = os.path.basename(val).split('.')[0].lower()
    if expected_basename in actual_files:
        updated_mapping[key] = 'images/' + actual_files[expected_basename]
    else:
        missed.append(key)

print(f'Original count: {len(mapping)}')
print(f'New matches: {len(updated_mapping)}')
print(f'Missed count: {len(missed)}')

with open('temp_mapping.json', 'w', encoding='utf-8') as f:
    json.dump(updated_mapping, f, ensure_ascii=False, indent=4)
