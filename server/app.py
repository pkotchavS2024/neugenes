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
import json
import concurrent.futures
from functools import partial
import uuid
import ResultProcessor as rp
import CustomHeatMap as chm

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

def process_mouse_folder(mouse_dir, structures):
    """Process a single mouse folder"""
    try:
        # Create a temporary directory for this mouse's processing
        temp_dir_name = f"temp_{os.path.basename(mouse_dir)}_{uuid.uuid4().hex[:8]}"
        temp_mouse_dir = os.path.join(TEMP_DIR, temp_dir_name)
        os.makedirs(temp_mouse_dir, exist_ok=True)

        print(f"Processing {mouse_dir} in {temp_mouse_dir}") 
        
        # Copy files to temp directory
        for file in os.listdir(mouse_dir):
            if file.lower().endswith(('.png', '.jpg', '.jpeg', '.tif', '.bmp')):
                src_path = os.path.join(mouse_dir, file)
                dst_path = os.path.join(temp_mouse_dir, file)
                shutil.copy2(src_path, dst_path)
                print(f"Copied {src_path} to {dst_path}")  # Debug log
        
        # Process the mouse's images
        process(temp_mouse_dir, structures, save_mask=True)
        
        # Move processed results back to mouse directory
        processed_dir = f"{temp_mouse_dir}_processed"
        if os.path.exists(processed_dir):
            print(f"Moving processed files from {processed_dir} to {mouse_dir}")  # Debug log
            for file in os.listdir(processed_dir):
                src_path = os.path.join(processed_dir, file)
                dst_path = os.path.join(mouse_dir, file)
                if os.path.exists(src_path):
                    shutil.move(src_path, dst_path)
                    print(f"Moved {src_path} to {dst_path}")  # Debug log
        
        # Clean up temp directory
        if os.path.exists(processed_dir):
            shutil.rmtree(processed_dir)
        if os.path.exists(temp_mouse_dir):
            shutil.rmtree(temp_mouse_dir)
        
        return True
    except Exception as e:
        print(f"Error processing {mouse_dir}: {str(e)}")
        # Clean up temp directories even if there's an error
        if os.path.exists(processed_dir):
            shutil.rmtree(processed_dir)
        if os.path.exists(temp_mouse_dir):
            shutil.rmtree(temp_mouse_dir)
        return False

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

