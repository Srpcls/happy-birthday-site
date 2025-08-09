let playLocked = false;

const canvas = document.getElementById('matrix');
const ctx = canvas.getContext('2d');
const starCanvas = document.getElementById('stars-canvas');
const starCtx = starCanvas.getContext('2d');

const music = document.getElementById('bg-music');

try { if (music) music.loop = false; } catch(e) {}

const playlist = ["HBD.mp3", "HBD1.MP3"];
let playlistIndex = 0;
const playerA = document.getElementById('playerA');
const playerB = document.getElementById('playerB');
let activePlayer = playerA;
let inactivePlayer = playerB;
const crossfadeSeconds = 1.0;

function setPlayerVolume(p, v) {
  try { p.volume = Math.max(0, Math.min(1, v)); } catch(e) {}
}

function playFirstTrack() {
  playlistIndex = 0;
  activePlayer.src = playlist[playlistIndex++];
  setPlayerVolume(activePlayer, 1);
  activePlayer.loop = false;
  activePlayer.play().catch(e => console.warn('play failed', e));
  activePlayer.addEventListener('ended', onActiveEnded);
}

function onActiveEnded() {
  if (playlistIndex < playlist.length) {

    inactivePlayer.src = playlist[playlistIndex++];
    inactivePlayer.currentTime = 0;
    setPlayerVolume(inactivePlayer, 0);
    inactivePlayer.play().catch(e => console.warn('play failed', e));

    const steps = 20;
    const stepTime = (crossfadeSeconds * 1000) / steps;
    let step = 0;
    const iv = setInterval(() => {
      step++;
      const t = step / steps;
      setPlayerVolume(inactivePlayer, t);
      setPlayerVolume(activePlayer, 1 - t);
      if (step >= steps) {
        clearInterval(iv);
        try { activePlayer.pause(); activePlayer.currentTime = 0; } catch(e) {}
        const tmp = activePlayer; activePlayer = inactivePlayer; inactivePlayer = tmp;
        activePlayer.removeEventListener('ended', onActiveEnded);
        activePlayer.addEventListener('ended', onActiveEnded);
      }
    }, stepTime);
  } else {
    console.log('playlist ended');

    if (autoResetTimer) {
      clearInterval(autoResetTimer);
      autoResetTimer = null;
    }
    if (thankYouMsg) {
      thankYouMsg.remove();
      thankYouMsg = null;
    }

    thankYouMsg = document.createElement("div");
    thankYouMsg.classList.add("thank-you-msg");
    thankYouMsg.innerHTML = "Thank for watching ❤️";
    document.body.appendChild(thankYouMsg);

    const countdown = document.createElement("div");
    countdown.classList.add("replay-countdown");
    thankYouMsg.appendChild(countdown);

    let secs = 10;
    countdown.innerHTML = `Replay in ${secs}`;
    autoResetTimer = setInterval(() => {
      secs--;
      countdown.innerHTML = `Replay in ${secs}`;
      if (secs <= 0) {
        clearInterval(autoResetTimer);
        autoResetTimer = null;
        if (thankYouMsg) {
            thankYouMsg.remove();
            thankYouMsg = null;
        }
        cancelAnimationFrame(animationFrameId);

        replayBtn.style.display = "block";
    replayBtn.classList.remove("replay-fade");
    void replayBtn.offsetWidth;
    replayBtn.classList.add("replay-fade");
        replayBtn.disabled = true;
        replayBtn.classList.remove("expand-fade-out");
        void replayBtn.offsetWidth;
        replayBtn.classList.add("expand-fade-out");

        replayBtn.addEventListener("animationend", function autoResetFadeEnd(e) {
            if (e.animationName && e.animationName !== "expandAndFadeOut") return;
            replayBtn.removeEventListener("animationend", autoResetFadeEnd);
            doFullReset();
            const titleEl = startScreen.querySelector("h1");
            if (titleEl) {
                titleEl.style.display = "block";
                titleEl.classList.remove("h1-grow-fade-out");
            }
            replayBtn.style.display = "none";
            replayBtn.classList.remove("expand-fade-out");
            replayBtn.style.opacity = "1";
            replayBtn.style.transform = "scale(1)";
            replayBtn.disabled = false;
        });
      }
    }, 1000);
  }
}

