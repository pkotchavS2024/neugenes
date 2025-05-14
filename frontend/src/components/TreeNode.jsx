import React, { useState, useEffect } from "react";
import "./TreeNode.css";

const TreeNode = ({ node, onToggle, expandedNodes }) => {
  const isExpanded = expandedNodes.has(node.id); // Check if the node is in expandedNodes
  const [expanded, setExpanded] = useState(isExpanded);

  // Sync local state with expandedNodes whenever it changes
  useEffect(() => {
    setExpanded(isExpanded);
  }, [isExpanded]);

  const toggleExpand = () => setExpanded((prev) => !prev);

  return (
    <li id={`node-${node.id}`}>
      {/* Checkbox with onChange handler */}
      <input
        type="checkbox"
        id={`checkbox-${node.id}`}
        checked={!!node.checked} // Ensure checked is always a boolean
        onChange={(e) => onToggle(node, e.target.checked)} // Call onToggle when toggled
      />
      <span
        className="toggle"
        onClick={toggleExpand}
        style={{ cursor: "pointer", color: "blue", textDecoration: "underline" }}
      >
        <strong>{node.name}</strong> (ID: {node.id}, Acronym: {node.acronym})
      </span>
      {/* Render children if expanded */}
      {Array.isArray(node.children) && node.children.length > 0 && expanded && (
        <ul>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              onToggle={onToggle}
              expandedNodes={expandedNodes}
            />
          ))}
        </ul>
      )}
    </li>
  );
};

export default TreeNode;
