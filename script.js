const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Ball properties
const ballRadius = 50;
const gravity = 9.81;  // Acceleration due to gravity (m/s^2)
const airResistance = 0.01; // Air resistance factor
const bounce = 0.7;   // Coefficient of restitution for bounce
const initialInterval = 30000; // Initial interval for spawning new balls (30 seconds)
const minInterval = 2000;      // Minimum interval between spawns (2 seconds)

// Array to store all the balls
let balls = [];
let isDragging = false;
let startX, startY;  // Starting position of the drag
let dragBallIndex = -1;  // Index of the dragged ball

// Timer for spawning balls
let spawnTimer;
let spawnInterval = initialInterval;

// Function to create a new ball
function createBall(x, y, dx = 0, dy = 0) {
    return {
        x,
        y,
        dx,
        dy,
        angle: 0,             // Angle of rotation
        angularVelocity: 0,  // Angular velocity
        mass: 1,             // Mass of the ball for realistic physics
        inertia: 0.1 // Inertia for rolling physics
    };
}

// Initialize the first ball
balls.push(createBall(canvas.width / 2, canvas.height / 2));

// Function to draw a ball
function drawBall(ball) {
    ctx.save();
    ctx.translate(ball.x, ball.y);
    ctx.rotate(ball.angle);
    ctx.fillStyle = 'white';
    ctx.beginPath();
    ctx.arc(0, 0, ballRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

// Function to draw text
function drawText(ball) {
    ctx.font = '24px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Yes', ball.x, ball.y);
}

// Function to handle ball collisions
function handleBallCollisions() {
    for (let i = 0; i < balls.length; i++) {
        for (let j = i + 1; j < balls.length; j++) {
            const ballA = balls[i];
            const ballB = balls[j];

            const dx = ballB.x - ballA.x;
            const dy = ballB.y - ballA.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 2 * ballRadius) {
                // Calculate new velocities after collision
                const normalX = dx / distance;
                const normalY = dy / distance;

                const relativeVelocityX = ballB.dx - ballA.dx;
                const relativeVelocityY = ballB.dy - ballA.dy;

                const dotProduct = (relativeVelocityX * normalX) + (relativeVelocityY * normalY);

                const impulse = 2 * dotProduct / (ballA.mass + ballB.mass);
                ballA.dx -= (impulse * normalX) * ballB.mass;
                ballA.dy -= (impulse * normalY) * ballB.mass;
                ballB.dx += (impulse * normalX) * ballA.mass;
                ballB.dy += (impulse * normalY) * ballA.mass;

                // Resolve overlap
                const overlap = 2 * ballRadius - distance;
                ballA.x -= overlap * normalX / 2;
                ballA.y -= overlap * normalY / 2;
                ballB.x += overlap * normalX / 2;
                ballB.y += overlap * normalY / 2;

                // Update angular velocities based on collision
                const angularImpulse = dotProduct * (1 - bounce) / (ballRadius);
                ballA.angularVelocity += angularImpulse;
                ballB.angularVelocity -= angularImpulse;
            }
        }
    }
}

// Function to update ball positions and rolling physics
function updateBallPositions() {
    balls.forEach(ball => {
        if (!isDragging || ball !== balls[dragBallIndex]) {
            // Apply gravity
            ball.dy += gravity * 0.1; // Adjust gravity effect

            // Apply air resistance
            ball.dx *= (1 - airResistance);
            ball.dy *= (1 - airResistance);
            ball.angularVelocity *= (1 - airResistance);

            // Update position based on velocity
            ball.x += ball.dx;
            ball.y += ball.dy;

            // Update rotation
            ball.angle += ball.angularVelocity;

            // Check for collision with canvas edges
            if (ball.x + ballRadius > canvas.width) {
                ball.x = canvas.width - ballRadius;
                ball.dx = -ball.dx * bounce;
                ball.angularVelocity *= -0.5; // Change direction and reduce rotation speed
            }
            if (ball.x - ballRadius < 0) {
                ball.x = ballRadius;
                ball.dx = -ball.dx * bounce;
                ball.angularVelocity *= -0.5; // Change direction and reduce rotation speed
            }
            if (ball.y + ballRadius > canvas.height) {
                ball.y = canvas.height - ballRadius;
                ball.dy = -ball.dy * bounce;
                ball.angularVelocity *= -0.5; // Change direction and reduce rotation speed
            }
            if (ball.y - ballRadius < 0) {
                ball.y = ballRadius;
                ball.dy = -ball.dy * bounce;
                ball.angularVelocity *= -0.5; // Change direction and reduce rotation speed
            }
        }
    });
}

// Function to handle mouse down event
function handleMouseDown(event) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    balls.forEach((ball, index) => {
        const distance = Math.sqrt((mouseX - ball.x) ** 2 + (mouseY - ball.y) ** 2);
        if (distance <= ballRadius) {
            isDragging = true;
            dragBallIndex = index;
            startX = mouseX;
            startY = mouseY;
        }
    });
}

// Function to handle mouse move event
function handleMouseMove(event) {
    if (isDragging) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // Update ball position based on drag
        const ball = balls[dragBallIndex];
        ball.x = mouseX;
        ball.y = mouseY;
    }
}

// Function to handle mouse up event
function handleMouseUp(event) {
    if (isDragging) {
        const rect = canvas.getBoundingClientRect();
        const endX = event.clientX - rect.left;
        const endY = event.clientY - rect.top;

        // Calculate velocity based on drag distance
        const ball = balls[dragBallIndex];
        ball.dx = (endX - startX) * 0.1;
        ball.dy = (endY - startY) * 0.1;

        // Apply some initial angular velocity for rolling
        ball.angularVelocity = Math.random() * 0.1 - 0.05;

        isDragging = false;
        dragBallIndex = -1;
    }
}

// Function to create new balls periodically
function createNewBalls() {
    if (balls.length < 20) { // Limit the number of balls to 20
        const newX = Math.random() * (canvas.width - 2 * ballRadius) + ballRadius;
        const newY = -ballRadius; // Start above the canvas
        balls.push(createBall(newX, newY, 0, 0));

        // Decrease the spawn interval over time
        spawnInterval = Math.max(minInterval, spawnInterval * 0.9);
        clearInterval(spawnTimer);
        spawnTimer = setInterval(createNewBalls, spawnInterval);
    }
}

// Draw function
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    balls.forEach(ball => {
        drawBall(ball);
        drawText(ball);
    });
    handleBallCollisions();
    updateBallPositions();
}

// Set up event listeners for mouse events
canvas.addEventListener('mousedown', handleMouseDown);
canvas.addEventListener('mousemove', handleMouseMove);
canvas.addEventListener('mouseup', handleMouseUp);

// Start animation and ball creation
spawnTimer = setInterval(createNewBalls, spawnInterval);
setInterval(draw, 10);