@app.route("/api/upload-mouse-experiment", methods=['POST'])
def upload_mouse_experiment():
    try:
        # Get the experiment metadata
        control_mice = int(request.form.get('controlMice', 0))
        stress_mice = int(request.form.get('stressMice', 0))
        structures = json.loads(request.form.get('structures', '[]'))
        structures = ['AM', 'AD']
        
        # Create base directories for control and stress mice
        control_dir = os.path.join(TEMP_DIR, 'control')
        stress_dir = os.path.join(TEMP_DIR, 'stress')
        os.makedirs(control_dir, exist_ok=True)
        os.makedirs(stress_dir, exist_ok=True)
        
        # Create mouse-specific directories
        for i in range(1, control_mice + 1):
            os.makedirs(os.path.join(control_dir, f'mouse_{i}'), exist_ok=True)
        for i in range(1, stress_mice + 1):
            os.makedirs(os.path.join(stress_dir, f'mouse_{i}'), exist_ok=True)
        
        # Process all uploaded files
        for key in request.files:
            if '_' in key:  # Format: control_mouse_1_0, stress_mouse_2_0, etc.
                mouse_type, mouse_num = key.split('_mouse_')
                mouse_num = mouse_num.split('_')[0]  # Get just the number
                
                file = request.files[key]
                if file and file.filename:
                    # Determine the target directory
                    target_dir = os.path.join(TEMP_DIR, mouse_type, f'mouse_{mouse_num}')
                    file.save(os.path.join(target_dir, file.filename))

        # Collect all mouse directories that need processing
        mouse_dirs = []
        
        # Add control mouse directories
        for i in range(1, control_mice + 1):
            mouse_dir = os.path.join(control_dir, f'mouse_{i}')
            if os.path.exists(mouse_dir) and os.listdir(mouse_dir):
                mouse_dirs.append(mouse_dir)
        
        # Add stress mouse directories
        for i in range(1, stress_mice + 1):
            mouse_dir = os.path.join(stress_dir, f'mouse_{i}')
            if os.path.exists(mouse_dir) and os.listdir(mouse_dir):
                mouse_dirs.append(mouse_dir)
        
        # Process all mouse directories in parallel
        with concurrent.futures.ThreadPoolExecutor() as executor:
            # Create a partial function with the structures parameter
            process_func = partial(process_mouse_folder, structures=structures)
            # Submit all processing tasks
            future_to_dir = {executor.submit(process_func, mouse_dir): mouse_dir for mouse_dir in mouse_dirs}
            
            # Wait for all tasks to complete
            results = []
            for future in concurrent.futures.as_completed(future_to_dir):
                mouse_dir = future_to_dir[future]
                try:
                    success = future.result()
                    results.append((mouse_dir, success))
                except Exception as e:
                    print(f"Error processing {mouse_dir}: {str(e)}")
                    results.append((mouse_dir, False))
        
        # Check if all processing was successful
        all_successful = all(success for _, success in results)
        
        if all_successful:
            return jsonify({
                "message": "Mouse experiment uploaded and processed successfully"
            }), 200
        else:
            failed_dirs = [dir for dir, success in results if not success]
            return jsonify({
                "message": "Some mouse folders failed to process",
                "failed_folders": failed_dirs
            }), 500
        # # Process each mouse's images individually
        # mouse_names = []
        
        # # Process control mice
        # for i in range(1, control_mice + 1):
        #     mouse_dir = os.path.join(control_dir, f'mouse_{i}')
        #     if os.path.exists(mouse_dir) and os.listdir(mouse_dir):  # Check if directory exists and has files
        #         process(mouse_dir, structures, save_mask=True)
        #         mouse_names.append(f'control_{i}')
        
        # # Process stress mice
        # for i in range(1, stress_mice + 1):
        #     mouse_dir = os.path.join(stress_dir, f'mouse_{i}')
        #     if os.path.exists(mouse_dir) and os.listdir(mouse_dir):  # Check if directory exists and has files
        #         process(mouse_dir, structures, save_mask=True)
        #         mouse_names.append(f'stress_{i}')
        
        
        # # Process the images with the given structures
        # process(TEMP_DIR, structures, save_mask=True)
        
        # # Generate results
        # file_path = os.path.join(BASE_DIR, "temp_images_processed", "result_norm.csv")
        # outfile_path = os.path.join(BASE_DIR, "temp_images_processed", "histogram.png")
        
        # # Create mouse names list for the plot
        # mouse_names = []
        # for i in range(1, control_mice + 1):
        #     mouse_names.append(f'control_{i}')
        # for i in range(1, stress_mice + 1):
        #     mouse_names.append(f'stress_{i}')
            
        # plot_expression_levels_scaled(file_path, structures, names=mouse_names,
        #                             title='Expression Levels', output_filepath=outfile_path)
        
        # # Get results
        # raw_result_path = os.path.join(BASE_DIR, "temp_images_processed", "result_raw.csv")
        # csv_data = []
        # with open(raw_result_path, newline='') as f:
        #     reader = csv.DictReader(f)
        #     for row in reader:
        #         csv_data.append(row)

        structure_data = rp.read_all_csv_and_generate_dict(TEMP_DIR)

        min_val = structure_data.pop("min_value")
        max_val = structure_data.pop("max_value")

        control_data = {}
        stress_data = {}

        for structure, data in structure_data.items():
            control_data[structure] = data["control_avg"]
            stress_data[structure] = data["stress_avg"]

        control_data_dict = chm.create_mapped_nan_dict(control_data)
        stress_data_dict = chm.create_mapped_nan_dict(stress_data)

        cmap = chm.create_transparent_colormap("PuRd")

        rp.plot_group_heatmaps(control_data_dict, min_val, max_val, "Control", "control_heatmap.png", cmap)
        rp.plot_group_heatmaps(stress_data_dict, min_val, max_val, "Stress", "stress_heatmap.png", cmap)

        return jsonify({
            "message": "Mouse experiment uploaded and processed successfully"
        }), 200
        
    except Exception as e:
        print(f"Error processing mouse experiment: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(port=3000,debug=True)
