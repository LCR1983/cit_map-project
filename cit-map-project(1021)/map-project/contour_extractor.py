import zlib
import struct
import os
import math
import json

def decode_png_alpha(png_path):
    with open(png_path, 'rb') as f:
        signature = f.read(8)
        if signature != b'\x89PNG\r\n\x1a\n':
            raise ValueError("Not a PNG file")
        
        idat_data = b''
        width = 0
        height = 0
        color_type = 0
        
        while True:
            length_bytes = f.read(4)
            if not length_bytes:
                break
            length = struct.unpack('>I', length_bytes)[0]
            chunk_type = f.read(4)
            chunk_data = f.read(length)
            f.read(4) # CRC
            
            if chunk_type == b'IHDR':
                width, height, bit_depth, color_type, compression, filter_method, interlace_method = struct.unpack('>IIBBBBB', chunk_data)
            elif chunk_type == b'IDAT':
                idat_data += chunk_data
            elif chunk_type == b'IEND':
                break
                
        if color_type != 6:
            raise ValueError(f"Only RGBA PNGs are supported, color_type is {color_type}")
            
        decompressed = zlib.decompress(idat_data)
        stride = width * 4 + 1
        recon = bytearray(height * width * 4)
        
        def paeth_predictor(a, b, c):
            p = a + b - c
            pa = abs(p - a)
            pb = abs(p - b)
            pc = abs(p - c)
            if pa <= pb and pa <= pc:
                return a
            elif pb <= pc:
                return b
            else:
                return c

        for y in range(height):
            filter_type = decompressed[y * stride]
            row_data = decompressed[y * stride + 1 : (y + 1) * stride]
            
            for x in range(width):
                idx = (y * width + x) * 4
                for c in range(4): # RGBA
                    val = row_data[x * 4 + c]
                    
                    a = recon[idx - 4 + c] if x > 0 else 0
                    b = recon[idx - width * 4 + c] if y > 0 else 0
                    c_val = recon[idx - width * 4 - 4 + c] if (x > 0 and y > 0) else 0
                    
                    if filter_type == 0:
                        recon_val = val
                    elif filter_type == 1:
                        recon_val = (val + a) & 0xff
                    elif filter_type == 2:
                        recon_val = (val + b) & 0xff
                    elif filter_type == 3:
                        recon_val = (val + ((a + b) // 2)) & 0xff
                    elif filter_type == 4:
                        recon_val = (val + paeth_predictor(a, b, c_val)) & 0xff
                    else:
                        recon_val = val
                        
                    recon[idx + c] = recon_val
                    
        # Extract alpha channel
        alpha = []
        for y in range(height):
            row = []
            for x in range(width):
                idx = (y * width + x) * 4 + 3
                row.append(recon[idx])
            alpha.append(row)
            
        return width, height, alpha

def get_contour(width, height, alpha, threshold=30):
    start_x, start_y = -1, -1
    for y in range(height):
        for x in range(width):
            if alpha[y][x] >= threshold:
                is_boundary = False
                for dx, dy in [(-1,0), (1,0), (0,-1), (0,1)]:
                    nx, ny = x + dx, y + dy
                    if nx < 0 or nx >= width or ny < 0 or ny >= height or alpha[ny][nx] < threshold:
                        is_boundary = True
                        break
                if is_boundary:
                    start_x, start_y = x, y
                    break
        if start_x != -1:
            break
            
    if start_x == -1:
        return []
        
    dirs = [
        (0, -1), (1, -1), (1, 0), (1, 1),
        (0, 1), (-1, 1), (-1, 0), (-1, -1)
    ]
    
    contour = []
    curr_x, curr_y = start_x, start_y
    back_dir = 6
    
    max_steps = width * height * 2
    step = 0
    
    while step < max_steps:
        contour.append((curr_x, curr_y))
        
        found = False
        start_search = (back_dir + 2) % 8
        for i in range(8):
            d = (start_search + i) % 8
            dx, dy = dirs[d]
            nx, ny = curr_x + dx, curr_y + dy
            
            if 0 <= nx < width and 0 <= ny < height and alpha[ny][nx] >= threshold:
                curr_x, curr_y = nx, ny
                back_dir = (d + 4) % 8
                found = True
                break
                
        if not found:
            break
        if curr_x == start_x and curr_y == start_y:
            break
            
        step += 1
        
    return contour

def distance_point_to_line(p, l1, l2):
    x0, y0 = p
    x1, y1 = l1
    x2, y2 = l2
    
    dx = x2 - x1
    dy = y2 - y1
    
    denom = math.sqrt(dx*dx + dy*dy)
    if denom == 0:
        return math.sqrt((x0-x1)**2 + (y0-y1)**2)
        
    num = abs(dy * x0 - dx * y0 + x2 * y1 - y2 * x1)
    return num / denom

def rdp(points, epsilon):
    if len(points) < 3:
        return points
        
    dmax = 0
    index = 0
    end = len(points) - 1
    
    for i in range(1, end):
        d = distance_point_to_line(points[i], points[0], points[end])
        if d > dmax:
            index = i
            dmax = d
            
    if dmax > epsilon:
        results1 = rdp(points[:index+1], epsilon)
        results2 = rdp(points[index:], epsilon)
        return results1[:-1] + results2
    else:
        return [points[0], points[end]]

def main():
    project_dir = r"C:\Users\disne\OneDrive\Desktop\map-project"
    
    prefs_config = {
        'gunma': { 'file': '3_kantou3__gunma.png', 'x': 12, 'y': 27, 'w': 252, 'h': 243, 'epsilon': 3.0 },
        'tochigi': { 'file': '3_kantou2__tochigi.png', 'x': 145, 'y': 3, 'w': 242, 'h': 228, 'epsilon': 3.0 },
        'ibaraki': { 'file': '3_kantou1__ibaraki.png', 'x': 208, 'y': 38, 'w': 271, 'h': 290, 'epsilon': 3.0 },
        'saitama': { 'file': '3_kantou4__saitama.png', 'x': 85, 'y': 122, 'w': 207, 'h': 243, 'epsilon': 3.0 },
        'chiba': { 'file': '3_kantou5__chiba.png', 'x': 192, 'y': 190, 'w': 265, 'h': 301, 'epsilon': 3.5 },
        'tokyo': { 'file': '3_kantou6__tokyo.png', 'x': 118, 'y': 180, 'w': 181, 'h': 200, 'epsilon': 2.5 },
        'kanagawa': { 'file': '3_kantou7__kanagawa.png', 'x': 124, 'y': 251, 'w': 142, 'h': 195, 'epsilon': 2.5 }
    }
    
    results = {}
    polygon_tags = []
    
    for pref_id, conf in prefs_config.items():
        img_path = os.path.join(project_dir, conf['file'])
        img_w, img_h, alpha = decode_png_alpha(img_path)
        contour = get_contour(img_w, img_h, alpha, threshold=30)
        simplified = rdp(contour, conf['epsilon'])
        
        svg_points = []
        for (px, py) in simplified:
            sx = conf['x'] + px * conf['w'] / img_w
            sy = conf['y'] + py * conf['h'] / img_h
            svg_points.append((round(sx), round(sy)))
            
        points_str = " ".join(f"{x},{y}" for x, y in svg_points)
        results[pref_id] = svg_points
        
        poly_tag = f'<polygon data-target="{pref_id}" points="{points_str}" fill="rgba(0,0,0,0.001)" class="pref-hit" style="cursor:pointer;" pointer-events="all" />'
        polygon_tags.append((pref_id, points_str, poly_tag))
        
    print("\n--- POLYGON TAGS ---")
    for pref_id, pts, tag in polygon_tags:
        print(tag)
        
    print("\n--- JAVASCRIPT OBJECT ---")
    js_prefs = []
    pref_names = {
        'gunma': '群馬県', 'tochigi': '栃木県', 'ibaraki': '茨城県',
        'saitama': '埼玉県', 'chiba': '千葉県', 'tokyo': '東京都', 'kanagawa': '神奈川県'
    }
    for pref_id, pts, _ in polygon_tags:
        pts_list = [{"x": x, "y": y} for x, y in results[pref_id]]
        js_prefs.append({
            "id": pref_id,
            "name": pref_names[pref_id],
            "points": pts_list
        })
    print(json.dumps(js_prefs, indent=2, ensure_ascii=False))

if __name__ == '__main__':
    main()
