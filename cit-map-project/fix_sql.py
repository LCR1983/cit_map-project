import re, os

sql_path = 'map-project/insert_specialties.sql'
with open(sql_path, 'r', encoding='utf-8') as f:
    sql_content = f.read()

img_dir = 'map-project/frontend/images'
files = os.listdir(img_dir)
# Build a map of lowercase basename without extension -> actual filename
actual_files = {}
for f in files:
    if os.path.isfile(os.path.join(img_dir, f)):
        base = f.split('.')[0].lower()
        actual_files[base] = f

# Also build a fallback map: foodName -> actual filename
fallback_files = {}
for f in files:
    if os.path.isfile(os.path.join(img_dir, f)):
        parts = f.split('.')[0].lower().split('_')
        if len(parts) > 1:
            food_part = parts[1]
            if food_part not in fallback_files:
                fallback_files[food_part] = f

def replace_image(match):
    pref = match.group(1)
    season = match.group(2)
    foodName = match.group(3)
    desc = match.group(4)
    dish = match.group(5)
    old_img = match.group(6)

    # Convert foodName to romaji approximation or use the original img name to find the base
    # old_img is like 'images/tokyo_fukagawameshi.png'
    # we can extract the base:
    old_base = old_img.split('/')[-1].split('.')[0].lower()
    
    new_img = old_img
    if old_base in actual_files:
        new_img = 'images/' + actual_files[old_base]
    else:
        # try fallback
        food_part = old_base.split('_')[-1] if '_' in old_base else old_base
        if food_part in fallback_files:
            new_img = 'images/' + fallback_files[food_part]

    return f"('{pref}', '{season}', '{foodName}', '{desc}', '{dish}', '{new_img}')"

# We must match across newlines for the strings because Kanagawa has newlines in desc!
pattern = r"\('([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)'\)"
new_sql = re.sub(pattern, replace_image, sql_content)

with open(sql_path, 'w', encoding='utf-8') as f:
    f.write(new_sql)

print('SQL updated!')