function startPlaylistCrossfade() {
  if (!playerA || !playerB) return;
  playFirstTrack();
}

const muteBtn = document.getElementById("mute-btn");
const startScreen = document.getElementById('start-screen');
const startBtn = document.getElementById('start-btn');
const textDiv = document.getElementById("text");
const finalImage = document.getElementById("final-image");
const countdownDiv = document.getElementById("countdown");
const replayBtn = document.getElementById("replay-btn");

const chars = 'HAPPYBIRTHDAY';
const fontSize = 14;
let columns, drops = [];
let index = 0, matrixFadeOut = false, matrixOpacity = 1;
let animationInterval;
let phase = 0;

let isMuted = false;

let autoResetTimer = null;
let thankYouMsg = null;

muteBtn?.addEventListener("click", () => {
  isMuted = !isMuted;
  music.muted = isMuted;
  if (playerA) playerA.muted = isMuted;
  if (playerB) playerB.muted = isMuted;
  muteBtn.textContent = isMuted ? "🔇" : "🔊";
});

startBtn.addEventListener('click', () => {
    if (playLocked) return;
    playLocked = true;
    startBtn.disabled = true;
  const titleEl = startScreen.querySelector("h1");
  if (titleEl) {
    titleEl.classList.remove("h1-grow-fade-out");
    void titleEl.offsetWidth;
    titleEl.classList.add("h1-grow-fade-out");
  }

  setTimeout(() => {
    startBtn.style.display = "none";
    if (titleEl) titleEl.style.display = "none";
    startScreen.style.display = "none";
  }, 500);

  document.querySelectorAll("#start-screen > *:not(#start-btn):not(h1)").forEach(el => {
    el.style.display = "none";
  });

  countdownDiv.style.display = 'block';

  if (music) { try { music.pause(); music.currentTime = 0; music.loop = false; music.muted = isMuted; } catch(e) {} }

  if (playerA) playerA.muted = isMuted;
  if (playerB) playerB.muted = isMuted;

  startPlaylistCrossfade();
  startCountdown();

  startBtn.classList.remove("expand-fade-out");
  void startBtn.offsetWidth;
  startBtn.classList.add("expand-fade-out");

  setTimeout(() => {
    startBtn.style.display = "none";
    startBtn.classList.remove("expand-fade-out");
    startBtn.style.opacity = "1";
    startBtn.style.transform = "scale(1)";
    startScreen.style.display = 'none';
  }, 500);
});

function startCountdown() {
  const numbers = ["","5","4","3", "2", "1"];
  let count = 0;
  countdownDiv.innerText = numbers[count];
  countdownDiv.style.animation = "fadeInOut 1s ease-in-out forwards";

  canvas.style.display = 'block';
  startMatrix();

  const countdownInterval = setInterval(() => {
    count++;
    if (count < numbers.length) {
      countdownDiv.innerText = numbers[count];
      countdownDiv.style.animation = "none";
      void countdownDiv.offsetWidth;
      countdownDiv.style.animation = "fadeInOut 1s ease-in-out forwards";
    } else {
      clearInterval(countdownInterval);
      countdownDiv.style.display = "none";
      textDiv.style.display = 'block';
      phase = 1;
      showNextText();
    }
  }, 1000);
}

function startMatrix() {
  clearInterval(animationInterval);
  canvas.height = window.innerHeight;
  canvas.width = window.innerWidth;
  columns = Math.floor(canvas.width / fontSize);
  drops = Array(columns).fill(0);
  phase = 0;
  matrixOpacity = 1;
  matrixFadeOut = false;
  animationInterval = setInterval(drawMatrix, 35);
}

