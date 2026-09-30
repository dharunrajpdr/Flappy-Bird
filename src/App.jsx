import { useCallback, useEffect, useRef, useState } from "react";

const WIDTH = 420;
const HEIGHT = 640;
const BIRD_X = 92;
const BIRD_SIZE = 28;
const GRAVITY = 0.42;
const FLAP = -7.2;
const PIPE_WIDTH = 64;
const PIPE_GAP = 155;
const PIPE_SPEED = 2.8;
const GROUND_HEIGHT = 72;
const PIPE_INTERVAL = 1500;

function createPipe(x = WIDTH + 20) {
  const minTop = 75;
  const maxTop = HEIGHT - GROUND_HEIGHT - PIPE_GAP - 75;
  return {
    x,
    top: Math.random() * (maxTop - minTop) + minTop,
    scored: false,
  };
}

function App() {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const lastTimeRef = useRef(0);
  const pipeTimerRef = useRef(0);
  const gameRef = useRef(null);

  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => Number(localStorage.getItem("flappy-best") || 0));

  const resetGame = useCallback(() => {
    gameRef.current = {
      birdY: HEIGHT / 2,
      velocity: 0,
      pipes: [createPipe(WIDTH + 70)],
      score: 0,
    };
    pipeTimerRef.current = 0;
    setScore(0);
    setGameOver(false);
  }, []);

  const flap = useCallback(() => {
    if (gameOver) {
      resetGame();
      setStarted(true);
      gameRef.current.velocity = FLAP;
      return;
    }

    if (!started) {
      resetGame();
      setStarted(true);
    }

    if (gameRef.current) gameRef.current.velocity = FLAP;
  }, [gameOver, resetGame, started]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (event.code === "Space" || event.code === "ArrowUp") {
        event.preventDefault();
        flap();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [flap]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    canvas.style.aspectRatio = WIDTH + "/" + HEIGHT;
    ctx.scale(dpr, dpr);

    const drawBackground = () => {
      const sky = ctx.createLinearGradient(0, 0, 0, HEIGHT);
      sky.addColorStop(0, "#70c5ce");
      sky.addColorStop(1, "#b8edf0");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      ctx.fillStyle = "rgba(255,255,255,0.7)";
      for (const cloud of [
        [55, 105, 32],
        [250, 160, 42],
        [345, 75, 26],
      ]) {
        ctx.beginPath();
        ctx.arc(cloud[0], cloud[1], cloud[2], 0, Math.PI * 2);
        ctx.arc(cloud[0] + 25, cloud[1] + 5, cloud[2] * 0.75, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const drawPipe = (pipe) => {
      const bottomY = pipe.top + PIPE_GAP;
      const groundY = HEIGHT - GROUND_HEIGHT;
      const capHeight = 18;

      ctx.fillStyle = "#4ecb55";
      ctx.strokeStyle = "#258d37";
      ctx.lineWidth = 3;

      ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.top);
      ctx.strokeRect(pipe.x, 0, PIPE_WIDTH, pipe.top);
      ctx.fillRect(pipe.x - 4, pipe.top - capHeight, PIPE_WIDTH + 8, capHeight);
      ctx.strokeRect(pipe.x - 4, pipe.top - capHeight, PIPE_WIDTH + 8, capHeight);

      ctx.fillRect(pipe.x, bottomY, PIPE_WIDTH, groundY - bottomY);
      ctx.strokeRect(pipe.x, bottomY, PIPE_WIDTH, groundY - bottomY);
      ctx.fillRect(pipe.x - 4, bottomY, PIPE_WIDTH + 8, capHeight);
      ctx.strokeRect(pipe.x - 4, bottomY, PIPE_WIDTH + 8, capHeight);
    };

    const drawBird = (y, velocity) => {
      const rotation = Math.max(-0.45, Math.min(1.1, velocity * 0.08));
      ctx.save();
      ctx.translate(BIRD_X, y);
      ctx.rotate(rotation);

      ctx.fillStyle = "#ffd83d";
      ctx.strokeStyle = "#b88400";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, BIRD_SIZE / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#f6a623";
      ctx.beginPath();
      ctx.ellipse(-4, 7, 11, 5, 0.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(7, -8, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#222";
      ctx.beginPath();
      ctx.arc(9, -8, 2.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ff7a18";
      ctx.beginPath();
      ctx.moveTo(12, 0);
      ctx.lineTo(28, 5);
      ctx.lineTo(12, 10);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    };

    const drawGround = () => {
      const groundY = HEIGHT - GROUND_HEIGHT;
      ctx.fillStyle = "#d9c46c";
      ctx.fillRect(0, groundY, WIDTH, GROUND_HEIGHT);
      ctx.fillStyle = "#7ed957";
      ctx.fillRect(0, groundY, WIDTH, 13);
      ctx.fillStyle = "#5fbf3d";
      for (let x = -20; x < WIDTH + 20; x += 28) {
        ctx.fillRect(x, groundY + 14, 14, 6);
      }
    };

    const draw = () => {
      const game = gameRef.current || {
        birdY: HEIGHT / 2,
        velocity: 0,
        pipes: [createPipe(WIDTH + 70)],
        score: 0,
      };

      drawBackground();
      game.pipes.forEach(drawPipe);
      drawGround();
      drawBird(game.birdY, game.velocity);

      ctx.textAlign = "center";
      ctx.font = "bold 42px system-ui, sans-serif";
      ctx.lineWidth = 5;
      ctx.strokeStyle = "rgba(0,0,0,0.45)";
      ctx.fillStyle = "#fff";
      ctx.strokeText(String(game.score), WIDTH / 2, 70);
      ctx.fillText(String(game.score), WIDTH / 2, 70);

      if (!started || gameOver) {
        ctx.fillStyle = "rgba(0,0,0,0.28)";
        ctx.fillRect(0, 0, WIDTH, HEIGHT - GROUND_HEIGHT);

        ctx.fillStyle = "#fff";
        ctx.font = "800 38px system-ui, sans-serif";
        ctx.fillText(gameOver ? "Game Over" : "Flappy Bird", WIDTH / 2, 220);

        ctx.font = "600 18px system-ui, sans-serif";
        ctx.fillText(
          gameOver ? "Press Space or tap to restart" : "Press Space or tap to flap",
          WIDTH / 2,
          265
        );

        if (gameOver) {
          ctx.font = "700 22px system-ui, sans-serif";
          ctx.fillText("Score: " + game.score + "  •  Best: " + best, WIDTH / 2, 310);
        }
      }
    };

    const tick = (time) => {
      const dt = Math.min((time - lastTimeRef.current) / 16.67 || 1, 2);
      lastTimeRef.current = time;

      if (started && !gameOver && gameRef.current) {
        const game = gameRef.current;
        game.velocity += GRAVITY * dt;
        game.birdY += game.velocity * dt;

        pipeTimerRef.current += time - (lastTimeRef.current - 16.67);
        if (pipeTimerRef.current > PIPE_INTERVAL) {
          game.pipes.push(createPipe());
          pipeTimerRef.current = 0;
        }

        game.pipes.forEach((pipe) => {
          pipe.x -= PIPE_SPEED * dt;

          if (!pipe.scored && pipe.x + PIPE_WIDTH < BIRD_X - BIRD_SIZE / 2) {
            pipe.scored = true;
            game.score += 1;
            setScore(game.score);
          }
        });

        game.pipes = game.pipes.filter((pipe) => pipe.x + PIPE_WIDTH > -20);

        const birdLeft = BIRD_X - BIRD_SIZE / 2 + 4;
        const birdRight = BIRD_X + BIRD_SIZE / 2 - 4;
        const birdTop = game.birdY - BIRD_SIZE / 2 + 4;
        const birdBottom = game.birdY + BIRD_SIZE / 2 - 4;
        const groundY = HEIGHT - GROUND_HEIGHT;

        const hitBoundary = birdTop <= 0 || birdBottom >= groundY;
        const hitPipe = game.pipes.some((pipe) => {
          const overlapsX = birdRight > pipe.x && birdLeft < pipe.x + PIPE_WIDTH;
          const inGap = birdTop > pipe.top && birdBottom < pipe.top + PIPE_GAP;
          return overlapsX && !inGap;
        });

        if (hitBoundary || hitPipe) {
          setGameOver(true);
          setStarted(false);
          const nextBest = Math.max(best, game.score);
          setBest(nextBest);
          localStorage.setItem("flappy-best", String(nextBest));
        }
      }

      draw();
      frameRef.current = requestAnimationFrame(tick);
    };

    resetGame();
    frameRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frameRef.current);
  }, [best, gameOver, resetGame, started]);

  return (
    <main className="game-page">
      <section className="game-card">
        <div className="game-header">
          <div>
            <p className="eyebrow">REACT GAME</p>
            <h1>Flappy Bird</h1>
          </div>
          <div className="score-box">
            <span>Best</span>
            <strong>{best}</strong>
          </div>
        </div>

        <button className="canvas-button" onClick={flap} aria-label="Flap bird">
          <canvas ref={canvasRef} />
        </button>

        <div className="controls">
          <span>🖱️ Click / Tap</span>
          <span>⌨️ Space / ↑</span>
        </div>

        <div className="live-score">Current Score: <strong>{score}</strong></div>
      </section>
    </main>
  );
}

export default App;
