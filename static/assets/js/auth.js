// Authentication module for static homepage
// Handles login state and credit display

// Global state
let currentUser = null;
let userCredits = 0;
let userPlanType = 'free';

// Update credits display in header
function updateCreditsDisplay() {
  const creditsDisplay = document.getElementById('credits-count');
  if (creditsDisplay) {
    if (userPlanType === 'mogul') {
      creditsDisplay.textContent = '∞';
    } else {
      creditsDisplay.textContent = userCredits.toLocaleString();
    }
  }
}

// Check authentication status and update UI
async function checkAuth() {
  try {
    const response = await fetch('/api/auth/user', { credentials: 'include' });
    if (response.ok) {
      const user = await response.json();
      currentUser = user;
      
      // Fetch user credits
      const creditsResponse = await fetch('/api/user/credits', { credentials: 'include' });
      if (creditsResponse.ok) {
        const creditsData = await creditsResponse.json();
        userCredits = creditsData.credits || 0;
        userPlanType = creditsData.planType || 'free';
      }
      
      // Update UI - hide login button, show user profile
      const loginBtn = document.getElementById('login-btn');
      const userProfile = document.getElementById('user-profile');
      if (loginBtn) loginBtn.style.display = 'none';
      if (userProfile) userProfile.style.display = 'flex';
      
      // Update credits display
      updateCreditsDisplay();
      
      // Update user name (truncate to 20 chars)
      const userName = document.getElementById('user-name');
      if (userName) {
        const fullName = user.firstName || user.email || 'User';
        const displayName = fullName.length > 20 ? fullName.substring(0, 20) + '...' : fullName;
        userName.textContent = displayName;
      }
      
      // Update avatar
      const userAvatar = document.getElementById('user-avatar');
      if (userAvatar) {
        userAvatar.src = '/assets/icon-set/profile-icon.png';
        userAvatar.alt = user.firstName || user.email || 'User';
      }
      
      // Show credits indicator and quest icon
      const creditsIndicator = document.querySelector('.credits-indicator');
      const questIcon = document.getElementById('quest-gift-icon');
      if (creditsIndicator) creditsIndicator.style.display = 'flex';
      if (questIcon) questIcon.style.display = 'flex';
    } else {
      // User not logged in - show login button, hide profile
      const loginBtn = document.getElementById('login-btn');
      const userProfile = document.getElementById('user-profile');
      if (loginBtn) loginBtn.style.display = 'inline-block';
      if (userProfile) userProfile.style.display = 'none';
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    // Show login button on error
    const loginBtn = document.getElementById('login-btn');
    const userProfile = document.getElementById('user-profile');
    if (loginBtn) loginBtn.style.display = 'inline-block';
    if (userProfile) userProfile.style.display = 'none';
  }
}

// Show profile modal
function showProfileModal() {
  if (!currentUser) return;
  
  // Remove existing modal if any
  const existingModal = document.getElementById('profile-modal');
  if (existingModal) existingModal.remove();
  
  // Create modal
  const modal = document.createElement('div');
  modal.id = 'profile-modal';
  modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; z-index: 10000; animation: fadeIn 0.3s ease-out;';
  
  modal.innerHTML = `
    <div style="background: var(--card-bg); border-radius: 16px; max-width: 500px; width: 90%; max-height: 80vh; display: flex; flex-direction: column; box-shadow: 0 8px 32px rgba(0,0,0,0.4); overflow: hidden;">
      <div style="padding: 2rem; border-bottom: 1px solid var(--border-color); flex-shrink: 0;">
        <h2 style="margin: 0 0 0.5rem 0; color: var(--text-primary); font-size: 1.5rem;">Profile</h2>
        <p style="margin: 0; color: var(--text-muted); font-size: 0.9rem;">${currentUser.email || ''}</p>
      </div>
      
      <div style="padding: 2rem; overflow-y: auto; flex: 1;">
        <div style="margin-bottom: 2rem;">
          <h3 style="font-size: 1.1rem; font-weight: 600; color: var(--text-primary); margin: 0 0 1rem 0;">Credits Balance</h3>
          <div style="background: linear-gradient(135deg, rgba(255, 46, 166, 0.1), rgba(139, 92, 246, 0.1)); border: 2px solid var(--aetherwave-pink); border-radius: 12px; padding: 1.25rem; text-align: center;">
            <div style="font-size: 2.5rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">
              ${userPlanType === 'mogul' ? '∞' : userCredits.toLocaleString()}
            </div>
            <div style="color: var(--text-muted); font-size: 0.9rem;">
              ${userPlanType === 'mogul' ? 'Unlimited Credits' : 'Available Credits'}
            </div>
          </div>
        </div>
        
        <div style="margin-bottom: 2rem;">
          <h3 style="font-size: 1.1rem; font-weight: 600; color: var(--text-primary); margin: 0 0 1rem 0;">Subscription Plan</h3>
          <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: 12px; padding: 1.25rem;">
            <div style="color: var(--text-primary); font-weight: 600; font-size: 1.1rem; text-transform: capitalize; margin-bottom: 0.5rem;">
              ${userPlanType || 'Free'}
            </div>
            <div style="color: var(--text-muted); font-size: 0.85rem;">
              ${userPlanType === 'free' ? '50 credits/month' : userPlanType === 'studio' ? '500 credits/month' : userPlanType === 'studio_plus' ? '1,250 credits/month' : userPlanType === 'pro' ? '2,500 credits/month' : 'Unlimited credits'}
            </div>
          </div>
        </div>
      </div>
      
      <div style="padding: 1.5rem 2rem; border-top: 1px solid var(--border-color); display: flex; gap: 1rem; flex-wrap: wrap; flex-shrink: 0;">
        <a href="/api/logout" style="padding: 0.75rem 1.5rem; background: rgba(244, 63, 94, 0.1); color: rgb(244, 63, 94); border: 1px solid rgba(244, 63, 94, 0.3); border-radius: 12px; font-weight: 500; cursor: pointer; font-size: 0.9rem; text-decoration: none; display: inline-block;" data-testid="button-logout">
          Logout
        </a>
        <a href="/profile" style="padding: 0.75rem 1.5rem; background: linear-gradient(135deg, var(--aetherwave-pink), var(--aetherwave-purple)); color: white; border: none; border-radius: 12px; font-weight: 500; cursor: pointer; font-size: 0.9rem; text-decoration: none; display: inline-block; flex: 1; text-align: center;" data-testid="button-manage-profile">
          Manage Profile
        </a>
        <button onclick="closeProfileModal()" style="padding: 0.75rem 1.5rem; background: rgba(255, 255, 255, 0.05); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 12px; font-weight: 500; cursor: pointer; font-size: 0.9rem;" data-testid="button-close-profile">
          Close
        </button>
      </div>
    </div>
  `;
  
  // Close on background click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeProfileModal();
  });
  
  document.body.appendChild(modal);
}

// Close profile modal
function closeProfileModal() {
  const modal = document.getElementById('profile-modal');
  if (modal) {
    modal.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => modal.remove(), 300);
  }
}

// Show quest modal
function showQuestModal() {
  // Navigate to buy-credits page (quests are shown there)
  window.location.href = '/buy-credits';
}

// Close quest modal
function closeQuestModal() {
  const modal = document.getElementById('quest-modal');
  if (modal) {
    modal.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => modal.remove(), 300);
  }
}

// Show payment modal (navigate to buy-credits)
function showPaymentModal() {
  window.location.href = '/buy-credits';
}

// Expose functions globally for onclick handlers
window.showProfileModal = showProfileModal;
window.closeProfileModal = closeProfileModal;
window.showQuestModal = showQuestModal;
window.closeQuestModal = closeQuestModal;
window.showPaymentModal = showPaymentModal;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  checkAuth();
  
  // Attach profile trigger click handler
  const profileTrigger = document.getElementById('profile-trigger');
  if (profileTrigger) {
    profileTrigger.addEventListener('click', showProfileModal);
  }
});
