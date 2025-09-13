// Popup script for Eden - AI Sustainability Counter
class PopupManager {
  constructor() {
    this.currentTokens = 0;
    this.totalTokens = 0;
    this.totalEnergy = 0;
    this.totalCarbon = 0;
    this.isMonitoring = false;
    
    this.init();
  }

  async init() {
    await this.loadStoredData();
    this.setupEventListeners();
    await this.checkTabStatus();
    this.updateDisplay();
  }

  async checkTabStatus() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const status = document.getElementById('status');
    const toggleContainer = document.querySelector('.toggle-container');
    const openSidePanelBtn = document.getElementById('openSidePanel');
    
    const isOnClaude = tab.url && tab.url.includes('claude.ai');
    
    if (isOnClaude) {
      status.textContent = 'On Claude.ai - Ready to monitor';
      status.style.background = '#d4edda';
      status.style.color = '#155724';
      toggleContainer.style.display = 'flex';
      openSidePanelBtn.disabled = false;
    } else {
      status.textContent = 'Please visit Claude.ai first';
      status.style.background = '#f8d7da';
      status.style.color = '#721c24';
      toggleContainer.style.display = 'none';
      openSidePanelBtn.disabled = true;
    }
  }

  setupEventListeners() {
    const monitoringToggle = document.getElementById('monitoring-toggle');
    const toggleLabel = document.getElementById('toggle-label');
    const openSidePanelBtn = document.getElementById('openSidePanel');
    const resetStatsBtn = document.getElementById('resetStats');

    // Monitoring toggle
    monitoringToggle.addEventListener('change', async () => {
      this.isMonitoring = monitoringToggle.checked;
      
      if (this.isMonitoring) {
        toggleLabel.textContent = 'Monitoring Active';
        await this.enableMonitoring();
      } else {
        toggleLabel.textContent = 'Start Monitoring';
        await this.disableMonitoring();
      }
    });

    // Open side panel
    openSidePanelBtn.addEventListener('click', async () => {
      await this.openSidePanel();
    });

    // Reset stats
    resetStatsBtn.addEventListener('click', () => {
      this.resetStats();
    });

    // API configuration removed - using environment variable

    // Listen for updates from content script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'updateStats') {
        this.updateCurrentSession(request.data);
        sendResponse({ success: true });
      }
    });
  }

  async enableMonitoring() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.tabs.sendMessage(tab.id, { action: 'enableMonitoring' });
      this.updateStatus('Monitoring enabled!', 'success');
    } catch (error) {
      console.error('Error enabling monitoring:', error);
      this.updateStatus('Error enabling monitoring', 'error');
    }
  }

  async disableMonitoring() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.tabs.sendMessage(tab.id, { action: 'disableMonitoring' });
      this.updateStatus('Monitoring disabled', 'info');
    } catch (error) {
      console.error('Error disabling monitoring:', error);
    }
  }

  async openSidePanel() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      // Try to open side panel first
      try {
        await chrome.sidePanel.setOptions({
          tabId: tab.id,
          enabled: true,
          path: 'sidepanel.html'
        });
        
        await chrome.sidePanel.open({ tabId: tab.id });
        this.updateStatus('Side panel opened!', 'success');
      } catch (sidePanelError) {
        console.log('Side panel not available, opening in new tab:', sidePanelError);
        // Fallback: open in new tab
        await chrome.tabs.create({
          url: chrome.runtime.getURL('sidepanel.html'),
          active: true
        });
        this.updateStatus('Opened in new tab!', 'success');
      }
    } catch (error) {
      console.error('Error opening side panel:', error);
      this.updateStatus(`Error: ${error.message}`, 'error');
    }
  }

  updateCurrentSession(data) {
    this.currentTokens = data.tokens || 0;
    this.updateDisplay();
  }

  updateDisplay() {
    document.getElementById('current-tokens').textContent = this.currentTokens.toLocaleString();
    document.getElementById('current-energy').textContent = `${(this.currentTokens * 0.000002).toFixed(6)} kWh`;
    document.getElementById('total-tokens').textContent = this.totalTokens.toLocaleString();
    document.getElementById('total-carbon').textContent = `${this.totalCarbon.toFixed(6)} kg CO₂`;
  }

  async loadStoredData() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['stats'], (result) => {
        if (result.stats) {
          this.totalTokens = result.stats.tokens || 0;
          this.totalEnergy = result.stats.energy || 0;
          this.totalCarbon = result.stats.carbon || 0;
        }
        resolve();
      });
    });
  }

  resetStats() {
    if (confirm('Are you sure you want to reset all statistics?')) {
      this.totalTokens = 0;
      this.totalEnergy = 0;
      this.totalCarbon = 0;
      
      chrome.storage.local.set({ 
        stats: { 
          tokens: 0, 
          energy: 0, 
          carbon: 0, 
          water: 0,
          lastUpdated: Date.now()
        } 
      });
      
      this.updateDisplay();
      this.updateStatus('Stats reset!', 'success');
    }
  }

  // API configuration removed - using environment variable

  updateStatus(message, type = 'info') {
    const status = document.getElementById('status');
    status.textContent = message;
    
    switch (type) {
      case 'success':
        status.style.background = '#d4edda';
        status.style.color = '#155724';
        break;
      case 'error':
        status.style.background = '#f8d7da';
        status.style.color = '#721c24';
        break;
      default:
        status.style.background = '#f8f9fa';
        status.style.color = '#6c757d';
    }
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupManager();
});
