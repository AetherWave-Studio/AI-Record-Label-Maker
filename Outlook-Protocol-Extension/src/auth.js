/**
 * Authentication Module for Microsoft Graph API
 * Handles OAuth 2.0 authentication flow using MSAL.js
 */

// MSAL Configuration
// TODO: Replace with your Azure AD app registration details
const msalConfig = {
  auth: {
    clientId: 'YOUR_CLIENT_ID_HERE', // Replace with your App Registration Client ID
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: 'https://localhost:3000/src/index.html'
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: true
  }
};

// Requested API permissions
const loginRequest = {
  scopes: [
    'Calendars.ReadWrite',
    'User.Read'
  ]
};

let msalInstance = null;
let currentAccount = null;

/**
 * Initialize MSAL instance
 */
function initializeMSAL() {
  try {
    msalInstance = new msal.PublicClientApplication(msalConfig);
    return msalInstance.initialize();
  } catch (error) {
    console.error('Error initializing MSAL:', error);
    showStatus('Failed to initialize authentication', 'error');
    throw error;
  }
}

/**
 * Sign in to Microsoft Account
 */
async function signIn() {
  try {
    showStatus('Signing in...', 'info');

    const response = await msalInstance.loginPopup(loginRequest);
    currentAccount = response.account;

    // Store account info
    localStorage.setItem('msalAccount', JSON.stringify(currentAccount));

    updateUIAfterLogin(currentAccount);
    showStatus('Signed in successfully!', 'success');

    return currentAccount;
  } catch (error) {
    console.error('Login error:', error);
    showStatus('Sign in failed: ' + error.message, 'error');
    throw error;
  }
}

/**
 * Sign out
 */
async function signOut() {
  try {
    const logoutRequest = {
      account: currentAccount
    };

    await msalInstance.logoutPopup(logoutRequest);
    currentAccount = null;
    localStorage.removeItem('msalAccount');
    localStorage.removeItem('accessToken');

    updateUIAfterLogout();
    showStatus('Signed out successfully', 'info');
  } catch (error) {
    console.error('Logout error:', error);
    showStatus('Sign out failed', 'error');
  }
}

/**
 * Get access token silently
 */
async function getAccessToken() {
  if (!currentAccount) {
    // Try to restore account from storage
    const storedAccount = localStorage.getItem('msalAccount');
    if (storedAccount) {
      currentAccount = JSON.parse(storedAccount);
    } else {
      throw new Error('No account found. Please sign in.');
    }
  }

  const request = {
    scopes: loginRequest.scopes,
    account: currentAccount
  };

  try {
    // Try to acquire token silently
    const response = await msalInstance.acquireTokenSilent(request);
    return response.accessToken;
  } catch (error) {
    console.warn('Silent token acquisition failed, trying popup:', error);

    // If silent acquisition fails, fall back to popup
    const response = await msalInstance.acquireTokenPopup(request);
    return response.accessToken;
  }
}

/**
 * Check if user is already signed in
 */
function checkAuthState() {
  const storedAccount = localStorage.getItem('msalAccount');

  if (storedAccount) {
    currentAccount = JSON.parse(storedAccount);
    updateUIAfterLogin(currentAccount);
    return true;
  }

  return false;
}

/**
 * Update UI after successful login
 */
function updateUIAfterLogin(account) {
  document.getElementById('authSection').querySelector('#loginBtn').style.display = 'none';
  document.getElementById('userInfo').style.display = 'flex';
  document.getElementById('userName').textContent = account.name || account.username;

  document.getElementById('eventSection').style.display = 'block';
  document.getElementById('metadataSection').style.display = 'block';
  document.getElementById('displaySection').style.display = 'block';
}

/**
 * Update UI after logout
 */
function updateUIAfterLogout() {
  document.getElementById('authSection').querySelector('#loginBtn').style.display = 'block';
  document.getElementById('userInfo').style.display = 'none';

  document.getElementById('eventSection').style.display = 'none';
  document.getElementById('metadataSection').style.display = 'none';
  document.getElementById('displaySection').style.display = 'none';
}

/**
 * Initialize authentication on page load
 */
async function initAuth() {
  try {
    await initializeMSAL();
    checkAuthState();

    // Set up event listeners
    document.getElementById('loginBtn').addEventListener('click', signIn);
    document.getElementById('logoutBtn').addEventListener('click', signOut);
  } catch (error) {
    console.error('Auth initialization error:', error);
    showStatus('Authentication setup failed', 'error');
  }
}

// Export functions for use in other modules
window.authModule = {
  initAuth,
  signIn,
  signOut,
  getAccessToken,
  checkAuthState
};
