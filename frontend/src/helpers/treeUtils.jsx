export const buildTree = (flatData) => {
  const idToNode = {};
  const tree = [];

  // Create a map of nodes by ID
  flatData.forEach((node) => {
    idToNode[node.id] = { ...node, children: [] };
  });

  // Build the tree structure
  flatData.forEach((node) => {
    if (node.structure_id_path.length > 1) {
      const parentId = node.structure_id_path[node.structure_id_path.length - 2];
      if (idToNode[parentId]) {
        idToNode[parentId].children.push(idToNode[node.id]);
      }
    } else {
      tree.push(idToNode[node.id]); // Root nodes
    }
  });

  return tree;
};

export default buildTree