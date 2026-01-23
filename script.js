// ===============================
// Common Phrase Corrections (High Quality)
// ===============================
const commonPhrases = {
  'en-hi': {
    'how are you': 'आप कैसे हैं',
    'how are you?': 'आप कैसे हैं?',
    'hello': 'नमस्ते',
    'hi': 'नमस्ते',
    'good morning': 'सुप्रभात',
    'good evening': 'शुभ संध्या',
    'good night': 'शुभ रात्रि',
    'thank you': 'धन्यवाद',
    'thanks': 'धन्यवाद',
    'please': 'कृपया',
    'sorry': 'माफ़ करना',
    'yes': 'हाँ',
    'no': 'नहीं',
    'i am fine': 'मैं ठीक हूं',
    'i am fine what about you': 'मैं ठीक हूं, आप कैसे हैं',
    'what is your name': 'आपका नाम क्या है',
    'my name is': 'मेरा नाम है',
    'nice to meet you': 'आपसे मिलकर खुशी हुई',
    'bye': 'अलविदा',
    'goodbye': 'अलविदा',
    'see you later': 'फिर मिलेंगे',
    'welcome': 'स्वागत है'
  },
  'hi-en': {
    'आप कैसे हैं': 'How are you',
    'नमस्ते': 'Hello',
    'धन्यवाद': 'Thank you',
    'सुप्रभात': 'Good morning',
    'शुभ संध्या': 'Good evening',
    'कृपया': 'Please',
    'माफ़ करना': 'Sorry',
    'हाँ': 'Yes',
    'नहीं': 'No',
    'मैं ठीक हूं': 'I am fine',
    'अलविदा': 'Goodbye'
  }
};

// ===============================
// Check Common Phrases First
// ===============================
function checkCommonPhrase(text, sourceLang, targetLang) {
  const key = `${sourceLang}-${targetLang}`;
  const normalized = text.toLowerCase().trim();
  
  if (commonPhrases[key] && commonPhrases[key][normalized]) {
    return commonPhrases[key][normalized];
  }
  
  return null;
}
const inputText = document.getElementById("inputText");
const outputText = document.getElementById("outputText");
const sourceLang = document.getElementById("sourceLang");
const targetLang = document.getElementById("targetLang");
const translateBtn = document.getElementById("translateBtn");
const copyBtn = document.getElementById("copyBtn");
const swapBtn = document.getElementById("swapBtn");
const speechBtn = document.getElementById("speechBtn");
const speakOutputBtn = document.getElementById("speakOutput");
const themeToggle = document.getElementById("themeToggle");
const statusText = document.getElementById("status");

// ===============================
// Dark Mode Toggle
// ===============================
themeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  themeToggle.textContent = document.body.classList.contains("dark")
    ? "Light Mode"
    : "Dark Mode";
});

// ===============================
// Swap Languages
// ===============================
swapBtn.addEventListener("click", () => {
  const temp = sourceLang.value;
  sourceLang.value = targetLang.value;
  targetLang.value = temp;

  // Swap text content too
  if (outputText.value) {
    inputText.value = outputText.value;
    outputText.value = "";
  }
});

