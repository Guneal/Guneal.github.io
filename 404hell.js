// Get the canvas and context
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 600;
canvas.height = 800;

// Load the controls image
const controlsImg = new Image();
controlsImg.src = '404-hell-controls.png';

// Game variables
const player = {
    x: canvas.width / 2 - 10, // Center horizontally
    y: 100, // Higher on the screen (near the top)
    width: 20,
    height: 20,
    speed: 5,
    dx: 0 // Horizontal velocity
};

const obstacles = [];
const laneWidth = (canvas.width - 100) / 3; // 3 lanes between boundaries (50px on each side)
const obstacleWidth = laneWidth - 10; // Narrow gaps between lanes (10px gaps)
const obstacleHeight = 10;
let obstacleSpeed = 4; // Starting speed
let obstacleSpawnTimer = 0;
const initialDelay = 5 * 60; // 5 seconds at 60 FPS
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
    player.x = canvas.width / 2 - 10;
    player.y = 100;
    startTime = 0;
    elapsedTime = 0;
    showControls = false;
    obstacleSpeed = 4; // Reset speed
    restartButton.style.display = 'none';
});

// Spawn obstacles
function spawnObstacle() {
    const position = Math.floor(Math.random() * 3); // 0: left, 1: center, 2: right
    let x;
    if (position === 0) {
        x = 50; // Left lane
    } else if (position === 1) {
        x = 50 + laneWidth; // Center lane
    } else {
        x = 50 + laneWidth * 2; // Right lane
    }
    obstacles.push({
        x: x,
        y: canvas.height, // Start at the bottom
        width: obstacleWidth,
        height: obstacleHeight
    });
}

// Format time as MM:SS
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `Time: ${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
    ctx.fillRect(40, 0, 10, canvas.height); // Left wall
    ctx.fillRect(canvas.width - 50, 0, 10, canvas.height); // Right wall

    if (!gameStarted) {
        // Initial animation
        animationFrame++;
        ctx.font = '40px Roboto';
        ctx.fillStyle = '#ff0000';
        ctx.textAlign = 'center';
        ctx.fillText('OH NO... YOU FELL', canvas.width / 2, canvas.height / 2 - 50);
        ctx.fillText('INTO 404 HELL', canvas.width / 2, canvas.height / 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(player.x, player.y + (animationFrame * 2), player.width, player.height); // Player falls during animation

        if (animationFrame >= animationDuration) {
            gameStarted = true;
            player.y = 100; // Reset player position higher on the screen
            showControls = true; // Show controls on the canvas
            obstacleSpawnTimer = initialDelay; // Start the 5-second delay
            startTime = Date.now(); // Start the timer
        }
    } else if (!gameOver) {
        // Update timer
        elapsedTime = (Date.now() - startTime) / 1000; // Time in seconds

        // Increase difficulty over time (up to 5 minutes)
        const maxTime = 5 * 60; // 5 minutes in seconds
        const timeFactor = Math.min(elapsedTime / maxTime, 1); // 0 to 1 over 5 minutes
        obstacleSpeed = 4 + timeFactor * 6; // Speed increases from 4 to 10
        const spawnChance = 0.02 + timeFactor * 0.08; // Spawn chance increases from 0.02 to 0.1

        // Update player position (horizontal movement only)
        player.x += player.dx;

        // Keep player within bounds
        if (player.x < 50) player.x = 50; // Left wall
        if (player.x + player.width > canvas.width - 50) player.x = canvas.width - 50 - player.width; // Right wall

        // Spawn obstacles after initial delay
        if (obstacleSpawnTimer > 0) {
            obstacleSpawnTimer--;
        } else {
            if (Math.random() < spawnChance) { // Dynamic spawn rate
                spawnObstacle();
                obstacleSpawnTimer = 60; // 1-second delay between spawns
            }
        }

        // Update obstacles
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obs = obstacles[i];
            obs.y -= obstacleSpeed; // Move upward faster
            if (obs.y + obs.height < 0) {
                obstacles.splice(i, 1); // Remove obstacles that go off-screen
            }
        }

        // Check collisions
        checkCollisions();

        // Draw controls image on the canvas
        if (showControls && controlsImg.complete) {
            ctx.drawImage(controlsImg, 5, 10, 150, 100); // Moved further left
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
        ctx.textAlign = 'right';
        ctx.fillText(formatTime(elapsedTime), canvas.width - 40, 30); // Right of the right boundary
    } else {
        // Game over state
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(player.x, player.y, player.width, player.height); // Freeze player
        obstacles.forEach(obs => {
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height); // Freeze obstacles
        });
        if (showControls && controlsImg.complete) {
            ctx.drawImage(controlsImg, 5, 10, 150, 100); // Keep controls visible
        }
        ctx.font = '40px Roboto';
        ctx.fillStyle = '#ff0000';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        restartButton.style.display = 'block'; // Show restart button
    }

    // Request next frame
    requestAnimationFrame(update);
}

// Start the game loop after a 2-second delay
setTimeout(() => {
    update();
}, 2000);
