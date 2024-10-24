import axios from "axios";
import { INTERACTIVE_NODE_TYPES, INTERACTION_TYPES } from "../models/figma.mjs";

const isInteractiveNode = (node) => INTERACTIVE_NODE_TYPES.has(node.type);
const ACTION_NAMES = {
  ON_CLICK: "Click",
  ON_HOVER: "Hover",
  DRAG: "Drag",
  ON_KEY_PRESS: "Keypress",
  ON_SCROLL: "Scroll",
};

function getActionName(triggerType) {
  return ACTION_NAMES[triggerType] || "Action";
}

/**
 * Fetches the images for a list of node IDs
 * @param {string} nodeIds - The node IDs
 * @param {string} accessToken - The Figma access token
 * @param {Array} nodes - The array of nodes
 * @returns {Promise<Object>} Object containing the images
 */
async function getFigmaNodeImages(figmaFileKey, nodeIds, accessToken) {
  const MAX_NODE_IDS_LENGTH = 100;
  const imageResults = {};
  const nodeIdsArray = nodeIds.split(",");
  for (let i = 0; i < nodeIdsArray.length; i += MAX_NODE_IDS_LENGTH) {
    const chunk = nodeIdsArray.slice(i, i + MAX_NODE_IDS_LENGTH).join(",");
    try {
      const response = await axios.get(
        `https://api.figma.com/v1/images/${figmaFileKey}?ids=${chunk}`,
        { headers: { "X-Figma-Token": accessToken } }
      );
      if (response.data.err !== null) {
        console.error(`Error fetching node images: ${response.data.err}`);
        continue;
      }
      const images = response.data.images;
      Object.assign(imageResults, images);
    } catch (error) {
      console.error(`Error fetching node images: ${error.message}`);
    }
  }
  return imageResults;
}

/**
 * Fetches the latest version of a Figma file
 * @param {string} figmaFileKey - The Figma file key
 * @param {string} accessToken - The Figma access token
 * @returns {Promise<string>} The latest version ID
 * @throws {Error} If unable to fetch the version
 */
async function getFigmaFileVersion(figmaFileKey, accessToken) {
  const response = await axios.get(
    `https://api.figma.com/v1/files/${figmaFileKey}/versions`,
    { headers: { "X-Figma-Token": accessToken } }
  );
  let version = "";
  if (response.status !== 200) {
    throw new Error(
      `Failed to fetch Figma file version: ${response.statusText}`
    );
  }

  const data = response.data;
  if (!data.versions || data.versions.length === 0) {
    throw new Error("No versions found for this Figma file");
  }
  version = data.versions[0].id;
  return version;
}

/**
 * Traverses the Figma file data and builds the nodes and edges
 * @param {Object} rootNode - The root node of the Figma file
 * @param {Map} nodesMap - The map of nodes
 * @param {Array} edges - The array of edges
 */
function traverseFigmaFileData(rootNode, nodesMap, edges) {
  const stack = [{ node: rootNode, parent: null }];
  while (stack.length > 0) {
    const { node, parent } = stack.pop();
    if (!node) continue;
    let currentFrame = parent;
    if (isInteractiveNode(node)) {
      currentFrame = node;
      nodesMap.set(node.id, {
        id: node.id,
        label: node.name,
        type: node.type,
        image: "",
      });
    }

    if (node.interactions && node.interactions.length > 0 && currentFrame) {
      for (const interaction of node.interactions) {
        if (interaction && INTERACTION_TYPES.has(interaction.trigger.type)) {
          const actions = interaction.actions || [];
          for (const action of actions) {
            if (action && action.destinationId) {
              const sourceNodeId = currentFrame.id;
              const targetNodeId = action.destinationId;
              const sourceNode = nodesMap.get(sourceNodeId);
              const targetNode = nodesMap.get(targetNodeId);
              if (sourceNode && targetNode) {
                edges.push({
                  sourceId: sourceNodeId,
                  targetId: targetNodeId,
                  triggerType: interaction.trigger.type,
                  label: `${getActionName(interaction.trigger.type)} on ${
                    node.name
                  }`,
                  image: sourceNode.image || "",
                });
              }
            }
          }
        }
      }
    }

    if (node.children && node.children.length > 0) {
      for (const child of node.children) {
        stack.push({ node: child, parent: currentFrame });
      }
    }
  }
}

/**
 * Fetches and processes Figma file data
 * @param {string} figmaFileKey - The Figma file key
 * @param {string} accessToken - The Figma access token
 * @returns {Promise<Object>} Object containing nodes, edges, and raw Figma file data
 */
async function getFigmaFileData(figmaFileKey, accessToken) {
  const nodesMap = new Map();
  const edges = [];

  const headers = {
    "X-Figma-Token": accessToken,
  };

  const figmaFileResponse = await axios.get(
    `https://api.figma.com/v1/files/${figmaFileKey}`,
    { headers }
  );

  const figmaFileData = figmaFileResponse.data;

  traverseFigmaFileData(figmaFileData.document, nodesMap, edges);

  const nodes = Array.from(nodesMap.values());
  const nodeIds = nodes.map((node) => node.id).join(",");
  const images = await getFigmaNodeImages(figmaFileKey, nodeIds, accessToken);
  if (Object.keys(images).length !== 0) {
    for (const node of nodes) {
      node.image = images[node.id] || "";
    }
    for (const edge of edges) {
      edge.image = images[edge.sourceId] || "";
    }
  }
  return { nodes, edges, figmaFileData };
}

export { getFigmaFileData, getFigmaFileVersion };
