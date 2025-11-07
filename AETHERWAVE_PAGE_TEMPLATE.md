# AetherWave Studio - Page Template

This template ensures all pages have consistent navigation, styling, authentication, and background animations.

---

## 1. HEAD Section - Required Imports

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Page Title - AetherWave Studio</title>

  <!-- Google Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">

  <!-- Navigation CSS (Global) -->
  <link rel="stylesheet" href="https://firebasestorage.googleapis.com/v0/b/aetherwave-playlists.firebasestorage.app/o/global-files%2Fnav.css?alt=media&token=d9ce7aa2-0609-46cc-92a8-169d8d8ca076">

  <!-- Tiled Background CSS -->
  <link rel="stylesheet" href="/static/assets/css/tiled-background.css">

  <style>
    /* CSS Variables (REQUIRED) */
    :root {
      --aetherwave-pink: #ff2ea6;
      --aetherwave-purple: #8b5cf6;
      --dark-bg: #0d0b15;
      --card-bg: #1a1625;
      --text-primary: #e9e8ff;
      --text-muted: #b7b3d9;
      --border-color: #2d2640;
    }

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: var(--dark-bg);
      color: var(--text-primary);
      min-height: 100vh;
    }

    /* ADD YOUR PAGE-SPECIFIC STYLES HERE */
  </style>
</head>
```

---

## 2. BODY Section - Background & Navigation

```html
<body>
  <!-- Tiled Background Container -->
  <div id="tiled-background-container"></div>

  <!-- Navigation Header -->
  <header class="main-header">
    <nav class="nav-container">
      <!-- Logo -->
      <div class="logo">
        <a href="https://aetherwavestudio.com">
          <img src="https://firebasestorage.googleapis.com/v0/b/aetherwave-playlists.firebasestorage.app/o/global-assets%2Faws-banner_1761542850665.png?alt=media&token=fe7db850-1c11-4f93-a04d-2f5ac6678133"
               alt="AetherWave Studio"
               style="height: 50px; width: auto;">
        </a>
      </div>

      <!-- Navigation Links (Add your custom links here) -->
      <ul class="nav-links">
        <li><a href="/">Home</a></li>
        <li><a href="/static/aimusic-media.html">Create</a></li>
        <!-- Add more navigation items as needed -->
      </ul>

      <!-- Auth Section (REQUIRED - DO NOT MODIFY) -->
      <div id="auth-section" style="display: flex; align-items: center; gap: 1rem;">
        <a href="/api/login" class="nav-btn" id="login-btn" data-testid="button-login">Login</a>
        <div id="user-profile" style="display: none; align-items: center; gap: 0.75rem;">

          <!-- Credits Badge -->
          <div class="credits-indicator" data-testid="credits-display" onclick="showPaymentModal()" title="Click to view plans and upgrade" style="display: none;">
            <span id="credits-count">0</span>
          </div>

          <!-- Quest Gift Box Icon -->
          <div id="quest-gift-icon" onclick="showQuestModal()" style="display: none; cursor: pointer; position: relative; width: 40px; height: 40px; background: linear-gradient(135deg, var(--aetherwave-pink), var(--aetherwave-purple)); border-radius: 8px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; box-shadow: 0 2px 8px rgba(255, 46, 166, 0.3);" onmouseover="this.style.transform='translateY(-2px) scale(1.05)'; this.style.boxShadow='0 4px 16px rgba(255, 46, 166, 0.5)'" onmouseout="this.style.transform=''; this.style.boxShadow='0 2px 8px rgba(255, 46, 166, 0.3)'" title="Earn free credits by completing quests!">
            <span style="font-size: 1.3rem;">🎁</span>
            <div id="quest-notification-badge" style="display: none; position: absolute; top: -4px; right: -4px; width: 16px; height: 16px; background: #ff2ea6; border-radius: 50%; border: 2px solid var(--dark-bg); font-size: 0.65rem; font-weight: 700; color: white; display: flex; align-items: center; justify-content: center;"></div>
          </div>

          <!-- Profile Trigger -->
          <div id="profile-trigger" style="display: flex; align-items: center; gap: 0.75rem; cursor: pointer; padding: 0.25rem 0.75rem; border-radius: 20px; transition: all 0.2s;" onmouseover="this.style.background='rgba(139, 92, 246, 0.1)'" onmouseout="this.style.background='transparent'" data-testid="button-profile">
            <img id="user-avatar" src="/assets/icon-set/profile-icon.png" alt="User" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid var(--aetherwave-purple);">
            <span id="user-name" style="color: var(--text-primary); font-size: 0.9rem;" data-testid="text-username"></span>
          </div>

          <!-- Logout Button -->
          <a href="/api/logout" class="nav-btn" style="padding: 0.5rem 1rem; font-size: 0.85rem;" data-testid="button-logout">Logout</a>
        </div>
      </div>
    </nav>
  </header>

  <main>
    <!-- YOUR PAGE CONTENT GOES HERE -->

  </main>

  <!-- Quest Modal (REQUIRED) -->
  <div id="quest-modal" class="modal-overlay" style="display: none;" onclick="if(event.target === this) closeQuestModal()">
    <div class="modal-content" style="max-width: 400px; width: 92%; margin: 0 auto;">
      <div class="modal-header">
        <div class="modal-title">🎁 Earn Free Credits!</div>
        <div class="modal-subtitle">Complete quests to earn 20 credits each (80 credits total)</div>
      </div>

      <div id="quest-list" style="display: flex; flex-direction: column; gap: 0.75rem; margin-bottom: 1rem;">
        <div style="text-align: center; padding: 1.5rem; color: var(--text-muted);">
          Loading quests...
        </div>
      </div>

      <div style="text-align: center; font-size: 0.8rem; color: var(--text-muted); padding: 0.75rem; background: rgba(139, 92, 246, 0.1); border-radius: 8px; line-height: 1.4;">
        <strong style="color: var(--text-primary);">Free Tier Credits:</strong> 100 welcome bonus + 20 credits/day (cap: 100)<br>
        Quest rewards can push you over the cap!
      </div>

      <div class="modal-actions">
        <button class="modal-btn modal-btn-secondary" onclick="closeQuestModal()">Close</button>
      </div>
    </div>
  </div>

  <!-- JAVASCRIPT SECTION BELOW -->
