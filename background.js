const CLAUDE_URL = 'https://claude.ai';

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
    if(!tab.url) return;
    const url = new URL(tab.url);
    if (url.origin === CLAUDE_URL) {
        await chrome.sidePanel.setOptions({
            tabId,
            path: 'sidepanel.html',
            enabled: true
        });
    } else {
        await chrome.sidePanel.setOptions({
            tabId,
            enabled: false
        });
    }
});