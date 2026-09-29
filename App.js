const modes = {
  general: "General AI",
  study: "Study AI",
  coding: "Coding AI",
  research: "Research AI"
};

const chat = document.getElementById("chat");
const input = document.getElementById("input");
const composer = document.getElementById("composer");
const title = document.getElementById("title");
const newChat = document.getElementById("newChat");

document.querySelectorAll(".mode").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".mode").forEach(b => b.classList.remove("active"));
    button.classList.add("active");

    const mode = button.dataset.mode;
    title.textContent = modes[mode];
  });
});

document.querySelectorAll("[data-prompt]").forEach(button => {
  button.addEventListener("click", () => {
    input.value = button.dataset.prompt;
    input.focus();
  });
});

composer.addEventListener("submit", event => {
  event.preventDefault();

  const message = input.value.trim();

  if (!message) return;

  addMessage("You", message);

  input.value = "";

  setTimeout(() => {
    addMessage(
      "Nova AI",
      "I received your message. AI responses will be connected here next."
    );
  }, 500);
});

function addMessage(sender, message) {
  const messageBox = document.createElement("div");

  messageBox.className = "message";

  messageBox.innerHTML = `
    <strong>${sender}</strong>
    <p>${escapeHTML(message)}</p>
  `;

  chat.appendChild(messageBox);
  chat.scrollTop = chat.scrollHeight;
}

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

newChat.addEventListener("click", () => {
  chat.innerHTML = `
    <div class="welcome">
      <div class="logo">✦</div>
      <h1>What can I help you with?</h1>
      <p>Your all-in-one AI workspace.</p>
    </div>
  `;
});
