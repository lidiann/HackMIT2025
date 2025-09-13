// Side panel JavaScript for Claude Token Counter
class SidePanelManager {
  constructor() {
    this.totalTokens = 0;
    this.totalEnergy = 0;
    this.totalCarbon = 0;
    this.totalWater = 0;
    
    this.init();
  }

  init() {
    this.loadStoredData();
    this.setupEventListeners();
    this.updateDisplay();
    this.startListeningForUpdates();
  }

  setupEventListeners() {
    // Global monitoring toggle
    const globalToggle = document.getElementById('global-monitoring-toggle');
    if (globalToggle) {
      globalToggle.addEventListener('change', () => this.toggleGlobalMonitoring());
    }

    // Reset stats button
    const resetBtn = document.getElementById('reset-stats');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetStats());
    }

    // Export data button
    const exportBtn = document.getElementById('export-data');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportData());
    }
  }

  startListeningForUpdates() {
    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'updateStats') {
        this.updateStats(request.data);
        sendResponse({ success: true });
      }
    });

    // Also listen for storage changes
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'local' && changes.stats) {
        this.loadStoredData();
        this.updateDisplay();
      }
    });
  }

  updateStats(data) {
    // Update current session metrics
    this.updateCurrentSession(data);

    // Update total metrics
    this.totalTokens += data.tokens || 0;
    this.totalEnergy += data.energy || 0;
    this.totalCarbon += data.carbon || 0;
    this.totalWater += data.water || 0;

    this.saveData();
    this.updateDisplay();
    this.updateStatus('Stats updated!', 'success');
  }

  updateCurrentSession(data) {
    const currentTokens = document.getElementById('current-tokens');
    const currentEnergy = document.getElementById('current-energy');

    if (currentTokens) {
      currentTokens.textContent = (data.tokens || 0).toLocaleString();
    }
    if (currentEnergy) {
      currentEnergy.textContent = `${(data.energy || 0).toFixed(6)} kWh`;
    }
  }

  loadStoredData() {
    chrome.storage.local.get(['stats'], (result) => {
      if (result.stats) {
        this.totalTokens = result.stats.tokens || 0;
        this.totalEnergy = result.stats.energy || 0;
        this.totalCarbon = result.stats.carbon || 0;
        this.totalWater = result.stats.water || 0;
      }
    });
  }

  saveData() {
    const stats = {
      tokens: this.totalTokens,
      energy: this.totalEnergy,
      carbon: this.totalCarbon,
      water: this.totalWater,
      lastUpdated: Date.now()
    };

    chrome.storage.local.set({ stats: stats });
  }

  updateDisplay() {
    this.updateElement('total-tokens', this.formatNumber(this.totalTokens));
    this.updateElement('total-energy', `${this.totalEnergy.toFixed(6)} kWh`);
    this.updateElement('total-carbon', `${this.totalCarbon.toFixed(6)} kg CO₂`);
    this.updateElement('total-water', `${this.totalWater.toFixed(3)} L`);
  }

  updateElement(id, value) {
    const element = document.getElementById(id);
    if (element) {
      element.textContent = value;
    }
  }

  formatNumber(num) {
    return num.toLocaleString();
  }

  resetStats() {
    if (confirm('Are you sure you want to reset all statistics?')) {
      this.totalTokens = 0;
      this.totalEnergy = 0;
      this.totalCarbon = 0;
      this.totalWater = 0;
      
      this.saveData();
      this.updateDisplay();
      this.updateStatus('Stats reset!', 'success');
    }
  }

  exportData() {
    const data = {
      tokens: this.totalTokens,
      energy: this.totalEnergy,
      carbon: this.totalCarbon,
      water: this.totalWater,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `claude-token-stats-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.updateStatus('Data exported!', 'success');
  }

  toggleGlobalMonitoring() {
    const globalToggle = document.getElementById('global-monitoring-toggle');
    const globalLabel = document.getElementById('global-toggle-label');
    
    if (globalToggle.checked) {
      globalLabel.textContent = 'Global Monitoring Enabled';
      this.updateStatus('Global monitoring enabled!', 'success');
      
      // Send message to content script to enable monitoring
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url.includes('claude.ai')) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'enableMonitoring' });
        }
      });
    } else {
      globalLabel.textContent = 'Enable Global Monitoring';
      this.updateStatus('Global monitoring disabled', 'warning');
      
      // Send message to content script to disable monitoring
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0] && tabs[0].url.includes('claude.ai')) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'disableMonitoring' });
        }
      });
    }
  }

  updateStatus(message, type = 'info') {
    const statusText = document.getElementById('status-text');
    const statusIndicator = document.getElementById('status-indicator');
    
    if (statusText) {
      statusText.textContent = message;
    }
    
    if (statusIndicator) {
      statusIndicator.className = `status-indicator ${type}`;
    }

    // Clear status after 3 seconds
    setTimeout(() => {
      if (statusText) {
        statusText.textContent = 'Ready to monitor';
      }
      if (statusIndicator) {
        statusIndicator.className = 'status-indicator';
      }
    }, 3000);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SidePanelManager();
});
