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

function findAncestorFrame(node) {
  if (!node) return null;
  if (isInteractiveNode(node)) {
    return node.id;
  }
  return findAncestorFrame(node.parent);
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
 * Fetches and processes Figma file data
 * @param {string} figmaFileKey - The Figma file key
 * @param {string} accessToken - The Figma access token
 * @returns {Promise<Object>} Object containing nodes, edges, and raw Figma file data
 */
async function getFigmaFileData(figmaFileKey, accessToken) {
  const nodesMap = new Map();
  const edges = [];
  const apisToRequest = [
    `https://api.figma.com/v1/files/${figmaFileKey}`,
    `https://api.figma.com/v1/files/${figmaFileKey}/images`,
  ];
  const headers = {
    "X-Figma-Token": accessToken,
  };

  const requests = apisToRequest.map((url) => axios.get(url, { headers }));

  const [figmaFileResponse, figmaImagesResponse] = await Promise.all(requests);

  const figmaFileData = figmaFileResponse.data;
  const figmaImages = figmaImagesResponse.data.meta.images;
  function traverse(rootNode) {
    const stack = [{ node: rootNode, parent: null }];
    while (stack.length > 0) {
      const { node, parent } = stack.pop();
      if (!node) continue;
      node.parent = parent;
      if (isInteractiveNode(node)) {
        let imageRef = null;
        if (node.fills) {
          for (const fill of node.fills) {
            if (fill.type === "IMAGE" && fill.imageRef) {
              imageRef = fill.imageRef;
              break;
            }
          }
        }

        nodesMap.set(node.id, {
          id: node.id,
          label: node.name,
          type: node.type,
          image: figmaImages[imageRef] || "",
        });
      }

      if (node.interactions && node.interactions.length > 0) {
        for (const interaction of node.interactions) {
          if (interaction && INTERACTION_TYPES.has(interaction.trigger.type)) {
            const actions = interaction.actions || [];
            for (const action of actions) {
              if (action && action.destinationId) {
                const sourceNodeId = findAncestorFrame(node);
                const targetNodeId = action.destinationId;
                const sourceNode = nodesMap.get(sourceNodeId);
                const targetNode = nodesMap.get(targetNodeId);
                if (sourceNode && targetNode) {
                  edges.push({
                    sourceId: sourceNodeId,
                    targetId: targetNodeId,
                    triggerType: interaction.trigger.type,
                    actionType: action.transition?.type || null,
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
        for (let i = 0; i < node.children.length; i++) {
          stack.push({ node: node.children[i], parent: node });
        }
      }
    }
  }

  traverse(figmaFileData.document);
  const nodes = Array.from(nodesMap.values());
  return { nodes, edges, figmaFileData };
}

export { getFigmaFileData, getFigmaFileVersion };
