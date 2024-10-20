import { getFigmaFileData, getFigmaFileVersion } from "../utils/figma.mjs";
import { Graph } from "../models/graph.mjs";
import { fetchDAGFromS3, saveDAGToS3 } from "../utils/s3Utils.mjs";

export const figmaToDAG = async (event) => {
  try {
    // Parse request payload
    const body = JSON.parse(event.body);
    const fileKey = body.file_key;
    const accessToken = body.access_token;
    const buildAdjacencyMatrix = body?.build_adjacency_matrix ?? false;

    const currentVersion = await getFigmaFileVersion(fileKey, accessToken);
    const existingDAG = await fetchDAGFromS3(fileKey, currentVersion);

    if (!existingDAG) {
      const figmaData = await getFigmaFileData(fileKey, accessToken);
      let graph = new Graph();
      graph.buildGraph(figmaData.nodes, figmaData.edges, buildAdjacencyMatrix);
      await saveDAGToS3(fileKey, currentVersion, graph);
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "DAG created successfully",
          graph: {
            nodes: Array.from(graph.nodes.values()),
            edges: graph.edges,
          },
          version: currentVersion,
        }),
      };
    }
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "DAG already exists",
        graph: {
          nodes: Array.from(existingDAG.graph.nodes.values()),
          edges: existingDAG.graph.edges,
        },
        version: existingDAG.version,
      }),
    };
  } catch (error) {
    console.error("Error handling request:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error", error }),
    };
  }
};
