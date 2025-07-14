import Browser from 'webextension-polyfill';

Browser.runtime.onInstalled.addListener(() => {
  // Initialize the extension
});

Browser.action.onClicked.addListener((tab) => {
  if (tab.id && tab.url && tab.url.startsWith("https://colab.research.google.com/")) {
    Browser.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content-script.js']
    });
  }
});
