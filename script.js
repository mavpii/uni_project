// ==================== КОНСТАНТИ ====================

const USERS_KEY = "snake_users";
const SCORES_KEY = "snake_scores";
const THEME_KEY = "snake_theme";

let currentUser = null;
let bestBeforeGame = 0; // рекорд перед стартом поточної гри

// ==================== КЕШ ДЛЯ localStorage ====================

let USERS_CACHE = null;
let SCORES_CACHE = null;

function loadUsers() {
    if (USERS_CACHE) return USERS_CACHE;
    try {
        USERS_CACHE = JSON.parse(localStorage.getItem(USERS_KEY)) || [];
    } catch (e) {
        USERS_CACHE = [];
    }
    return USERS_CACHE;
}

function saveUsers(users) {
    USERS_CACHE = users;
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function loadScores() {
    if (SCORES_CACHE) return SCORES_CACHE;
    try {
        SCORES_CACHE = JSON.parse(localStorage.getItem(SCORES_KEY)) || [];
    } catch (e) {
        SCORES_CACHE = [];
    }
    return SCORES_CACHE;
}

function saveScores(scores) {
    SCORES_CACHE = scores;
    localStorage.setItem(SCORES_KEY, JSON.stringify(scores));
}

function addScore(score) {
    if (!currentUser || score <= 0) return;
    const scores = loadScores();
    scores.push({
        email: currentUser.email,
        nickname: currentUser.nickname,
        score,
        createdAt: new Date().toISOString()
    });
    saveScores(scores);
    updateLeaderboard();
}

function updateUserBestScore(score) {
    if (!currentUser) return;
    const users = loadUsers();
    const idx = users.findIndex((u) => u.email === currentUser.email);
    if (idx !== -1) {
        users[idx].bestScore = Math.max(users[idx].bestScore || 0, score);
        currentUser = users[idx];
        saveUsers(users);
    }
    renderUserInfo();
    updateBestScoreLabel();
    updateLeaderboard();
}

// ==================== АВАТАРКИ ====================

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

authToggleBtn.addEventListener("click", () => {
    if (isLoginMode) {
        loginForm.classList.add("hidden");
        regForm.classList.remove("hidden");
        authTitle.textContent = "Реєстрація";
        authToggleText.textContent = "Вже маєте акаунт?";
        authToggleBtn.textContent = "Увійти";
        if (messageEl) messageEl.textContent = "";
        isLoginMode = false;
    } else {
        regForm.classList.add("hidden");
        loginForm.classList.remove("hidden");
        authTitle.textContent = "Вхід";
        authToggleText.textContent = "Немає акаунту?";
        authToggleBtn.textContent = "Зареєструватися";
        if (messageEl) messageEl.textContent = "";
        isLoginMode = true;
    }
});

regForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const nickname = document.getElementById("nickname").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value.trim();

    if (!nickname || !email || !password) {
        showMessage("Будь ласка, заповніть всі поля!", "red");
        return;
    }

    const users = loadUsers();
    if (users.some((u) => u.email === email)) {
        showMessage(
            "Користувач з такою електронною поштою вже існує. Увійдіть або використайте іншу пошту.",
            "red"
        );
        return;
    }

    const newUser = {
        nickname,
        email,
        password,
        bestScore: 0,
        avatar: null
    };

    users.push(newUser);
    saveUsers(users);

    currentUser = newUser;
    showMessage("Реєстрація успішна! Ви увійшли в систему.", "green");
    renderUserInfo();
    switchToGame();
});

loginForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const email = document.getElementById("loginEmail").value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value.trim();

    if (!email || !password) {
        showMessage("Заповніть пошту та пароль для входу.", "red");
        return;
    }

    const users = loadUsers();
    const user = users.find((u) => u.email === email && u.password === password);

    if (!user) {
        showMessage("Невірна електронна пошта або пароль.", "red");
        return;
    }

    currentUser = user;
    showMessage("Вхід успішний! Ласкаво просимо.", "green");
    renderUserInfo();
    switchToGame();
});

function showMessage(text, color = "black") {
    if (!messageEl) return;
    messageEl.style.color = color;
    messageEl.textContent = text;
}

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

changeAvatarBtn.addEventListener("click", () => {
    if (!currentUser) return;
    avatarInput.click();
    userMenu.classList.add("hidden");
});

avatarInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file || !currentUser) {
        avatarInput.value = "";
        return;
    }

    if (!file.type.startsWith("image/")) {
        showMessage("Будь ласка, оберіть зображення (png/jpg).", "red");
        avatarInput.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
        const dataUrl = evt.target.result;

        const users = loadUsers();
        const idx = users.findIndex((u) => u.email === currentUser.email);
        if (idx !== -1) {
            users[idx].avatar = dataUrl;
            currentUser = users[idx];
            saveUsers(users);
        } else {
            currentUser.avatar = dataUrl;
        }

        renderUserInfo();
        updateLeaderboard();
    };

    reader.readAsDataURL(file);
    avatarInput.value = "";
});

