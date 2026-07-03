import os
import re

img_dir = 'map-project/frontend/images'

# 1. Rename files in the directory
files = os.listdir(img_dir)
for f in files:
    full_path = os.path.join(img_dir, f)
    if os.path.isfile(full_path):
        # Extract the core name, removing extensions and " (number)"
        base = f
        # Remove common extensions
        for ext in ['.png', '.jpg', '.jpeg']:
            base = base.replace(ext, '')
            base = base.replace(ext.upper(), '')
        
        # Remove trailing spaces and " (number)" like " (2)"
        base = re.sub(r'\s*\(\d+\)$', '', base).strip()

        new_name = base + '.png'
        new_full_path = os.path.join(img_dir, new_name)

        if full_path != new_full_path:
            # Handle collision
            if os.path.exists(new_full_path):
                # If there's already a file, we can either skip or overwrite.
                # Usually we want to keep the one that is being renamed if it's " (2)" meaning it's newer, 
                # but to be safe, just add a suffix or skip.
                # Let's remove the old one if it's the same base to avoid collision
                try:
                    os.remove(new_full_path)
                except:
                    pass
            
            os.rename(full_path, new_full_path)
            print(f'Renamed: {f} -> {new_name}')

# 2. Update insert_specialties.sql to ensure all image paths end in .png and have clean names
sql_path = 'map-project/insert_specialties.sql'
with open(sql_path, 'r', encoding='utf-8') as file:
    sql_content = file.read()

def replace_image(match):
    pref = match.group(1)
    season = match.group(2)
    foodName = match.group(3)
    desc = match.group(4)
    dish = match.group(5)
    old_img = match.group(6)

    # Clean the old_img to just be .png
    base_img = old_img.split('/')[-1]
    for ext in ['.png', '.jpg', '.jpeg']:
        base_img = base_img.replace(ext, '')
        base_img = base_img.replace(ext.upper(), '')
    base_img = re.sub(r'\s*\(\d+\)$', '', base_img).strip()
    
    new_img = 'images/' + base_img + '.png'
    return f"('{pref}', '{season}', '{foodName}', '{desc}', '{dish}', '{new_img}')"

pattern = r"\('([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)'\)"
new_sql = re.sub(pattern, replace_image, sql_content)

with open(sql_path, 'w', encoding='utf-8') as file:
    file.write(new_sql)

print('Done renaming and updating SQL!')
