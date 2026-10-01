(function() {
    'use strict';

    const CONFIG = { USE_MOCK_API: true, API_ENDPOINT: '', API_TIMEOUT: 15000 };
    const state = { chatStarted: false, messageCount: 0, isProcessing: false, webSearchEnabled: false };
    const dom = {};

    function cacheDom() {
        dom.mainInput = document.getElementById('main-input');
        dom.sendBtn = document.getElementById('send-btn');
        dom.chatMessages = document.getElementById('chat-messages');
        dom.welcomeView = document.getElementById('welcome-view');
        dom.chatView = document.getElementById('chat-view');
        dom.suggestions = document.getElementById('suggestions');
        dom.modelSelect = document.getElementById('model-select');
        dom.searchInput = document.getElementById('search-input');
        dom.toastContainer = document.getElementById('toast-container');
        dom.fileInput = document.getElementById('file-input');
        dom.imageInput = document.getElementById('image-input');
        dom.webBtn = document.getElementById('tool-web');
        dom.viewContainer = document.getElementById('view-container');
    }

    function init() { cacheDom(); initNavigation(); bindEvents(); console.log('✅ Nova AI Frontend initialized.'); }

    function initNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        for (let i = 0; i < navItems.length; i++) {
            navItems[i].addEventListener('click', function(e) {
                e.preventDefault();
                for (let j = 0; j < navItems.length; j++) navItems[j].classList.remove('active');
                this.classList.add('active');
            });
        }
    }

    // ===== API LAYER =====
    const NovaAPI = {
        mockRequest: function(prompt) { 
            return new Promise((resolve) => { 
                setTimeout(() => { resolve(generateMockResponse(prompt)); }, 1000 + Math.random() * 1500); 
            }); 
        },
        realRequest: async function(prompt, model) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);
            try {
                const response = await fetch(CONFIG.API_ENDPOINT, { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({ prompt: prompt, model: model, webSearch: state.webSearchEnabled }), 
                    signal: controller.signal 
                });
                clearTimeout(timeoutId);
                if (!response.ok) throw new Error(`Server error: ${response.status}`);
                const data = await response.json();
                return data.response || data.message || "No response received.";
            } catch (error) {
                clearTimeout(timeoutId);
                if (error.name === 'AbortError') throw new Error('Request timed out.');
                throw error;
            }
        },
        send: function(prompt, model) { if (CONFIG.USE_MOCK_API) return this.mockRequest(prompt); return this.realRequest(prompt, model); }
    };

    // ===== CHAT LOGIC =====
    async function sendMessage() {
        if (!dom.mainInput) return;
        const text = dom.mainInput.value.trim();
        if (!text || state.isProcessing) return;

        state.isProcessing = true;
        if (dom.sendBtn) dom.sendBtn.disabled = true;

        if (!state.chatStarted) { startChatView(); state.chatStarted = true; }
        const model = dom.modelSelect ? dom.modelSelect.value : 'general';
        
        addMessage(text, 'user');
        dom.mainInput.value = '';
        state.messageCount++;
        showLoading();

        try {
            const aiResponse = await NovaAPI.send(text, model);
            removeLoading();
            addMessage(aiResponse, 'ai');
            state.messageCount++;
        } catch (error) {
            removeLoading();
            addMessage(`⚠️ Error: ${error.message}. Please try again.`, 'ai');
            showToast(error.message, 'error');
        } finally {
            state.isProcessing = false;
            if (dom.sendBtn) dom.sendBtn.disabled = false;
            dom.mainInput.focus();
        }
    }

    function startChatView() {
        if (dom.welcomeView) dom.welcomeView.style.display = 'none';
        if (dom.chatView) dom.chatView.style.display = 'flex';
        if (dom.suggestions) dom.suggestions.style.display = 'none';
    }

    function addMessage(text, type) {
        if (!dom.chatMessages) return;
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message';
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const avatarLetter = type === 'user' ? 'G' : 'N';
        const avatarClass = type === 'user' ? 'user-av' : 'ai-av';
        const name = type === 'user' ? 'Guest' : 'Nova AI';

        msgDiv.innerHTML = `
            <div class="msg-avatar ${avatarClass}">${avatarLetter}</div>
            <div class="msg-body">
                <div class="msg-header">
                    <span class="msg-name">${name}</span>
                    <span class="msg-time">${timeStr}</span>
                </div>
                <div class="msg-content">${formatMessage(text)}</div>
            </div>
        `;
        dom.chatMessages.appendChild(msgDiv);
        scrollToBottom();
    }

    function formatMessage(text) {
        if (!text) return '';
        let safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        safeText = safeText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>').replace(/\n/g, '<br>');
        return safeText;
    }

    function showLoading() {
        if (!dom.chatMessages) return;
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'chat-message';
        loadingDiv.id = 'loading-msg';
        loadingDiv.innerHTML = `
            <div class="msg-avatar ai-av">N</div>
            <div class="msg-body">
                <div class="msg-header"><span class="msg-name">Nova AI</span></div>
                <div class="msg-content"><div class="loading-dots"><span></span><span></span><span></span></div></div>
            </div>
        `;
        dom.chatMessages.appendChild(loadingDiv);
        scrollToBottom();
    }

    function removeLoading() { 
        const loading = document.getElementById('loading-msg'); 
        if (loading) loading.remove(); 
    }

    function scrollToBottom() {
        if (dom.chatMessages) {
            dom.chatMessages.scrollTop = dom.chatMessages.scrollHeight;
        }
    }

    function generateMockResponse(input) {
        const lower = input.toLowerCase();
        if (lower.includes('quadratic')) return "A quadratic equation is of the form **ax² + bx + c = 0**. You can solve it using the quadratic formula:\n\nx = (-b ± √(b²-4ac)) / 2a\n\nWould you like me to walk through a specific example?";
        if (lower.includes('python') || lower.includes('script')) return "Here's a simple Python script to get you started:\n\n```python\ndef greet(name):\n    return f'Hello, {name}!'\n\nprint(greet('Student'))\n```\n\nWhat would you like to build?";
        if (lower.includes('study') || lower.includes('exam')) return "I'd be happy to help you study! Here's a structured approach:\n\n1. **Review** your notes and textbook chapters\n2. **Practice** with sample problems\n3. **Test** yourself with flashcards\n4. **Rest** before the exam\n\nWhat subject are you studying?";
        return "That's a great question! Let me help you with that. Based on what you've asked, here are some key points to consider. Would you like me to go deeper into any specific aspect?";
    }

    function showToast(message, type = 'success') {
        if (!dom.toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        const icon = type === 'success' ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-exclamation-circle"></i>';
        toast.innerHTML = `${icon} <span>${message}</span>`;
        dom.toastContainer.appendChild(toast);
        setTimeout(() => { toast.style.animation = 'slideOut 0.3s ease forwards'; setTimeout(() => toast.remove(), 300); }, 3000);
    }

    // ===== EVENT BINDING =====
    function bindEvents() {
        if (dom.sendBtn) dom.sendBtn.addEventListener('click', sendMessage);
        if (dom.mainInput) dom.mainInput.addEventListener('keypress', function(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } });

        bindDelegatedClick('.chip', function(el) { 
            const prompt = el.getAttribute('data-prompt'); 
            if (prompt && dom.mainInput) { dom.mainInput.value = prompt; sendMessage(); } 
        });
        
        bindDelegatedClick('.feature-card', function(el) { 
            const feature = el.getAttribute('data-feature'); 
            if (feature && dom.mainInput) { dom.mainInput.value = 'I want to use ' + feature + '. '; dom.mainInput.focus(); } 
        });

        document.getElementById('tool-add')?.addEventListener('click', () => showToast('Add content menu opening...', 'success'));
        
        // FIXED: File Upload with reset to allow same file selection
        document.getElementById('tool-upload')?.addEventListener('click', () => {
            if (dom.fileInput) { dom.fileInput.value = ''; dom.fileInput.click(); }
        });
        
        document.getElementById('tool-image')?.addEventListener('click', () => {
            if (dom.imageInput) { dom.imageInput.value = ''; dom.imageInput.click(); }
        });

        if (dom.fileInput) {
            dom.fileInput.addEventListener('change', function() {
                if (this.files && this.files[0]) showToast(`File selected: ${this.files[0].name}`, 'success');
            });
        }
        if (dom.imageInput) {
            dom.imageInput.addEventListener('change', function() {
                if (this.files && this.files[0]) showToast(`Image selected: ${this.files[0].name}`, 'success');
            });
        }

        // FIXED: Web Search Toggle
        if (dom.webBtn) {
            dom.webBtn.addEventListener('click', function() {
                state.webSearchEnabled = !state.webSearchEnabled;
                this.classList.toggle('active', state.webSearchEnabled);
                showToast(state.webSearchEnabled ? 'Web search enabled' : 'Web search disabled', 'success');
            });
        }

        if (dom.modelSelect) dom.modelSelect.addEventListener('change', function() { showToast(`Switched to ${this.options[this.selectedIndex].text}`, 'success'); });
        if (dom.searchInput) dom.searchInput.addEventListener('keypress', function(e) { if (e.key === 'Enter') { const q = this.value.trim(); if (q) showToast(`Searching for: ${q}`, 'success'); } });

        document.querySelectorAll('.btn-auth, .btn-auth-top, .pro-btn, .upgrade-btn').forEach(btn => {
            btn.addEventListener('click', () => showToast('Authentication module coming soon', 'success'));
        });
    }

    function bindDelegatedClick(selector, callback) {
        const elements = document.querySelectorAll(selector);
        for (let i = 0; i < elements.length; i++) { elements[i].addEventListener('click', function(e) { callback(this, e); }); }
    }

    if (document.readyState === 'loading') { document.addEventListener('DOMContentLoaded', init); } else { init(); }
})();