// ===============================
// Translate Function with Multiple APIs
// ===============================
async function performTranslation() {
  const text = inputText.value.trim();

  if (!text) {
    statusText.textContent = "Please enter text to translate.";
    return;
  }

  // Check if source and target are the same
  if (sourceLang.value === targetLang.value) {
    outputText.value = text;
    statusText.textContent = "Source and target languages are the same.";
    return;
  }

  statusText.textContent = "Translating...";
  outputText.value = "";

  // First, check common phrases for high-quality translations
  const commonTranslation = checkCommonPhrase(text, sourceLang.value, targetLang.value);
  if (commonTranslation) {
    outputText.value = commonTranslation;
    statusText.textContent = "Translation completed.";
    return;
  }

  // Try multiple APIs in order of reliability
  const apis = [
    // API 1: Google Translate via alternative endpoint
    async () => {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang.value}&tl=${targetLang.value}&dt=t&q=${encodeURIComponent(text)}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        const translated = data[0].map(item => item[0]).join('');
        if (translated && translated.toLowerCase() !== text.toLowerCase()) {
          return translated;
        }
      }
      throw new Error('Invalid translation');
    },
    
    // API 2: MyMemory
    async () => {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
        text
      )}&langpair=${sourceLang.value}|${targetLang.value}`;
      
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.responseData && data.responseData.translatedText) {
        const translated = data.responseData.translatedText;
        
        // Validate translation quality
        if (translated && 
            translated.toLowerCase() !== text.toLowerCase() &&
            !translated.includes('MYMEMORY WARNING')) {
          return translated;
        }
      }
      throw new Error('Invalid translation');
    },
    
    // API 3: LibreTranslate (fallback)
    async () => {
      const response = await fetch('https://libretranslate.de/translate', {
        method: 'POST',
        body: JSON.stringify({
          q: text,
          source: sourceLang.value,
          target: targetLang.value,
          format: 'text'
        }),
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.translatedText && data.translatedText !== text) {
        return data.translatedText;
      }
      throw new Error('Invalid translation');
    }
  ];

  // Try each API in order
  for (let i = 0; i < apis.length; i++) {
    try {
      const translation = await apis[i]();
      outputText.value = translation;
      statusText.textContent = "Translation completed.";
      return;
    } catch (error) {
      console.log(`API ${i + 1} failed:`, error.message);
      if (i === apis.length - 1) {
        // All APIs failed
        statusText.textContent = "Translation failed. Please check your internet connection and try again.";
        outputText.value = "";
      }
    }
  }
}

// ===============================
// Translate Button
// ===============================
translateBtn.addEventListener("click", performTranslation);

// ===============================
// Auto-translate on typing (optional)
// ===============================
let typingTimer;
inputText.addEventListener("input", () => {
  clearTimeout(typingTimer);
  if (inputText.value.trim().length > 2) {
    typingTimer = setTimeout(performTranslation, 1000);
  }
});

// ===============================
// Copy to Clipboard
// ===============================
copyBtn.addEventListener("click", () => {
  if (!outputText.value) {
    statusText.textContent = "Nothing to copy.";
    return;
  }
  
  navigator.clipboard.writeText(outputText.value).then(() => {
    statusText.textContent = "Copied to clipboard!";
    copyBtn.textContent = "✓ Copied!";
    setTimeout(() => {
      copyBtn.textContent = "Copy";
    }, 2000);
  }).catch(() => {
    statusText.textContent = "Failed to copy.";
  });
});

// ===============================
// Speech to Text
// ===============================
speechBtn.addEventListener("click", () => {
  if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
    statusText.textContent = "Speech recognition not supported in this browser.";
    return;
  }

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  recognition.lang = sourceLang.value;
  recognition.continuous = false;
  recognition.interimResults = false;

  statusText.textContent = "Listening... Speak now!";
  speechBtn.textContent = "🎤 Listening...";
  speechBtn.disabled = true;

  recognition.onresult = (event) => {
    inputText.value = event.results[0][0].transcript;
    statusText.textContent = "Speech captured. Translating...";
    
    // Auto-translate after speech
    setTimeout(() => {
      performTranslation();
    }, 500);
  };

  recognition.onerror = (event) => {
    statusText.textContent = `Error: ${event.error}`;
    speechBtn.textContent = "🎤 Speak Input";
    speechBtn.disabled = false;
  };

  recognition.onend = () => {
    speechBtn.textContent = "🎤 Speak Input";
    speechBtn.disabled = false;
  };

  recognition.start();
});

// ===============================
// Text to Speech
// ===============================
speakOutputBtn.addEventListener("click", () => {
  if (!outputText.value) {
    statusText.textContent = "Nothing to speak.";
    return;
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const speech = new SpeechSynthesisUtterance(outputText.value);
  speech.lang = targetLang.value;
  speech.rate = 0.9;
  speech.pitch = 1;
  speech.volume = 1;

  statusText.textContent = "Speaking...";
  speakOutputBtn.textContent = "🔊 Speaking...";
  speakOutputBtn.disabled = true;

  speech.onend = () => {
    statusText.textContent = "Speech completed.";
    speakOutputBtn.textContent = "🔊 Listen";
    speakOutputBtn.disabled = false;
  };

  speech.onerror = () => {
    statusText.textContent = "Speech failed.";
    speakOutputBtn.textContent = "🔊 Listen";
    speakOutputBtn.disabled = false;
  };

  window.speechSynthesis.speak(speech);
});