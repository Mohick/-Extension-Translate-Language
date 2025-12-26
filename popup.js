document.addEventListener('DOMContentLoaded', async () => {
  const result = await chrome.storage.sync.get(['mode']);
  const mode = result.mode || 'vietnamese';
  
  document.getElementById(`mode-${mode}`).checked = true;
  
  document.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.addEventListener('change', async (e) => {
      const selectedMode = e.target.value;
      
      await chrome.storage.sync.set({ mode: selectedMode });
      
      showStatus();
      
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { 
            action: 'modeChanged', 
            mode: selectedMode 
          });
        }
      });
    });
  });
});

function showStatus() {
  const status = document.getElementById('status');
  status.classList.add('show');
  
  setTimeout(() => {
    status.classList.remove('show');
  }, 2000);
}