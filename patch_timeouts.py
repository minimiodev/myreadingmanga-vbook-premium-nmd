import os

workspace = r"d:\extenbook"
src_dir = os.path.join(workspace, "src")

for file in os.listdir(src_dir):
    if file.endswith(".js"):
        file_path = os.path.join(src_dir, file)
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Replace 20000ms timeout with 8000ms timeout for faster failure response
        new_content = content.replace("20000", "8000")
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)

print("Patched timeouts in all scripts.")
