import re
import sys

def convert():
    with open('c:\\Users\\kenka\\OneDrive - Chiba Institute of Technology\\デスクトップ\\cit_map-project\\output_extracted.txt', 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    season_map = {
        '春': 'spring',
        '夏': 'summer',
        '秋': 'autumn',
        '冬': 'winter'
    }
    
    current_pref = ''
    values = []
    
    for line in lines:
        line = line.strip()
        m_pref = re.search(r'## \d+\. .*?\((.*?)\)', line)
        if m_pref:
            current_pref = m_pref.group(1)
            continue
            
        if line.startswith('|') and not line.startswith('| 季節') and not line.startswith('| :---'):
            parts = [p.strip() for p in line.split('|')]
            if len(parts) >= 6:
                season_jp = parts[1]
                name = parts[2]
                category = parts[3]
                image_str = parts[4]
                status = parts[5]
                notes = parts[6] if len(parts) > 6 else ''
                
                season = season_map.get(season_jp, season_jp)
                description = f'{category}'
                local_dish = f'{notes}' if notes else ''
                
                m_img = re.search(r'`(.*?)`', image_str)
                image_file = m_img.group(1) if m_img else image_str
                image_url = f'images/{image_file}'.replace('.jpg', '.png')
                if not image_url.endswith('.png'):
                    image_url += '.png'                
                name = name.replace("'", "''")
                description = description.replace("'", "''")
                local_dish = local_dish.replace("'", "''")
                image_url = image_url.replace("'", "''")
                
                if current_pref:
                    values.append(f"('{current_pref}', '{season}', '{name}', '{description}', '{local_dish}', '{image_url}')")
    
    sql = 'SET NAMES utf8mb4;\n-- 一旦、現在のデータをすべてリセットします\n'
    sql += 'CREATE TABLE IF NOT EXISTS specialties (\n'
    sql += '    id bigint not null auto_increment,\n'
    sql += '    description TEXT,\n'
    sql += '    image_url TEXT,\n'
    sql += '    local_dish TEXT,\n'
    sql += '    name varchar(255),\n'
    sql += '    prefecture varchar(255),\n'
    sql += '    season varchar(255),\n'
    sql += '    primary key (id)\n'
    sql += ') engine=InnoDB;\n'
    sql += 'TRUNCATE TABLE specialties;\n\n'
    sql += '-- デジタル変革実験_food_images_mapping のデータをインサートします\n'
    sql += 'INSERT INTO specialties (prefecture, season, name, description, local_dish, image_url) VALUES\n'
    sql += ',\n'.join(values) + ';\n'
    
    with open('c:\\Users\\kenka\\OneDrive - Chiba Institute of Technology\\デスクトップ\\cit_map-project\\cit-map-project\\map-project\\insert_specialties.sql', 'w', encoding='utf-8') as f:
        f.write(sql)
    
    try:
        with open('c:\\Users\\kenka\\OneDrive - Chiba Institute of Technology\\デスクトップ\\cit_map-project\\cit-map-project\\mysql\\init\\insert_specialties.sql', 'w', encoding='utf-8') as f:
            f.write(sql)
    except Exception as e:
        print('Error writing to mysql folder:', e)

convert()
