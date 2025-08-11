import zipfile
import os

zip_path = r"C:\Users\vinee\OneDrive\skin_cancer\Skin-Cancer-Detection-\CNN_assignment.zip"
extract_dir = r"C:\Users\vinee\OneDrive\skin_cancer\Skin-Cancer-Detection-\dataset"

# Extract if not already extracted
if not os.path.exists(extract_dir):
    os.makedirs(extract_dir, exist_ok=True)
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        zip_ref.extractall(extract_dir)
    print(f"Dataset extracted to {extract_dir}")
else:
    print("Dataset already extracted")
