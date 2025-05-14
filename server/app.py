import os
import tempfile
from flask import Flask, request, render_template, send_file, jsonify, send_from_directory
from flask_cors import CORS
from PIL import Image
import os
import importlib
import sys
import shutil
import csv

# Add the parent directory to the system path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Now you can import from model
import model.utils as utils
from model.utils import *
import importlib
importlib.reload(utils) 

from model.model import *
from model.visualize import *

app = Flask(__name__)
CORS(app)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMP_DIR = os.path.join(BASE_DIR, "temp_images")
PROCESS_DIR = os.path.join(BASE_DIR, "temp_images_processed")
os.makedirs(TEMP_DIR, exist_ok=True)
# Function to clear a directory
def clear_directory(directory):
    if os.path.exists(directory):
        shutil.rmtree(directory)  # Remove all contents
        os.makedirs(directory)  # Recreate empty directory

@app.route('/api/clear-temp', methods=['POST'])
def clear_temp_directories():
    try:
        print("in clearing")
        clear_directory(TEMP_DIR)
        clear_directory(PROCESS_DIR)
        return jsonify({"message": "Temporary directories cleared"}), 200
    except Exception as e:
        print(str(e))
        return jsonify({"error": str(e)}), 500
    
@app.route("/api/upload", methods=['POST'])
def upload_images():
    print("in here 1")
    if 'images' not in request.files:
        return jsonify({"error": "No images provided"}), 400

    files = request.files.getlist('images')
    if len(files) < 2:
        return jsonify({"error": "At least 2 images are required"}), 400
    
    for file in files:
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
        if file:
            original_temp = tempfile.NamedTemporaryFile(
                delete=False, suffix=".png", dir=TEMP_DIR
            )
            # file.save(os.path.join(app.config['UPLOAD_FOLDER'], file.filename))
            file.save(original_temp.name)
            original_temp.close()

    print(TEMP_DIR)
    # dataset = "temp_images"
    struct_str = request.form.get('structures')  # This is a JSON string
    struct = json.loads(struct_str) 
    # struct = ['AM', 'AD', 'MD', 'PT']
    print(struct)
    # generate registration on full dataset
    # registration = atlas_registration(TEMP_DIR,True,False,False,None)

    # for img in os.listdir(TEMP_DIR):
    #     image_path = img
    #     print("Path",image_path)
    #     if not img.lower().endswith((".png", ".jpg", ".jpeg", ".tif", ".bmp")):
    #         print(f"Skipping non-image file: {img}")
    #         continue
    #     #alignment for given scan, parsed from full brain registration
    #     alignment = generate_alignment_matrix(registration,image_path)

    #     image = cv2.imread(os.path.join(TEMP_DIR,image_path))
        
    #     # mask aligned to scan for given structure
    #     _, mask,_ = process_mask(acronymn_to_id(struct), alignment,image)
    #     image = np.array(image)
    #     plt.figure(figsize=(20,20))
    #     plt.imshow(image,cmap='gray')
    #     plt.scatter(mask[:, 1], mask[:, 0], s=3, edgecolor='red')
        
    #     save = os.path.join(MASK_DIR, image_path)
    #     plt.savefig(save, dpi=300, bbox_inches='tight')  # Save to a new temp file
    #     plt.close() 

    process(TEMP_DIR, struct, save_mask = True)
    print("in here")
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # Get the directory where app.py is located
    file_path = os.path.join(BASE_DIR, "temp_images_processed", "result_norm.csv")
    outfile_path = os.path.join(BASE_DIR, "temp_images_processed", "histogram.png")
    plot_expression_levels_scaled(file_path,struct, names = ['control_1','stress_5'], 
    title = 'title', output_filepath=outfile_path)

    img_files = os.listdir(TEMP_DIR)
    mask_list = os.listdir(PROCESS_DIR)
    mask_files = [f for f in mask_list if f.endswith('_mask.png')]
    raw_result_path = os.path.join(BASE_DIR, "temp_images_processed", "result_raw.csv")
    csv_data = []

    with open(raw_result_path, newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            csv_data.append(row)
    response = jsonify({"message": "Images uploaded successfully", "images": img_files, "masks": mask_files, "csv_res": csv_data})
    response.headers['Content-Type'] = 'application/json'
    print("before return")
    return response, 200

@app.route("/temp/results-raw")
def get_raw_results():
    csv_file_path = os.path.join(BASE_DIR, "temp_images_processed", "result_raw.csv")
    csv_data = []

    with open(csv_file_path, newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            csv_data.append(row)
    
    response = jsonify({"csv_data": csv_data})
    response.headers['Content-Type'] = 'application/json'
    print("before return")
    return response, 200

@app.route("/temp-image")
def serve_temp_image():
    temp_file_path = request.args.get("path")
    print("I made it here")
    print(temp_file_path)
    if temp_file_path and os.path.exists(temp_file_path):
        # Serve the file, then remove it
        response = send_file(temp_file_path)
        os.remove(temp_file_path)
        return response
    return "File not found.", 404

IMAGE_DIR = "temp_images_processed"
@app.route("/processed-images", methods=["GET"])
def get_processed_images():
    # Get the list of image filenames in the directory
    image_filenames = os.listdir(IMAGE_DIR)
    
    # Construct full URLs for the images
    base_url = "http://localhost:5000"  # Replace with your server's URL
    image_urls = [f"{base_url}/temp/{filename}" for filename in image_filenames]
    
    return jsonify({"images": image_urls})

@app.route("/temp/<filename>", methods=["GET"])
def serve_image(filename):
    # Serve images from the "temp" directory
    return send_from_directory(IMAGE_DIR, filename)

if __name__ == "__main__":
    app.run(port=3000,debug=True)