function drawMatrix() {
  if (matrixFadeOut) {
    matrixOpacity -= 0.01;
    if (matrixOpacity <= 0) {
      clearInterval(animationInterval);
      canvas.style.display = "none";
      return;
    }
  }

  ctx.fillStyle = `rgba(0, 0, 0, 0.05)`;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = `rgba(255, 102, 204, ${matrixOpacity})`;
  ctx.font = fontSize + 'px monospace';

  for (let i = 0; i < columns; i++) {
    let letter;
    if (phase === 0) {
      letter = chars[Math.floor(Math.random() * chars.length)];
    } else {
      const charIndex = drops[i] % chars.length;
      letter = chars[charIndex];
    }

    ctx.fillText(letter, i * fontSize, drops[i] * fontSize);

    if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
      drops[i] = 0;
    } else {
      drops[i]++;
    }
  }
}

const texts = [
  "HAPPY<br>BIRTHDAY",
  "นะค้าบบบบบ",
  "พี่เบนซ์ ❤️",
  "🎂 10/08/2025 🎂"
];

function showNextText() {
  if (index < texts.length) {
    textDiv.innerHTML = texts[index];
    textDiv.style.display = "block";
    textDiv.style.animation = "none";
    void textDiv.offsetWidth;
    textDiv.style.animation = "fadeInOut 3s ease-in-out forwards";
    index++;
    setTimeout(showNextText, 3000);
  } else {
    matrixFadeOut = true;
    document.getElementById("sticker-scene").style.display = "flex";
    cancelAnimationFrame(animationFrameId);
    document.getElementById("film-box").style.display = "block";
    preloadInitialImages();
    scrollFilm();
    replayBtn.style.display = "block";
    replayBtn.classList.remove("replay-fade");
    void replayBtn.offsetWidth;
    replayBtn.classList.add("replay-fade");
  }
}

function generateStars() {
  starCanvas.width = window.innerWidth;
  starCanvas.height = window.innerHeight;
  const stars = [];

  for (let i = 0; i < 100; i++) {
    stars.push({
      x: Math.random() * starCanvas.width,
      y: Math.random() * starCanvas.height,
      radius: Math.random() < 0.2 ? Math.random() * 3 + 2 : Math.random() * 1.5,
      alpha: Math.random(),
      delta: Math.random() * 0.02
    });
  }

  function animateStars() {
    starCtx.clearRect(0, 0, starCanvas.width, starCanvas.height);
    for (let star of stars) {
      starCtx.beginPath();
      starCtx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
      starCtx.fillStyle = `rgba(255,255,255,${star.alpha})`;
      starCtx.fill();
      star.alpha += star.delta;
      if (star.alpha <= 0 || star.alpha >= 1) {
        star.delta = -star.delta;
      }
    }
    requestAnimationFrame(animateStars);
  }

  animateStars();
}
generateStars();

const filmTrack = document.getElementById("film-track");
const imagePool = ["p1.png", "p2.png", "p3.png", "p4.png", "p5.png", "p6.png", "p7.png", "p8.png"
  , "p9.png", "p10.png", "p11.png", "p12.png", "p13.png", "p14.png", "p15.png", "p16.png"
  , "p17.png", "p18.png", "p19.png", "p20.png", "p21.png", "p22.png", "p23.png"
];

let shuffledImages = [];
let currentIndex = 0;
let recentHistory = [];
let offset = 0;
let lastAddedAt = 0;
const minSpacing = 250;
let animationFrameId;

function shuffleArray(array) {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
}

function getNextRandomImage() {
  if (currentIndex >= shuffledImages.length) {
    let newShuffle;
    let tries = 10;
    do {
      newShuffle = shuffleArray(imagePool);
      tries--;
    } while (
      tries > 0 &&
      recentHistory.includes(newShuffle[0])
    );

    shuffledImages = newShuffle;
    currentIndex = 0;
  }

  const selected = shuffledImages[currentIndex++];
  recentHistory.push(selected);
  if (recentHistory.length > 3) recentHistory.shift();
  return selected;
}

