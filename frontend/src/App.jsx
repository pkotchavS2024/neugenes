import React from 'react';
import ImageUploadForm from './components/ImageUploadForm';
import HierarchyTree from "./components/HierarchyTree";
import structureData from "./data/structures.json";
import { buildTree } from "./helpers/treeUtils";
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ResultsPage from './pages/ResultsPage';
import ResultsLayout from './pages/ResultsPage2';

function App() {
  const treeData = buildTree(structureData);
  console.log("Tree Data:", treeData); // Add this line to verify tree data
  return (
    <Router>
    <Routes>
      {/* Home Page */}
      <Route path="/" element={<HomePage />} />

      {/* Results Page */}
      <Route path="/results" element={<ResultsPage />} />

      <Route path="/all-results" element={<ResultsLayout />} />
    </Routes>
  </Router>
  );
}

export default App;
