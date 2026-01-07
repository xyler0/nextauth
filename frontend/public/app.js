const API_URL = 'http://localhost:3000';
let token = null;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  // Check for OAuth callback
  const urlParams = new URLSearchParams(window.location.search);
  const callbackToken = urlParams.get('token');
  const provider = urlParams.get('provider');
  const linked = urlParams.get('linked');
  const success = urlParams.get('success');
  
  if (callbackToken) {
    // OAuth signup/login callback
    token = callbackToken;
    localStorage.setItem('jwt', token);
    showAlert(`Successfully signed in with ${provider}!`, 'success');
    window.history.replaceState({}, document.title, '/');
    loadDashboard();
  } else if (linked && success === 'true') {
    // OAuth link callback
    showAlert(`Successfully linked ${linked} account!`, 'success');
    window.history.replaceState({}, document.title, '/');
    token = localStorage.getItem('jwt');
    if (token) {
      loadDashboard();
    }
  } else {
    // Check existing token
    token = localStorage.getItem('jwt');
    if (token) {
      loadDashboard();
    }
  }
});

async function loadDashboard() {
  try {
    // Get user profile
    const profileRes = await fetch(`${API_URL}/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!profileRes.ok) {
      throw new Error('Failed to load profile');
    }
    
    const profile = await profileRes.json();
    
    // Show dashboard
    document.getElementById('login-section').classList.add('hidden');
    document.getElementById('dashboard-section').classList.remove('hidden');
    
    // Display user info
    document.getElementById('user-email').textContent = profile.email;
    document.getElementById('user-id').textContent = profile.id;
    
    // Get connection status
    const connectionsRes = await fetch(`${API_URL}/user/connections`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const connections = await connectionsRes.json();
    
    // Update GitHub status
    const githubStatus = document.getElementById('github-status');
    const githubUsername = document.getElementById('github-username');
    if (connections.github.linked) {
      githubStatus.textContent = 'Connected';
      githubStatus.className = 'status status-connected';
      githubUsername.textContent = `(@${connections.github.username})`;
      document.getElementById('link-github').textContent = 'Reconnect GitHub';
      
      // Load repositories
      loadRepositories();
    }
    
    // Update Twitter status
    const twitterStatus = document.getElementById('twitter-status');
    const twitterUsername = document.getElementById('twitter-username');
    if (connections.twitter.linked) {
      twitterStatus.textContent = 'Connected';
      twitterStatus.className = 'status status-connected';
      twitterUsername.textContent = `(@${connections.twitter.username})`;
      document.getElementById('link-twitter').textContent = 'Reconnect Twitter';
    }
    
  } catch (error) {
    console.error('Error loading dashboard:', error);
    showAlert('Failed to load dashboard. Please login again.', 'error');
    logout();
  }
}

async function loadRepositories() {
  document.getElementById('repos-section').classList.remove('hidden');
  document.getElementById('repos-loading').classList.remove('hidden');
  
  try {
    const res = await fetch(`${API_URL}/user/github/repositories`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await res.json();
    
    document.getElementById('repos-loading').classList.add('hidden');
    document.getElementById('repos-list').classList.remove('hidden');
    document.getElementById('save-repos-btn').style.display = 'block';
    
    const reposList = document.getElementById('repos-list');
    reposList.innerHTML = '';
    
    if (data.repositories.length === 0) {
      reposList.innerHTML = '<p>No repositories found</p>';
      return;
    }
    
    data.repositories.forEach(repo => {
      const div = document.createElement('div');
      div.className = 'repo-item';
      
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.value = repo;
      checkbox.id = `repo-${repo}`;
      checkbox.checked = data.monitored.includes(repo);
      
      const label = document.createElement('label');
      label.htmlFor = `repo-${repo}`;
      label.textContent = repo;
      label.style.cursor = 'pointer';
      
      div.appendChild(checkbox);
      div.appendChild(label);
      reposList.appendChild(div);
    });
    
  } catch (error) {
    console.error('Error loading repositories:', error);
    showAlert('Failed to load repositories', 'error');
  }
}

async function saveRepositories() {
  const checkboxes = document.querySelectorAll('#repos-list input[type="checkbox"]:checked');
  const selectedRepos = Array.from(checkboxes).map(cb => cb.value);
  
  try {
    const res = await fetch(`${API_URL}/user/github/repositories`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ repos: selectedRepos })
    });
    
    if (!res.ok) {
      throw new Error('Failed to save repositories');
    }
    
    showAlert(`Successfully monitoring ${selectedRepos.length} repositories!`, 'success');
    
  } catch (error) {
    console.error('Error saving repositories:', error);
    showAlert('Failed to save repositories', 'error');
  }
}

function showAlert(message, type) {
  const alert = document.getElementById('alert');
  alert.className = `alert alert-${type}`;
  alert.textContent = message;
  alert.classList.remove('hidden');
  
  setTimeout(() => {
    alert.classList.add('hidden');
  }, 5000);
}

function logout() {
  localStorage.removeItem('jwt');
  token = null;
  window.location.href = '/';
}