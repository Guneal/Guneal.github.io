// Get the canvas and context
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 700; // Total width
canvas.height = 800;

// Define the playable area
const playAreaWidth = 350; // Reduced from 400px to 350px
const leftBoundary = (canvas.width - playAreaWidth) / 2; // Center the playable area: (700 - 350) / 2 = 175
const rightBoundary = leftBoundary + playAreaWidth; // 175 + 350 = 525

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
const laneWidth = playAreaWidth / 5; // 5 lanes within the playable area (350 / 5 = 70px)
const obstacleWidth = laneWidth - 10; // Narrow gaps between lanes (10px gaps)
const obstacleHeight = 10;
let obstacleSpeed1Wide = 8; // Starting speed for 1wide (red)
let obstacleSpeed2Wide = 4; // Starting speed for 2wide (orange), 50% of 1wide
let obstacleSpeed3Wide = 1; // Starting speed for 3wide (purple), 25% of 2wide
let obstacleSpawnTimer1Wide = 0;
let obstacleSpawnTimer2Wide = 0;
let obstacleSpawnTimer3Wide = 0;
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
    obstacleSpawnTimer1Wide = 0;
    obstacleSpawnTimer2Wide = 0;
    obstacleSpawnTimer3Wide = 0;
    player.x = leftBoundary + (playAreaWidth / 2) - 10;
    player.y = 100;
    startTime = 0;
    elapsedTime = 0;
    showControls = false;
    obstacleSpeed1Wide = 8; // Reset speed
    obstacleSpeed2Wide = 4;
    obstacleSpeed3Wide = 1;
    restartButton.style.display = 'none';
});

// Spawn obstacles
function spawn1Wide() {
    const position = Math.floor(Math.random() * 5); // 0 to 4 for 5 lanes
    const x = leftBoundary + position * laneWidth; // Lane positions within the playable area
    const speedVariation = obstacleSpeed1Wide * (0.9 + Math.random() * 0.2); // Speed varies between 90% and 110%
    obstacles.push({
        x: x,
        y: canvas.height, // Start at the bottom
        width: obstacleWidth,
        height: obstacleHeight,
        speed: speedVariation,
        type: '1wide' // Red obstacle
    });
}

function spawn2Wide() {
    const position = Math.floor(Math.random() * 4); // 0 to 3 for 4 possible positions (lanes 0-1, 1-2, 2-3, 3-4)
    const x = leftBoundary + position * laneWidth; // Lane positions within the playable area
    const speedVariation = obstacleSpeed2Wide * (0.9 + Math.random() * 0.2); // Speed varies between 90% and 110%
    obstacles.push({
        x: x,
        y: canvas.height, // Start at the bottom
        width: obstacleWidth * 2 + 10, // 2 lanes wide (including the gap)
        height: obstacleHeight,
        speed: speedVariation,
        type: '2wide' // Orange obstacle
    });
}

