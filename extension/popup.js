const API_URL = 'http://localhost:3000/api';

// UI Elements
const loginView = document.getElementById('loginView');
const mainView = document.getElementById('mainView');
const logoutBtn = document.getElementById('logoutBtn');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const roleSelect = document.getElementById('roleSelect');
const reviewBtn = document.getElementById('reviewBtn');
const loadingState = document.getElementById('loadingState');
const resultsView = document.getElementById('resultsView');

// State
let authToken = null;

// Initialization
document.addEventListener('DOMContentLoaded', async () => {
  // Check if we have a token
  const result = await chrome.storage.local.get(['authToken']);
  if (result.authToken) {
    authToken = result.authToken;
    showMainView();
  } else {
    showLoginView();
  }
});

// Auth Handlers
loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (response.ok) {
      const data = await response.json();
      authToken = data.token;
      await chrome.storage.local.set({ authToken });
      showMainView();
    } else {
      showError('Invalid credentials');
    }
  } catch (error) {
    showError('Server not reachable');
  }
});

logoutBtn.addEventListener('click', () => {
  authToken = null;
  chrome.storage.local.remove('authToken');
  showLoginView();
});

// View Handlers
function showLoginView() {
  loginView.classList.remove('hidden');
  mainView.classList.add('hidden');
  logoutBtn.classList.add('hidden');
}

async function showMainView() {
  loginView.classList.add('hidden');
  mainView.classList.remove('hidden');
  logoutBtn.classList.remove('hidden');
  resultsView.classList.add('hidden');
  await loadRoles();
}

function showError(msg) {
  loginError.textContent = msg;
  loginError.classList.remove('hidden');
}

// Data Loaders
async function loadRoles() {
  try {
    const response = await fetch(`${API_URL}/roles`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (response.ok) {
      const roles = await response.json();
      roleSelect.innerHTML = '<option value="" disabled selected>Select a role to match against</option>';
      roles.forEach(role => {
        const opt = document.createElement('option');
        opt.value = role.id;
        opt.textContent = role.title;
        roleSelect.appendChild(opt);
      });
      roleSelect.addEventListener('change', () => {
        reviewBtn.disabled = !roleSelect.value;
      });
    } else if (response.status === 401 || response.status === 403) {
      // Token expired
      logoutBtn.click();
    }
  } catch (error) {
    console.error('Failed to load roles', error);
  }
}

// Review Process
reviewBtn.addEventListener('click', async () => {
  const roleId = roleSelect.value;
  if (!roleId) return;

  // 1. Show loading
  resultsView.classList.add('hidden');
  loadingState.classList.remove('hidden');
  reviewBtn.disabled = true;

  // 2. Get active tab text
  let cvText = "";
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Inject and execute content script directly if not already injected
    const result = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => document.body.innerText,
    });
    
    cvText = result[0].result;
  } catch (err) {
    console.error("Could not read tab", err);
    cvText = "Could not read page content.";
  }

  // 3. Send to backend
  try {
    const response = await fetch(`${API_URL}/evaluate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ cvText, roleId })
    });

    if (response.ok) {
      const result = await response.json();
      displayResults(result);
    } else {
      console.error('Failed to evaluate');
      alert('Error evaluating profile');
    }
  } catch (error) {
    console.error('Evaluation request failed', error);
  } finally {
    loadingState.classList.add('hidden');
    reviewBtn.disabled = false;
  }
});

function displayResults(data) {
  // Update Score Ring
  const scoreRing = document.querySelector('.score-ring');
  const scoreValue = document.getElementById('scoreValue');
  
  scoreValue.textContent = data.score;
  scoreRing.style.background = `conic-gradient(var(--success) ${data.score}%, var(--border) 0%)`;

  // Change color based on score
  if (data.score < 50) {
    scoreRing.style.background = `conic-gradient(var(--error) ${data.score}%, var(--border) 0%)`;
  } else if (data.score < 80) {
    scoreRing.style.background = `conic-gradient(#F59E0B ${data.score}%, var(--border) 0%)`;
  }

  // Update Analysis
  document.getElementById('summaryText').textContent = data.summary;
  
  const strengthsList = document.getElementById('strengthsList');
  strengthsList.innerHTML = '';
  data.strengths.forEach(s => {
    const li = document.createElement('li');
    li.textContent = s;
    strengthsList.appendChild(li);
  });

  const weaknessesList = document.getElementById('weaknessesList');
  weaknessesList.innerHTML = '';
  data.weaknesses.forEach(w => {
    const li = document.createElement('li');
    li.textContent = w;
    weaknessesList.appendChild(li);
  });

  resultsView.classList.remove('hidden');
}
