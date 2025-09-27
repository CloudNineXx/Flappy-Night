
// Board 
let board; 
let boardWidth = 256 * 3;
let boardHeight = 256 * 3;
let context; 

// Bird
let birdWidth = 34;
let birdHeight = 24;
let birdX = boardWidth/3;
let birdY = boardHeight/2;
// let birdImg;
let birdImgs = []; 
let birdImgsIndex = 0; 

let bird = { 
    x: birdX,
    y: birdY,
    width: birdWidth,
    height: birdHeight
} 



// pipes 
let pipeArray = []; 
let pipeWidth = 64; 
let pipeHeight = boardHeight / 2; 
let pipeX = boardWidth;
let pipeY = 0;

let topPipeImg; 
let bottomPipeImg; 

let backgroundImg = new Image();
backgroundImg.src = "https://pixeljoint.com/files/icons/full/save3.png";

// physics 
let velocityX = -2; // how fast the pipes move to the left
let velocityY = 0; // bird jump speed 
let gravity = 0.2; 

let gameOver = false;
let score = 0; 

let bgm = new Audio("./flappyvibe.mp3");
bgm.loop = true; 

window.onload = function() {
    board = document.getElementById("board"); 
    board.width = boardWidth; 
    board.height = boardHeight; 
    context = board.getContext("2d"); // used for drawing on the board 

    context.imageSmoothingEnabled = false; 

    requestAnimationFrame(update);

    

    // Draw bird 
    // context.fillStyle = "green";
    // context.fillRect(bird.x, bird.y, bird.width, bird.height);

    // Load bird image
    // birdImg = new Image();
    // birdImg.src = "./flappybird.png"; 
    // birdImg.onload = function() {
    //     context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height);
    // } 

    for (let i = 0; i < 4; i++) { 
        let birdImg = new Image(); 
        birdImg.src = `./flappybird${i}.png`; 
        birdImgs.push(birdImg); 
    }

    topPipeImg = new Image();
    topPipeImg.src = "./toppipe.png";

    bottomPipeImg = new Image();
    bottomPipeImg.src = "./bottompipe.png";

    requestAnimationFrame(update);
    setInterval(placePipes, 1500); // every 1.5 seconds 
    setInterval(animateBird, 100); // every 0.1 seconds 
    document.addEventListener("keydown", moveBird); 

    // Music toggle button
    const musicBtn = document.getElementById("music-toggle");
    let musicPlaying = false;

    musicBtn.addEventListener("click", function() {
        if (musicPlaying) {
            bgm.pause();
            musicBtn.dataset.playing = "false";
        } else {
            bgm.play();
            musicBtn.dataset.playing = "true";
        }
        musicPlaying = !musicPlaying;
        drawMusicIconLine();
    });

    drawMusicIconLine(); // Initial state

} 

function drawMusicIconLine() {
    const musicBtn = document.getElementById("music-toggle");
    const gameContainer = document.getElementById("game-container");
    // Remove previous canvas if any
    let overlay = document.getElementById("music-overlay");
    if (overlay) overlay.remove();

    if (musicBtn.dataset.playing === "false" || !bgm.paused) {
        // Only draw line if music is paused
        if (bgm.paused) {
            // Create canvas overlay
            overlay = document.createElement("canvas");
            overlay.id = "music-overlay";
            overlay.width = musicBtn.width;
            overlay.height = musicBtn.height;
            overlay.style.position = "absolute";
            overlay.style.left = musicBtn.offsetLeft + "px";
            overlay.style.top = musicBtn.offsetTop + "px";
            overlay.style.pointerEvents = "none";
            overlay.style.zIndex = "11";
            gameContainer.appendChild(overlay); // <-- append to gameContainer

            const ctx = overlay.getContext("2d");
            ctx.strokeStyle = "red";
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(overlay.width, overlay.height);
            ctx.stroke();
        }
    }
}

