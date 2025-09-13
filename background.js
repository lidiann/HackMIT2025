// Background service worker for Eden - AI Sustainability Counter
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages/count_tokens';

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'countTokens') {
    countTokens(request.text)
      .then(result => {
        sendResponse({ success: true, data: result });
      })
      .catch(error => {
        console.error('Token counting error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep message channel open for async response
  }
});

// Handle extension icon click (fallback for when popup doesn't work)
chrome.action.onClicked.addListener(async (tab) => {
  console.log('Extension icon clicked on tab:', tab.url);
  if (tab.url && tab.url.includes('claude.ai')) {
    try {
      // Enable and open side panel
      await chrome.sidePanel.setOptions({
        tabId: tab.id,
        enabled: true,
        path: 'sidepanel.html'
      });
      
      await chrome.sidePanel.open({ tabId: tab.id });
      console.log('Side panel opened for tab:', tab.id);
    } catch (error) {
      console.error('Error opening side panel:', error);
      // Fallback: open popup
      chrome.action.openPopup();
    }
  } else {
    console.log('Not on Claude.ai, opening popup instead');
    chrome.action.openPopup();
  }
});

// Enable side panel on Claude.ai
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.includes('claude.ai')) {
    try {
      await chrome.sidePanel.setOptions({
        tabId: tabId,
        enabled: true,
        path: 'sidepanel.html'
      });
      console.log('Side panel enabled for Claude.ai on tab:', tabId);
    } catch (error) {
      console.error('Error enabling side panel:', error);
    }
  } else if (tab.url && !tab.url.includes('claude.ai')) {
    try {
      await chrome.sidePanel.setOptions({
        tabId: tabId,
        enabled: false
      });
      console.log('Side panel disabled for non-Claude tab:', tab.url);
    } catch (error) {
      console.error('Error disabling side panel:', error);
    }
  }
});

// Alternative method: Listen for side panel events
chrome.sidePanel.onPanelShown.addListener(({ tabId }) => {
  console.log('Side panel shown for tab:', tabId);
});

chrome.sidePanel.onPanelHidden.addListener(({ tabId }) => {
  console.log('Side panel hidden for tab:', tabId);
});

// Count tokens using Anthropic API
async function countTokens(text) {
  try {
    // For demo purposes, we'll use a simple estimation
    // In production, you'd call the actual Anthropic API
    const estimatedTokens = estimateTokens(text);
    
    // Calculate energy, carbon, and water usage
    const energy = calculateEnergy(estimatedTokens);
    const carbon = calculateCarbon(energy);
    const water = calculateWater(energy);
    
    return {
      tokens: estimatedTokens,
      energy: energy,
      carbon: carbon,
      water: water
    };
  } catch (error) {
    throw new Error(`Failed to count tokens: ${error.message}`);
  }
}

// Simple token estimation (rough approximation)
function estimateTokens(text) {
  // Very rough estimation: ~4 characters per token for English text
  // This is just for demo - real implementation would use proper tokenization
  const words = text.split(/\s+/).length;
  const chars = text.length;
  return Math.max(words, Math.ceil(chars / 4));
}

// Calculate energy usage (kWh per 1M tokens)
function calculateEnergy(tokens) {
  // Based on research: ~0.002 kWh per 1M tokens for GPT-3.5
  // Claude might be similar, this is an approximation
  return (tokens / 1000000) * 0.002;
}

// Calculate carbon emissions (kg CO2 per kWh)
function calculateCarbon(energy) {
  // Average US grid carbon intensity: ~0.4 kg CO2 per kWh
  return energy * 0.4;
}

// Calculate water usage (liters per kWh)
function calculateWater(energy) {
  // Average water usage for data centers: ~1.5 liters per kWh
  return energy * 1.5;
}