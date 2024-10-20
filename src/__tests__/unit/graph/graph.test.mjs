import { Graph } from "../../../models/graph.mjs";

describe("buildGraph", () => {
  /**
   * @type {Graph}
   */
  let graph;
  beforeEach(() => {
    graph = new Graph();
  });
  test("should build a graph with nodes and edges", () => {
    const nodes = [
      { id: "1", name: "Node 1" },
      { id: "2", name: "Node 2" },
      { id: "3", name: "Node 3" },
    ];
    const edges = [
      { sourceId: "1", targetId: "2" },
      { sourceId: "2", targetId: "3" },
    ];

    graph.buildGraph(nodes, edges);

    expect(graph.nodes.size).toBe(3);
    expect(graph.edges.length).toBe(2);
  });
});
