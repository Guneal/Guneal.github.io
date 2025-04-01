// Get the canvas and context
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 700; // Total width
canvas.height = 800;

// Define the playable area
const playAreaWidth = 350; // Playable area width
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
let obstacleSpeed1Wide = 5.33; // Reduced by 33% from 8
let obstacleSpeed2Wide = 2; // Reduced by 50% from 4
let obstacleSpeed3Wide = 1; // Half of 2wide
let obstacleSpawnTimer1Wide = 0;
let obstacleSpawnTimer2Wide = 0;
let obstacleSpawnTimer3Wide = 0;
let lastSpawnTime2Wide = 0;
let lastSpawnTime3Wide = 0;
const initialDelay = 3 * 60; // 3 seconds at 60 FPS
let gameStarted = false;
let gameOver = false;
let scoreSubmitted = false;

// Timer variables
let startTime = 0;
let elapsedTime = 0;

// Animation variables
let animationFrame = 0;
const animationDuration = 3 * 60; // 3 seconds at 60 FPS

// Controls image visibility
let showControls = false;

// Leaderboard elements
const leaderboardContainer = document.getElementById('leaderboard-container');
const scoreDisplay = document.getElementById('score-display');
const nameInput = document.getElementById('name-input');
const nameUnderscores = document.getElementById('name-underscores');
const confirmNameButton = document.getElementById('confirm-name-button');
const leaderboardScores = document.getElementById('leaderboard-scores');

// Reward elements
const rewardButton = document.getElementById('reward-button');
const rewardVideo = document.getElementById('reward-video');

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

// Load leaderboard from localStorage
function loadLeaderboard() {
    const leaderboard = localStorage.getItem('404hell-leaderboard');
    return leaderboard ? JSON.parse(leaderboard) : [];
}

// Save leaderboard to localStorage
function saveLeaderboard(leaderboard) {
    localStorage.setItem('404hell-leaderboard', JSON.stringify(leaderboard));
}

// Update leaderboard display
function updateLeaderboardDisplay() {
    const leaderboard = loadLeaderboard();
    leaderboardScores.innerHTML = '';
    leaderboard.forEach((entry, index) => {
        const entryDiv = document.createElement('div');
        entryDiv.innerHTML = `
            <span class="rank">${index + 1}.</span>
            <span class="name">${entry.name}</span>
            <span class="time">${formatTime(entry.time)}</span>
        `;
        leaderboardScores.appendChild(entryDiv);
    });
}

// Handle name input and underscore display
nameInput.addEventListener('input', () => {
    const value = nameInput.value.toUpperCase();
    const underscores = nameUnderscores.querySelectorAll('.underscore');
    underscores.forEach((underscore, index) => {
        underscore.textContent = index < value.length ? value[index] : '_';
        if (index === value.length || (index === 2 && value.length === 3)) {
            underscore.classList.add('active');
        } else {
            underscore.classList.remove('active');
        }
    });
    confirmNameButton.disabled = value.length !== 3;
});

// Handle score submission
confirmNameButton.addEventListener('click', () => {
    if (nameInput.value.length === 3 && !scoreSubmitted) {
        const leaderboard = loadLeaderboard();
        leaderboard.push({ name: nameInput.value.toUpperCase(), time: elapsedTime });
        leaderboard.sort((a, b) => b.time - a.time); // Sort descending by time
        if (leaderboard.length > 100) leaderboard.length = 100; // Keep top 100
        saveLeaderboard(leaderboard);
        updateLeaderboardDisplay();
        nameInput.disabled = true;
        confirmNameButton.disabled = true;
        scoreSubmitted = true;
    }
});

// Reward video button
rewardButton.addEventListener('click', () => {
    rewardButton.style.display = 'none';
    rewardVideo.style.display = 'block';
    rewardVideo.innerHTML = `
        <iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0" frameborder="0" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
    `;
});

