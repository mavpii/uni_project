// ==================== КОНСТАНТИ ====================

// Бекенд на Node.js + Express
const API_BASE = "http://localhost:3000/api";

const THEME_KEY = "snake_theme";

let currentUser = null;      // { id, email, nickname, bestScore, avatar }
let currentUserId = null;
let bestBeforeGame = 0;      // рекорд перед стартом поточної гри

// ==================== ДОПОМІЖНІ ФУНКЦІЇ ДЛЯ API ====================

async function apiPost(path, bodyObj) {
    const res = await fetch(`${API_BASE}${path}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyObj)
    });
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || "Помилка запиту");
    }
    return data;
}

async function apiGet(path) {
    const res = await fetch(`${API_BASE}${path}`);
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || "Помилка запиту");
    }
    return data;
}

// ==================== АВАТАРКИ (UI) ====================

function stringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = Math.abs(hash) % 360;
    return `hsl(${h}, 70%, 55%)`;
}

function getInitial(str) {
    if (!str) return "?";
    const trimmed = str.trim();
    return trimmed ? trimmed[0].toUpperCase() : "?";
}

function renderAvatarHTML(nickname, extraClass = "", avatarUrl = null) {
    if (avatarUrl) {
        return `
            <span class="avatar ${extraClass}">
                <img src="${avatarUrl}" alt="${nickname}" />
            </span>
        `;
    }
    const color = stringToColor(nickname || "Guest");
    const initial = getInitial(nickname || "G");
    return `<span class="avatar ${extraClass}" style="background:${color}">${initial}</span>`;
}

// ==================== DOM-ЕЛЕМЕНТИ ====================

const regForm = document.getElementById("regForm");
const loginForm = document.getElementById("loginForm");
const messageEl = document.getElementById("message");
const userInfoEl = document.getElementById("userInfo");

const authSection = document.getElementById("authSection");
const gameSection = document.getElementById("gameSection");

const leaderboardList = document.getElementById("leaderboardList");
const userRankEl = document.getElementById("userRank");

// селект сортування (єдиний контрол у лідерборді)
const sortSelect = document.getElementById("sortSelect");

const startGameBtn = document.getElementById("startGameBtn");
const pauseGameBtn = document.getElementById("pauseGameBtn");
const currentScoreEl = document.getElementById("currentScore");
const bestScoreEl = document.getElementById("bestScore");
const scoreProgressFill = document.getElementById("scoreProgressFill");

const battleArea = document.getElementById("battleArea");

const gameOverOverlay = document.getElementById("gameOverOverlay");
const gameOverText = document.getElementById("gameOverText");
const gameOverOkBtn = document.getElementById("gameOverOkBtn");

const toggleBtn = document.getElementById("themeToggle");

const avatarInput = document.getElementById("avatarInput");
const userMenu = document.getElementById("userMenu");
const changeAvatarBtn = document.getElementById("changeAvatarBtn");
const logoutBtn = document.getElementById("logoutBtn");

const changeNameBtn = document.getElementById("changeNameBtn");
const changeNameOverlay = document.getElementById("changeNameOverlay");
const newNameInput = document.getElementById("newNameInput");
const saveNewNameBtn = document.getElementById("saveNewNameBtn");

// ==================== ТЕМА ====================

toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");
    const isDark = document.body.classList.contains("dark");
    toggleBtn.textContent = isDark ? "☀️ Світла тема" : "🌙 Темна тема";
    localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
});

// ==================== АВТЕНТИФІКАЦІЯ ====================

const authTitle = document.getElementById("authTitle");
const authToggleText = document.getElementById("authToggleText");
const authToggleBtn = document.getElementById("authToggleBtn");

let isLoginMode = true;

// Перемикач Вхід / Реєстрація
authToggleBtn.addEventListener("click", () => {
    if (isLoginMode) {
        loginForm.classList.add("hidden");
        regForm.classList.remove("hidden");
        authTitle.textContent = "Реєстрація";
        authToggleText.textContent = "Вже маєте акаунт?";
        authToggleBtn.textContent = "Увійти";
        messageEl.textContent = "";
        isLoginMode = false;
    } else {
        regForm.classList.add("hidden");
        loginForm.classList.remove("hidden");
        authTitle.textContent = "Вхід";
        authToggleText.textContent = "Немає акаунту?";
        authToggleBtn.textContent = "Зареєструватися";
        messageEl.textContent = "";
        isLoginMode = true;
    }
});

function showMessage(text, color = "black") {
    if (!messageEl) return;
    messageEl.style.color = color;
    messageEl.textContent = text;
}

// Реєстрація → бекенд
regForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const nickname = document.getElementById("nickname").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value.trim();

    if (!nickname || !email || !password) {
        showMessage("Будь ласка, заповніть всі поля!", "red");
        return;
    }

    try {
        const user = await apiPost("/register", { nickname, email, password });
        currentUser = {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            bestScore: user.bestScore || 0,
            avatar: user.avatar || null
        };
        currentUserId = user.id;

        showMessage("Реєстрація успішна! Ви увійшли в систему.", "green");
        renderUserInfo();
        switchToGame();
    } catch (err) {
        showMessage(err.message, "red");
    }
});

// Вхід → бекенд
loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value.trim();

    if (!email || !password) {
        showMessage("Заповніть пошту та пароль для входу.", "red");
        return;
    }

    try {
        const user = await apiPost("/login", { email, password });
        currentUser = {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            bestScore: user.bestScore || 0,
            avatar: user.avatar || null
        };
        currentUserId = user.id;

        showMessage("Вхід успішний! Ласкаво просимо.", "green");
        renderUserInfo();
        switchToGame();
    } catch (err) {
        showMessage(err.message, "red");
    }
});

function renderUserInfo() {
    if (!currentUser) {
        userInfoEl.textContent = "";
        return;
    }
    const avatarHTML = renderAvatarHTML(
        currentUser.nickname,
        "avatar-small",
        currentUser.avatar || null
    );
    const text = `Користувач: ${currentUser.nickname} | Найкращий результат: ${
        currentUser.bestScore || 0
    }`;
    userInfoEl.innerHTML = `${avatarHTML}<span class="user-label">${text}</span>`;
}

function switchToGame() {
    authSection.classList.add("hidden");
    gameSection.classList.remove("hidden");
    updateLeaderboard();
    updateBestScoreLabel();
    updateScoreProgress();
}

// ==================== МЕНЮ КОРИСТУВАЧА / АВАТАР ====================

userInfoEl.addEventListener("click", () => {
    if (!currentUser) return;
    userMenu.classList.toggle("hidden");
});

document.addEventListener("click", (e) => {
    if (!userMenu.contains(e.target) && !userInfoEl.contains(e.target)) {
        userMenu.classList.add("hidden");
    }
});

// Зміна аватара (не при реєстрації)
changeAvatarBtn.addEventListener("click", () => {
    if (!currentUser) return;
    avatarInput.click();
    userMenu.classList.add("hidden");
});

avatarInput.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file || !currentUserId) {
        avatarInput.value = "";
        return;
    }

    if (!file.type.startsWith("image/")) {
        showMessage("Будь ласка, оберіть зображення (png/jpg).", "red");
        avatarInput.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = async (evt) => {
        const dataUrl = evt.target.result;

        try {
            const user = await apiPost("/change-avatar", {
                userId: currentUserId,
                avatar: dataUrl
            });

            currentUser.avatar = user.avatar || null;
            renderUserInfo();
            updateLeaderboard();
        } catch (err) {
            showMessage(err.message, "red");
        }
    };

    reader.readAsDataURL(file);
    avatarInput.value = "";
});

logoutBtn.addEventListener("click", () => {
    currentUser = null;
    currentUserId = null;
    userMenu.classList.add("hidden");
    gameSection.classList.add("hidden");
    authSection.classList.remove("hidden");
    userInfoEl.textContent = "";
    showMessage("");
});

// ==================== ЛІДЕРБОРД (MySQL, сортування) ====================

async function updateLeaderboard() {
    try {
        // значення типу "score_desc", "name_asc" і т.д.
        const sortValue = (sortSelect && sortSelect.value) || "score_desc";
        const [sortKey, order] = sortValue.split("_");

        // на бекенд віддаємо зрозумілі значення
        const sortBy = sortKey === "name" ? "name" : "score";
        const sortOrder = order === "asc" ? "asc" : "desc";

        const params = new URLSearchParams({
            sortBy,
            order: sortOrder
        });

        // /api/users?sortBy=score&order=desc
        const users = await apiGet(`/users?${params.toString()}`);

        leaderboardList.innerHTML = "";

        if (!users.length) {
            leaderboardList.innerHTML = "<li>Немає користувачів.</li>";
            userRankEl.textContent = "";
            return;
        }

        users.forEach((user) => {
            const li = document.createElement("li");
            const isSelf = currentUserId && user.id === currentUserId;

            const avatarHTML = renderAvatarHTML(
                user.nickname,
                "avatar-leader",
                user.avatar_url || null
            );

            const score = user.best_score ?? 0;

            li.innerHTML = `
                ${avatarHTML}
                <span class="leader-name">
                    ${user.nickname}
                    ${isSelf ? '<span class="leader-self-badge">Ви</span>' : ""}
                </span>
                <span class="leader-score">${score}</span>
            `;

            if (isSelf) li.classList.add("leader-self");
            leaderboardList.appendChild(li);
        });

        // місце користувача у відсортованому списку
        if (currentUserId) {
            const idx = users.findIndex((u) => u.id === currentUserId);
            if (idx !== -1) {
                userRankEl.textContent = `Ваше місце: ${idx + 1} з ${users.length}`;
            } else {
                userRankEl.textContent = "";
            }
        } else {
            userRankEl.textContent = "";
        }
    } catch (err) {
        console.error(err);
        leaderboardList.innerHTML = "<li>Помилка завантаження.</li>";
        userRankEl.textContent = "";
    }
}

function updateBestScoreLabel() {
    const best = currentUser?.bestScore || 0;
    bestScoreEl.textContent = `Рекорд: ${best}`;
}

function updateScoreProgress() {
    const best = currentUser?.bestScore || 0;
    if (!best || best <= 0) {
        scoreProgressFill.style.width = "0%";
        return;
    }
    const percent = Math.max(0, Math.min(Score / best, 1)) * 100;
    scoreProgressFill.style.width = percent + "%";
}

// ==================== ЗМІНА ІМЕНІ (через бекенд) ====================

changeNameBtn.addEventListener("click", () => {
    if (!currentUser) return;
    newNameInput.value = currentUser.nickname || "";
    changeNameOverlay.classList.remove("hidden");
});

saveNewNameBtn.addEventListener("click", async () => {
    const newName = newNameInput.value.trim();
    if (!newName || !currentUserId) return;

    try {
        const user = await apiPost("/change-name", {
            userId: currentUserId,
            newName
        });

        currentUser.nickname = user.nickname;
        renderUserInfo();
        updateLeaderboard();
        changeNameOverlay.classList.add("hidden");
    } catch (err) {
        showMessage(err.message, "red");
    }
});

changeNameOverlay.addEventListener("click", (e) => {
    if (e.target === changeNameOverlay) {
        changeNameOverlay.classList.add("hidden");
    }
});

// ==================== ЛОГІКА ГРИ ====================

let PowerStoneRMx;
let PowerStoneRMy;
let ESX;
let ESY;

let nodeArray = []; // [{ nodeElement, x, y }, ...]

let isExitStoneIntervalExists = false;
let ExitStoneInterval = null;

const parentElement = battleArea;
let PowerStone = null;
let exitStone = null;

let Side = "right";
let PosX = 200;
let PosY = 200;
let Score = 0;
let maxScore = 0;
let snakeHitLose = false;
let pause = false;
let Move = null;

let isRunning = false;
let isPaused = false;

function initMaxScore() {
    maxScore = currentUser?.bestScore || 0;
    updateBestScoreLabel();
}

function randomFullNumber(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min) * 20;
}

function PowerStoneRandomGeneration() {
    if (!PowerStone) {
        PowerStone = document.createElement("div");
        PowerStone.className = "powerStone";
        parentElement.append(PowerStone);
    }

    PowerStoneRMx = randomFullNumber(0, 19);
    PowerStoneRMy = randomFullNumber(0, 19);

    PowerStone.style.left = PowerStoneRMx + "px";
    PowerStone.style.top = PowerStoneRMy + "px";

    PowerStone.classList.remove("pop");
    void PowerStone.offsetWidth;
    PowerStone.classList.add("pop");
}

function PickStone() {
    if (PosX === PowerStoneRMx && PosY === PowerStoneRMy) {
        PowerStoneRandomGeneration();
        Score++;
        currentScoreEl.textContent = `Рахунок: ${Score}`;
        updateScoreProgress();
        createChild();
    }
}

function PickExitStone() {
    if (!exitStone) return;
    if (PosX === ESX && PosY === ESY) {
        if (isExitStoneIntervalExists) {
            clearInterval(ExitStoneInterval);
            isExitStoneIntervalExists = false;
        }
        exitStone.remove();
    }
}

function Lose() {
    if (PosX >= 400 || PosX < 0 || PosY >= 400 || PosY < 0 || snakeHitLose) {
        const prevBest = currentUser?.bestScore || 0;
        const isNewRecord = currentUser && Score > prevBest;

        if (currentUser && Score > prevBest) {
            currentUser.bestScore = Score;
        }

        updateBestScoreLabel();

        if (Move) {
            clearInterval(Move);
            Move = null;
        }

        // зберігаємо результат на сервер
        if (Score > 0 && currentUserId) {
            saveScoreToServer(Score);
        }

        battleArea.classList.add("death-flash");
        setTimeout(() => {
            battleArea.classList.remove("death-flash");
        }, 250);

        showGameOver(isNewRecord);
    }
}

function showGameOver(isNewRecord) {
    if (isNewRecord) {
        gameOverText.textContent = `Новий рекорд! Ваш рахунок: ${Score}. Новий рекорд: ${currentUser.bestScore}`;
    } else {
        gameOverText.textContent = `Ви програли. Ваш рахунок: ${Score}. Поточний рекорд: ${currentUser?.bestScore || 0}`;
    }
    gameOverOverlay.classList.remove("hidden");

    gameOverOkBtn.onclick = () => {
        gameOverOverlay.classList.add("hidden");
        resetGameState();
    };
}

async function saveScoreToServer(score) {
    try {
        await apiPost("/score", {
            userId: currentUserId,
            score
        });
        updateLeaderboard();
    } catch (err) {
        console.error(err);
    }
}

// ==================== КЕРУВАННЯ ====================

function pressWASD(event) {
    const code = event.keyCode;
    if ((code === 65 || code === 37) && Side !== "right") {
        Side = "left";
    } else if ((code === 68 || code === 39) && Side !== "left") {
        Side = "right";
    } else if ((code === 83 || code === 40) && Side !== "top") {
        Side = "down";
    } else if ((code === 87 || code === 38) && Side !== "down") {
        Side = "top";
    }
}

function pressPause(event) {
    if (event.keyCode === 32) togglePause();
}

pauseGameBtn.addEventListener("click", togglePause);

function togglePause() {
    if (!isRunning) return;

    if (!isPaused) {
        clearInterval(Move);
        isPaused = true;
    } else {
        Move = setInterval(gameTick, 120);
        isPaused = false;
    }
}

window.addEventListener("keydown", pressPause);
window.addEventListener("keydown", pressWASD);

// ==================== ІГРОВИЙ ЦИКЛ ====================

function gameTick() {
    MoveTestXY();
    PickStone();
    Lose();
}

function MoveTestXY() {
    const len = nodeArray.length;
    if (!len) return;

    for (let i = len - 1; i > 0; i--) {
        nodeArray[i].x = nodeArray[i - 1].x;
        nodeArray[i].y = nodeArray[i - 1].y;
    }

    if (Side === "top") {
        PosY -= 20;
    } else if (Side === "down") {
        PosY += 20;
    } else if (Side === "left") {
        PosX -= 20;
    } else {
        PosX += 20;
    }

    nodeArray[0].x = PosX;
    nodeArray[0].y = PosY;

    snakeHitLose = false;
    const headX = nodeArray[0].x;
    const headY = nodeArray[0].y;
    for (let i = 1; i < len; i++) {
        if (nodeArray[i].x === headX && nodeArray[i].y === headY) {
            snakeHitLose = true;
            break;
        }
    }

    for (let i = 0; i < len; i++) {
        const seg = nodeArray[i];
        const el = seg.nodeElement;
        el.style.left = seg.x + "px";
        el.style.top = seg.y + "px";
    }
}

function addSegmentAnimation(element) {
    element.classList.add("segment-pop");
    setTimeout(() => element.classList.remove("segment-pop"), 220);
}

function createChild() {
    const node = document.createElement("div");
    node.className = "Child";
    parentElement.append(node);

    const len = nodeArray.length;
    let x = PosX;
    let y = PosY;

    if (len > 0) {
        const prev = nodeArray[len - 1];
        x = prev.x;
        y = prev.y;
    }

    const nodeObject = { nodeElement: node, x, y };
    nodeArray.push(nodeObject);

    node.style.left = x + "px";
    node.style.top = y + "px";
    addSegmentAnimation(node);
}

function syncSnakeDOM() {
    for (let i = 0, len = nodeArray.length; i < len; i++) {
        const seg = nodeArray[i];
        const el = seg.nodeElement;
        el.style.left = seg.x + "px";
        el.style.top = seg.y + "px";
    }
}

function initSnake() {
    parentElement.innerHTML = "";
    nodeArray = [];
    PowerStone = null;
    exitStone = null;
    snakeHitLose = false;
    pause = false;

    PosX = 200;
    PosY = 200;
    Side = "right";
    Score = 0;
    currentScoreEl.textContent = `Рахунок: 0`;
    bestBeforeGame = currentUser?.bestScore || 0;
    initMaxScore();
    updateScoreProgress();

    const head = document.createElement("div");
    head.className = "Child head";
    parentElement.append(head);

    nodeArray.push({ nodeElement: head, x: PosX, y: PosY });
    syncSnakeDOM();
    addSegmentAnimation(head);

    PowerStoneRandomGeneration();
}

function resetGameState() {
    clearInterval(Move);
    Move = null;
    isRunning = false;
    isPaused = false;
    initSnake();
}

startGameBtn.addEventListener("click", () => {
    if (!currentUser) {
        showMessage("Спочатку увійдіть або зареєструйтесь.", "red");
        return;
    }

    if (Move) clearInterval(Move);

    initSnake();

    Move = setInterval(gameTick, 120);
    isRunning = true;
    isPaused = false;
});

// ==================== ІНІЦІАЛІЗАЦІЯ ====================

(function bootstrap() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === "dark") {
        document.body.classList.add("dark");
        toggleBtn.textContent = "☀️ Світла тема";
    } else {
        toggleBtn.textContent = "🌙 Темна тема";
    }

    if (sortSelect) {
        sortSelect.addEventListener("change", updateLeaderboard);
    }

    updateLeaderboard();
})();
