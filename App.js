(function() {
    'use strict';

    // ==========================================
    // CONFIGURATION (CHANGE THIS FOR VERCEL)
    // ==========================================
    const CONFIG = {
        // When your Vercel backend is ready, set this to false 
        // and add your Vercel API URL below.
        USE_MOCK_API: true, 
        
        // Example Vercel URL: 'https://your-vercel-app.vercel.app/api/chat'
        API_ENDPOINT: '', 
        
        API_TIMEOUT: 15000 // 15 seconds timeout
    };

    // ==========================================
    // STATE MANAGEMENT
    // ==========================================
    const state = {
        chatStarted: false,
        messageCount: 0,
        isProcessing: false
    };

    const dom = {};

    // ==========================================
    // INITIALIZATION
    // ==========================================
    function cacheDom() {
        dom.mainInput = document.getElementById('main-input');
        dom.sendBtn = document.getElementById('send-btn');
        dom.chatContainer = document.getElementById('chat-container');
        dom.welcomeView = document.getElementById('welcome-view');
        dom.chatView = document.getElementById('chat-view');
        dom.suggestions = document.getElementById('suggestions');
        dom.statMessages = document.getElementById('stat-messages');
        dom.modelSelect = document.getElementById('model-select');
        dom.searchInput = document.getElementById('search-input');
        dom.toastContainer = document.getElementById('toast-container');
    }

    function init() {
        cacheDom();
        initNavigation();
        bindEvents();
        console.log('✅ Nova AI Frontend initialized successfully.');
    }

    // ==========================================
    // NAVIGATION
    // ==========================================
    function initNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        for (let i = 0; i < navItems.length; i++) {
            navItems[i].addEventListener('click', function(e) {
                e.preventDefault();
                for (let j = 0; j < navItems.length; j++) navItems[j].classList.remove('active');
                this.classList.add('active');
                showToast(`Navigated to ${this.getAttribute('data-page')}`, 'success');
            });
        }
    }

    // ==========================================
    // API LAYER (Vercel Ready)
    // ==========================================
    const NovaAPI = {
        // Mock response for development
        mockRequest: function(prompt) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(generateMockResponse(prompt));
                }, 1000 + Math.random() * 1500);
            });
        },

        // Real Vercel API call
        realRequest: async function(prompt, model) {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);

            try {
                const response = await fetch(CONFIG.API_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ prompt: prompt, model: model }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) throw new Error(`Server error: ${response.status}`);
                
                const data = await response.json();
                return data.response || data.message || "No response received.";
            } catch (error) {
                clearTimeout(timeoutId);
                if (error.name === 'AbortError') throw new Error('Request timed out. Please try again.');
                throw error;
            }
        },

        send: function(prompt, model) {
            if (CONFIG.USE_MOCK_API) return this.mockRequest(prompt);
            return this.realRequest(prompt, model);
        }
    };

    // ==========================================
    // CHAT LOGIC
    // ==========================================
    async function sendMessage() {
        if (!dom.mainInput) return;

        const text = dom.mainInput.value.trim();
        if (!text || state.isProcessing) return;

        state.isProcessing = true;
        if (dom.sendBtn) dom.sendBtn.disabled = true;

        if (!state.chatStarted) {
            startChatView();
            state.chatStarted = true;
        }

        const model = dom.modelSelect ? dom.modelSelect.value : 'general';
        
        addMessage(text, 'user');
        dom.mainInput.value = '';
        state.messageCount++;
        updateStats();

        showLoading();

        try {
            const aiResponse = await NovaAPI.send(text, model);
            removeLoading();
            addMessage(aiResponse, 'ai');
            state.messageCount++;
            updateStats();
        } catch (error) {
            removeLoading();
            addMessage(`⚠️ Error: ${error.message}. Please check your connection and try again.`, 'ai');
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
        if (!dom.chatContainer) return;

        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-message' + (type === 'user' ? ' user-msg' : '');

        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const avatarLetter = type === 'user' ? 'W' : 'N';
        const avatarClass = type === 'user' ? 'user-av' : 'ai-av';
        const name = type === 'user' ? 'You' : 'Nova AI';

        msgDiv.innerHTML =
            '<div class="msg-header">' +
                '<div class="msg-avatar ' + avatarClass + '">' + avatarLetter + '</div>' +
                '<span class="msg-name">' + name + '</span>' +
                '<span class="msg-time">' + timeStr + '</span>' +
            '</div>' +
            '<div class="msg-content">' + formatMessage(text) + '</div>';

        dom.chatContainer.appendChild(msgDiv);
        dom.chatContainer.scrollTop = dom.chatContainer.scrollHeight;
    }

    function formatMessage(text) {
        if (!text) return '';
        // Prevent XSS by escaping HTML first
        let safeText = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        // Apply markdown-like formatting
        safeText = safeText
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/```(\w*)\n?([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
            .replace(/\n/g, '<br>');
        return safeText;
    }

    function showLoading() {
        if (!dom.chatContainer) return;
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'chat-message';
        loadingDiv.id = 'loading-msg';
        loadingDiv.innerHTML =
            '<div class="msg-header"><div class="msg-avatar ai-av">N</div><span class="msg-name">Nova AI</span></div>' +
            '<div class="msg-content"><div class="loading-dots"><span></span><span></span><span></span></div></div>';
        dom.chatContainer.appendChild(loadingDiv);
        dom.chatContainer.scrollTop = dom.chatContainer.scrollHeight;
    }

    function removeLoading() {
        const loading = document.getElementById('loading-msg');
        if (loading) loading.remove();
    }

    function updateStats() {
        if (dom.statMessages) dom.statMessages.textContent = state.messageCount;
    }

    // ==========================================
    // MOCK RESPONSES (Remove when Vercel is ready)
    // ==========================================
    function generateMockResponse(input) {
        const lower = input.toLowerCase();
        if (lower.includes('quadratic')) return "A quadratic equation is of the form **ax² + bx + c = 0**. You can solve it using the quadratic formula:\n\nx = (-b ± √(b²-4ac)) / 2a\n\nWould you like me to walk through a specific example?";
        if (lower.includes('python') || lower.includes('script')) return "Here's a simple Python script to get you started:\n\n```python\ndef greet(name):\n    return f'Hello, {name}!'\n\nprint(greet('Student'))\n```\n\nWhat would you like to build?";
        if (lower.includes('study') || lower.includes('exam')) return "I'd be happy to help you study! Here's a structured approach:\n\n1. **Review** your notes and textbook chapters\n2. **Practice** with sample problems\n3. **Test** yourself with flashcards\n4. **Rest** before the exam\n\nWhat subject are you studying?";
        return "That's a great question! Let me help you with that. Based on what you've asked, here are some key points to consider. Would you like me to go deeper into any specific aspect?";
    }

    // ==========================================
    // TOAST NOTIFICATION SYSTEM
    // ==========================================
    function showToast(message, type = 'success') {
        if (!dom.toastContainer) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icon = type === 'success' ? '<i class="fas fa-check-circle"></i>' : '<i class="fas fa-exclamation-circle"></i>';
        toast.innerHTML = `${icon} <span>${message}</span>`;
        
        dom.toastContainer.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // ==========================================
    // EVENT BINDING
    // ==========================================
    function bindEvents() {
        if (dom.sendBtn) dom.sendBtn.addEventListener('click', sendMessage);
        
        if (dom.mainInput) {
            dom.mainInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
            });
        }

        bindDelegatedClick('.chip', function(el) {
            const prompt = el.getAttribute('data-prompt');
            if (prompt && dom.mainInput) { dom.mainInput.value = prompt; sendMessage(); }
        });

        bindDelegatedClick('.feature-card', function(el) {
            const feature = el.getAttribute('data-feature');
            if (feature && dom.mainInput) { dom.mainInput.value = 'I want to use ' + feature + '. '; dom.mainInput.focus(); }
        });

        bindDelegatedClick('.chat-item', function(el, e) {
            e.preventDefault();
            const title = el.querySelector('.chat-title');
            if (title && dom.mainInput) { dom.mainInput.value = 'Continue: ' + title.textContent; dom.mainInput.focus(); }
        });

        // Tool buttons
        document.getElementById('tool-add')?.addEventListener('click', () => showToast('Add content feature coming soon', 'success'));
        document.getElementById('tool-upload')?.addEventListener('click', () => showToast('File upload ready (PDF, DOCX, TXT)', 'success'));
        document.getElementById('tool-image')?.addEventListener('click', () => showToast('Image upload coming soon', 'success'));
        document.getElementById('tool-web')?.addEventListener('click', () => showToast('Web search enabled', 'success'));

        if (dom.modelSelect) dom.modelSelect.addEventListener('change', function() { showToast(`Switched to ${this.options[this.selectedIndex].text}`, 'success'); });
        
        if (dom.searchInput) {
            dom.searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') { const q = this.value.trim(); if (q) showToast(`Searching for: ${q}`, 'success'); }
            });
        }

        document.getElementById('notif-btn')?.addEventListener('click', () => showToast('No new notifications', 'success'));
        document.getElementById('pro-btn-top')?.addEventListener('click', () => showToast('Upgrade to Nova AI Pro', 'success'));
        document.getElementById('upgrade-btn')?.addEventListener('click', () => showToast('Redirecting to checkout...', 'success'));
        document.getElementById('user-avatar-btn')?.addEventListener('click', () => showToast('Profile settings opening...', 'success'));
        document.getElementById('user-profile-btn')?.addEventListener('click', () => showToast('Profile settings opening...', 'success'));
        document.getElementById('view-all-btn')?.addEventListener('click', (e) => { e.preventDefault(); showToast('Full chat history coming soon', 'success'); });
    }

    function bindDelegatedClick(selector, callback) {
        const elements = document.querySelectorAll(selector);
        for (let i = 0; i < elements.length; i++) {
            elements[i].addEventListener('click', function(e) { callback(this, e); });
        }
    }

    // ==========================================
    // BOOT
    // ==========================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
