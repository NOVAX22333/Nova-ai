const messageInput = document.getElementById("messageInput");
const sendBtn = document.getElementById("sendBtn");
const messages = document.getElementById("messages");
const welcome = document.getElementById("welcome");

const newChatBtn = document.getElementById("newChatBtn");
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");

const settingsBtn = document.getElementById("settingsBtn");
const settingsModal = document.getElementById("settingsModal");
const closeSettings = document.getElementById("closeSettings");

const themeBtn = document.getElementById("themeBtn");
const darkToggle = document.getElementById("darkToggle");

const attachBtn = document.getElementById("attachBtn");
const micBtn = document.getElementById("micBtn");

const suggestions = document.querySelectorAll(".suggestion");


// -------------------------
// SEND MESSAGE
// -------------------------

function sendMessage() {

  const text = messageInput.value.trim();

  if (!text) return;

  welcome.style.display = "none";

  addMessage(text, "user");

  messageInput.value = "";

  resizeTextarea();

  setTimeout(() => {

    addTyping();

    setTimeout(() => {

      removeTyping();

      const response = generateResponse(text);

      addMessage(response, "nova");

    }, 900);

  }, 300);
}


// -------------------------
// ADD MESSAGE
// -------------------------

function addMessage(text, sender) {

  const message = document.createElement("div");

  message.className = `message ${sender}`;

  const avatar = document.createElement("div");

  avatar.className = "avatar";

  avatar.textContent =
    sender === "user" ? "U" : "✦";

  const content = document.createElement("div");

  content.className = "message-content";

  const name = document.createElement("div");

  name.className = "message-name";

  name.textContent =
    sender === "user" ? "You" : "Nova AI";

  const messageText = document.createElement("div");

  messageText.className = "message-text";

  messageText.textContent = text;

  content.appendChild(name);
  content.appendChild(messageText);

  message.appendChild(avatar);
  message.appendChild(content);

  messages.appendChild(message);

  scrollToBottom();
}


// -------------------------
// TYPING INDICATOR
// -------------------------

function addTyping() {

  const typing = document.createElement("div");

  typing.className = "message nova";

  typing.id = "typing";

  typing.innerHTML = `
    <div class="avatar">✦</div>

    <div class="message-content">

      <div class="message-name">
        Nova AI
      </div>

      <div class="message-text">
        <span class="typing-dots">Nova is thinking...</span>
      </div>

    </div>
  `;

  messages.appendChild(typing);

  scrollToBottom();
}


function removeTyping() {

  const typing = document.getElementById("typing");

  if (typing) {
    typing.remove();
  }
}


// -------------------------
// DEMO AI RESPONSE
// -------------------------

function generateResponse(input) {

  const text = input.toLowerCase();

  if (
    text.includes("hello") ||
    text.includes("hi") ||
    text.includes("hey")
  ) {

    return "Hey! 👋 I'm Nova AI. What are we building today?";

  }

  if (
    text.includes("code") ||
    text.includes("coding") ||
    text.includes("javascript") ||
    text.includes("html")
  ) {

    return "Absolutely. I can help you plan the project, structure the frontend, and write the HTML, CSS and JavaScript. 🚀";

  }

  if (
    text.includes("math") ||
    text.includes("equation") ||
    text.includes("calculate")
  ) {

    return "Let's break the maths problem down step by step and make sure every part is clear. 🧠";

  }

  if (
    text.includes("idea") ||
    text.includes("ideas") ||
    text.includes("project")
  ) {

    return "Here's a project idea: build a personal AI dashboard with notes, a study planner, a coding playground and an AI chat interface.";

  }

  if (
    text.includes("who are you") ||
    text.includes("what are you")
  ) {

    return "I'm Nova AI — a futuristic AI assistant interface. This version is a frontend demo, so my responses are simulated.";

  }

  if (
    text.includes("thank")
  ) {

    return "You're welcome! 😎";

  }

  return `I received your message:

"${input}"

This is currently a frontend-only Nova AI demo. Connect an AI backend later to generate real responses.`;
}


// -------------------------
// ENTER TO SEND
// -------------------------

messageInput.addEventListener("keydown", function(event) {

  if (
    event.key === "Enter" &&
    !event.shiftKey
  ) {

    event.preventDefault();

    sendMessage();

  }

});


// -------------------------
// SEND BUTTON
// -------------------------

sendBtn.addEventListener(
  "click",
  sendMessage
);


// -------------------------
// TEXTAREA AUTO RESIZE
// -------------------------

function resizeTextarea() {

  messageInput.style.height = "auto";

  messageInput.style.height =
    Math.min(messageInput.scrollHeight, 150) + "px";

}

messageInput.addEventListener(
  "input",
  resizeTextarea
);


// -------------------------
// SUGGESTIONS
// -------------------------

suggestions.forEach(button => {

  button.addEventListener("click", () => {

    messageInput.value =
      button.dataset.prompt;

    resizeTextarea();

    sendMessage();

  });

});


// -------------------------
// NEW CHAT
// -------------------------

newChatBtn.addEventListener("click", () => {

  messages.innerHTML = "";

  welcome.style.display = "block";

  messageInput.value = "";

  resizeTextarea();

  sidebar.classList.remove("open");

});


// -------------------------
// MOBILE SIDEBAR
// -------------------------

menuBtn.addEventListener("click", () => {

  sidebar.classList.toggle("open");

});


// -------------------------
// SETTINGS
// -------------------------

settingsBtn.addEventListener("click", () => {

  settingsModal.classList.add("show");

  sidebar.classList.remove("open");

});

closeSettings.addEventListener("click", () => {

  settingsModal.classList.remove("show");

});

settingsModal.addEventListener("click", event => {

  if (event.target === settingsModal) {

    settingsModal.classList.remove("show");

  }

});


// -------------------------
// THEME
// -------------------------

function updateTheme() {

  if (darkToggle.checked) {

    document.body.classList.remove("light");

  } else {

    document.body.classList.add("light");

  }

}

darkToggle.addEventListener(
  "change",
  updateTheme
);

themeBtn.addEventListener("click", () => {

  darkToggle.checked =
    !darkToggle.checked;

  updateTheme();

});


// -------------------------
// ATTACH BUTTON
// -------------------------

attachBtn.addEventListener("click", () => {

  alert(
    "File upload UI is ready. Connect a backend later to process uploaded files."
  );

});


// -------------------------
// MICROPHONE BUTTON
// -------------------------

micBtn.addEventListener("click", () => {

  alert(
    "Voice input is currently a frontend demo feature."
  );

});


// -------------------------
// SCROLL
// -------------------------

function scrollToBottom() {

  const container =
    document.getElementById("chatContainer");

  setTimeout(() => {

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth"
    });

  }, 50);

}
