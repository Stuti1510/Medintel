import os
import sys
import urllib.request
import zipfile
import threading

FILES = [
    {
        "name": "imgs_part_1.zip",
        "url": "https://data.mendeley.com/public-files/datasets/zr7vgbcyr2/files/1cc2f71f-20a2-412d-b746-a9b9bc20c966/file_downloaded",
        "size": 1245184680
    },
    {
        "name": "imgs_part_2.zip",
        "url": "https://data.mendeley.com/public-files/datasets/zr7vgbcyr2/files/559a60ed-5504-475d-996c-6a8bc253b5e7/file_downloaded",
        "size": 1126646990
    },
    {
        "name": "imgs_part_3.zip",
        "url": "https://data.mendeley.com/public-files/datasets/zr7vgbcyr2/files/34dcdf8e-e5f1-4b35-aa0b-5135051ff852/file_downloaded",
        "size": 1220565093
    }
]

RAW_DIR = os.path.abspath("data/raw/pad_ufes_20")
IMAGES_DIR = os.path.join(RAW_DIR, "images")
os.makedirs(IMAGES_DIR, exist_ok=True)

def download_and_extract(item):
    zip_path = os.path.join(RAW_DIR, item["name"])
    print(f"[{item['name']}] Starting download...")
    
    # Download with progress
    req = urllib.request.Request(item["url"], headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(req) as resp, open(zip_path, "wb") as out_f:
        downloaded = 0
        total = item["size"]
        while True:
            chunk = resp.read(1024 * 1024) # 1MB
            if not chunk:
                break
            out_f.write(chunk)
            downloaded += len(chunk)
            if downloaded % (50 * 1024 * 1024) == 0 or downloaded == total:
                print(f"[{item['name']}] {downloaded / (1024*1024):.1f}MB / {total / (1024*1024):.1f}MB ({downloaded/total*100:.1f}%)")
    
    print(f"[{item['name']}] Download finished! Extracting...")
    with zipfile.ZipFile(zip_path, 'r') as zf:
        zf.extractall(IMAGES_DIR)
    print(f"[{item['name']}] Extraction complete. Removing zip...")
    try:
        os.remove(zip_path)
    except Exception:
        pass
    print(f"[{item['name']}] Done!")

if __name__ == "__main__":
    threads = []
    for item in FILES:
        t = threading.Thread(target=download_and_extract, args=(item,))
        threads.append(t)
        t.start()
    
    for t in threads:
        t.join()
    print("All PAD-UFES-20 images downloaded and extracted successfully!")
