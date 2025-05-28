import { useState } from 'react';
import { Upload, X, Folder, Rat } from 'lucide-react';

export default function MouseExperimentForm({ selectedAcronyms, FULL_BRAIN }) {
  const [step, setStep] = useState(1);
  const [controlMice, setControlMice] = useState(0);
  const [stressMice, setStressMice] = useState(0);
  const [folderStructure, setFolderStructure] = useState({
    control: {},
    stress: {}
  });
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [uploads, setUploads] = useState({});

  // Generate folder structure based on mouse counts
  const generateFolders = () => {
    if (controlMice <= 0 && stressMice <= 0) return;
    
    const newStructure = { control: {}, stress: {} };
    
    for (let i = 1; i <= controlMice; i++) {
      const folderName = `control_mouse_${i}`;
      newStructure.control[folderName] = [];
    }
    
    for (let i = 1; i <= stressMice; i++) {
      const folderName = `stress_mouse_${i}`;
      newStructure.stress[folderName] = [];
    }
    
    setFolderStructure(newStructure);
    setUploads({});
    setStep(2);
  };

  // Handle image uploads from drag and drop
  const handleDrop = (e, mouseType, mouseNumber) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files, mouseType, mouseNumber);
  };

  // Handle image uploads from file input
  const handleFileInput = (e, mouseType, mouseNumber) => {
    const files = Array.from(e.target.files);
    handleFiles(files, mouseType, mouseNumber);
  };

  // Process uploaded files
  const handleFiles = (files, mouseType, mouseNumber) => {
    // Filter for image files only
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) return;
    
    const newUploads = { ...uploads };
    if (!newUploads[`${mouseType}_mouse_${mouseNumber}`]) {
      newUploads[`${mouseType}_mouse_${mouseNumber}`] = [];
    }
    
    // Add new files with preview URLs
    imageFiles.forEach(file => {
      const previewUrl = URL.createObjectURL(file);
      newUploads[`${mouseType}_mouse_${mouseNumber}`].push({
        file,
        preview: previewUrl,
        name: file.name
      });
    });
    
    setUploads(newUploads);
  };
  
  // Remove an image from the uploads
  const removeImage = (mouseType, mouseNumber, index) => {
    const uploadKey = `${mouseType}_mouse_${mouseNumber}`;
    const newUploads = { ...uploads };
    
    if (newUploads[uploadKey] && newUploads[uploadKey][index]) {
      // Release the object URL to avoid memory leaks
      URL.revokeObjectURL(newUploads[uploadKey][index].preview);
      
      // Remove the image
      newUploads[uploadKey].splice(index, 1);
      setUploads(newUploads);
    }
  };

  // Allow drag events
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // Submit all uploads to server
  const handleSubmit = async () => {
    try {
      // Organize data for submission
      const uploadData = {
        controlMice,
        stressMice,
        folderData: {} 
      };
      
      // Create FormData object
      const formData = new FormData();
      
      // Add experiment metadata
      formData.append('controlMice', controlMice);
      formData.append('stressMice', stressMice);
      
      // Add all files with their folder paths
      Object.keys(uploads).forEach(key => {
        uploads[key].forEach((upload, index) => {
          formData.append(`${key}_${index}`, upload.file);
        });
      });

      console.log('Selected Acronyms form:', selectedAcronyms);
      if (selectedAcronyms.length === 0) {
          window.alert('No structures selected or Selected Structures are not part of the validated list. Defaulting to FULL_BRAIN.');
          selectedAcronyms = Array.from(FULL_BRAIN); // Default to FULL_BRAIN
      }
      // Add the structures list as a JSON string
      formData.append('structures', JSON.stringify(selectedAcronyms));
      
      // Send to backend
      const response = await fetch('http://localhost:5000/api/upload-mouse-experiment', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('Server response:', result);
      
      // Show success message
      alert('Images uploaded and processed successfully!');
      
    } catch (error) {
      console.error('Error uploading images:', error);
      alert('Error uploading images. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      {step === 1 && (
        <div className="space-y-6">
          <h1 className="text-2xl font-bold text-center mb-6">Mouse Experiment Setup</h1>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Control Mice
              </label>
              <input
                type="number"
                min="0"
                value={controlMice}
                onChange={(e) => setControlMice(parseInt(e.target.value) || 0)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Number of Stress Mice
              </label>
              <input
                type="number"
                min="0"
                value={stressMice}
                onChange={(e) => setStressMice(parseInt(e.target.value) || 0)}
                className="w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>
          
          <button
            onClick={generateFolders}
            disabled={controlMice <= 0 && stressMice <= 0}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium rounded-md"
          >
            Generate Folders
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Image Upload</h1>
            <button
              onClick={() => setStep(1)}
              className="text-blue-600 hover:text-blue-800"
            >
              Change Mouse Counts
            </button>
          </div>
          
          <div className="grid grid-cols-2 gap-6">
            {/* Control Mice Section */}
            {controlMice > 0 && (
              <div className="border rounded-lg p-4">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Rat className="mr-2" size={20} /> Control Mice
                </h2>
                <div className="space-y-4">
                  {Object.keys(folderStructure.control).map((folder) => {
                    const mouseNumber = folder.split('control_mouse_')[1];
                    const uploadKey = `control_mouse_${mouseNumber}`;
                    const imageCount = uploads[uploadKey] ? uploads[uploadKey].length : 0;
                    
                    return (
                      <div key={folder} className="border-t pt-4 first:border-t-0 first:pt-0">
                        <div 
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => setSelectedFolder(selectedFolder === `control_${folder}` ? null : `control_${folder}`)}
                        >
                          <span className="flex items-center">
                            <Folder className="mr-2" size={16} />
                            {folder.replace('control_', '')}
                          </span>
                          <span className="text-sm text-gray-500">
                            {imageCount} images
                          </span>
                        </div>
                        
                        {selectedFolder === `control_${folder}` && (
                          <div className="mt-2">
                            {/* Dropzone */}
                            <div
                              className="border-2 border-dashed border-gray-300 rounded-lg p-6 mt-2 text-center"
                              onDrop={(e) => handleDrop(e, 'control', mouseNumber)}
                              onDragOver={handleDragOver}
                            >
                              <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                              <p className="text-sm text-gray-500">
                                Drag images here or
                                <label className="text-blue-600 hover:text-blue-800 ml-1 cursor-pointer">
                                  browse
                                  <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => handleFileInput(e, 'control', mouseNumber)}
                                    className="hidden"
                                  />
                                </label>
                              </p>
                            </div>
                            
                            {/* Image previews */}
                            {uploads[uploadKey] && uploads[uploadKey].length > 0 && (
                              <div className="mt-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-700">
                                    {uploads[uploadKey].length} image{uploads[uploadKey].length !== 1 ? 's' : ''} uploaded
                                  </span>
                                  {uploads[uploadKey].length > 6 && (
                                    <span className="text-xs text-gray-500">Scroll to see more</span>
                                  )}
                                </div>
                                <div className="max-h-64 overflow-y-auto border rounded-lg p-2">
                                  <div className="grid grid-cols-3 gap-2">
                                    {uploads[uploadKey].map((upload, index) => (
                                      <div key={index} className="relative group">
                                        <img
                                          src={upload.preview}
                                          alt={`Preview ${index}`}
                                          className="h-20 w-full object-cover rounded"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => removeImage('control', mouseNumber, index)}
                                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <X size={12} />
                                        </button>
                                        <p className="text-xs truncate mt-1">{upload.name}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Stress Mice Section */}
            {stressMice > 0 && (
              <div className="border rounded-lg p-4">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <Rat className="mr-2" size={20} /> Stress Mice
                </h2>
                <div className="space-y-4">
                  {Object.keys(folderStructure.stress).map((folder) => {
                    const mouseNumber = folder.split('stress_mouse_')[1];
                    const uploadKey = `stress_mouse_${mouseNumber}`;
                    const imageCount = uploads[uploadKey] ? uploads[uploadKey].length : 0;
                    
                    return (
                      <div key={folder} className="border-t pt-4 first:border-t-0 first:pt-0">
                        <div 
                          className="flex items-center justify-between cursor-pointer"
                          onClick={() => setSelectedFolder(selectedFolder === `stress_${folder}` ? null : `stress_${folder}`)}
                        >
                          <span className="flex items-center">
                            <Folder className="mr-2" size={16} />
                            {folder.replace('stress_', '')}
                          </span>
                          <span className="text-sm text-gray-500">
                            {imageCount} images
                          </span>
                        </div>
                        
                        {selectedFolder === `stress_${folder}` && (
                          <div className="mt-2">
                            {/* Dropzone */}
                            <div
                              className="border-2 border-dashed border-gray-300 rounded-lg p-6 mt-2 text-center"
                              onDrop={(e) => handleDrop(e, 'stress', mouseNumber)}
                              onDragOver={handleDragOver}
                            >
                              <Upload className="mx-auto text-gray-400 mb-2" size={24} />
                              <p className="text-sm text-gray-500">
                                Drag images here or
                                <label className="text-blue-600 hover:text-blue-800 ml-1 cursor-pointer">
                                  browse
                                  <input
                                    type="file"
                                    multiple
                                    accept="image/*"
                                    onChange={(e) => handleFileInput(e, 'stress', mouseNumber)}
                                    className="hidden"
                                  />
                                </label>
                              </p>
                            </div>
                            
                            {/* Image previews */}
                            {uploads[uploadKey] && uploads[uploadKey].length > 0 && (
                              <div className="mt-4">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sm font-medium text-gray-700">
                                    {uploads[uploadKey].length} image{uploads[uploadKey].length !== 1 ? 's' : ''} uploaded
                                  </span>
                                  {uploads[uploadKey].length > 6 && (
                                    <span className="text-xs text-gray-500">Scroll to see more</span>
                                  )}
                                </div>
                                <div className="max-h-64 overflow-y-auto border rounded-lg p-2">
                                  <div className="grid grid-cols-3 gap-2">
                                    {uploads[uploadKey].map((upload, index) => (
                                      <div key={index} className="relative group">
                                        <img
                                          src={upload.preview}
                                          alt={`Preview ${index}`}
                                          className="h-20 w-full object-cover rounded"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => removeImage('stress', mouseNumber, index)}
                                          className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <X size={12} />
                                        </button>
                                        <p className="text-xs truncate mt-1">{upload.name}</p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
          
          <div className="mt-8">
            <button
              onClick={handleSubmit}
              className="w-full py-2 px-4 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md"
            >
              Submit All Images
            </button>
          </div>
        </div>
      )}
    </div>
  );
}