```

---

## 3. JavaScript - Authentication & Navigation (REQUIRED)

Place this `<script>` tag before the closing `</body>` tag:

```html
  <script>
    // Global error handler
    window.addEventListener('error', (e) => {
      console.error('Global error:', e.message, e.filename, e.lineno, e.colno);
    });

    // Global user state
    let currentUser = null;
    let userCredits = 0;

    // Check authentication status and update UI
    async function checkAuth() {
      try {
        const response = await fetch('/api/auth/user', { credentials: 'include' });
        if (response.ok) {
          const user = await response.json();

          // Store user data globally for profile modal
          currentUser = user;

          // Fetch user credits
          const creditsResponse = await fetch('/api/user/credits', { credentials: 'include' });
          if (creditsResponse.ok) {
            const creditsData = await creditsResponse.json();
            userCredits = creditsData.credits || 0;
          }

          // User is logged in
          document.getElementById('login-btn').style.display = 'none';
          document.getElementById('user-profile').style.display = 'flex';

          // Truncate username to 20 characters
          const fullName = user.firstName || user.email || 'User';
          const displayName = fullName.length > 20 ? fullName.substring(0, 20) + '...' : fullName;
          document.getElementById('user-name').textContent = displayName;

          // Always use the profile icon
          document.getElementById('user-avatar').src = '/assets/icon-set/profile-icon.png';
          document.getElementById('user-avatar').alt = user.firstName || user.email || 'User';

          // Attach event listener to profile trigger
          const profileTrigger = document.getElementById('profile-trigger');
          if (profileTrigger && !profileTrigger.hasAttribute('data-listener-attached')) {
            profileTrigger.addEventListener('click', function() {
              showProfileModal();
            });
            profileTrigger.setAttribute('data-listener-attached', 'true');
          }
        } else {
          // User not logged in
          document.getElementById('login-btn').style.display = 'inline-block';
          document.getElementById('user-profile').style.display = 'none';
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        // Show login button on error
        document.getElementById('login-btn').style.display = 'inline-block';
        document.getElementById('user-profile').style.display = 'none';
      }
    }

    // Check auth on page load
    checkAuth();

    // Mobile Navigation Controller
    function initMobileNavigation() {
      const mobileNavBtns = document.querySelectorAll('.mobile-nav-btn');
      const panels = {
        music: document.querySelector('.panel-music'),
        chat: document.querySelector('.panel-chat'),
        media: document.querySelector('.panel-media')
      };

      // Check if panels exist before proceeding
      if (!panels.music && !panels.chat && !panels.media) {
        return; // No mobile panels on this page
      }

      // Set initial active panel (music)
      if (window.innerWidth <= 768) {
        if (panels.music) panels.music.classList.add('mobile-active');
        if (panels.chat) panels.chat.classList.remove('mobile-active');
        if (panels.media) panels.media.classList.remove('mobile-active');
      }

      // Handle mobile nav clicks
      mobileNavBtns.forEach(btn => {
        btn.addEventListener('click', function() {
          const targetPanel = this.getAttribute('data-panel');

          // Update button states
          mobileNavBtns.forEach(b => b.classList.remove('active'));
          this.classList.add('active');

          // Update panel visibility (only on mobile)
          if (window.innerWidth <= 768) {
            Object.keys(panels).forEach(key => {
              if (panels[key]) {
                if (key === targetPanel) {
                  panels[key].classList.add('mobile-active');
                  panels[key].scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                  panels[key].classList.remove('mobile-active');
                }
              }
            });
          }
        });
      });

      // Handle window resize
      let resizeTimeout;
      window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(function() {
          if (window.innerWidth > 768) {
            // Desktop mode - remove mobile-active classes
            Object.values(panels).forEach(panel => {
              if (panel) panel.classList.remove('mobile-active');
            });
          } else {
            // Mobile mode - ensure one panel is active
            const hasActive = Array.from(Object.values(panels)).some(p => p && p.classList.contains('mobile-active'));
            if (!hasActive && panels.music) {
              panels.music.classList.add('mobile-active');
            }
          }
        }, 250);
      });
    }

    // Initialize mobile navigation on page load
    initMobileNavigation();

    // Credit Management
    let userPlanType = 'free';

    async function fetchUserCredits() {
      try {
        const response = await fetch('/api/user/credits', { credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          userCredits = data.credits;
          userPlanType = data.planType;
          updateCreditsDisplay();

          // Auto-check for daily reset
          await checkDailyReset();
        } else if (response.status === 401) {
          // User not authenticated - hide credits display
          const creditsIndicator = document.querySelector('.credits-indicator');
          if (creditsIndicator) {
            creditsIndicator.style.display = 'none';
          }
        }
      } catch (error) {
        console.error('Failed to fetch credits:', error);
        // Hide credits on error
        const creditsIndicator = document.querySelector('.credits-indicator');
        if (creditsIndicator) {
          creditsIndicator.style.display = 'none';
        }
      }
    }

    async function checkDailyReset() {
      try {
        const response = await fetch('/api/user/credits/check-reset', { method: 'POST', credentials: 'include' });
        if (response.ok) {
          const data = await response.json();
          if (data.resetOccurred) {
            userCredits = data.credits;
            updateCreditsDisplay();
            showNotification('Daily credits reset! You now have 50 credits.', 'success');
          }
        }
      } catch (error) {
        console.error('Failed to check daily reset:', error);
      }
    }

    function updateCreditsDisplay() {
      const creditsElement = document.getElementById('credits-count');
      const creditsIndicator = document.querySelector('.credits-indicator');
      const questGiftIcon = document.getElementById('quest-gift-icon');

      if (creditsElement && creditsIndicator) {
        // Show the indicator
        creditsIndicator.style.display = 'flex';

        if (userPlanType === 'studio' || userPlanType === 'creator' || userPlanType === 'all_access') {
          creditsElement.textContent = '∞';
          creditsIndicator.title = 'Unlimited music credits - Click to view plans';
          // Hide quest icon for paid users
          if (questGiftIcon) questGiftIcon.style.display = 'none';
        } else {
          creditsElement.textContent = userCredits;
          creditsIndicator.title = `${userCredits} credits remaining - Click to upgrade`;
          // Show quest icon for free users
          if (questGiftIcon) questGiftIcon.style.display = 'flex';
          // Load and check for uncompleted quests
          loadQuests();
        }
      }
    }

    // ===== QUEST SYSTEM FUNCTIONS =====

    let userQuests = [];

    async function loadQuests() {
      try {
        const response = await fetch('/api/quests', { credentials: 'include' });

        // If quest endpoint doesn't exist or returns error, silently fail
        if (!response.ok) {
          console.log('Quests not available on this page');
          return null;
        }

        // Check if response is JSON before parsing
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          console.log('Quest endpoint returned non-JSON response');
          return null;
        }

        const data = await response.json();
        userQuests = data.quests;

        // Update notification badge
        const uncompletedCount = userQuests.filter(q => !q.completed).length;
        const badge = document.getElementById('quest-notification-badge');
        if (badge) {
          if (uncompletedCount > 0) {
            badge.textContent = uncompletedCount;
            badge.style.display = 'flex';
          } else {
            badge.style.display = 'none';
          }
        }

        return data;
      } catch (error) {
        console.log('Quests feature not available on this page');
        return null;
      }
    }

    async function showQuestModal() {
      const modal = document.getElementById('quest-modal');
      const questList = document.getElementById('quest-list');

      modal.style.display = 'flex';

      // Load quests if not already loaded
      if (!userQuests.length) {
        await loadQuests();
      }

      // Render quests
      if (!userQuests || userQuests.length === 0) {
        questList.innerHTML = '<div style="text-align: center; padding: 1.5rem; color: var(--text-muted);">No quests available</div>';
        return;
      }

      questList.innerHTML = userQuests.map(quest => `
        <div class="quest-card" style="background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); border-radius: 12px; padding: 1rem; transition: all 0.2s; ${quest.completed ? 'opacity: 0.5;' : ''}">
          <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 0.5rem;">
            <div style="flex: 1;">
              <div style="font-weight: 600; color: var(--text-primary); margin-bottom: 0.25rem; display: flex; align-items: center; gap: 0.5rem;">
                ${quest.completed ? '✅' : '🎯'} ${quest.title}
              </div>
              <div style="font-size: 0.85rem; color: var(--text-muted); line-height: 1.4;">
                ${quest.description}
              </div>
            </div>
            <div style="background: linear-gradient(135deg, var(--aetherwave-pink), var(--aetherwave-purple)); color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.75rem; font-weight: 700; white-space: nowrap; margin-left: 0.75rem;">
              +${quest.reward} credits
            </div>
          </div>
          ${!quest.completed ? `
            <button onclick="completeQuest('${quest.id}')" style="width: 100%; padding: 0.5rem; background: linear-gradient(135deg, var(--aetherwave-pink), var(--aetherwave-purple)); color: white; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.85rem; margin-top: 0.5rem; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''">
              Complete Quest
            </button>
          ` : '<div style="text-align: center; color: #4ade80; font-size: 0.85rem; font-weight: 600; margin-top: 0.5rem;">✓ Completed</div>'}
        </div>
      `).join('');
    }

    function closeQuestModal() {
      const modal = document.getElementById('quest-modal');
      modal.style.display = 'none';
    }

    async function completeQuest(questId) {
      try {
        const response = await fetch('/api/quests/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ questId })
        });

        if (!response.ok) {
          const error = await response.json();
          showNotification(error.message || 'Failed to complete quest', 'error');
          return;
        }

        const data = await response.json();
        userCredits = data.newBalance;
        updateCreditsDisplay();
        showNotification(data.message, 'success');

        // Reload quest modal to show updated completion status
        await loadQuests(); // Reload quests first
        showQuestModal(); // Then refresh modal

      } catch (error) {
        console.error('Error completing quest:', error);
        showNotification('Failed to complete quest', 'error');
      }
    }

    // ===== END QUEST SYSTEM =====

    // Fetch credits on page load
    setTimeout(() => {
      fetchUserCredits();
    }, 500);

    // Payment Modal (placeholder function - implement as needed)
    function showPaymentModal() {
      alert('Payment modal would open here. Implement your upgrade/payment flow.');
    }

    // Profile Modal Functions
    window.showProfileModal = function showProfileModal() {
      console.log('Profile modal function called, currentUser:', currentUser);
      if (!currentUser) {
        showNotification('Please log in to view your profile');
        return;
      }

      const modal = document.createElement('div');
      modal.id = 'profile-modal';
      modal.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(13, 11, 21, 0.95);
        backdrop-filter: blur(12px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        animation: fadeIn 0.3s ease-out;
      `;

      const planNames = {
        'free': 'Free',
        'studio': 'Studio Member',
        'creator': 'Creator',
        'all_access': 'All Access Pass'
      };

      const planName = planNames[currentUser.subscriptionPlan] || 'Free';

      modal.innerHTML = `
        <div style="background: var(--card-bg); border: 1px solid var(--border-color); border-radius: 24px; max-width: 600px; width: 100%; max-height: 90vh; display: flex; flex-direction: column; box-shadow: 0 24px 80px rgba(0, 0, 0, 0.8); animation: slideUp 0.4s ease-out; overflow: hidden;">
          <div style="padding: 2rem; border-bottom: 1px solid var(--border-color); flex-shrink: 0; background: url('/assets/header-panel_1761541736595.png') no-repeat center center; background-size: cover;">
            <div style="display: flex; align-items: center; gap: 1.5rem; margin-bottom: 1rem;">
              <img src="${currentUser.profileImageUrl || '/assets/icon-set/profile-icon.png'}" alt="Profile" style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover; border: 3px solid var(--aetherwave-purple); box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);">
              <div>
                <h2 style="font-size: 1.75rem; font-weight: 700; color: var(--text-primary); margin: 0;">
                  ${currentUser.username || currentUser.email || 'User'}
                </h2>
                <p style="color: var(--text-muted); margin: 0.25rem 0 0 0; font-size: 0.95rem;">
                  ${currentUser.email || ''}
                </p>
              </div>
            </div>
          </div>

          <div style="flex: 1; overflow-y: auto; overflow-x: hidden; padding: 2rem;">
            <!-- Account Info -->
            <div style="margin-bottom: 2rem;">
              <h3 style="font-size: 1.1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                👤 Account Information
              </h3>
              <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: 12px; padding: 1.25rem;">
                <div style="display: grid; gap: 1rem;">
                  <div>
                    <div style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 0.25rem;">Username</div>
                    <div style="color: var(--text-primary); font-weight: 500;">${currentUser.username || 'Not set'}</div>
                  </div>
                  <div>
                    <div style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 0.25rem;">Email</div>
                    <div style="color: var(--text-primary); font-weight: 500;">${currentUser.email || 'Not set'}</div>
                  </div>
                  <div>
                    <div style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 0.25rem;">User ID</div>
                    <div style="color: var(--text-muted); font-size: 0.8rem; font-family: monospace;">${currentUser.id}</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Subscription Info -->
            <div style="margin-bottom: 2rem;">
              <h3 style="font-size: 1.1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                ⭐ Subscription
              </h3>
              <div style="background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(255, 46, 166, 0.05)); border: 2px solid var(--aetherwave-purple); border-radius: 12px; padding: 1.25rem;">
                <div style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">
                  ${planName}
                </div>
                <div style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;">
                  ${currentUser.subscriptionPlan === 'free' ? 'Upgrade to unlock unlimited features' : 'Thank you for being a premium member!'}
                </div>
                <button onclick="closeProfileModal(); showPaymentModal();" style="width: 100%; padding: 0.75rem; background: linear-gradient(135deg, var(--aetherwave-pink), var(--aetherwave-purple)); color: white; border: none; border-radius: 12px; font-weight: 600; cursor: pointer; font-size: 0.9rem; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''">
                  ${currentUser.subscriptionPlan === 'free' ? 'Upgrade Plan' : 'Manage Subscription'}
                </button>
              </div>
            </div>

            <!-- Credits Info -->
            <div style="margin-bottom: 2rem;">
              <h3 style="font-size: 1.1rem; font-weight: 600; color: var(--text-primary); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
                💎 Credits Balance
              </h3>
              <div style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-color); border-radius: 12px; padding: 1.25rem;">
                <div style="font-size: 2rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.5rem;">
                  ${userCredits.toLocaleString()} credits
                </div>
                <div style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 0.75rem;">
                  ${currentUser.subscriptionPlan === 'free' ? 'Resets daily at midnight' : 'Unlimited for your plan'}
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; font-size: 0.85rem;">
                  <div style="padding: 0.75rem; background: rgba(139, 92, 246, 0.1); border-radius: 8px;">
                    <div style="color: var(--text-muted); margin-bottom: 0.25rem;">Music Cost</div>
                    <div style="color: var(--text-primary); font-weight: 600;">5 credits</div>
                  </div>
                  <div style="padding: 0.75rem; background: rgba(255, 46, 166, 0.1); border-radius: 8px;">
                    <div style="color: var(--text-muted); margin-bottom: 0.25rem;">Video Cost</div>
                    <div style="color: var(--text-primary); font-weight: 600;">8-15 credits</div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <div style="padding: 1.5rem 2rem; border-top: 1px solid var(--border-color); display: flex; gap: 1rem; justify-content: space-between; flex-shrink: 0; flex-wrap: wrap;">
            <a href="/api/logout" style="padding: 0.75rem 1.5rem; background: rgba(244, 63, 94, 0.1); color: rgb(244, 63, 94); border: 1px solid rgba(244, 63, 94, 0.3); border-radius: 12px; font-weight: 500; cursor: pointer; font-size: 0.9rem; transition: all 0.2s; text-decoration: none; display: inline-block;" onmouseover="this.style.background='rgba(244, 63, 94, 0.2)'" onmouseout="this.style.background='rgba(244, 63, 94, 0.1)'">
              Logout
            </a>
            <div style="display: flex; gap: 0.75rem;">
              <a href="/profile" style="padding: 0.75rem 1.5rem; background: rgba(139, 92, 246, 0.15); color: var(--aetherwave-purple); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 12px; font-weight: 500; cursor: pointer; font-size: 0.9rem; transition: all 0.2s; text-decoration: none; display: inline-block;" onmouseover="this.style.background='rgba(139, 92, 246, 0.25)'" onmouseout="this.style.background='rgba(139, 92, 246, 0.15)'">
                Manage Profile
              </a>
              <button onclick="closeProfileModal()" style="padding: 0.75rem 2rem; background: linear-gradient(135deg, var(--aetherwave-pink), var(--aetherwave-purple)); color: white; border: none; border-radius: 12px; font-weight: 500; cursor: pointer; font-size: 0.9rem; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform=''">
                Close
              </button>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
    }

    window.closeProfileModal = function closeProfileModal() {
      const modal = document.getElementById('profile-modal');
      if (modal) {
        modal.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => modal.remove(), 300);
      }
    }

    // Notification System
    function showNotification(message, type = 'info') {
      const notification = document.createElement('div');
      notification.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        background: ${type === 'success' ? 'rgba(74, 222, 128, 0.15)' : type === 'error' ? 'rgba(244, 63, 94, 0.15)' : 'rgba(139, 92, 246, 0.15)'};
        border: 1px solid ${type === 'success' ? 'rgba(74, 222, 128, 0.3)' : type === 'error' ? 'rgba(244, 63, 94, 0.3)' : 'rgba(139, 92, 246, 0.3)'};
        color: var(--text-primary);
        padding: 1rem 1.5rem;
        border-radius: 12px;
        font-size: 0.9rem;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
      `;
      notification.textContent = message;
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    }

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
      }
      @keyframes slideUp {
        from { transform: translateY(30px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
      }

      .credits-indicator {
        display: none;
        align-items: center;
        gap: 0.5rem;
        padding: 0.5rem 1rem;
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(255, 46, 166, 0.1));
        border: 1px solid rgba(139, 92, 246, 0.3);
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.2s;
      }

      .credits-indicator:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
      }

      #credits-count {
        font-weight: 600;
        color: var(--text-primary);
        font-size: 0.9rem;
      }

      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(13, 11, 21, 0.95);
        backdrop-filter: blur(12px);
        z-index: 9998;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 1rem;
      }

      .modal-content {
        background: var(--card-bg);
        border: 1px solid var(--border-color);
        border-radius: 24px;
        padding: 2rem;
        box-shadow: 0 24px 80px rgba(0, 0, 0, 0.8);
      }

      .modal-header {
        margin-bottom: 1.5rem;
      }

      .modal-title {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 0.5rem;
      }

      .modal-subtitle {
        color: var(--text-muted);
        font-size: 0.9rem;
      }

      .modal-actions {
        margin-top: 1.5rem;
        display: flex;
        gap: 0.75rem;
        justify-content: flex-end;
      }

      .modal-btn {
        padding: 0.75rem 1.5rem;
        border-radius: 12px;
        font-weight: 600;
        cursor: pointer;
        font-size: 0.9rem;
        transition: transform 0.2s;
        border: none;
      }

      .modal-btn:hover {
        transform: translateY(-2px);
      }

      .modal-btn-secondary {
        background: rgba(255, 255, 255, 0.05);
        color: var(--text-primary);
        border: 1px solid var(--border-color);
      }
    `;
    document.head.appendChild(style);
  </script>

  <!-- Tiled Background Script (REQUIRED) -->
  <script src="/static/assets/js/tiled-background-v2.js"></script>

</body>
</html>
```

---

## 4. Summary - What This Template Includes

### ✅ Visual Elements
- **Tiled animated background** with videos, images, and gradients
- **Consistent color scheme** (AetherWave purple/pink)
- **Responsive design** for mobile and desktop

### ✅ Navigation Features
- **Login/Logout** buttons with authentication
- **Credits badge** showing user's credit balance
- **Quest icon** with notification badge for free users
- **Profile dropdown** with user avatar and name
- **Mobile-responsive** navigation

### ✅ Functionality
- **Authentication check** on page load
- **Automatic credit fetching** and display
- **Daily credit reset** checking
- **Quest system** with modal
- **Profile modal** with user info
- **Notification system** for user feedback

### ✅ Styling
- **Google Inter font** for consistency
- **Global CSS variables** for easy theming
- **Smooth animations** and transitions
- **Modal overlays** with backdrop blur

---

## 5. How to Use This Template

1. **Copy the HEAD section** - Include all CSS and font links
2. **Copy the BODY structure** - Include background container and navigation
3. **Add your page content** in the `<main>` section
4. **Copy the Quest Modal HTML** before closing `</body>`
5. **Copy the entire JavaScript section** - This handles all auth/navigation
6. **Include the tiled background script** at the end

---

## 6. Customization Points

### Page-Specific Customization
- **Page title** - Change in `<title>` tag
- **Navigation links** - Add/remove links in the `<ul class="nav-links">` section
- **Main content** - Add your page-specific HTML in `<main>`
- **Additional styles** - Add in the `<style>` section in HEAD

### What NOT to Change
- The entire `#auth-section` div structure
- The Quest Modal HTML
- The JavaScript authentication and navigation functions
- The tiled background container and script

---

## 7. Testing Checklist

After applying this template to a new page:

- [ ] Page loads without JavaScript errors
- [ ] Tiled background animates
- [ ] Login button appears when not logged in
- [ ] After login, credits/quest/profile icons appear
- [ ] Credits display shows correct balance
- [ ] Quest modal opens and displays quests
- [ ] Profile modal opens with user info
- [ ] Mobile navigation works (if applicable)
- [ ] All links work correctly

---

**Save this template and use it for all new AetherWave Studio pages!**
