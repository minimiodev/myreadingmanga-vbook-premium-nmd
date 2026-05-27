import os
import shutil
import json
import zipfile

workspace = r"d:\extenbook"
src_dir = os.path.join(workspace, "src")
icon_file = os.path.join(workspace, "icon.png")
zip_output = os.path.join(workspace, "myreadingmanga_vbook.zip")
temp_dir = os.path.join(workspace, "temp_pkg")

# 1. Clean up old files
if os.path.exists(temp_dir):
    shutil.rmtree(temp_dir)
if os.path.exists(zip_output):
    os.remove(zip_output)

# 2. Create temp directory
os.makedirs(temp_dir)
shutil.copytree(src_dir, os.path.join(temp_dir, "src"))
shutil.copy2(icon_file, os.path.join(temp_dir, "icon.png"))

# 3. Create the INTERNAL plugin.json (single object) for the extension itself
internal_manifest = {
    "metadata": {
        "name": "MyReadingMangaPremium",
        "author": "Nguyễn Mạnh Dũng",
        "version": 100,
        "source": "https://myreadingmanga.info",
        "regexp": r"https?:\/\/(myreadingmanga\.(info|to|xyz))\/.*",
        "description": "Tiện ích mở rộng siêu nâng cao cho MyReadingManga - Tác giả Nguyễn Mạnh Dũng. Hỗ trợ tự động vượt Cloudflare, gộp nhiều trang thành 1 chương duy nhất và tự động chuyển đổi sang tên miền hoạt động khi bị chặn.",
        "locale": "vi_VN",
        "tag": "nsfw",
        "type": "comic"
    },
    "script": {
        "home": "home.js",
        "detail": "detail.js",
        "search": "search.js",
        "toc": "toc.js",
        "chap": "chap.js"
    }
}

with open(os.path.join(temp_dir, "plugin.json"), "w", encoding="utf-8") as f:
    json.dump(internal_manifest, f, ensure_ascii=False, indent=2)

# 4. Zip the temp_pkg contents (files must be at the root of the zip, not in a nested temp_pkg folder)
with zipfile.ZipFile(zip_output, "w", zipfile.ZIP_DEFLATED) as zip_file:
    for root, dirs, files in os.walk(temp_dir):
        for file in files:
            file_path = os.path.join(root, file)
            # Make the path relative to temp_dir
            arcname = os.path.relpath(file_path, temp_dir)
            zip_file.write(file_path, arcname)

# 5. Clean up temp folder
shutil.rmtree(temp_dir)

# 6. Create the MASTER plugin.json (JSON array) at the root of the workspace for the Repository list
master_manifest = [
    {
        "name": "MyReadingManga",
        "author": "Nguyễn Mạnh Dũng",
        "version": 100,
        "source": "https://myreadingmanga.info",
        "regexp": r"https?:\/\/(myreadingmanga\.(info|to|xyz))\/.*",
        "description": "Tiện ích mở rộng siêu nâng cao cho MyReadingManga - Tác giả Nguyễn Mạnh Dũng. Hỗ trợ tự động vượt Cloudflare, gộp nhiều trang thành 1 chương duy nhất và tự động chuyển đổi sang tên miền hoạt động khi bị chặn.",
        "locale": "vi_VN",
        "tag": "nsfw",
        "type": "comic",
        "path": "myreadingmanga_vbook.zip"
    }
]

with open(os.path.join(workspace, "plugin.json"), "w", encoding="utf-8") as f:
    json.dump(master_manifest, f, ensure_ascii=False, indent=2)

print("Packaged VBook extension successfully.")
