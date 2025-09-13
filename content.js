// Listen for messages from side panel
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getPrompt') {
      // Get the current prompt from claude.ai page
      const promptElement = document.querySelector('[data-testid="chat-input"]');
      const prompt = promptElement?.value || 'No prompt text found';
      sendResponse({ prompt });
    }
    return true; // Keep message channel open for async response
  });