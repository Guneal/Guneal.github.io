// Get the canvas and context
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 400;
canvas.height = 600;

// Game variables
const player = {
    x: canvas.width / 2 - 10, // Center horizontally
    y: canvas.height / 2 - 10, // Fixed vertical position (center of screen)
    width: 20,
    height: 20,
    speed: 5,
    dx: 0 // Horizontal velocity
};

const obstacles = [];
const obstacleWidth = 10;
const obstacleHeight = 10;
const obstacleSpeed = 2; // Speed at which obstacles move upward
let obstacleSpawnTimer = 0;
const initialDelay = 5 * 60; // 5 seconds at 60 FPS
let gameStarted = false;
let gameOver = false;

// Animation variables
let animationFrame = 0;
const animationDuration = 3 * 60; // 3 seconds at 60 FPS

// Controls image
const controlsImg = document.getElementById('controls');

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

// Spawn obstacles
function spawnObstacle() {
    const position = Math.floor(Math.random() * 3); // 0: left, 1: center, 2: right
    let x;
    if (position === 0) {
        x = 50; // Left
    } else if (position === 1) {
        x = canvas.width / 2 - obstacleWidth / 2; // Center
    } else {
        x = canvas.width - 50 - obstacleWidth; // Right
    }
    obstacles.push({
        x: x,
        y: canvas.height, // Start at the bottom
        width: obstacleWidth,
        height: obstacleHeight
    });
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
        ctx.font = '30px Roboto';
        ctx.fillStyle = '#ff0000';
        ctx.textAlign = 'center';
        ctx.fillText('OH NO... YOU FELL', canvas.width / 2, canvas.height / 2 - 50);
        ctx.fillText('INTO 404 HELL', canvas.width / 2, canvas.height / 2);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(player.x, player.y + (animationFrame * 2), player.width, player.height); // Player falls during animation

        if (animationFrame >= animationDuration) {
            gameStarted = true;
            player.y = canvas.height / 2 - 10; // Reset player position
            controlsImg.style.display = 'block'; // Show controls
            obstacleSpawnTimer = initialDelay; // Start the 5-second delay
        }
    } else if (!gameOver) {
        // Update player position (horizontal movement only)
        player.x += player.dx;

        // Keep player within bounds
        if (player.x < 50) player.x = 50; // Left wall
        if (player.x + player.width > canvas.width - 50) player.x = canvas.width - 50 - player.width; // Right wall

        // Spawn obstacles after initial delay
        if (obstacleSpawnTimer > 0) {
            obstacleSpawnTimer--;
        } else {
            if (Math.random() < 0.02) { // Adjust spawn rate
                spawnObstacle();
                obstacleSpawnTimer = 60; // 1-second delay between spawns
            }
        }

        // Update obstacles
        for (let i = obstacles.length - 1; i >= 0; i--) {
            const obs = obstacles[i];
            obs.y -= obstacleSpeed; // Move upward
            if (obs.y + obs.height < 0) {
                obstacles.splice(i, 1); // Remove obstacles that go off-screen
            }
        }

        // Check collisions
        checkCollisions();

        // Draw player
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(player.x, player.y, player.width, player.height);

        // Draw obstacles
        ctx.fillStyle = '#ff0000';
        obstacles.forEach(obs => {
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
        });
    } else {
        // Game over state
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(player.x, player.y, player.width, player.height); // Freeze player
        obstacles.forEach(obs => {
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height); // Freeze obstacles
        });
        ctx.font = '30px Roboto';
        ctx.fillStyle = '#ff0000';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2);
        ctx.fillStyle = '#ffffff';
        ctx.font = '20px Roboto';
        ctx.fillText('Refresh to try again', canvas.width / 2, canvas.height / 2 + 40);
    }

    // Request next frame
    requestAnimationFrame(update);
}

// Start the game loop after a 2-second delay
setTimeout(() => {
    update();
}, 2000);