function update() { 
    requestAnimationFrame(update); 
    if (gameOver) {
        return;
    }
    context.drawImage(backgroundImg, 0, 0, board.width, board.height); 

    // bird 
    velocityY += gravity; 
    // bird.y += velocityY; 
    bird.y = Math.max(bird.y + velocityY, 0); 
    // context.drawImage(birdImg, bird.x, bird.y, bird.width, bird.height); 
    context.drawImage(birdImgs[birdImgsIndex], bird.x, bird.y, bird.width, bird.height); 
    // birdImgsIndex++; 
    // birdImgsIndex %= birdImgs.length; 

    if (bird.y > board.height) {
        gameOver = true; 
    } 

    // pipes 
    for (let i = 0; i < pipeArray.length; i++) { 
    let pipe = pipeArray[i]; 
    pipe.x += velocityX; // move pipe to the left

    // Draw top pipe (from top to gap)
    context.drawImage(
        topPipeImg,
        pipe.x,
        0,
        pipe.width,
        pipe.gapY
    );
    // Tint top pipe
    context.save();
    context.globalAlpha = 0.6;
    context.globalCompositeOperation = "source-atop";
    context.fillStyle = "#6A0DAD";
    context.fillRect(pipe.x, 0, pipe.width, pipe.gapY);
    context.globalCompositeOperation = "source-over";
    context.globalAlpha = 1.0;
    context.restore();

    // Draw bottom pipe (from gap+opening to bottom)
    context.drawImage(
        bottomPipeImg,
        pipe.x,
        pipe.gapY + pipe.openingSpace,
        pipe.width,
        boardHeight - (pipe.gapY + pipe.openingSpace)
    );
    // Tint bottom pipe
    context.save();
    context.globalAlpha = 0.6;
    context.globalCompositeOperation = "source-atop";
    context.fillStyle = "#6A0DAD";
    context.fillRect(pipe.x, pipe.gapY + pipe.openingSpace, pipe.width, boardHeight - (pipe.gapY + pipe.openingSpace));
    context.globalCompositeOperation = "source-over";
    context.globalAlpha = 1.0;
    context.restore();

    // Collision and scoring logic
    // Top pipe
    if (detectCollision(bird, {
        x: pipe.x,
        y: 0,
        width: pipe.width,
        height: pipe.gapY
    })) {
        gameOver = true;
    }
    // Bottom pipe
    if (detectCollision(bird, {
        x: pipe.x,
        y: pipe.gapY + pipe.openingSpace,
        width: pipe.width,
        height: boardHeight - (pipe.gapY + pipe.openingSpace)
    })) {
        gameOver = true;
    }

    if(!pipe.passed && bird.x > pipe.x + pipe.width) { 
    score += 1; // increment by 1 per gap
    pipe.passed = true; 
    }
} 

    // clear pipes 
    while (pipeArray.length > 0 && pipeArray[0].x < -pipeWidth) { 
        pipeArray.shift(); // remove first element from array
    }

    // score 
context.fillStyle = "white";
context.font = "45px Audiowide, Sans-serif";
context.textAlign = "center"; // center horizontally
context.textBaseline = "top"; // align to top

context.fillText(score, boardWidth / 2, 20);

if (gameOver) { 
    context.fillText("Game Over", boardWidth / 2, 80);
}

} 

function animateBird() { 
    birdImgsIndex++; 
    birdImgsIndex %= birdImgs.length; 
}

function placePipes() { 
    if (gameOver) {
        return;
    } 

    let openingSpace = boardHeight / 4; // size of gap between pipes
    let minGapY = 50;
    let maxGapY = boardHeight - openingSpace - 50;
    let gapY = Math.floor(Math.random() * (maxGapY - minGapY + 1)) + minGapY;

    pipeArray.push({
        x: pipeX,
        gapY: gapY,
        width: pipeWidth,
        openingSpace: openingSpace,
        passed: false
    });
}

function moveBird(e) { 
    if (e.code == "Space" || e.code == "ArrowUp" || e.code == "KeyX") { 
        bgm.play(); 
        //jump 
        velocityY = -5; // stronger jump

        // reset game 
        if (gameOver) { 
            bird.y = birdY; 
            pipeArray = []; 
            score = 0; 
            gameOver = false; 
        }
    } 
} 

function detectCollision(a, b) { 
    return a.x < b.x + b.width && 
           a.x + a.width > b.x && 
           a.y < b.y + b.height && 
           a.y + a.height > b.y; 
} 