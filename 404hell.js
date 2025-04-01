// Get the canvas and context
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 700; // Total width
canvas.height = 800;

// Define the playable area
const playAreaWidth = 400; // Reduced from 500px to 400px
const leftBoundary = (canvas.width - playAreaWidth) / 2; // Center the playable area: (700 - 400) / 2 = 150
const rightBoundary = leftBoundary + playAreaWidth; // 150 + 400 = 550

// Load the controls image
const controlsImg = new Image();
controlsImg.src = '404-hell-controls.png';

// Game variables
const player = {
    x: leftBoundary + (playAreaWidth / 2) - 10, // Center within the playable area
    y: 100, // Higher on the screen (near the top)
    width: 20,
    height: 20,
    speed: 5,
    dx: 0 // Horizontal velocity
};

const obstacles = [];
const laneWidth = playAreaWidth / 5; // 5 lanes within the playable area (400 / 5 = 80px)
const obstacleWidth = laneWidth - 10; // Narrow gaps between lanes (10px gaps)
const obstacleHeight = 10;
let obstacleSpeed = 8; // Starting speed
let obstacleSpawnTimer = 0;
const initialDelay = 3 * 60; // 3 seconds at 60 FPS
let gameStarted = false;
let gameOver = false;

// Timer variables
let startTime = 0;
let elapsedTime = 0;

// Animation variables
let animationFrame = 0;
const animationDuration = 3 * 60; // 3 seconds at 60 FPS

// Controls image visibility
let showControls = false;

// Restart button
const restartButton = document.getElementById('restart-button');

// Player movement
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') {
        player.dx = -player.speed;
    } else if (e.key === 'ArrowRight') {
        player.dx = player.speed;
    }
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        player.dx = 0;
    }
});

// Restart game
restartButton.addEventListener('click', () => {
    gameStarted = false;
    gameOver = false;
    animationFrame = 0;
    obstacles.length = 0;
    obstacleSpawnTimer = 0;
    player.x = leftBoundary + (playAreaWidth / 2) - 10;
    player.y = 100;
    startTime = 0;
    elapsedTime = 0;
    showControls = false;
    obstacleSpeed = 8; // Reset speed
    restartButton.style.display = 'none';
});

// Spawn obstacles
function spawnObstacle() {
    const position = Math.floor(Math.random() * 5); // 0 to 4 for 5 lanes
    const x = leftBoundary + position * laneWidth; // Lane positions within the playable area
    const speedVariation = obstacleSpeed * (0.9 + Math.random() * 0.2); // Speed varies between 90% and 110%
    obstacles.push({
        x: x,
        y: canvas.height, // Start at the bottom
        width: obstacleWidth,
        height: obstacleHeight,
        speed: speedVariation // Individual speed for this obstacle
    });
}

// Format time as MM:SS
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Check for collisions
function checkCollisions() {
    for (let i = 0; i < obstacles.length; i++) {
        const obs = obstacles[i];
        if (
            player.x < obs.x + obs.width &&
            player.x + player.width > obs.x &&
            player.y < obs.y + obs.height &&
            player.y + player.height > obs.y
        ) {
            gameOver = true;
        }
    }
}

// Game loop
function update() {
    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the shaft (two vertical lines)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(leftBoundary - 10, 0, 10, canvas.height); // Left wall
    ctx.fillRect(rightBoundary, 0, 10, canvas.height); // Right wall

    if (!gameStarted) {
        // Initial animation
        animationFrame++;
        ctx.font = '40px Roboto';
        ctx.fillStyle = '#ff0000';
        ctx.textAlign = 'center';
        ctx.fillText('OH NO... YOU FELL', leftBoundary + (playAreaWidth / 2), canvas.height / 2 - 50);
        ctx.fillText('INTO 404 HELL', leftBoundary + (playAreaWidth / 2), canvas.height / 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(player.x, player.y + (animationFrame * 2), player.width, player.height); // Player falls during animation

        if (animationFrame >= animationDuration) {
            gameStarted = true;
            player.y = 100; // Reset player position higher on the screen
            showControls = true; // Show controls on the canvas
            obstacleSpawnTimer = initialDelay; // Start the 3-second delay
            startTime = Date.now(); // Start the timer
        }
    } else if (!gameOver) {
        // Update timer
        elapsedTime = (Date.now() - startTime) / 1000; // Time in seconds

        // Increase difficulty over time
        const rampUpTime = 3 * 60; // 3 minutes in seconds
        const timeFactor = Math.min(elapsedTime / rampUpTime, 1); // 0 to 1 over 3 minutes
        const additionalTimeFactor = elapsedTime > rampUpTime ? (elapsedTime - rampUpTime) / (2 * 60) : 0; // Slight increase after 3 minutes
        obstacleSpeed = 8 + timeFactor * 4 + additionalTimeFactor * 2; // Speed: 8 to 12 by 3 minutes, then up to 14

        const spawnChance = 0.04 + timeFactor * 0.16; // Spawn chance: 0.04 to 0.2 by 3 minutes

        // Update player position (horizontal movement only)
        player.x += player.dx;

        // Keep player within bounds
        if (player.x < leftBoundary) player.x = leftBoundary; // Left wall
        if (player.x + player.width > rightBoundary) player.x = rightBoundary - player.width; // Right wall

        // Spawn obstacles after initial delay
        if (obstacleSpawnTimer > 0) {
            obstacleSpawnTimer--;
        } else {
            if (Math.random() < spawnChance) { // Dynamic spawn rate
                spawnObstacle();
                obstacleSpawnTimer = 30; // 0.5 seconds delay
            }
        }

        // Update obstacles
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obs = obstacles[i];
            obs.y -= obs.speed; // Use individual speed
            if (obs.y + obs.height < 0) {
                obstacles.splice(i, 1); // Remove obstacles that go off-screen
            }
        }

        // Check collisions
        checkCollisions();

        // Draw controls image on the canvas
        if (showControls && controlsImg.complete) {
            ctx.drawImage(controlsImg, leftBoundary - 160, 10, 150, 100); // Positioned in the extra space on the left
        }

        // Draw player
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(player.x, player.y, player.width, player.height);

        // Draw obstacles
        ctx.fillStyle = '#ff0000';
        obstacles.forEach(obs => {
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        });

        // Draw timer
        ctx.font = '20px Roboto';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(`Time: ${formatTime(elapsedTime)}`, rightBoundary + 10, 30); // Positioned in the extra space on the right
    } else {
        // Game over state
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(player.x, player.y, player.width, player.height); // Freeze player
        obstacles.forEach(obs => {
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height); // Freeze obstacles
        });
        if (showControls && controlsImg.complete) {
            ctx.drawImage(controlsImg, leftBoundary - 160, 10, 150, 100); // Keep controls visible
        }
        ctx.font = '40px Roboto';
        ctx.fillStyle = '#ff0000';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', leftBoundary + (playAreaWidth / 2), canvas.height / 2);
        ctx.font = '20px Roboto';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(`Time Survived: ${formatTime(elapsedTime)}`, leftBoundary + (playAreaWidth / 2), canvas.height / 2 + 40);
        restartButton.style.display = 'block'; // Show restart button
    }

    // Request next frame
    requestAnimationFrame(update);
}

// Start the game loop after a 2-second delay
setTimeout(() => {
    update();
}, 2000);
