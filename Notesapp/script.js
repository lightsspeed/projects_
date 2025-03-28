const notesContainer = document.querySelector(".notes-container");
const createBtn = document.querySelector(".btn");

// Load notes from local storage on page load
function loadNotes() {
    const savedNotes = JSON.parse(localStorage.getItem('notes') || '[]');
    savedNotes.forEach(noteText => {
        createNoteElement(noteText);
    });
}

function createNoteElement(text = '') {
    let inputBox = document.createElement("p");
    let img = document.createElement("img");
    
    inputBox.classList.add("input-box");
    inputBox.setAttribute("contenteditable", "true");
    inputBox.textContent = text;
    
    img.src = "images/delete.png";
    inputBox.appendChild(img);
    notesContainer.appendChild(inputBox);
    
    // Save notes after creating
    saveNotes();
}

function saveNotes() {
    const notes = Array.from(document.querySelectorAll(".input-box"))
        .map(note => note.textContent.trim())
        .filter(text => text !== '');
    
    localStorage.setItem('notes', JSON.stringify(notes));
}

createBtn.addEventListener("click", () => {
    createNoteElement();
});

notesContainer.addEventListener("click", function(e) {
    if (e.target.tagName === "IMG") {
        e.target.parentElement.remove();
        saveNotes(); // Update local storage after deletion
    }
});

// Load existing notes when page loads
document.addEventListener('DOMContentLoaded', loadNotes);

// Save notes when content changes
notesContainer.addEventListener('input', saveNotes);