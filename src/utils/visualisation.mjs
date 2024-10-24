import { Graph } from "../models/graph.mjs";

/**
 * Generates HTML for rendering a graph using D3.js
 * @param {Graph} graph - The graph to render
 * @returns {string} - The HTML string for the rendered graph
 */
function renderGraphHtml(graph) {
  const nodes = Array.from(graph.nodes.values());
  const d3Nodes = nodes.map((node, index) => ({
    data: {
      id: node.id,
      label: node.data.label,
      image: node.data.image,
    },
  }));

  const d3Edges = graph.edges.map((edge) => ({
    data: {
      source: edge.sourceId,
      target: edge.targetId,
      label: edge.data.label,
      action: edge.data.triggerType,
      image: edge.data.image,
    },
  }));

  return htmlTemplate(d3Nodes, d3Edges);
}

/**
 *
 * @param {Array} nodes
 * @param {Array} edges
 * @returns
 */
const htmlTemplate = (nodes, edges) => {
  return `
  <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Graph Visualization</title>
      <script src="https://unpkg.com/cytoscape/dist/cytoscape.min.js"></script>
      <style>
        body {
          margin: 0;
          padding: 0;
          font-family: sans-serif;
          display: flex;
        }
        #cy {
          flex-grow: 1;
          height: 100vh;
          background-color: #f5f5f5;
        }
        .sidebar {
          width: 300px;
          background: #fafafa;
          padding: 20px;
          box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
          overflow-y: auto;
        }
        .sidebar h2 {
          margin-top: 0;
        }
      </style>
    </head>
    <body>
      <div id="cy"></div>
      <div class="sidebar">
        <h2>Node/Edge Information</h2>
        <div id="details">Click on a node or edge to see details</div>
      </div>

      <script>
        const colors = ["#3498db", "#e74c3c", "#2ecc71", "#9b59b6", "#f39c12", "#1abc9c", "#e67e22", "#d35400"];

        function getRandomColor() {
          return colors[Math.floor(Math.random() * colors.length)];
        }

        function truncateLabel(label, maxLength = 10) {
          return label.length > maxLength ? label.slice(0, maxLength) + '...' : label;
        }

        const nodesWithColors = ${JSON.stringify(nodes)}.map(node => {
          return {
            data: {
              ...node.data,
              label: truncateLabel(node.data.label),
              color: node.data.color || getRandomColor()  // Assign random color if color is missing
            }
          };
        });

        const cy = cytoscape({
          container: document.getElementById('cy'),
          elements: {
            nodes: nodesWithColors,
            edges: ${JSON.stringify(edges)}
          },
          style: [
            {
              selector: 'node',
              style: {
                'background-color': 'data(color)',   // Use the assigned or random color
                'shape': 'ellipse',                  // Circular nodes
                'width': '60px',
                'height': '60px',
                'label': 'data(label)',              // Show label in the center of the node
                'color': '#fff',                     // Label text color
                'text-valign': 'center',
                'text-halign': 'center',
                'font-size': '14px'
              }
            },
            {
              selector: 'edge',
              style: {
                'label': 'data(label)',              // Label for the edge
                'line-color': '#ccc',                // Line color for edges
                'target-arrow-color': '#ccc',        // Arrow color for edges
                'target-arrow-shape': 'triangle',    // Arrow shape at the end of the edge
                'curve-style': 'bezier',             // Curve style for edges
                'font-size': '10px'
              }
            }
          ],
          layout: {
            name: 'grid', // You can change this to 'circle', 'concentric', or any other layout
            rows: ${Math.ceil(nodes.length / 4)}
          }
        });


        // Handle node clicks
        cy.on('tap', 'node', function(event) {
          const node = event.target;
          const detailsDiv = document.getElementById('details');
          detailsDiv.innerHTML = \`
            <h3>Node Information</h3>
            <p><strong>ID:</strong> \${node.id()}</p>
            <p><strong>Label:</strong> \${node.data('label')}</p>
            <p><strong>Color:</strong> \${node.data('color')}</p>
            <p><img src="\${node.data('image')}" alt="Node Image" /></p>
          \`;
        });

        // Handle edge clicks
        cy.on('tap', 'edge', function(event) {
          const edge = event.target;
          const detailsDiv = document.getElementById('details');
          detailsDiv.innerHTML = \`
            <h3>Edge Information</h3>
            <p><strong>Source:</strong> \${edge.data('source')}</p>
            <p><strong>Target:</strong> \${edge.data('target')}</p>
            <p><strong>Label:</strong> \${edge.data('label')}</p>
            <p><strong>Action:</strong> \${edge.data('action')}</p>
            <p><img src="\${edge.data('image')}" alt="Edge Image" /></p>
          \`;
        });
      </script>
    </body>
    </html>`;
};

export { renderGraphHtml };
