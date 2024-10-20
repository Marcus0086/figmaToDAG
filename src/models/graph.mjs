class Node {
  /**
   * @param {string} id
   * @param {Object} data
   */
  constructor(id, data) {
    this.id = id;
    this.data = data;
  }
}

class Edge {
  /**
   * @param {string} sourceId
   * @param {string} targetId
   * @param {Object} data
   */
  constructor(sourceId, targetId, data) {
    this.sourceId = sourceId;
    this.targetId = targetId;
    this.data = data;
  }
}

class Graph {
  constructor() {
    /**
     * Stores nodes by their ID for easy lookup
     * @type {Map<string, Node>}
     */
    this.nodes = new Map();

    /**
     * Array to store all edges in the graph
     * @type {Edge[]}
     */
    this.edges = [];

    /**
     * Stores node index for building an adjacency matrix
     * @type {Map<string, number>}
     */
    this.nodeIndexMap = new Map();

    /**
     * The adjacency matrix for the graph
     * @type {number[][]}
     */
    this.adjacencyMatrix = [];
  }

  /**
   * Adds a node to the graph if it doesn't already exist
   * @param {string} id
   * @param {Object} data
   */
  addNode(id, data) {
    if (!id) {
      throw new Error("Node ID is required");
    }
    if (!this.nodes.has(id)) {
      this.nodes.set(id, new Node(id, data));
    }
  }

  /**
   * Adds an edge between two nodes
   * @param {string} sourceId
   * @param {string} targetId
   * @param {Object} data
   */
  addEdge(sourceId, targetId, data) {
    if (!this.nodes.has(sourceId)) {
      throw new Error(`Source node with ID '${sourceId}' does not exist.`);
    }
    if (!this.nodes.has(targetId)) {
      throw new Error(`Target node with ID '${targetId}' does not exist.`);
    }

    if (sourceId === targetId) {
      console.warn(
        `Edge from '${sourceId}' to '${targetId}' is a self-loop and will be ignored.`
      );
      return;
    }

    // Check for existing edge to avoid duplicates
    for (const edge of this.edges) {
      if (edge.sourceId === sourceId && edge.targetId === targetId) {
        console.warn(
          `Edge from '${sourceId}' to '${targetId}' already exists.`
        );
        return;
      }
    }

    const edge = new Edge(sourceId, targetId, data);
    this.edges.push(edge);
  }

  buildGraph(nodes, edges, shouldMakeAdjacencyMatrix = false) {
    try {
      if (!Array.isArray(nodes) || !Array.isArray(edges)) {
        throw new Error("Nodes and edges are in invalid format.");
      }

      // Add nodes to the graph
      for (const node of nodes) {
        this.addNode(node.id, {
          label: node.label,
          type: node.type,
          image: node.image,
        });
      }

      // Add edges to the graph
      for (const edge of edges) {
        this.addEdge(edge.sourceId, edge.targetId, {
          triggerType: edge.triggerType,
          actionType: edge.actionType,
          label: edge.label,
          image: edge.image,
        });
      }

      if (this.detectCycles()) {
        console.warn("Cycles detected. Modifying graph to be acyclic.");
        this.makeAcyclic();
      } else {
        console.log("Graph is already acyclic.");
      }

      if (shouldMakeAdjacencyMatrix) {
        this.buildAdjacencyMatrix();
      }
    } catch (error) {
      console.error("Error building graph:", error);
    }
  }

  /**
   * Builds an adjacency matrix representation of the graph
   */
  buildAdjacencyMatrix() {
    const nodeIds = Array.from(this.nodes.keys());
    const size = nodeIds.length;

    this.adjacencyMatrix = Array.from({ length: size }, () =>
      Array(size).fill(0)
    );

    for (let i = 0; i < nodeIds.length; i++) {
      const nodeId = nodeIds[i];
      this.nodeIndexMap.set(nodeId, i);
    }

    for (const edge of this.edges) {
      const sourceIndex = this.nodeIndexMap.get(edge.sourceId);
      const targetIndex = this.nodeIndexMap.get(edge.targetId);
      this.adjacencyMatrix[sourceIndex][targetIndex] = 1;
    }
  }

  /**
   * DFS traversal starting from a given node ID
   * @param {string} startNodeId - The ID of the node to start the traversal
   * @returns {string[]} - Array of node IDs in the order they were visited
   */
  dfs(startNodeId) {
    if (!this.nodes.has(startNodeId)) {
      throw new Error(`Node with ID '${startNodeId}' does not exist.`);
    }

    const visited = new Set();
    const result = [];

    const stack = [startNodeId];

    while (stack.length > 0) {
      const nodeId = stack.pop();
      if (!visited.has(nodeId)) {
        visited.add(nodeId);
        result.push(nodeId);

        const neighbors = [];
        for (const edge of this.edges) {
          if (edge.sourceId === nodeId) {
            neighbors.push(edge.targetId);
          }
        }

        for (const neighborId of neighbors.reverse()) {
          if (!visited.has(neighborId)) {
            stack.push(neighborId);
          }
        }
      }
    }

    return result;
  }

  /**
   * Detects if there are any cycles in the graph
   * @returns {boolean} True if a cycle is detected, false otherwise
   */
  detectCycles() {
    const visited = new Set();
    const recStack = new Set();

    const nodeValues = Array.from(this.nodes.values());
    for (let i = 0; i < nodeValues.length; i++) {
      const node = nodeValues[i];
      if (this.isCyclic(node, visited, recStack)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Helper function for detecting cycles using DFS
   * @param {Node} node
   * @param {Set<string>} visited
   * @param {Set<string>} recStack
   * @returns {boolean} True if a cycle is found, false otherwise
   */
  isCyclic(node, visited, recStack) {
    if (!visited.has(node.id)) {
      visited.add(node.id);
      recStack.add(node.id);

      for (let i = 0; i < this.edges.length; i++) {
        const edge = this.edges[i];
        if (edge.sourceId === node.id) {
          const targetNode = this.nodes.get(edge.targetId);
          if (
            !visited.has(targetNode.id) &&
            this.isCyclic(targetNode, visited, recStack)
          ) {
            return true;
          } else if (recStack.has(targetNode.id)) {
            return true;
          }
        }
      }
    }
    recStack.delete(node.id);
    return false;
  }

  /**
   * Makes the graph acyclic by removing cycles
   */
  makeAcyclic() {
    const visited = new Set();
    const recStack = new Set();

    const nodeValues = Array.from(this.nodes.values());
    for (let i = 0; i < nodeValues.length; i++) {
      const node = nodeValues[i];
      this.removeCycles(node, visited, recStack);
    }
  }

  /**
   * Helper function for removing cycles
   * @param {Node} node
   * @param {Set<string>} visited
   * @param {Set<string>} recStack
   */
  removeCycles(node, visited, recStack) {
    if (!visited.has(node.id)) {
      visited.add(node.id);
      recStack.add(node.id);

      for (let i = 0; i < this.edges.length; i++) {
        const edge = this.edges[i];
        if (edge.sourceId === node.id) {
          const targetNode = this.nodes.get(edge.targetId);
          if (recStack.has(targetNode.id)) {
            this.edges.splice(i, 1); // Remove edge to break cycle
            i--; // Adjust index after removal
          } else {
            this.removeCycles(targetNode, visited, recStack);
          }
        }
      }
    }
    recStack.delete(node.id);
  }

  clear() {
    this.nodes.clear();
    this.edges = [];
    this.nodeIndexMap.clear();
    this.adjacencyMatrix = [];
  }
}

export { Graph };
