import { getFigmaFileVersion } from "../utils/figma.mjs";
import { fetchDAGFromS3 } from "../utils/s3Utils.mjs";
import { renderGraphHtml } from "../utils/visualisation.mjs";

export const handler = async (event) => {
  try {
    const { fileKey, accessToken } = event.queryStringParameters;

    // Validate input
    if (!fileKey || !accessToken) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing fileKey or accessToken" }),
      };
    }
    const currentVersion = await getFigmaFileVersion(fileKey, accessToken);
    const existingDAG = await fetchDAGFromS3(fileKey, currentVersion);
    if (!existingDAG) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: "DAG not found" }),
      };
    }

    const html = renderGraphHtml(existingDAG.graph);
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "text/html",
      },
      body: html,
    };
  } catch (error) {
    console.error("Error handling request:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error", error }),
    };
  }
};