function addRandomImage() {
  const img = document.createElement("img");
  const src = getNextRandomImage();
  img.src = src;
  img.classList.add("film-fade-in");
  filmTrack.appendChild(img);
}

function preloadInitialImages(count = 10) {
  for (let i = 0; i < count; i++) {
    addRandomImage();
  }
}
function scrollFilm() {
  offset -= 0.5;
  filmTrack.style.transform = `translateX(${offset}px)`;

  const totalWidth = filmTrack.scrollWidth;
  const boxWidth = document.getElementById("film-box").offsetWidth;

  if (
    totalWidth - Math.abs(offset) < boxWidth + 400 &&
    Math.abs(offset - lastAddedAt) > minSpacing
  ) {
    addRandomImage();
    lastAddedAt = offset;

    if (filmTrack.childNodes.length > 30) {
      filmTrack.removeChild(filmTrack.firstChild);
    }
  }

  animationFrameId = requestAnimationFrame(scrollFilm);
}

function doFullReset() {

  cancelAnimationFrame(animationFrameId);
  clearFilmTrackBeforeReplay();
  resetFilmRandomState();

  index = 0;
  phase = 0;
  matrixOpacity = 1;
  matrixFadeOut = false;

  if (startBtn) {
    startBtn.classList.remove("expand-fade-out");
    startBtn.style.opacity = "1";
    startBtn.style.transform = "scale(1)";
    startBtn.style.display = "block";
  }

  clearInterval(animationInterval);
  if (ctx && canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.style.display = "none";
  }

  if (textDiv) textDiv.style.display = "none";
  if (typeof finalImage !== 'undefined' && finalImage) finalImage.style.display = "none";
  if (countdownDiv) countdownDiv.style.display = "none";

  const sticker = document.getElementById("sticker-scene");
  if (sticker) sticker.style.display = "none";

  document.querySelectorAll(".sticker").forEach(s => {

    s.style.display = "";
    s.style.opacity = "";
    s.style.animation = "none";

    void s.offsetWidth;
    s.style.animation = "";
  });

  if (music) {
    music.pause();
    music.currentTime = 0;
  }

  try {
    if (playerA) { playerA.pause(); playerA.currentTime = 0; playerA.removeEventListener('ended', onActiveEnded); }
    if (playerB) { playerB.pause(); playerB.currentTime = 0; playerB.removeEventListener('ended', onActiveEnded); }
  } catch(e) {}

  try { playlistIndex = 0; } catch(e) {}

  if (startScreen) startScreen.style.display = "flex";
  playLocked = false;
  startBtn.disabled = false;
}

replayBtn.addEventListener("click", () => {

  if (autoResetTimer) {
    clearInterval(autoResetTimer);
    autoResetTimer = null;
  }
  if (thankYouMsg) {
    thankYouMsg.remove();
    thankYouMsg = null;
  }

  replayBtn.disabled = true;

  replayBtn.classList.remove("expand-fade-out");
  void replayBtn.offsetWidth;
  replayBtn.classList.add("expand-fade-out");

  doFullReset();

  const titleEl = startScreen.querySelector("h1");
  if (titleEl) {
    titleEl.style.display = "block";
    titleEl.classList.remove("h1-grow-fade-out");
  }

  function onAnimEnd(e) {

    if (e.animationName && e.animationName !== "expandAndFadeOut") return;
    replayBtn.removeEventListener("animationend", onAnimEnd);
    replayBtn.style.display = "none";
    replayBtn.classList.remove("expand-fade-out");
    replayBtn.style.opacity = "1";
    replayBtn.style.transform = "scale(1)";
    replayBtn.disabled = false;
  }
  replayBtn.addEventListener("animationend", onAnimEnd);
});

function resetScene() {

  doFullReset();
}

function clearFilmTrackBeforeReplay() {
  while (filmTrack.firstChild) {
    filmTrack.removeChild(filmTrack.firstChild);
  }
  offset = 0;
}

function resetFilmRandomState() {
  shuffledImages = [];
  currentIndex = 0;
  recentHistory = [];
  lastAddedAt = 0;
}