function spawn3Wide() {
    const position = Math.floor(Math.random() * 3); // 0 to 2 for 3 possible positions (lanes 0-2, 1-3, 2-4)
    const x = leftBoundary + position * laneWidth; // Lane positions within the playable area
    const speedVariation = obstacleSpeed3Wide * (0.9 + Math.random() * 0.2); // Speed varies between 90% and 110%
    obstacles.push({
        x: x,
        y: canvas.height, // Start at the bottom
        width: obstacleWidth * 3 + 20, // 3 lanes wide (including the gaps)
        height: obstacleHeight,
        speed: speedVariation,
        type: '3wide' // Purple obstacle
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
            obstacleSpawnTimer1Wide = initialDelay; // Start the 3-second delay
            startTime = Date.now(); // Start the timer
        }
    } else if (!gameOver) {
        // Update timer
        elapsedTime = (Date.now() - startTime) / 1000; // Time in seconds

        // Increase difficulty over time
        const rampUpTime = 3 * 60; // 3 minutes in seconds
        const timeFactor = Math.min(elapsedTime / rampUpTime, 1); // 0 to 1 over 3 minutes
        const additionalTimeFactor = elapsedTime > rampUpTime ? (elapsedTime - rampUpTime) / (2 * 60) : 0; // Slight increase after 3 minutes
        obstacleSpeed1Wide = 8 + timeFactor * 4 + additionalTimeFactor * 2; // Speed: 8 to 12 by 3 minutes, then up to 14
        obstacleSpeed2Wide = 4 + timeFactor * 2 + additionalTimeFactor * 1; // Speed: 4 to 6 by 3 minutes, then up to 7
        obstacleSpeed3Wide = 1 + timeFactor * 0.5 + additionalTimeFactor * 0.25; // Speed: 1 to 1.5 by 3 minutes, then up to 1.75

        const spawnChance1Wide = 0.04 + timeFactor * 0.16; // Spawn chance for 1wide: 0.04 to 0.2 by 3 minutes
        const spawnChance2Wide = (0.02 + timeFactor * 0.08) * (elapsedTime >= 25 ? 1 : 0); // Spawn chance for 2wide: 0.02 to 0.1, starts at 25s
        const spawnChance3Wide = (0.01 + timeFactor * 0.04) * (elapsedTime >= 40 ? 1 : 0); // Spawn chance for 3wide: 0.01 to 0.05, starts at 40s

        // Update player position (horizontal movement only)
        player.x += player.dx;

        // Keep player within bounds
        if (player.x < leftBoundary) player.x = leftBoundary; // Left wall
        if (player.x + player.width > rightBoundary) player.x = rightBoundary - player.width; // Right wall

        // Spawn 1wide obstacles after initial delay
        if (obstacleSpawnTimer1Wide > 0) {
            obstacleSpawnTimer1Wide--;
        } else {
            if (Math.random() < spawnChance1Wide) { // Dynamic spawn rate
                spawn1Wide();
                obstacleSpawnTimer1Wide = 30; // 0.5 seconds delay
            }
        }

        // Spawn 2wide obstacles after 25 seconds
        if (obstacleSpawnTimer2Wide > 0) {
            obstacleSpawnTimer2Wide--;
        } else {
            if (Math.random() < spawnChance2Wide) { // Dynamic spawn rate
                spawn2Wide();
                obstacleSpawnTimer2Wide = 30; // 0.5 seconds delay
            }
        }

        // Spawn 3wide obstacles after 40 seconds
        if (obstacleSpawnTimer3Wide > 0) {
            obstacleSpawnTimer3Wide--;
        } else {
            if (Math.random() < spawnChance3Wide) { // Dynamic spawn rate
                spawn3Wide();
                obstacleSpawnTimer3Wide = 30; // 0.5 seconds delay
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
        obstacles.forEach(obs => {
            if (obs.type === '1wide') {
                ctx.fillStyle = '#ff0000'; // Red for 1wide
            } else if (obs.type === '2wide') {
                ctx.fillStyle = '#FFA500'; // Orange for 2wide
            } else if (obs.type === '3wide') {
                ctx.fillStyle = '#800080'; // Purple for 3wide
            }
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        });

        // Draw timer
        ctx.font = '20px Roboto';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'left';
        ctx.fillText(`Time: ${formatTime(elapsedTime)}`, rightBoundary + 35, 30); // Adjusted for even spacing
    } else {
        // Game over state
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(player.x, player.y, player.width, player.height); // Freeze player
        obstacles.forEach(obs => {
            if (obs.type === '1wide') {
                ctx.fillStyle = '#ff0000'; // Red for 1wide
            } else if (obs.type === '2wide') {
                ctx.fillStyle = '#FFA500'; // Orange for 2wide
            } else if (obs.type === '3wide') {
                ctx.fillStyle = '#800080'; // Purple for 3wide
            }
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
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
