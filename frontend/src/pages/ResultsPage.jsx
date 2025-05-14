import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import './ResultsPage.css';
import * as d3 from 'd3';

const ResultsPage = () => {
  const location = useLocation();

  // Mock data (Replace with actual API response)
  const images = ["tmpbup0ozv0.png", "tmplzrpswqe.png", "tmpts1k07r7.png"];
  const masks = ["tmpbup0ozv0_mask.png", "tmplzrpswqe_mask.png", "tmpts1k07r7_mask.png"];
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [histogramLoaded, setHistogramLoaded] = useState(false);
  const [imageList, setImageList] = useState([]);
  const [hullData, setHullData] = useState([]);
  const [visibleStructures, setVisibleStructures] = useState({});
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });
  const [resultsRaw, setResultsRaw] = useState([]);
  const svgRef = useRef();

  // Base URL for images
  const BASE_URL = "http://localhost:5000/temp";

  const scaleCoordinates = (point, originalDims, displayDims) => {
    const [x, y] = point;
    const scaleX = displayDims[0] / originalDims[0];
    const scaleY = displayDims[1] / originalDims[1];
    
    return [x * scaleX, y * scaleY];
  };

  const handleResize = () => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight
    });
  };

  const getCurrentImageMetrics = () => {
    return resultsRaw.find(row => row.Filename === currentImage?.Filename);
  };

  useEffect(() => {
    // Load convex_hulls.json from backend
    fetch(`${BASE_URL}/convex_hulls.json`)
      .then(res => res.json())
      .then(data => {
        setHullData(data);
        setImageList(data.map(d => d.Filename));
        // Initialize all structures as visible
        const initialVisibility = {};
        data[0] && Object.keys(data[0].Structures).forEach(struc => {
          initialVisibility[struc] = true;
        });
        setVisibleStructures(initialVisibility);
      });

    fetch(`${BASE_URL}/results-raw`)
      .then(res => res.json())
      .then(data => {
        console.log(data);
        setResultsRaw(data.csv_data);
        console.log(resultsRaw)
      })
  }, []);

  // Preload images before displaying them to prevent desync issues
  // useEffect(() => {
  //   setIsLoading(true);

  //   const originalImg = new Image();
  //   const maskImg = new Image();

  //   originalImg.src = `${BASE_URL}/${images[currentIndex]}`;
  //   maskImg.src = `${BASE_URL}/${masks[currentIndex]}`;

  //   let originalLoaded = false;
  //   let maskLoaded = false;

  //   originalImg.onload = () => {
  //     originalLoaded = true;
  //     if (maskLoaded) {
  //       setIsLoading(false);
  //     }
  //   };

  //   maskImg.onload = () => {
  //     maskLoaded = true;
  //     if (originalLoaded) {
  //       setIsLoading(false);
  //     }
  //   };
  // }, [currentIndex]);

  const currentImage = hullData[currentIndex];
  const imageRef = useRef();

  useEffect(() => {
    // Function to handle resize events
    const handleResize = () => {
      // Force re-render of SVG overlays by triggering the useEffect that draws them
      // We can do this by creating a shallow copy of the visibleStructures state
      // Only trigger if we have current image and image ref
      if (currentImage && imageRef.current) {
        // Create a slight delay to ensure image dimensions are updated
        setTimeout(() => {
          // Force re-render by triggering the above useEffect
          setVisibleStructures(prev => ({...prev}));
        }, 100);
      }
    };
  
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [currentImage]);

  useEffect(() => {
    // When the component mounts, ensure structures are rendered after the image loads
    if (imageRef.current && imageRef.current.complete) {
      // Image is already loaded, force a re-render of structures
      setVisibleStructures(prev => ({...prev}));
    } else if (imageRef.current) {
      // Add a load event listener to the image
      const handleImageLoad = () => {
        setVisibleStructures(prev => ({...prev}));
      };
      
      imageRef.current.addEventListener('load', handleImageLoad);
      
      return () => {
        if (imageRef.current) {
          imageRef.current.removeEventListener('load', handleImageLoad);
        }
      };
    }
  }, [currentIndex]);

  useEffect(() => {
    if (!currentImage || !imageRef.current) {
      console.error("No current image data available");
      return;
    }
    
    console.log("Current image dimensions:", currentImage.Dimensions);
    
    const handleImageLoad = () => {
      if (!currentImage.Structures) {
        console.error("No Structures object in current image data");
        return;
      }

      // Get the actual rendered dimensions of the image
      const displayDimensions = [
        imageRef.current.clientWidth,
        imageRef.current.clientHeight
      ];
      const originalDimensions = currentImage.Dimensions;

      const svg = d3.select(svgRef.current);
      svg.selectAll("*").remove(); // Clear previous hulls

      svg.attr("width", displayDimensions[0])
          .attr("height", displayDimensions[1]);

      // svg.attr("viewBox", `0 0 ${currentImage.Dimensions[0]} ${currentImage.Dimensions[1]}`)
      // .attr("preserveAspectRatio", "xMidYMid meet");

      const { Structures } = currentImage;
      console.log(currentImage.Structures);

      Object.entries(Structures).forEach(([structure, hulls]) => {
        if (!visibleStructures[structure]) return;

        // Check if hulls is an array and has elements
        if (!Array.isArray(hulls) || hulls.length === 0) {
          console.warn(`No hull data for structure ${structure}`);
          return;
        }

        hulls.forEach((hull, idx) => {
          // Validate hull data
          if (!Array.isArray(hull) || hull.length < 3) {
            console.warn(`Invalid hull data for ${structure} (hull ${idx})`, hull);
            return;
          }

          // Scale each point in the hull
          const scaledHull = hull.map(point => 
            scaleCoordinates(point, originalDimensions, displayDimensions)
          );
          console.log(`Drawing hull for ${structure} (hull ${idx}):`, hull);
          
          svg.append("polygon")
          .attr("points", scaledHull.map(([x, y]) => `${x},${y}`).join(" "))
          .attr("fill", "rgba(255,0,0,0.2)")
          .attr("stroke", "red")
          .attr("stroke-width", 2)
          .attr("data-structure", structure)
          .attr("class", `hull-${structure}`);
        });
    });
  };
  // If image is already loaded, render immediately
  if (imageRef.current.complete) {
    handleImageLoad();
  } else {
    // Otherwise, wait for image to load
    imageRef.current.addEventListener('load', handleImageLoad);
    return () => {
      imageRef.current.removeEventListener('load', handleImageLoad);
    };
  }
}, [currentImage, visibleStructures, windowSize]);

  const toggleStructure = (structure) => {
    setVisibleStructures(prev => ({
      ...prev,
      [structure]: !prev[structure]
    }));
  };

  // Function to navigate to the previous image
  const prevImage = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prevIndex) => prevIndex - 1);
    }
  };

  // Function to navigate to the next image
  const nextImage = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex((prevIndex) => prevIndex + 1);
    }
  };

  const names_list = ["Anteromedial nucleus", "Anterodorsal nucleus","Mediodorsal nucleus of thalamus","Parataenial nucleus" ]
  return (
    <div className="results-container">
      <header className="header-banner">
        <h1>Brain Atlas Platform</h1>
      </header>
      <h2>Processing Results</h2>

      {/* Top Half: Side-by-Side Images */}
      {currentImage ? (
        <div className="viewer-section">
          {/* Image + overlay */}
          <div className="image-overlay-container"
              // style={{
              //   width: currentImage.Dimensions[0],
              //   height: currentImage.Dimensions[1],
              // }}
              >
            <img
              ref={imageRef}
              src={`${BASE_URL}/${currentImage.Filename}`}
              alt="Original"
              className="background-image"
            />
            <svg
              ref={svgRef}
              className="overlay-svg"
              width={currentImage.Dimensions[0]}
              height={currentImage.Dimensions[1]}
            />
          </div>

          {/* Structure toggles */}
          <div className="structure-list">
            <h3>Toggle Structures</h3>
            {Object.keys(currentImage.Structures).map((structure, idx) => {
              const metrics = getCurrentImageMetrics();
              const count = metrics?.[structure] ?? '...';
              console.log(count)

              return (
                <label key={idx}>
                  <input
                    type="checkbox"
                    checked={visibleStructures[structure]}
                    onChange={() => toggleStructure(structure)}
                  />
                  {structure} Count: {count}
                </label>
              );})}
          </div>
        </div>
      ) : (
        <div>Loading...</div>
      )}

      {/* Navigation */}
      <div className="nav-buttons">
        <button onClick={prevImage} disabled={currentIndex === 0}>&#9664; Prev</button>
        <button onClick={nextImage} disabled={currentIndex === imageList.length - 1}>Next &#9654;</button>
      </div>

      {/* Bottom Half: Histogram */}
      <div className="bottom-half">
        <h2>Intensity Histogram</h2>
        <img 
          src={`${BASE_URL}/histogram.png`} 
          alt="Histogram"
          className={`histogram-image ${histogramLoaded ? 'loaded' : 'loading'}`}
          onLoad={() => setHistogramLoaded(true)}
        />
        {!histogramLoaded && <div className="loading-container">Loading Histogram...</div>}
      </div>
    </div>
  );
};

export default ResultsPage;
