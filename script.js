const c = document.getElementById("canvas");
const x = c.getContext("2d");

const W = c.width;
const H = c.height;

const G = 72;
const BX = 92;
const BS = 28;
const GR = 0.42;
const FL = -7.2;

const PW = 64;
const PG = 155;
const PS = 2.8;
const PI = 1500;

const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const overlay = document.getElementById("overlay");
const title = document.getElementById("title");
const msg = document.getElementById("message");
const start = document.getElementById("start");

let bird;
let pipes;
let score;
let best = +localStorage.getItem("flappy-best") || 0;
let state = "ready";
let last = 0;
let timer = 0;

bestEl.textContent = best;

function pipe(px = W + 20) {
    let min = 75;
    let max = H - G - PG - 75;

    return {
        x: px,
        top: Math.random() * (max - min) + min,
        scored: false
    };
}

function reset() {
    bird = {
        y: H / 2,
        v: 0
    };

    pipes = [pipe(W + 70)];

    score = 0;
    timer = 0;

    scoreEl.textContent = 0;
}

function begin() {
    reset();

    state = "play";

    overlay.classList.add("hide");

    bird.v = FL;
}

function flap() {
    if (state !== "play") {
        begin();
    } else {
        bird.v = FL;
    }
}

function end() {
    state = "over";

    best = Math.max(best, score);

    localStorage.setItem("flappy-best", best);

    bestEl.textContent = best;

    title.textContent = "Game Over";

    msg.textContent = "Score: " + score + " • Best: " + best;

    start.textContent = "Play Again";

    overlay.classList.remove("hide");
}

function update(dt) {
    bird.v += GR * dt;
    bird.y += bird.v * dt;

    timer += dt * 16.67;

    if (timer >= PI) {
        pipes.push(pipe());

        timer -= PI;
    }

    pipes.forEach(p => {
        p.x -= PS * dt;

        if (!p.scored && p.x + PW < BX - BS / 2) {
            p.scored = true;

            score++;

            scoreEl.textContent = score;
        }
    });

    pipes = pipes.filter(p => p.x + PW > -20);

    let l = BX - BS / 2 + 4;
    let r = BX + BS / 2 - 4;

    let t = bird.y - BS / 2 + 4;
    let b = bird.y + BS / 2 - 4;

    if (t <= 0 || b >= H - G) {
        end();
        return;
    }

    if (
        pipes.some(
            p =>
                r > p.x &&
                l < p.x + PW &&
                !(t > p.top && b < p.top + PG)
        )
    ) {
        end();
    }
}

function bg() {
    let g = x.createLinearGradient(0, 0, 0, H);

    g.addColorStop(0, "#70c5ce");
    g.addColorStop(1, "#b8edf0");

    x.fillStyle = g;

    x.fillRect(0, 0, W, H);

    x.fillStyle = "#ffffffb3";

    [
        [55, 105, 32],
        [250, 160, 42],
        [345, 75, 26]
    ].forEach(a => {
        x.beginPath();

        x.arc(
            a[0],
            a[1],
            a[2],
            0,
            7
        );

        x.arc(
            a[0] + 25,
            a[1] + 5,
            a[2] * 0.75,
            0,
            7
        );

        x.fill();
    });
}

function drawPipe(p) {
    let by = p.top + PG;
    let gy = H - G;

    x.fillStyle = "#4ecb55";
    x.strokeStyle = "#258d37";
    x.lineWidth = 3;

    // Top pipe
    x.fillRect(
        p.x,
        0,
        PW,
        p.top
    );

    x.strokeRect(
        p.x,
        0,
        PW,
        p.top
    );

    // Top pipe cap
    x.fillRect(
        p.x - 4,
        p.top - 18,
        PW + 8,
        18
    );

    x.strokeRect(
        p.x - 4,
        p.top - 18,
        PW + 8,
        18
    );

    // Bottom pipe
    x.fillRect(
        p.x,
        by,
        PW,
        gy - by
    );

    x.strokeRect(
        p.x,
        by,
        PW,
        gy - by
    );

    // Bottom pipe cap
    x.fillRect(
        p.x - 4,
        by,
        PW + 8,
        18
    );

    x.strokeRect(
        p.x - 4,
        by,
        PW + 8,
        18
    );
}

function birdDraw() {
    x.save();

    x.translate(BX, bird.y);

    x.rotate(
        Math.max(
            -0.45,
            Math.min(1.1, bird.v * 0.08)
        )
    );

    // Bird body
    x.fillStyle = "#ffd83d";
    x.strokeStyle = "#b88400";

    x.beginPath();

    x.arc(
        0,
        0,
        BS / 2,
        0,
        7
    );

    x.fill();
    x.stroke();

    // Wing
    x.fillStyle = "#f6a623";

    x.beginPath();

    x.ellipse(
        -4,
        7,
        11,
        5,
        0.2,
        0,
        7
    );

    x.fill();

    // Eye
    x.fillStyle = "#fff";

    x.beginPath();

    x.arc(
        7,
        -8,
        6,
        0,
        7
    );

    x.fill();

    // Pupil
    x.fillStyle = "#222";

    x.beginPath();

    x.arc(
        9,
        -8,
        2.5,
        0,
        7
    );

    x.fill();

    // Beak
    x.fillStyle = "#ff7a18";

    x.beginPath();

    x.moveTo(12, 0);
    x.lineTo(28, 5);
    x.lineTo(12, 10);

    x.closePath();

    x.fill();
    x.stroke();

    x.restore();
}

function draw() {
    // Draw background
    bg();

    // Draw pipes
    pipes.forEach(drawPipe);

    // Draw ground
    let gy = H - G;

    x.fillStyle = "#d9c46c";

    x.fillRect(
        0,
        gy,
        W,
        G
    );

    // Draw grass
    x.fillStyle = "#7ed957";

    x.fillRect(
        0,
        gy,
        W,
        13
    );

    // Draw bird
    birdDraw();

    // Draw score
    x.textAlign = "center";

    x.font = "bold 42px Arial";

    x.lineWidth = 5;

    x.strokeStyle = "#00000073";

    x.fillStyle = "#fff";

    x.strokeText(
        score,
        W / 2,
        70
    );

    x.fillText(
        score,
        W / 2,
        70
    );
}

function loop(t) {
    let dt = last
        ? Math.min((t - last) / 16.67, 2)
        : 1;

    last = t;

    if (state === "play") {
        update(dt);
    }

    draw();

    requestAnimationFrame(loop);
}

c.onclick = flap;

start.onclick = begin;

document.onkeydown = e => {
    if (
        e.code === "Space" ||
        e.code === "ArrowUp"
    ) {
        e.preventDefault();

        flap();
    }
};

reset();

requestAnimationFrame(loop);