logoutBtn.addEventListener("click", () => {
    currentUser = null;
    userMenu.classList.add("hidden");
    gameSection.classList.add("hidden");
    authSection.classList.remove("hidden");
    userInfoEl.textContent = "";
    showMessage("");
});



// ==================== ЛІДЕРБОРД ====================

function updateLeaderboard() {
    const scores = loadScores();
    const users = loadUsers();

    const bestByEmail = {};
    for (let i = 0, len = scores.length; i < len; i++) {
        const rec = scores[i];
        const email = rec.email;
        if (!email) continue;
        const existing = bestByEmail[email];
        if (!existing || rec.score > existing.score) {
            bestByEmail[email] = rec;
        }
    }

    const allRecords = Object.values(bestByEmail);
    allRecords.sort((a, b) => b.score - a.score);

    const top = allRecords.slice(0, 10);
    const totalPlayers = allRecords.length;

    leaderboardList.innerHTML = "";
    if (top.length === 0) {
        const li = document.createElement("li");
        li.textContent = "Поки що немає результатів.";
        leaderboardList.appendChild(li);
    } else {
        for (let i = 0, len = top.length; i < len; i++) {
            const record = top[i];
            const li = document.createElement("li");

            const user = users.find((u) => u.email === record.email);
            const avatarUrl = user?.avatar || null;
            const isSelf = currentUser && record.email === currentUser.email;

            const avatarHTML = renderAvatarHTML(
                record.nickname,
                "avatar-leader",
                avatarUrl
            );

            li.innerHTML = `
                ${avatarHTML}
                <span class="leader-name">${record.nickname}${
                isSelf ? '<span class="leader-self-badge">Ви</span>' : ""
            }</span>
                <span class="leader-score">${record.score}</span>
            `;

            if (isSelf) {
                li.classList.add("leader-self");
            }

            leaderboardList.appendChild(li);
        }
    }

    if (currentUser && totalPlayers > 0) {
        const idx = allRecords.findIndex(
            (r) => r.email === currentUser.email
        );
        if (idx !== -1) {
            const place = idx + 1;
            userRankEl.textContent = `Ваше місце: ${place} з ${totalPlayers}`;
        } else {
            userRankEl.textContent = "";
        }
    } else {
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

changeNameBtn.addEventListener("click", () => {
    newNameInput.value = currentUser?.nickname || "";
    changeNameOverlay.classList.remove("hidden");
});


saveNewNameBtn.addEventListener("click", () => {
    const newName = newNameInput.value.trim();
    if (!newName) return;

    const users = loadUsers();
    const idx = users.findIndex(u => u.email === currentUser.email);

    if (idx !== -1) {
        users[idx].nickname = newName;
        currentUser.nickname = newName;
        saveUsers(users);
    }

    // Оновлення всіх місць, де використовується ім’я
    renderUserInfo();
    updateLeaderboard();

    changeNameOverlay.classList.add("hidden");
});



changeNameOverlay.addEventListener("click", e => {
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

// ExitStone поки на майбутнє
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
let Move = null; // setInterval id

let isRunning = false; // чи запущена гра (йде цикл)
let isPaused = false;  // чи зараз пауза


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
    // координати кратні 20, тому достатньо == без складних перевірок
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
        if (Score > maxScore) {
            maxScore = Score;
        }

        const isNewRecord = currentUser && Score > bestBeforeGame;

        updateUserBestScore(Score);
        addScore(Score);

        if (Move) {
            clearInterval(Move);
            Move = null;
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
        gameOverText.textContent = `Новий рекорд! Ваш рахунок: ${Score}. Новий рекорд: ${maxScore}`;
    } else {
        gameOverText.textContent = `Ви програли. Ваш рахунок: ${Score}. Поточний рекорд: ${maxScore}`;
    }
    gameOverOverlay.classList.remove("hidden");

    gameOverOkBtn.onclick = () => {
        gameOverOverlay.classList.add("hidden");
        resetGameState();
    };
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
    // Якщо гра ще не запущена – нічого не робимо
    if (!isRunning) return;

    if (!isPaused) {
        // Стаємо на паузу
        clearInterval(Move);
        isPaused = true;
    } else {
        // Продовжуємо з паузи
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

// рух змійки з числовими координатами
function MoveTestXY() {
    const len = nodeArray.length;
    if (!len) return;

    // хвіст бере координати попередніх сегментів
    for (let i = len - 1; i > 0; i--) {
        nodeArray[i].x = nodeArray[i - 1].x;
        nodeArray[i].y = nodeArray[i - 1].y;
    }

    // голова
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

    // перевірка зіткнення з тілом
    snakeHitLose = false;
    const headX = nodeArray[0].x;
    const headY = nodeArray[0].y;
    for (let i = 1; i < len; i++) {
        if (nodeArray[i].x === headX && nodeArray[i].y === headY) {
            snakeHitLose = true;
            break;
        }
    }

    // одна синхронізація DOM
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


// запуск гри
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

    updateLeaderboard();
})();
