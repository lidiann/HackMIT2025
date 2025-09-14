// Content script for Eden AI Sustainability Counter
console.log('Eden AI Sustainability Counter content script loaded');

// Auto-open sidebar when on Claude.ai
chrome.runtime.sendMessage({ action: 'openSidebar' });

// Monitor for input changes on Claude.ai
const inputSelectors = [
  'textarea[placeholder*="Reply to Claude"]',
  'textarea[placeholder*="Talk to Claude"]',
  'textarea[data-testid="chat-input"]',
  'div[contenteditable="true"][role="textbox"]',
  'textarea.ProseMirror',
  'div.ProseMirror[contenteditable="true"]',
  'textarea[aria-label*="message"]',
  'div[contenteditable="true"]',
  'textarea',
  'input[type="text"]'
];

let lastInputValue = '';
let isMonitoring = false;

// Check if monitoring is enabled
chrome.storage.local.get(['edenMonitoringEnabled'], (result) => {
  isMonitoring = result.edenMonitoringEnabled !== false; // Default to true
  if (isMonitoring) {
    startMonitoring();
  }
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local' && changes.edenMonitoringEnabled) {
    isMonitoring = changes.edenMonitoringEnabled.newValue;
    if (isMonitoring) {
      startMonitoring();
    } else {
      stopMonitoring();
    }
  }
});

function startMonitoring() {
  console.log('Starting input monitoring...');
  
  // Monitor existing inputs
  inputSelectors.forEach(selector => {
    const inputs = document.querySelectorAll(selector);
    inputs.forEach(input => {
      addInputListener(input);
    });
  });

  // Monitor for new inputs (dynamic content)
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          inputSelectors.forEach(selector => {
            const inputs = node.querySelectorAll ? node.querySelectorAll(selector) : [];
            inputs.forEach(input => addInputListener(input));
          });
        }
      });
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function stopMonitoring() {
  console.log('Stopping input monitoring...');
  // Remove all event listeners
  inputSelectors.forEach(selector => {
    const inputs = document.querySelectorAll(selector);
    inputs.forEach(input => {
      input.removeEventListener('input', handleInput);
      input.removeEventListener('blur', handleBlur);
    });
  });
}

function addInputListener(input) {
  if (input.dataset.edenListenerAdded) return;
  
  input.addEventListener('input', handleInput);
  input.addEventListener('blur', handleBlur);
  input.dataset.edenListenerAdded = 'true';
}

function handleInput(event) {
  if (!isMonitoring) return;
  
  const text = event.target.value || event.target.textContent || '';
  if (text.length > 10 && text !== lastInputValue) { // Only process meaningful text
    lastInputValue = text;
    console.log('Input detected:', text.substring(0, 50) + '...');
  }
}

function handleBlur(event) {
  if (!isMonitoring) return;
  
  const text = event.target.value || event.target.textContent || '';
  if (text.length > 10) {
    console.log('Processing input on blur:', text.substring(0, 50) + '...');
    
    // Send message to background script
    chrome.runtime.sendMessage({
      action: 'countTokens',
      text: text,
      model: 'claude-3-5-haiku-20241022',
      expectedOutputTokens: 200
    }, (response) => {
      if (response && response.success) {
        console.log('Token count result:', response.data);
        // Store the result in local storage
        chrome.storage.local.get(['edenUsageHistory'], (result) => {
          const history = result.edenUsageHistory || [];
          const newEntry = {
            ...response.data,
            timestamp: new Date().toISOString(),
            text: text.substring(0, 100) + (text.length > 100 ? '...' : '')
          };
          history.unshift(newEntry);
          // Keep only last 100 entries
          if (history.length > 100) {
            history.splice(100);
          }
          chrome.storage.local.set({ edenUsageHistory: history });
        });
      } else {
        console.error('Error counting tokens:', response?.error);
      }
    });
  }
}
