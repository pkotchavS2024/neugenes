import React, { useState, useEffect } from 'react';
import ImageUploadForm from '../components/ImageUploadForm';
import HierarchyTree from '../components/HierarchyTree';
import structureData from '../data/structures.json';
import { buildTree } from '../helpers/treeUtils';
import './HomePage.css';
import axios from 'axios';

const FULL_BRAIN = new Set([  'SSp-ll', 'SSp-tr', 'VISC', 'AUDpo', 'VISal', 'VISam', 'VISl', 'VISp', 'VISpl', 'VISpm', 
  'VISli', 'VISpor', 'ACAd', 'ACAv', 'PL', 'ILA', 'ORB', 'VISrl', 'TEa', 'AId', 'AIp', 'AIv', 
  'RSPagl', 'RSPd', 'RSPv', 'PTLp', 'PERI', 'ECT', 'TT', 'DP', 'PIR', 'NLOT', 'COA', 'PAA', 'TR', 
  'HPF', 'FC', 'ENTl', 'ENTm',  'PAR', 'POST', 'PRE', 'SUB', 'ProS', 'CLA', 'EP', 'LA', 'BMA', 
  'ACB', 'FS', 'LSc', 'LSr', 'LSv', 'SH', 'sAMY', 'MEA', 'GPe', 'GPi', 'SI', 'MA', 'NDB',  'SPF', 
  'PP', 'MG', 'SGN', 'AM', 'AD', 'MD', 'PT', 'RE', 'RH', 'PCN', 'SubG', 'SO', 'ASO', 'PVH', 'ARH', 
  'ADP', 'AHA', 'MEPO', 'PS', 'SCH', 'VMH', 'TU', 'ZI', 'VTA', 'RN', 'SOC', 'TRN', 'LDT', 'CN', 
  'PARN', 'RPA', 'DN', 'PVT', 'BLA', 'ARH', 'DMH', 'ENT', 'FRP', 'HPF', 'HY', 'ILA', 'LHA', 'LS', 
  'MPO', 'MPN', 'MD', 'MBmot', 'ACB', 'NTS', 'PB', 'PVH', 'PeF', 'PIR', 'PH', 'PL', 'SSp', 'VISp', 
  'RSP', 'MOs', 'SFO', 'SCH', 'VMH', 'VTA', 'TH', 'VAL', 'VP', 'MG', 'LGd', 'LP', 'PO', 'POL', 'VM', 
  'VPL', 'VPM', 'PVT', 'AV', 'AM', 'AD', 'IAM', 'IAD', 'LD', 'IMD', 'MTN', 'PCN', 'CL', 'PF', 'RE', 
  'Xi', 'ILM', 'RH', 'CM', 'SGN', 'GENd', 'GENv', 'VPLpc', 'VPMpc', 'LGd-sh', 'LGd-co', 'LGd-ip', 
  'LGv', 'IntG', 'SPFm', 'SPFp', 'SPA', 'PP', 'ATN', 'APN', 'NOT', 'OP', 'PPT', 'RPF', 'CUN', 'III', 
  'IV', 'VI', 'XII', 'I5', 'IF', 'IPR', 'PRC','VTN']);

  // Function to filter selected acronyms based on FULL_BRAIN
const filterValidAcronyms = (selectedAcronyms) => {
  console.log("Selected Acronyms:", selectedAcronyms);
  // console.log("Length of FULL_BRAIN:", FULL_BRAIN.size);
  return selectedAcronyms.filter(acronym => FULL_BRAIN.has(acronym));
};

const HomePage = () => {
  const treeData = buildTree(structureData);
  const [selectedAcronyms, setSelectedAcronyms] = useState([]);

  useEffect(() => {
    // Call backend to clear temp directories when HomePage loads
    axios.post("http://localhost:5000/api/clear-temp")
      .then(response => {
        console.log("Temp directories cleared:", response.data.message);
      })
      .catch(error => {
        console.error("Error clearing temp directories:", error);
      });
  }, []);

  const handleSelectionChange = (selectedAcronyms) => {
    const validAcronyms = filterValidAcronyms(selectedAcronyms);

    if (validAcronyms.length === 0) {
      window.alert("No matching structures found. Defaulting to FULL_BRAIN.");
      setSelectedAcronyms(Array.from(FULL_BRAIN)); // Default to FULL_BRAIN
    } else {
      // setShowAlert(false); // Hide alert when valid selection exists
      setSelectedAcronyms(validAcronyms);
    }

    console.log("Filtered Selected Acronyms:", validAcronyms.length === 0 ? FULL_BRAIN : validAcronyms);
  };

  return (
    <div className="page-container">
      <div className="title-container">
        <h1 className='big-title'>Brain Atlas Platform</h1>

        {/* Left Panel */}
        <div className="left-panel">
          <ImageUploadForm selectedAcronyms={selectedAcronyms} FULL_BRAIN={FULL_BRAIN}/>
        </div>

        {/* Right Panel */}
        <div className="right-panel">
          <HierarchyTree data={treeData} onSelectionChange={handleSelectionChange}/>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