// Restart game
restartButton.addEventListener('click', () => {
    gameStarted = false;
    gameOver = false;
    scoreSubmitted = false;
    animationFrame = 0;
    obstacles.length = 0;
    obstacleSpawnTimer1Wide = 0;
    obstacleSpawnTimer2Wide = 0;
    obstacleSpawnTimer3Wide = 0;
    lastSpawnTime2Wide = 0;
    lastSpawnTime3Wide = 0;
    player.x = leftBoundary + (playAreaWidth / 2) - 10;
    player.y = 100;
    startTime = 0;
    elapsedTime = 0;
    showControls = false;
    obstacleSpeed1Wide = 5.33; // Reset speed
    obstacleSpeed2Wide = 2;
    obstacleSpeed3Wide = 1;
    restartButton.style.display = 'none';
    leaderboardContainer.style.display = 'none';
    nameInput.disabled = false;
    nameInput.value = '';
    confirmNameButton.disabled = true;
    const underscores = nameUnderscores.querySelectorAll('.underscore');
    underscores.forEach(underscore => {
        underscore.textContent = '_';
        underscore.classList.remove('active');
    });
    rewardButton.style.display = 'none';
    rewardVideo.style.display = 'none';
    rewardVideo.innerHTML = '';
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
    lastSpawnTime2Wide = Date.now();
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
    lastSpawnTime3Wide = Date.now();
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
    // Clear the canvas without filling a background (transparency)
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
        obstacleSpeed1Wide = 5.33 + timeFactor * 2.67 + additionalTimeFactor * 1.33; // Speed: 5.33 to 8 by 3 minutes, then up to 9.33
        obstacleSpeed2Wide = 2 + timeFactor * 1 + additionalTimeFactor * 0.5; // Speed: 2 to 3 by 3 minutes, then up to 3.5
        obstacleSpeed3Wide = 1 + timeFactor * 0.5 + additionalTimeFactor * 0.25; // Speed: 1 to 1.5 by 3 minutes, then up to 1.75

        const spawnChance1Wide = 0.04 + timeFactor * 0.16; // Spawn chance for 1wide: 0.04 to 0.2 by 3 minutes
        const spawnChance2Wide = (0.005 + timeFactor * 0.02) * (elapsedTime >= 25 ? 1 : 0); // 0.005 to 0.025
        const spawnChance3Wide = (0.0025 + timeFactor * 0.01) * (elapsedTime >= 40 ? 1 : 0); // 0.0025 to 0.0125

        // Calculate max counts for 2wides and 3wides
        const max2Wides = 4 + timeFactor * 2; // 4 to 6 by 3 minutes
        const max3Wides = 2 + timeFactor * 1; // 2 to 3 by 3 minutes
        const current2Wides = obstacles.filter(obs => obs.type === '2wide').length;
        const current3Wides = obstacles.filter(obs => obs.type === '3wide').length;

        // Calculate forced delay (in milliseconds)
        const forcedDelay2Wide = 1000 - timeFactor * 500; // 1000ms to 500ms by 3 minutes
        const forcedDelay3Wide = 1000 - timeFactor * 500; // 1000ms to 500ms by 3 minutes

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
            if (
                Math.random() < spawnChance2Wide &&
                current2Wides < max2Wides &&
                (Date.now() - lastSpawnTime2Wide) >= forcedDelay2Wide
            ) { // Dynamic spawn rate with max count and forced delay
                spawn2Wide();
                obstacleSpawnTimer2Wide = 30; // 0.5 seconds delay
            }
        }

        // Spawn 3wide obstacles after 40 seconds
        if (obstacleSpawnTimer3Wide > 0) {
            obstacleSpawnTimer3Wide--;
        } else {
            if (
                Math.random() < spawnChance3Wide &&
                current3Wides < max3Wides &&
                (Date.now() - lastSpawnTime3Wide) >= forcedDelay3Wide
            ) { // Dynamic spawn rate with max count and forced delay
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

        // Show leaderboard
        leaderboardContainer.style.display = 'block';
        scoreDisplay.textContent = `You Survived: ${formatTime(elapsedTime)}`;
        updateLeaderboardDisplay();

        // Show reward button if survived over 1 minute
        if (elapsedTime >= 60) {
            rewardButton.style.display = 'block';
        }

        restartButton.style.display = 'block'; // Show restart button
    }

    // Request next frame
    requestAnimationFrame(update);
}

// Start the game loop after a 2-second delay
setTimeout(() => {
    update();
}, 2000);
