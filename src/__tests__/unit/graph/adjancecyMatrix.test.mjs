import { Graph } from "../../../models/graph.mjs";

describe("buildAdjacencyMatrix", () => {
  /**
   * @type {Graph}
   */
  let graph;
  beforeEach(() => {
    graph = new Graph();
  });
  test("should build correct adjacency matrix for a simple graph", () => {
    const nodes = [
      { id: "1", name: "Node 1" },
      { id: "2", name: "Node 2" },
      { id: "3", name: "Node 3" },
    ];
    const edges = [
      { sourceId: "1", targetId: "2" },
      { sourceId: "2", targetId: "3" },
    ];

    graph.buildGraph(nodes, edges, true);

    expect(graph.adjacencyMatrix).toEqual([
      [0, 1, 0],
      [0, 0, 1],
      [0, 0, 0],
    ]);
  });
});
