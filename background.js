// Khởi tạo cài đặt mặc định khi cài extension
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ mode: 'vietnamese' });
  console.log('Text Reader Extension installed successfully!');
});
