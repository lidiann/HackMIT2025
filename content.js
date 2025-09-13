// Content script for Eden - AI Sustainability Counter
class ClaudeTokenCounter {
  constructor() {
    this.isMonitoring = false;
    this.debounceTimer = null;
    this.lastText = '';
    
    this.init();
  }

  init() {
    // Wait for page to load
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }

    // Listen for messages from side panel
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'enableMonitoring') {
        this.isMonitoring = true;
        this.findAndMonitorInput();
        sendResponse({ success: true });
      } else if (request.action === 'disableMonitoring') {
        this.isMonitoring = false;
        sendResponse({ success: true });
      } else if (request.action === 'getCurrentPrompt') {
        const prompt = this.getCurrentPrompt();
        sendResponse({ prompt: prompt });
      }
    });
  }

  setup() {
    this.startMonitoring();
  }

  toggleMonitoring() {
    this.isMonitoring = !this.isMonitoring;
    
    if (this.isMonitoring) {
      this.findAndMonitorInput();
    }
  }

  startMonitoring() {
    // Monitor for input changes
    const observer = new MutationObserver(() => {
      if (this.isMonitoring) {
        this.findAndMonitorInput();
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  findAndMonitorInput() {
    // Look for Claude's input elements
    const inputSelectors = [
      'textarea[placeholder*="Talk to Claude"]',
      'textarea[data-testid="chat-input"]',
      'div[contenteditable="true"][role="textbox"]',
      'textarea.ProseMirror',
      'div.ProseMirror[contenteditable="true"]'
    ];

    for (const selector of inputSelectors) {
      const input = document.querySelector(selector);
      if (input && !input.hasAttribute('data-token-monitored')) {
        this.attachInputListener(input);
        input.setAttribute('data-token-monitored', 'true');
        break;
      }
    }
  }

  attachInputListener(input) {
    const handleInput = () => {
      if (!this.isMonitoring) return;
      
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.processInput(input);
      }, 500); // 500ms debounce
    };

    // Add event listeners based on input type
    if (input.tagName === 'TEXTAREA') {
      input.addEventListener('input', handleInput);
      input.addEventListener('paste', handleInput);
    } else if (input.contentEditable === 'true') {
      input.addEventListener('input', handleInput);
      input.addEventListener('paste', handleInput);
      input.addEventListener('keyup', handleInput);
    }
  }

  processInput(input) {
    const text = this.extractText(input);
    
    if (!text.trim() || text === this.lastText) {
      return;
    }

    this.lastText = text;

    // Send to background script for token counting
    chrome.runtime.sendMessage({
      action: 'countTokens',
      text: text
    }, (response) => {
      if (response && response.success) {
        // Send update to side panel
        chrome.runtime.sendMessage({
          action: 'updateStats',
          data: response.data
        });
      } else {
        console.error('Token counting error:', response?.error);
      }
    });
  }

  getCurrentPrompt() {
    const inputSelectors = [
      'textarea[placeholder*="Talk to Claude"]',
      'textarea[data-testid="chat-input"]',
      'div[contenteditable="true"][role="textbox"]',
      'textarea.ProseMirror',
      'div.ProseMirror[contenteditable="true"]'
    ];

    for (const selector of inputSelectors) {
      const input = document.querySelector(selector);
      if (input) {
        return this.extractText(input);
      }
    }
    return '';
  }

  extractText(input) {
    if (input.tagName === 'TEXTAREA') {
      return input.value;
    } else if (input.contentEditable === 'true') {
      return input.textContent || input.innerText || '';
    }
    return '';
  }
}

// Initialize the token counter
new ClaudeTokenCounter();