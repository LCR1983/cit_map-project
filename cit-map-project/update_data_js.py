import json
import re

# Read mapping
with open("temp_mapping.json", "r", encoding="utf-8") as f:
    mapping = json.load(f)

# Read data.js
data_js_path = "frontend/data.js"
with open(data_js_path, "r", encoding="utf-8") as f:
    content = f.read()

mapping_str = "  const IMAGE_MAPPING = " + json.dumps(mapping, ensure_ascii=False, indent=4).replace("\n", "\n  ") + ";\n"

# We want to insert mapping_str before createDatabase
# and modify createDatabase to use it.

# Find createDatabase
pattern_func = r"(function createDatabase\(\) \{)(.*?)(return db;\s*\})"

def replacer(match):
    func_start = match.group(1)
    func_body = match.group(2)
    func_end = match.group(3)
    
    # Replace imageSrc line
    old_img_line = "            imageSrc:    `https://placehold.co/300x200/${colorStr}?text=${imgText}`,"
    
    new_img_logic = """
          const mapKey = prefCode + '_' + foodName;
          let finalImageSrc = `https://placehold.co/300x200/${colorStr}?text=${imgText}`;
          if (typeof IMAGE_MAPPING !== 'undefined' && IMAGE_MAPPING[mapKey]) {
            finalImageSrc = IMAGE_MAPPING[mapKey];
          }
"""
    new_img_line = "            imageSrc:    finalImageSrc,"
    
    func_body = func_body.replace(old_img_line, new_img_logic + "\n" + new_img_line)
    
    return mapping_str + "\n  " + func_start + func_body + func_end

new_content = re.sub(pattern_func, replacer, content, flags=re.DOTALL)

with open(data_js_path, "w", encoding="utf-8") as f:
    f.write(new_content)
print("data.js successfully updated with image mappings.")
