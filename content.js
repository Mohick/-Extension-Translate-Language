// Lưu trữ SpeechSynthesisUtterance hiện tại
let currentUtterance = null;
let isReading = false;

// Lấy cài đặt từ storage
async function getSettings() {
  const result = await chrome.storage.sync.get(['mode']);
  return result.mode || 'vietnamese';
}

// Kiểm tra xem văn bản có phải tiếng Việt không
function isVietnamese(text) {
  const vietnameseChars = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
  return vietnameseChars.test(text);
}

// Dịch văn bản từ tiếng Anh sang tiếng Việt
async function translateToVietnamese(text) {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data[0]) {
      return data[0].map(item => item[0]).join('');
    }
    return text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

// Dịch văn bản từ tiếng Việt sang tiếng Anh
async function translateToEnglish(text) {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=vi&tl=en&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data[0]) {
      return data[0].map(item => item[0]).join('');
    }
    return text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

// Đọc văn bản
async function readText(text) {
  // Dừng đọc hiện tại nếu có
  if (isReading) {
    speechSynthesis.cancel();
    isReading = false;
    hideReadingIndicator();
    return;
  }

  const mode = await getSettings();
  let textToRead = text;
  let language = 'vi-VN';

  showReadingIndicator();

  // Xác định xử lý dựa trên mode và ngôn ngữ của văn bản
  if (isVietnamese(text)) {
    if (mode === 'english') {
      showTranslatingIndicator('Đang dịch sang tiếng Anh...');
      textToRead = await translateToEnglish(text);
      language = 'en-US';
    } else {
      language = 'vi-VN';
    }
  } else {
    if (mode === 'vietnamese') {
      showTranslatingIndicator('Đang dịch sang tiếng Việt...');
      textToRead = await translateToVietnamese(text);
      language = 'vi-VN';
    } else {
      language = 'en-US';
    }
  }

  hideTranslatingIndicator();

  // Tạo utterance mới
  currentUtterance = new SpeechSynthesisUtterance(textToRead);
  currentUtterance.lang = language;
  currentUtterance.rate = 1.0;
  currentUtterance.pitch = 1.0;
  currentUtterance.volume = 1.0;

  currentUtterance.onend = () => {
    isReading = false;
    hideReadingIndicator();
  };

  currentUtterance.onerror = (event) => {
    console.error('Speech synthesis error:', event);
    isReading = false;
    hideReadingIndicator();
  };

  isReading = true;
  speechSynthesis.speak(currentUtterance);
}

function showReadingIndicator() {
  let indicator = document.getElementById('text-reader-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.id = 'text-reader-indicator';
    indicator.innerHTML = '🔊 Đang đọc... (Shift+R để dừng)';
    document.body.appendChild(indicator);
  }
  indicator.style.display = 'block';
}

function hideReadingIndicator() {
  const indicator = document.getElementById('text-reader-indicator');
  if (indicator) {
    indicator.style.display = 'none';
  }
}

function showTranslatingIndicator(message) {
  let indicator = document.getElementById('text-reader-indicator');
  if (indicator) {
    indicator.innerHTML = `⏳ ${message}`;
  }
}

function hideTranslatingIndicator() {
  // Sẽ chuyển sang indicator đọc
}

document.addEventListener('keydown', (event) => {
  if (event.shiftKey && event.key === 'R') {
    event.preventDefault();
    
    const selectedText = window.getSelection().toString().trim();
    
    if (selectedText) {
      readText(selectedText);
    } else {
      if (isReading) {
        speechSynthesis.cancel();
        isReading = false;
        hideReadingIndicator();
      }
    }
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'modeChanged') {
    getSettings();
  }
});