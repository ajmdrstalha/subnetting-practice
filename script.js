const ipAddressEl = document.getElementById("ipAddress");
const cidrDisplayEl = document.getElementById("cidrDisplay");
const answerForm = document.getElementById("answerForm");
const networkInput = document.getElementById("networkInput");
const broadcastInput = document.getElementById("broadcastInput");
const resultSection = document.getElementById("resultSection");
const explanationSection = document.getElementById("explanationSection");
const newProblemBtn = document.getElementById("newProblemBtn");
const resetTimerBtn = document.getElementById("resetTimerBtn");

const difficultySelect = document.getElementById("difficultySelect");
const timerToggle = document.getElementById("timerToggle");
const timerDisplay = document.getElementById("timerDisplay");

const scoreValue = document.getElementById("scoreValue");
const attemptedValue = document.getElementById("attemptedValue");
const accuracyValue = document.getElementById("accuracyValue");

// Structured explanation fields
const explainGrid = document.getElementById("explainGrid");
const expNetwork = document.getElementById("expNetwork");
const expMask = document.getElementById("expMask");
const expBroadcast = document.getElementById("expBroadcast");
const expWildcard = document.getElementById("expWildcard");
const expText = document.getElementById("expText");

let currentProblem = null;
let score = 0;
let attempted = 0;

let timerId = null;
let timeLeft = 100;

const masksByDifficulty = {
  easy: [24, 25, 26, 27, 28, 29],
  medium: [20, 21, 22, 23],
  hard: [16, 17, 18, 19]
};

function cidrToMask(cidr) {
  const maskInt = cidr === 0 ? 0 : (0xFFFFFFFF << (32 - cidr)) >>> 0;
  return intToIp(maskInt);
}

function wildcardFromMask(maskInt) {
  return (~maskInt >>> 0);
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomIp() {
  return [randomInt(1, 223), randomInt(0, 255), randomInt(0, 255), randomInt(1, 254)].join(".");
}

function ipToInt(ip) {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
}

function intToIp(int) {
  return [(int >>> 24) & 255, (int >>> 16) & 255, (int >>> 8) & 255, int & 255].join(".");
}

function clearExplanation() {
  explainGrid.hidden = true;
  expText.hidden = true;
  expNetwork.textContent = "—";
  expMask.textContent = "—";
  expBroadcast.textContent = "—";
  expWildcard.textContent = "—";
  expText.textContent = "";
}

function showExplanation(p) {
  const wildcard = intToIp(wildcardFromMask(p.maskInt));

  // Fill structured fields (what you marked in the UI)
  expNetwork.textContent = p.network;
  expMask.textContent = p.mask;
  expBroadcast.textContent = p.broadcast;
  expWildcard.textContent = wildcard;

  explainGrid.hidden = false;

  // Simple explanation text (kept brief)
  expText.innerHTML =
    `<b>How it was calculated:</b><br>` +
    `Network = IP AND Subnet Mask<br>` +
    `Broadcast = Network OR Wildcard Mask<br>` +
    `Wildcard Mask = NOT Subnet Mask`;
  expText.hidden = false;
}

function generateProblem() {
  const difficulty = difficultySelect.value;
  const cidrOptions = masksByDifficulty[difficulty];
  const cidr = cidrOptions[randomInt(0, cidrOptions.length - 1)];

  const ip = randomIp();
  const mask = cidrToMask(cidr);

  const ipInt = ipToInt(ip);
  const maskInt = ipToInt(mask);

  const networkInt = ipInt & maskInt;
  const broadcastInt = networkInt | (~maskInt >>> 0);

  currentProblem = {
    ip,
    cidr,
    mask,
    network: intToIp(networkInt),
    broadcast: intToIp(broadcastInt),
    networkInt,
    broadcastInt,
    ipInt,
    maskInt
  };

  ipAddressEl.textContent = currentProblem.ip;
  cidrDisplayEl.textContent = `${currentProblem.ip}/${currentProblem.cidr}`;

  networkInput.value = "";
  broadcastInput.value = "";
  resultSection.className = "result";
  resultSection.textContent = "";
  clearExplanation();
}

function isValidIp(ip) {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return false;
  return parts.every(p => {
    if (!/^\d+$/.test(p)) return false;
    const n = Number(p);
    return n >= 0 && n <= 255;
  });
}

function updateScore() {
  attemptedValue.textContent = attempted;
  scoreValue.textContent = score;
  const accuracy = attempted === 0 ? 0 : Math.round((score / attempted) * 100);
  accuracyValue.textContent = `${accuracy}%`;
}

function stopTimer() {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
}

function resetTimer() {
  timeLeft = 100;
  timerDisplay.textContent = timeLeft;
}

function startTimer() {
  stopTimer();
  resetTimer();
  timerId = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;

    if (timeLeft <= 0) {
      stopTimer();
      resultSection.className = "result error";
      resultSection.textContent = "Time's up! Generating a new problem.";
      clearExplanation();

      setTimeout(() => {
        generateProblem();
        if (timerToggle.checked) startTimer();
      }, 700);
    }
  }, 1000);
}

answerForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const userNetwork = networkInput.value.trim();
  const userBroadcast = broadcastInput.value.trim();

  if (!isValidIp(userNetwork) || !isValidIp(userBroadcast)) {
    resultSection.className = "result error";
    resultSection.textContent = "Please enter valid IPv4 dotted-decimal addresses.";
    clearExplanation();
    return;
  }

  attempted++;

  const isNetworkCorrect = userNetwork === currentProblem.network;
  const isBroadcastCorrect = userBroadcast === currentProblem.broadcast;

  if (isNetworkCorrect && isBroadcastCorrect) {
    score++;
    resultSection.className = "result success";
    resultSection.textContent = "Correct! Great job.";
  } else {
    resultSection.className = "result error";
    resultSection.textContent =
      `Incorrect. Correct answers: Network = ${currentProblem.network}, Broadcast = ${currentProblem.broadcast}`;
  }

  // Show structured explanation panel (your requested UI)
  showExplanation(currentProblem);
  updateScore();
});

newProblemBtn.addEventListener("click", () => {
  generateProblem();
  if (timerToggle.checked) startTimer();
});

resetTimerBtn.addEventListener("click", () => {
  if (timerToggle.checked) startTimer();
  else resetTimer();
});

timerToggle.addEventListener("change", () => {
  if (timerToggle.checked) startTimer();
  else stopTimer();
});

difficultySelect.addEventListener("change", () => {
  generateProblem();
  if (timerToggle.checked) startTimer();
});

generateProblem();
updateScore();
resetTimer();