async function startGameAndSubmit(event) {
    event.preventDefault(); // Prevent form submission

    const textarea = document.getElementById("requirements");
const inputText = textarea.value.trim().toLowerCase();
const errorMessage = document.getElementById("validation-error");

// Simplified validation for "budget" and "headcount"
const budgetRegex = /(\$\s*\d+|\d+\s*\$)/; // Matches "$5000" or "5000$"
const headcountRegex = /\b\d+\s*(guests?|people|children)\b/i; // Matches "50 guests", "20 people", "10 children"

// Ensure both budget and headcount are present
if (!budgetRegex.test(inputText) || !headcountRegex.test(inputText)) {
    errorMessage.style.display = "block";
    errorMessage.textContent = "Unable to extract event details. Please check your input.";
    textarea.style.borderColor = "red";
    return; // Stop if validation fails
}

    errorMessage.style.display = "none";
    textarea.style.borderColor = ""; // Reset styles

    // Show the game overlay
    const gameOverlay = document.getElementById("game-overlay");
    gameOverlay.style.display = "flex";

    let recommendationsReady = false;
    let recommendationsUrl = "";

    // Start the snake game without waiting for recommendations
    initSnakeGame();

    // Fetch recommendations in the background
    try {
        const formData = new FormData(event.target);
        const response = await fetch("/", {
            method: "POST",
            body: formData,
        });

        if (response.redirected) {
            recommendationsReady = true;
            recommendationsUrl = response.url;

            console.log("Recommendations are ready:", recommendationsUrl);

            // Show modal once recommendations are ready
            showRecommendationModal(recommendationsUrl);
        } else {
            const errorText = await response.text();
            console.error("Failed to fetch recommendations:", response.status, errorText);
        }
    } catch (error) {
        console.error("Error submitting form:", error);
    }
}

function showRecommendationModal(recommendationsUrl) {
    const modalHTML = `
        <div id="recommendation-modal" style="position: fixed; z-index: 2000; top: 50%; left: 50%; transform: translate(-50%, -50%); background: rgba(0, 0, 0, 0.8); padding: 20px; color: white; border-radius: 8px; text-align: center;">
            <h3>Recommendations Ready</h3>
            <p>Your recommendations are ready. Do you want to proceed?</p>
            <div style="margin-top: 10px; display: flex; justify-content: center; gap: 10px;">
                <button id="proceed-btn" style="background: green; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer;">Proceed</button>
                <button id="stay-btn" style="background: blue; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer;">Stay Here</button>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalHTML);

    document.getElementById("proceed-btn").addEventListener("click", () => {
        window.location.href = recommendationsUrl; // Redirect to recommendations
    });

    document.getElementById("stay-btn").addEventListener("click", () => {
        document.getElementById("recommendation-modal").remove(); // Close modal
    });
}
function initSnakeGame() {
    const playBoard = document.querySelector(".play-board");
    const scoreElement = document.querySelector(".score");
    const highScoreElement = document.querySelector(".high-score");

    let blockSize = 25;
    let total_row = 17;
    let total_col = 17;
    let snakeX = blockSize * 5;
    let snakeY = blockSize * 5;
    let velocityX = 0;
    let velocityY = 0;
    let snakeBody = [[snakeX, snakeY]];
    let foodX, foodY;
    let gameOver = false;
    let score = 0;

    let highScore = localStorage.getItem("high-score") || 0;
    highScoreElement.innerText = `High Score: ${highScore}`;

    const placeFood = () => {
        do {
            foodX = Math.floor(Math.random() * total_col) * blockSize;
            foodY = Math.floor(Math.random() * total_row) * blockSize;
        } while (snakeBody.some(segment => segment[0] === foodX && segment[1] === foodY));
    };
    placeFood();

    const renderGame = () => {
        playBoard.innerHTML = ""; // Clear the board

        // Render food
        const foodElement = document.createElement("div");
        foodElement.style.gridArea = `${foodY / blockSize + 1} / ${foodX / blockSize + 1}`;
        foodElement.classList.add("food");
        playBoard.appendChild(foodElement);

        // Render snake
        snakeBody.forEach(segment => {
            const segmentElement = document.createElement("div");
            segmentElement.style.gridArea = `${segment[1] / blockSize + 1} / ${segment[0] / blockSize + 1}`;
            segmentElement.classList.add("head");
            playBoard.appendChild(segmentElement);
        });

        scoreElement.innerText = `Score: ${score}`;
    };

    const handleGameOver = () => {
        clearInterval(setIntervalId);
        gameOver = true;

        const gameOverMessage = `
            <div id="game-over-card" style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; background: rgba(0, 0, 0, 0.7); color: white; border-radius: 8px; padding: 20px; width: 300px; margin: auto; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">
                <h2>Game Over</h2>
                <p>Oops! You hit the wall or yourself.</p>
                <button id="restart-btn" style="background: #007BFF; color: white; padding: 10px; border-radius: 4px; cursor: pointer;">Restart</button>
            </div>
        `;
        playBoard.innerHTML = gameOverMessage;

        document.getElementById("restart-btn").addEventListener("click", restartGame);
    };

    const restartGame = () => {
        gameOver = false;
        snakeX = blockSize * 5;
        snakeY = blockSize * 5;
        velocityX = 0;
        velocityY = 0;
        snakeBody = [[snakeX, snakeY]];
        score = 0;
        placeFood();
        setIntervalId = setInterval(updateGame, 200);
        renderGame();
    };

    const updateGame = () => {
        if (gameOver) return handleGameOver();

        snakeX += velocityX * blockSize;
        snakeY += velocityY * blockSize;

        if (snakeX < 0 || snakeX >= blockSize * total_col || snakeY < 0 || snakeY >= blockSize * total_row) {
            gameOver = true;
            return handleGameOver();
        }

        for (let i = 1; i < snakeBody.length; i++) {
            if (snakeBody[i][0] === snakeX && snakeBody[i][1] === snakeY) {
                gameOver = true;
                return handleGameOver();
            }
        }

        if (snakeX === foodX && snakeY === foodY) {
            score++;
            snakeBody.push([foodX, foodY]);
            highScore = Math.max(score, highScore);
            localStorage.setItem("high-score", highScore);
            highScoreElement.innerText = `High Score: ${highScore}`;
            placeFood();
        }

        for (let i = snakeBody.length - 1; i > 0; i--) {
            snakeBody[i] = [...snakeBody[i - 1]];
        }
        snakeBody[0] = [snakeX, snakeY];

        renderGame();
    };

    const changeDirection = (key) => {
        if (key === "ArrowUp" && velocityY !== 1) {
            velocityX = 0;
            velocityY = -1;
        } else if (key === "ArrowDown" && velocityY !== -1) {
            velocityX = 0;
            velocityY = 1;
        } else if (key === "ArrowLeft" && velocityX !== 1) {
            velocityX = -1;
            velocityY = 0;
        } else if (key === "ArrowRight" && velocityX !== -1) {
            velocityX = 1;
            velocityY = 0;
        }
    };

    // Add event listeners for keyboard keys
    document.addEventListener("keydown", (e) => changeDirection(e.key));

    // Add event listeners for on-screen controls
    document.querySelectorAll(".controls i").forEach(button => {
        button.addEventListener("click", () => changeDirection(button.dataset.key));
    });

    let setIntervalId = setInterval(updateGame, 200);

    renderGame();
}
