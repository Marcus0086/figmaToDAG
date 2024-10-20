import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { Graph } from "../models/graph.mjs";

const s3Client = new S3Client({});

const s3Bucket = process.env.S3_BUCKET;

/**
 * Saves a graph to S3
 * @param {string} fileKey - The Figma file key
 * @param {string} version - The Figma file version
 * @param {Graph} graph - The graph to save
 * @throws {Error} If unable to save the graph
 */
const saveDAGToS3 = async (fileKey, version, graph) => {
  try {
    const nodeValues = Array.from(graph.nodes.values());
    const nodes = nodeValues.map((node) => ({
      id: node.id,
      data: node.data,
    }));

    const edges = graph.edges.map((edge) => ({
      sourceId: edge.sourceId,
      targetId: edge.targetId,
      data: edge.data,
    }));
    const graphData = {
      nodes,
      edges,
    };
    const bodyData = JSON.stringify(graphData);
    const params = {
      Bucket: s3Bucket,
      Key: `graphs/${fileKey}-${version}.json`,
      Body: bodyData,
      ContentEncoding: "gzip",
      ContentType: "application/json",
    };

    await s3Client.send(new PutObjectCommand(params));
    console.log("Graph saved to S3.");
  } catch (error) {
    console.error("Error saving graph to S3:", error);
  }
};

/**
 * Fetches a graph from S3
 * @param {string} figmaFileKey - The Figma file key
 * @param {string} version - The Figma file version
 * @returns {Promise<Object|null>} The graph data and version, or null if not found
 * @throws {Error} If unable to fetch the graph
 */
async function fetchDAGFromS3(figmaFileKey, version) {
  try {
    const params = {
      Bucket: s3Bucket,
      Key: `graphs/${figmaFileKey}-${version}.json`,
    };
    const command = new GetObjectCommand(params);
    const response = await s3Client.send(command);
    const data = await response.Body.transformToString();
    let { nodes, edges } = JSON.parse(data);
    console.log("Graph fetched from S3.");
    const graph = new Graph();
    nodes = nodes.map((node) => ({
      id: node.id,
      ...node.data,
    }));
    edges = edges.map((edge) => ({
      sourceId: edge.sourceId,
      targetId: edge.targetId,
      ...edge.data,
    }));
    graph.buildGraph(nodes, edges);
    return {
      graph,
      version,
    };
  } catch (error) {
    console.error("Error fetching DAG from DB:", error);
  }
}

export { saveDAGToS3, fetchDAGFromS3 };
