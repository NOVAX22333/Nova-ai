// ===== CONFIGURATION =====
// ⚠️ PASTE YOUR API KEY INSIDE THE QUOTES BELOW
const API_KEY = "PASTE_YOUR_GOOGLE_API_KEY_HERE"; 

// Using gemini-1.5-flash for maximum stability and zero "Model Not Found" bugs
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

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

// ===== HELPER FUNCTIONS =====
function createMessageBubble(text, isUser, isLoading = false) {
    const bubble = document.createElement('div');
    bubble.className = `message-bubble ${isUser ? 'user-message' : 'ai-message'}`;
    if (isLoading) bubble.classList.add('loading-bubble');
    
    // Convert newlines to breaks so the AI's formatting looks good
    bubble.innerHTML = text.replace(/\n/g, '<br>'); 
    return bubble;
}

// ===== THE REAL AI BRAIN =====
async function getRealAIResponse(userMessage) {
    // Safety check: Did they forget the API key?
    if (API_KEY === "PASTE_YOUR_GOOGLE_API_KEY_HERE" || API_KEY === "") {
        return "⚠️ Error: You forgot to add your API key in the App.js file!";
    }

    // Add system instructions based on the selected mode
    let systemPrompt = "You are Nova AI, a helpful, friendly, and professional AI assistant.";
    if (currentMode === 'study') systemPrompt += " You are an expert tutor. Explain things simply and use examples.";
    if (currentMode === 'coding') systemPrompt += " You are an expert programmer. Provide clean, well-commented code examples.";
    if (currentMode === 'research') systemPrompt += " You are a research analyst. Provide detailed, factual, and structured answers.";

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: `${systemPrompt}\n\nUser: ${userMessage}` }] }]
            })
        });

        const data = await response.json();
        
        // Check if the API returned a valid answer
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text;
        } else {
            return "I'm sorry, I couldn't generate a response. The API might be blocked or the prompt was unsafe.";
        }
    } catch (error) {
        console.error("API Error:", error);
        return "️ Network error. Please check your internet connection or verify your API key.";
    }
}

// ===== SEND MESSAGE LOGIC =====
async function sendMessage() {
    const message = chatInput.value.trim();
    if (!message) return; // Bug prevention: Don't send empty messages
    
    // 1. UI Setup: Hide welcome, show chat
    welcomeScreen.classList.add('hidden');
    chatHistory.classList.remove('hidden');
    
    // 2. Add User Message
    chatHistory.appendChild(createMessageBubble(message, true));
    chatInput.value = '';
    chatHistory.scrollTop = chatHistory.scrollHeight;
    
    // 3. Add "Thinking..." Bubble
    const loadingBubble = createMessageBubble("Thinking", false, true);
    chatHistory.appendChild(loadingBubble);
    chatHistory.scrollTop = chatHistory.scrollHeight;
    
    // 4. Get AI Response
    const aiResponse = await getRealAIResponse(message);
    
    // 5. Remove loading bubble and show real response
    loadingBubble.remove();
    chatHistory.appendChild(createMessageBubble(aiResponse, false));
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// ===== EVENT LISTENERS =====
sendBtn.addEventListener('click', sendMessage);

chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault(); // Prevents the page from refreshing if inside a form
        sendMessage();
    }
});

document.querySelectorAll('.suggestion-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        chatInput.value = chip.textContent;
        sendMessage();
    });
});

newChatBtn.addEventListener('click', () => {
    chatHistory.innerHTML = ''; 
    chatHistory.classList.add('hidden');
    welcomeScreen.classList.remove('hidden');
    chatInput.value = '';
    chatInput.focus();
});
