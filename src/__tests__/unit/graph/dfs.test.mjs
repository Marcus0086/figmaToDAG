import { Graph } from "../../../models/graph.mjs";

describe("dfs", () => {
  /**
   * @type {Graph}
   */
  let graph;
  beforeEach(() => {
    graph = new Graph();
  });
  test("should perform DFS correctly", () => {
    const nodes = [
      { id: "1", name: "Node 1" },
      { id: "2", name: "Node 2" },
      { id: "3", name: "Node 3" },
      { id: "4", name: "Node 4" },
    ];
    const edges = [
      { sourceId: "1", targetId: "2" },
      { sourceId: "1", targetId: "3" },
      { sourceId: "2", targetId: "4" },
      { sourceId: "3", targetId: "4" },
    ];

    graph.buildGraph(nodes, edges);
    const visited = graph.dfs("1");
    console.log(visited);
    expect(visited).toEqual(expect.arrayContaining(["1", "2", "4", "3"]));
  });

  test("should handle disconnected components in DFS", () => {
    const nodes = [
      { id: "1", name: "Node 1" },
      { id: "2", name: "Node 2" },
      { id: "3", name: "Node 3" },
      { id: "4", name: "Node 4" },
    ];
    const edges = [
      { sourceId: "1", targetId: "2" },
      { sourceId: "3", targetId: "4" },
    ];

    graph.buildGraph(nodes, edges);
    const visited = graph.dfs("1");

    expect(visited).toEqual(["1", "2"]);
  });
});
