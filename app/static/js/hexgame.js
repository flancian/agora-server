
const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
const centerX = canvas.width / 2;
const centerY = canvas.height / 2;
const ballRadius = 17; // Radius of each ball
let angle = 0; // Initial rotation angle
let numLayers = 5; // Total number of layers

// Define an array of seven colors
const colors = ['#FF0000', '#FF7F00', '#000000', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
let ballColors = []; // Array to store the color of each ball

function drawBall(x, y, index) {
  ctx.beginPath();
  ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
  ctx.fillStyle = ballColors[index]; // Use the stored color for this ball
  ctx.fill();
  ctx.closePath();
}

function initializeBallColors(totalBalls) {
  // Assign a random color to each ball
  for (let i = 0; i < totalBalls; i++) {
    ballColors[i] = colors[Math.floor(Math.random() * colors.length)];
  }
}

function getHexagonalRing(layer, distance) {
  // Calculate the starting point for the current layer
  let startAngle = -Math.PI / 2; // Starting at the top (12 o'clock)
  let startX = Math.cos(startAngle) * layer * distance;
  let startY = Math.sin(startAngle) * layer * distance;

  let points = [];
  for (let side = 0; side < 6; side++) { // 6 sides of a hexagon
    let angleOffset = (Math.PI / 3) * side; // 60 degrees between sides
    let nextAngleOffset = (Math.PI / 3) * (side + 1);
    let endX = Math.cos(startAngle + nextAngleOffset) * layer * distance;
    let endY = Math.sin(startAngle + nextAngleOffset) * layer * distance;

    for (let i = 0; i < layer; i++) {
      let x = startX + (endX - startX) * (i / layer);
      let y = startY + (endY - startY) * (i / layer);
      points.push({ x, y });
    }

    startX = endX;
    startY = endY;
  }
  return points;
}

function drawHexagon() {
  ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear the canvas
  ctx.save(); // Save the current state
  ctx.translate(centerX, centerY); // Move to the center of the canvas
  ctx.rotate(angle); // Rotate the entire canvas

  let distance = 2 * ballRadius + 1; // Distance between balls centers
  let totalBalls = 1; // Start with 1 for the center ball

  // Draw the center ball
  drawBall(0, 0, totalBalls - 1);

  for (let layer = 1; layer <= numLayers; layer++) {
    let ring = getHexagonalRing(layer, distance);
    ring.forEach(point => {
      drawBall(point.x, point.y, totalBalls++);
    });
  }

  ctx.restore(); // Restore the original state
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowLeft') {
    angle -= Math.PI / 6; // Rotate left
  } else if (event.key === 'ArrowRight') {
    angle += Math.PI / 6; // Rotate right
  }
  drawHexagon(); // Redraw the hexagon with the same color assignments
});

// Calculate total balls needed and initialize colors
let totalBalls = 1 + 6 * numLayers * (numLayers + 1) / 2; // 1 for center + sum of series for hexagon rings
initializeBallColors(totalBalls);
drawHexagon();
