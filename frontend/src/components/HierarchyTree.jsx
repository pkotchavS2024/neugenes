import React, { useState, useEffect } from "react";
import TreeNode from "./TreeNode";

const HierarchyTree = ({ data, onSelectionChange }) => {
  const [treeData, setTreeData] = useState(data);
  const [selectedAcronyms, setSelectedAcronyms] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedNodes, setExpandedNodes] = useState(new Set()); // Track expanded nodes

  // Recursive function to collect all acronyms under a node
  const getAllAcronyms = (node) => {
    let acronyms = new Set([node.acronym]); // Include the current node's acronym
    if (node.children) {
      node.children.forEach((child) => {
        acronyms = new Set([...acronyms, ...getAllAcronyms(child)]);
      });
    }
    return acronyms;
  };

  // Recursive function to update the checked state of a node and its children
  const toggleNodeCheckedState = (node, isChecked) => {
    const updatedNode = { ...node, checked: isChecked }; // Create a new node with updated checked state

    if (node.children && node.children.length > 0) {
      updatedNode.children = node.children.map((child) =>
        toggleNodeCheckedState(child, isChecked)
      ); // Update children
    }

    return updatedNode;
  };

  // Recursive function to handle toggling nodes and updating the tree
  const handleToggle = (toggledNode, isChecked) => {
    const newSelectedAcronyms = new Set(selectedAcronyms);

    if (isChecked) {
      // If selecting, add the node and all its children
      getAllAcronyms(toggledNode).forEach((acronym) =>
        newSelectedAcronyms.add(acronym)
      );
    } else {
      // If deselecting, remove the node and all its children
      getAllAcronyms(toggledNode).forEach((acronym) =>
        newSelectedAcronyms.delete(acronym)
      );
    }

    setSelectedAcronyms(newSelectedAcronyms);
    const updateTree = (nodes) =>
      nodes.map((node) => {
        if (node.id === toggledNode.id) {
          return toggleNodeCheckedState(node, isChecked); // Update the toggled node
        } else if (node.children && node.children.length > 0) {
          return { ...node, children: updateTree(node.children) }; // Recurse into children
        }
        return node; // Return unchanged nodes
      });

    const updatedTreeData = updateTree(treeData); // Create a new tree with updated state
    setTreeData(updatedTreeData); // Update the state
  };

  useEffect(() => {
    // Convert selectedNodes (Set) to an array and compare with the previous array
    const selectedArray = Array.from(selectedAcronyms);
    
    // Avoid unnecessary re-renders if the selection hasn't changed
    if (selectedArray.length > 0) {
      onSelectionChange(selectedArray);
    }
  }, [selectedAcronyms]);
  
  // Recursive function to expand the tree to matching nodes
  const expandMatchingNodes = (node, query, expandedSet) => {
    if (node.acronym.toLowerCase() === query) {
      expandedSet.add(node.id); // Expand the matching node
      return true; // Indicate the parent needs to expand
    }

    let shouldExpand = false;
    if (node.children && node.children.length > 0) {
      node.children.forEach((child) => {
        if (expandMatchingNodes(child, query, expandedSet)) {
          shouldExpand = true;
          expandedSet.add(node.id); // Expand the parent node if a child matches
        }
      });
    }

    return shouldExpand;
  };

  // Trigger search on button click
  const handleSearch = () => {
    const query = searchQuery.toLowerCase();
    if (!query) return;

    const newExpandedNodes = new Set();
    treeData.forEach((node) => {
      expandMatchingNodes(node, query, newExpandedNodes);
    });

    setExpandedNodes(newExpandedNodes); // Update expanded nodes
  };

  return (
    <div id="right-panel">
      {/* Search Bar */}
      <div style={{ marginBottom: "10px" }}>
        <input
          type="text"
          id="search-bar"
          placeholder="Search by Acronym..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: "5px",
            marginRight: "10px",
            width: "70%",
            border: "1px solid #ccc",
            borderRadius: "4px",
          }}
        />
        <button
          onClick={handleSearch}
          style={{
            padding: "5px 10px",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Search
        </button>
      </div>

      <h1>Mouse Brain Atlas Hierarchy</h1>
      <ul>
        {treeData.map((node) => (
          <TreeNode
            key={node.id}
            node={node}
            onToggle={handleToggle} // Pass the handleToggle function
            expandedNodes={expandedNodes} // Pass expanded nodes
          />
        ))}
      </ul>
    </div>
  );
};

export default HierarchyTree;
