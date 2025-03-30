const inputBox = document.getElementById("input-box");
const listContainer = document.getElementById("list-container");
const addButton = document.getElementById("add-button");

// Add a new task
function addTask() {
  if(inputBox.value === "") {
    alert("Please enter a task!");
  } else {
    let li = document.createElement("li");
    li.innerHTML = inputBox.value;
    
    // Add delete button to each task
    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = "Delete";
    deleteBtn.className = "delete-btn";
    deleteBtn.onclick = function(e) {
      e.stopPropagation(); // Prevent the click from triggering the li click event
      li.remove();
      saveData();
    };
    
    li.appendChild(deleteBtn);
    
    // Add new tasks at the top of the list
    if (listContainer.firstChild) {
      listContainer.insertBefore(li, listContainer.firstChild);
    } else {
      listContainer.appendChild(li);
    }
    
    // Clear input field after adding task
    inputBox.value = "";
    saveData();
  }
}

// Toggle checked status when clicking on a task and reorder
listContainer.addEventListener("click", function(e) {
  if(e.target.tagName === "LI") {
    // Toggle checked class
    e.target.classList.toggle("checked");
    
    // If task is now checked, move to bottom of list
    if (e.target.classList.contains("checked")) {
      listContainer.appendChild(e.target);
    } 
    // If task is unchecked, move to top of list
    else {
      listContainer.insertBefore(e.target, listContainer.firstChild);
    }
    
    saveData();
  }
}, false);

// Save tasks to local storage
function saveData() {
  localStorage.setItem("todoData", listContainer.innerHTML);
}

// Load tasks from local storage
function loadData() {
  listContainer.innerHTML = localStorage.getItem("todoData") || "";
  
  // Reattach delete button functionality
  const deleteButtons = document.querySelectorAll(".delete-btn");
  deleteButtons.forEach(btn => {
    btn.onclick = function(e) {
      e.stopPropagation(); // Prevent the click from triggering the li click event
      this.parentElement.remove();
      saveData();
    };
  });
  
  // Reorder tasks: unchecked at top, checked at bottom
  reorderTasks();
}

// Function to reorder tasks when loading
function reorderTasks() {
  const tasks = Array.from(listContainer.querySelectorAll("li"));
  
  // First append all checked tasks
  tasks.filter(task => task.classList.contains("checked"))
       .forEach(task => listContainer.appendChild(task));
  
  // Then prepend all unchecked tasks (in reverse order to maintain original order)
  tasks.filter(task => !task.classList.contains("checked"))
       .reverse()
       .forEach(task => listContainer.insertBefore(task, listContainer.firstChild));
}

// Allow adding tasks with Enter key
inputBox.addEventListener("keypress", function(e) {
  if(e.key === "Enter") {
    addTask();
  }
});

// Add event listener to the Add button
addButton.addEventListener("click", addTask);

// Load saved tasks when page loads
document.addEventListener("DOMContentLoaded", loadData);