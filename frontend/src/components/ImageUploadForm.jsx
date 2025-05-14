import React, { useState } from 'react';
import axios from 'axios';
import './ImageUploadForm.css'
import { useNavigate } from 'react-router-dom';

const ImageUploadForm = ({ selectedAcronyms, FULL_BRAIN }) => {
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Handle file input change
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + images.length < 2) {
      setError('Please upload at least 2 images.');
    } else {
      setError('');
      setImages((prevImages) => [...prevImages, ...files]);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (images.length < 2) {
      setError('Please upload at least 2 images.');
      return;
    }

    const formData = new FormData();
    images.forEach((image, index) => {
      formData.append('images', image);
    });

    console.log('Selected Acronyms form:', selectedAcronyms);
    if (selectedAcronyms.length === 0) {
      window.alert('No structures selected or Selected Structures are not part of the validated list. Defaulting to FULL_BRAIN.');
      selectedAcronyms = Array.from(FULL_BRAIN); // Default to FULL_BRAIN
    }
    // Add the structures list as a JSON string
    formData.append('structures', JSON.stringify(selectedAcronyms));

    try {
        const response = await axios.post('http://localhost:5000/api/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        console.log(response.data)
        if (response.status === 200) {
          console.log('Images uploaded successfully:', response.data);
          alert('Images uploaded successfully!');
          setImages([]); // Clear the images
          setError(''); // Clear any previous errors
          navigate('/results', { state: { images: response.data.images, masks: response.data.masks } });
        }
    } catch (error) {
        console.error('Error uploading images:', error.response?.data || error.message);
        setError(error.response?.data?.error || 'Failed to upload images. Please try again.');
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit}>
        <div className="file-input">
          <label htmlFor="image-upload">Upload Images (Minimum 2):</label>
          <input
            type="file"
            id="image-upload"
            accept="image/*"
            multiple
            onChange={handleImageChange}
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        
        <div className="selected-images">
          <h3>Selected Images:</h3>
          <ul>
            {images.map((image, index) => (
              <li key={index}>{image.name}</li>
            ))}
          </ul>
        </div>
        <button type="submit" className="submit-button" disabled={images.length < 2}>
          Submit
        </button>
      </form>
    </div>
  );
};

export default ImageUploadForm;