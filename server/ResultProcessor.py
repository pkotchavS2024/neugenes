import pandas as pd
import os
import CustomHeatMap as chm
import matplotlib.pyplot as plt


def read_csv_and_generate_dict(file_path):
    """
    Reads a CSV file and generates a dictionary with region names as keys
    and their corresponding values.

    Parameters
    ----------
    file_path : str
        Path to the CSV file.

    Returns
    -------
    dict
        Dictionary with region names as keys and their corresponding values.
    """
    data_dict = {}
    df = pd.read_csv(file_path)
    structures = df.columns[1:].to_list()

    # Sum over the specified structures
    region_sums1 = df[structures].sum()

    # Scale intensities to a range of 0-100
    region_sums1_scaled = (region_sums1 / region_sums1.max()) * 100

    data_dict = {structure: region_sums1_scaled[structure] for structure in structures if structure != "AHA"}
    return data_dict

# from brainrender.atlas import Atlas

# atlas = Atlas("allen_mouse_25um")
# print(atlas.lookup_df[["acronym", "name"]].to_string())

def read_all_csv_and_generate_dict(base_dir):
    """
    Reads result_norm.csv files from mouse folders and organizes structure data into stress and control groups.
    Computes raw sums per structure per mouse, group averages, and global min/max values.

    Parameters
    ----------
    base_dir : str
        Base directory containing mouse folders (control and stress groups)

    Returns
    -------
    dict
        Dictionary structured as:
        {
            structure_name: {
                'control': [...],
                'stress': [...],
                'control_avg': float,
                'stress_avg': float
            },
            ...
            'min_value': float,
            'max_value': float
        }
    """
    structure_data = {}
    all_values = []

    # Process control mice
    control_dir = os.path.join(base_dir, "control")
    if os.path.exists(control_dir):
        for mouse_folder in os.listdir(control_dir):
            mouse_path = os.path.join(control_dir, mouse_folder)
            if os.path.isdir(mouse_path):
                result_file = os.path.join(mouse_path, "result_norm.csv")
                if os.path.exists(result_file):
                    df = pd.read_csv(result_file)
                    structures = df.columns[1:]  # Skip first column

                    for structure in structures:
                        if structure == "AHA":
                            continue

                        structure_sum = df[structure].sum()

                        if structure not in structure_data:
                            structure_data[structure] = {"control": [], "stress": []}

                        structure_data[structure]["control"].append(structure_sum)
                        all_values.append(structure_sum)

    # Process stress mice
    stress_dir = os.path.join(base_dir, "stress")
    if os.path.exists(stress_dir):
        for mouse_folder in os.listdir(stress_dir):
            mouse_path = os.path.join(stress_dir, mouse_folder)
            if os.path.isdir(mouse_path):
                result_file = os.path.join(mouse_path, "result_norm.csv")
                if os.path.exists(result_file):
                    df = pd.read_csv(result_file)
                    structures = df.columns[1:]  # Skip first column

                    for structure in structures:
                        if structure == "AHA":
                            continue

                        structure_sum = df[structure].sum()

                        if structure not in structure_data:
                            structure_data[structure] = {"control": [], "stress": []}

                        structure_data[structure]["stress"].append(structure_sum)
                        all_values.append(structure_sum)

    # Compute averages and add them to the dict
    for structure, groups in structure_data.items():
        control_vals = groups["control"]
        stress_vals = groups["stress"]
        groups["control_avg"] = sum(control_vals) / len(control_vals) if control_vals else 0
        groups["stress_avg"] = sum(stress_vals) / len(stress_vals) if stress_vals else 0

    # Compute min and max over all raw values
    if all_values:  # Only add min/max if we have values
        structure_data["min_value"] = min(all_values)
        structure_data["max_value"] = max(all_values)
    else:
        structure_data["min_value"] = 0
        structure_data["max_value"] = 0

    return structure_data

def plot_group_heatmaps(data_dict, min_val, max_val, title_prefix, save_path, cmap):
    fig, axs = plt.subplots(6, 4, figsize=(18, 12))
    positions = range(0, 12000, 500)
    scenes = []

    for distance in positions:
        scene = chm.CustomHeatMap(
            data_dict,
            position=distance,
            orientation="frontal",
            thickness=10,
            format="2D",
            cmap=cmap,
            vmin=min_val,
            vmax=max_val,
            label_regions=False,
            annotate_regions=False,
        )
        scenes.append(scene)

    for scene, ax, pos in zip(scenes, axs.flatten(), positions, strict=False):
        scene.plot_subplot(fig=fig, ax=ax, show_cbar=True, hide_axes=False)
        print(f"{title_prefix}: finished processing slice at {pos} µm")

    plt.tight_layout()
    plt.savefig(save_path, dpi=300)
    plt.close(fig)