// ===== DOM ELEMENTS =====
const modeButtons = document.querySelectorAll('.mode-btn');
const activeModeName = document.getElementById('activeModeName');
const sendBtn = document.getElementById('sendBtn');
const chatInput = document.getElementById('chatInput');
const welcomeScreen = document.getElementById('welcome-screen');
const chatHistory = document.getElementById('chat-history');
const newChatBtn = document.getElementById('newChatBtn');

let currentMode = 'general';

// ===== MODE SWITCHING =====
modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        modeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentMode = btn.dataset.mode;
        activeModeName.textContent = btn.textContent.trim();
    });
});

// ===== AI RESPONSE LOGIC =====
const aiResponses = {
    general: [
        "That's an interesting question! Let me think about it...",
        "I'd be happy to help you with that!",
        "Great question! Here's what I think...",
        "I understand what you're asking. Let me explain..."
    ],
    study: [
        "Let me help you understand this concept better...",
        "Here's a study tip that might help...",
        "This topic is fascinating! Let me break it down...",
        "I'll explain this in a way that's easy to remember..."
    ],
    coding: [
        "Here's how you can solve that coding problem...",
        "Let me show you the code for that...",
        "This is a common programming challenge. Here's the solution...",
        "I can help you debug that! Let's look at the code..."
    ],
    research: [
        "Based on my research, here's what I found...",
        "This is an interesting topic to explore...",
        "Let me provide some insights on this subject...",
        "Here are some key findings about this topic..."
    ]
};

const specificResponses = {
    'hello': "Hello! 👋 How can I help you today?",
    'hi': "Hi there! What would you like to know?",
    'help': "I can help you with:\n• Explaining concepts\n• Teaching coding\n• Study assistance\n• Research topics\n\nJust ask me anything!",
    'what can you do': "I'm Nova AI, your all-in-one AI workspace! I can answer questions, help you study, teach coding, and assist with research.",
    'thank you': "You're welcome! 😊 Is there anything else I can help you with?",
    'thanks': "Happy to help! Let me know if you need anything else."
};

// ===== FUNCTIONS =====
function createMessageBubble(text, isUser) {
    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${isUser ? 'user-message' : 'ai-message'}`;
    // Convert newlines to breaks for better formatting
    bubble.innerHTML = text.replace(/\n/g, '<br>'); 
    return bubble;
}

function getAIResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase().trim();
    
    // Check for specific keyword matches first
    for (let key in specificResponses) {
        if (lowerMessage.includes(key)) {
            return specificResponses[key];
        }
    }
    
    // Fallback to random mode-based response
    const modeResponses = aiResponses[currentMode] || aiResponses.general;
    const randomIndex = Math.floor(Math.random() * modeResponses.length);
    return modeResponses[randomIndex];
}

function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return;
    
    // 1. Hide welcome screen, show chat history
    welcomeScreen.classList.add('hidden');
    chatHistory.classList.remove('hidden');
    
    // 2. Add user message
    chatHistory.appendChild(createMessageBubble(message, true));
    chatInput.value = '';
    
    // 3. Scroll to bottom immediately
    chatHistory.scrollTop = chatHistory.scrollHeight;
    
    // 4. Simulate AI thinking delay
    setTimeout(() => {
        const aiResponse = getAIResponse(message);
        chatHistory.appendChild(createMessageBubble(aiResponse, false));
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }, 800); // 800ms delay for realism
}

// ===== EVENT LISTENERS =====
sendBtn.addEventListener('click', sendMessage);

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Suggestion chips click
document.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        chatInput.value = chip.textContent;
        sendMessage();
    });
});

// New Chat button
newChatBtn.addEventListener('click', () => {
    chatHistory.innerHTML = ''; // Clear messages
    chatHistory.classList.add('hidden');
    welcomeScreen.classList.remove('hidden');
    chatInput.value = '';
    chatInput.focus();
});
