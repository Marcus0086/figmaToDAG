import { Graph } from "../../../models/graph.mjs";

describe("removeCycles", () => {
  /**
   * @type {Graph}
   */
  let graph;
  beforeEach(() => {
    graph = new Graph();
  });
  test("should remove cycles from a graph", () => {
    const nodes = Array.from({ length: 100 }, (_, i) => ({
      id: `${i + 1}`,
      name: `Node ${i + 1}`,
    }));
    const edges = [];

    // Create a large graph with multiple cycles
    for (let i = 1; i <= 100; i++) {
      // Connect to the next node
      if (i < 100) {
        edges.push({ sourceId: `${i}`, targetId: `${i + 1}` });
      }
      // Create some back edges to form cycles
      if (i > 10) {
        edges.push({ sourceId: `${i}`, targetId: `${i - 10}` });
      }
      // Create some random edges
      const randomTarget = Math.floor(Math.random() * 100) + 1;
      if (randomTarget !== i) {
        edges.push({ sourceId: `${i}`, targetId: `${randomTarget}` });
      }
    }

    graph.buildGraph(nodes, edges);

    const originalEdgeCount = edges.length;

    expect(graph.edges.length).toBeLessThan(originalEdgeCount);
    expect(graph.isCyclic()).toBe(false);
  });

  test("should handle self-loops", () => {
    const nodes = [
      { id: "1", name: "Node 1" },
      { id: "2", name: "Node 2" },
    ];
    const edges = [
      { sourceId: "1", targetId: "2" },
      { sourceId: "1", targetId: "1" }, // Self-loop
    ];

    graph.buildGraph(nodes, edges);
    expect(graph.edges.length).toBe(1);
    expect(graph.edges).not.toContainEqual(
      expect.objectContaining({ sourceId: "1", targetId: "1" })
    );
  });
});
