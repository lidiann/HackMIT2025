document.addEventListener('DOMContentLoaded', () => {
    const getPromptButton = document.getElementById('getPrompt');
    const outputDiv = document.getElementById('output');
    
    if (getPromptButton) {
      getPromptButton.addEventListener('click', async () => {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        if (tab.url && tab.url.includes('claude.ai')) {
          chrome.tabs.sendMessage(tab.id, { action: 'getPrompt' }, (response) => {
            if (outputDiv) {
              outputDiv.textContent = response?.prompt || 'No prompt found';
            }
          });
        } else {
          if (outputDiv) {
            outputDiv.textContent = 'Please navigate to Claude.ai first';
          }
        }
      });
    } else {
      console.error('getPrompt button not found in DOM');
    }
  });