document.getElementById("regForm").addEventListener("submit", function(e) {
    e.preventDefault();

    let name = document.getElementById("name").value.trim();
    let surname = document.getElementById("surname").value.trim();
    let email = document.getElementById("email").value.trim();
    let password = document.getElementById("password").value.trim();
    let message = document.getElementById("message");

    if (!name || !surname || !email || !password) {
        message.style.color = "red";
        message.textContent = "Будь ласка, заповніть всі поля!";
        return;
    }

    message.style.color = "green";
    message.textContent = "Форму успішно відправлено!";
});

// Перемикання теми
const toggleBtn = document.getElementById("themeToggle");

toggleBtn.addEventListener("click", () => {
    document.body.classList.toggle("dark");

    toggleBtn.textContent = document.body.classList.contains("dark")
        ? "☀️ Світла тема"
        : "🌙 Темна тема";
});
