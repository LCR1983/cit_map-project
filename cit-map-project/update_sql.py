import docx
import re
import os

def main():
    docx_path = "../郷土料理一覧_504件.docx"
    sql_path = "map-project/insert_specialties.sql"
    
    # 1. Extract 504 dishes
    doc = docx.Document(docx_path)
    dishes = []
    
    for i in range(28):
        table = doc.tables[i]
        for row in table.rows[1:]:
            cells = row.cells
            if len(cells) >= 2:
                food = cells[0].text.strip()
                dish = cells[1].text.strip()
                if food:
                    if dish == "空欄":
                        dish = ""
                    dishes.append(dish)
                    
    print(f"Extracted {len(dishes)} dishes from docx.")
    if len(dishes) != 504:
        print("Warning: Did not find exactly 504 dishes!")
        return

    # 2. Parse SQL
    with open(sql_path, "r", encoding="utf-8") as f:
        sql_content = f.read()

    pattern = r"\('([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)',\s*'([^']*)'\)"
    
    def replacer(match):
        nonlocal current_idx
        if current_idx >= len(dishes):
            return match.group(0)
        
        pref = match.group(1)
        season = match.group(2)
        name = match.group(3)
        desc = match.group(4)
        dish = match.group(5)
        img = match.group(6)
        
        new_dish = dishes[current_idx]
        current_idx += 1
        
        new_dish = new_dish.replace("'", "\\'")
        
        return f"('{pref}', '{season}', '{name}', '{desc}', '{new_dish}', '{img}')"
        
    current_idx = 0
    new_sql_content = re.sub(pattern, replacer, sql_content)
    
    print(f"Replaced {current_idx} items in SQL.")
    
    with open(sql_path, "w", encoding="utf-8") as f:
        f.write(new_sql_content)
        
    print("Successfully updated SQL file.")

if __name__ == "__main__":
    main()
