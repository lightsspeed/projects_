function replaceWord() {
    const sentence = document.getElementById('sentence').value;
    const wordToReplace = document.getElementById('wordToReplace').value;
    const replacementWord = document.getElementById('replacementWord').value;
    
    if (!sentence) {
        alert("Please enter a sentence");
        return;
    }
    
    if (!wordToReplace) {
        alert("Please enter a word to replace");
        return;
    }
    
    // Create a regular expression with word boundaries to match whole words
    const regex = new RegExp('\\b' + wordToReplace + '\\b', 'gi');
    const modifiedSentence = sentence.replace(regex, replacementWord);
    
    document.getElementById('result').innerHTML = `
        <p><strong>Original:</strong> ${sentence}</p>
        <p><strong>Modified:</strong> ${modifiedSentence}</p>
        <div class="button-group">
            <button class="copy-button tooltip" onclick="copyToClipboard('${modifiedSentence}')">
                <svg class="copy-icon" viewBox="0 0 24 24">
                    <path d="M16 1H4C2.9 1 2 1.9 2 3V17H4V3H16V1ZM19 5H8C6.9 5 6 5.9 6 7V21C6 22.1 6.9 23 8 23H19C20.1 23 21 22.1 21 21V7C21 5.9 20.1 5 19 5ZM19 21H8V7H19V21Z" />
                </svg>
                Copy
                <span class="tooltiptext" id="copyTooltip">Copy to clipboard</span>
            </button>
        </div>
    `;
}

function useExample(element) {
    document.getElementById('sentence').value = element.textContent;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text)
        .then(() => {
            const tooltip = document.getElementById("copyTooltip");
            tooltip.textContent = "Copied!";
            setTimeout(() => {
                tooltip.textContent = "Copy to clipboard";
            }, 2000);
        })
        .catch(err => {
            console.error('Failed to copy: ', err);
            alert("Failed to copy text");
        });
}

// Modern Dark mode toggle functionality
const toggleSwitch = document.querySelector('#checkbox');

// Check for saved theme preference on page load
document.addEventListener('DOMContentLoaded', () => {
    const darkMode = localStorage.getItem('darkMode');
    if (darkMode === 'true') {
        document.body.classList.add('dark-mode');
        toggleSwitch.checked = true;
    }
});

// Listen for toggle changes
toggleSwitch.addEventListener('change', () => {
    if (toggleSwitch.checked) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'true');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'false');
    }
});

// Add subtle animation to the toggle
toggleSwitch.addEventListener('click', () => {
    document.querySelector('.slider').style.transition = '0.4s';
    setTimeout(() => {
        document.querySelector('.slider').style.transition = '0.4s';
    }, 400);
});