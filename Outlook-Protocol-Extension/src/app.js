/**
 * Protocol Calendar Extension - Main Application Logic
 * Coordinates UI, authentication, and Graph API interactions
 */

let currentEventData = null;
let currentEventId = null;

/**
 * Initialize Office Add-in
 */
Office.onReady((info) => {
  if (info.host === Office.HostType.Outlook) {
    console.log('Protocol Calendar Extension loaded');

    // Initialize authentication
    window.authModule.initAuth();

    // Set up UI event listeners
    setupEventListeners();

    // Load current event data if authenticated
    if (window.authModule.checkAuthState()) {
      loadCurrentEvent();
    }
  }
});

/**
 * Set up all UI event listeners
 */
function setupEventListeners() {
  // Metadata actions
  document.getElementById('saveMetadataBtn').addEventListener('click', handleSaveMetadata);
  document.getElementById('loadMetadataBtn').addEventListener('click', handleLoadMetadata);
  document.getElementById('clearMetadataBtn').addEventListener('click', handleClearForm);

  // Auto-save on field changes (optional)
  const autoSaveFields = ['emotionalRelic', 'loreType', 'contributorStatus'];
  autoSaveFields.forEach(fieldId => {
    document.getElementById(fieldId).addEventListener('change', () => {
      showStatus('Changes detected. Click Save to persist.', 'info');
    });
  });
}

/**
 * Load current calendar event
 */
async function loadCurrentEvent() {
  try {
    showStatus('Loading event...', 'info');

    // Get event from Outlook
    const item = Office.context.mailbox.item;

    if (!item) {
      showStatus('No event selected', 'warning');
      return;
    }

    // Display basic event info from Outlook item
    displayEventInfo({
      subject: item.subject,
      start: item.start,
      end: item.end,
      location: item.location
    });

    // Store event ID for metadata operations
    currentEventId = item.itemId;

    showStatus('Event loaded successfully', 'success');

    // Try to load existing metadata
    await handleLoadMetadata();
  } catch (error) {
    console.error('Error loading current event:', error);
    showStatus('Failed to load event: ' + error.message, 'error');
  }
}

/**
 * Display event information in UI
 */
function displayEventInfo(event) {
  document.getElementById('eventTitle').textContent = event.subject || '-';

  if (event.start) {
    const startDate = new Date(event.start);
    document.getElementById('eventStart').textContent = startDate.toLocaleString();
  }

  if (event.end) {
    const endDate = new Date(event.end);
    document.getElementById('eventEnd').textContent = endDate.toLocaleString();
  }

  document.getElementById('eventLocation').textContent = event.location || '-';

  currentEventData = event;
}

/**
 * Handle save metadata button click
 */
async function handleSaveMetadata() {
  if (!currentEventId) {
    showStatus('No event loaded', 'error');
    return;
  }

  try {
    showStatus('Saving protocol metadata...', 'info');

    // Collect metadata from form
    const metadata = {
      emotionalRelic: document.getElementById('emotionalRelic').value,
      loreType: document.getElementById('loreType').value,
      contributorStatus: document.getElementById('contributorStatus').value,
      customTags: document.getElementById('customTags').value,
      protocolNotes: document.getElementById('protocolNotes').value,
      lastUpdated: new Date().toISOString(),
      version: '1.0'
    };

    // Remove empty fields
    Object.keys(metadata).forEach(key => {
      if (metadata[key] === '' || metadata[key] === null) {
        delete metadata[key];
      }
    });

    // Save to Graph API
    const result = await window.graphAPI.saveProtocolMetadata(
      convertEventId(currentEventId),
      metadata
    );

    showStatus(`Protocol metadata ${result.action}!`, 'success');

    // Display saved metadata
    displaySavedMetadata(metadata);
  } catch (error) {
    console.error('Error saving metadata:', error);
    showStatus('Failed to save: ' + error.message, 'error');
  }
}

/**
 * Handle load metadata button click
 */
async function handleLoadMetadata() {
  if (!currentEventId) {
    showStatus('No event loaded', 'error');
    return;
  }

  try {
    showStatus('Loading protocol metadata...', 'info');

    const metadata = await window.graphAPI.loadProtocolMetadata(
      convertEventId(currentEventId)
    );

    if (!metadata) {
      showStatus('No protocol metadata found for this event', 'info');
      displaySavedMetadata(null);
      return;
    }

    // Populate form with loaded metadata
    document.getElementById('emotionalRelic').value = metadata.emotionalRelic || '';
    document.getElementById('loreType').value = metadata.loreType || '';
    document.getElementById('contributorStatus').value = metadata.contributorStatus || '';
    document.getElementById('customTags').value = metadata.customTags || '';
    document.getElementById('protocolNotes').value = metadata.protocolNotes || '';

    // Display in read-only view
    displaySavedMetadata(metadata);

    showStatus('Protocol metadata loaded', 'success');
  } catch (error) {
    console.error('Error loading metadata:', error);
    showStatus('Failed to load metadata: ' + error.message, 'error');
  }
}

/**
 * Handle clear form
 */
function handleClearForm() {
  document.getElementById('emotionalRelic').value = '';
  document.getElementById('loreType').value = '';
  document.getElementById('contributorStatus').value = '';
  document.getElementById('customTags').value = '';
  document.getElementById('protocolNotes').value = '';

  showStatus('Form cleared', 'info');
}

/**
 * Display saved metadata in read-only view
 */
function displaySavedMetadata(metadata) {
  const displayDiv = document.getElementById('metadataDisplay');

  if (!metadata) {
    displayDiv.innerHTML = '<p style="color: var(--text-muted); font-style: italic;">No protocol metadata saved for this event.</p>';
    return;
  }

  let html = '';

  // Emotional Relic
  if (metadata.emotionalRelic) {
    html += `
      <div class="metadata-item">
        <div class="metadata-label">Emotional Relic</div>
        <div class="metadata-value">${getEmotionalRelicDisplay(metadata.emotionalRelic)}</div>
      </div>
    `;
  }

  // Lore Type
  if (metadata.loreType) {
    html += `
      <div class="metadata-item">
        <div class="metadata-label">Lore Type</div>
        <div class="metadata-value">${getLoreTypeDisplay(metadata.loreType)}</div>
      </div>
    `;
  }

  // Contributor Status
  if (metadata.contributorStatus) {
    html += `
      <div class="metadata-item">
        <div class="metadata-label">Contributor Status</div>
        <div class="metadata-value">${getContributorStatusDisplay(metadata.contributorStatus)}</div>
      </div>
    `;
  }

  // Custom Tags
  if (metadata.customTags) {
    const tags = metadata.customTags.split(',').map(t => t.trim()).filter(t => t);
    if (tags.length > 0) {
      html += `
        <div class="metadata-item">
          <div class="metadata-label">Custom Tags</div>
          <div class="metadata-tags">
            ${tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
        </div>
      `;
    }
  }

  // Notes
  if (metadata.protocolNotes) {
    html += `
      <div class="metadata-item">
        <div class="metadata-label">Protocol Notes</div>
        <div class="metadata-value">${escapeHtml(metadata.protocolNotes)}</div>
      </div>
    `;
  }

  // Last Updated
  if (metadata.lastUpdated) {
    const date = new Date(metadata.lastUpdated);
    html += `
      <div class="metadata-item">
        <div class="metadata-label">Last Updated</div>
        <div class="metadata-value">${date.toLocaleString()}</div>
      </div>
    `;
  }

  displayDiv.innerHTML = html || '<p style="color: var(--text-muted);">No data to display</p>';
}

/**
 * Get display text for emotional relic
 */
function getEmotionalRelicDisplay(value) {
  const map = {
    'joy': '✨ Joy',
    'anticipation': '🌟 Anticipation',
    'reflection': '🌙 Reflection',
    'determination': '⚡ Determination',
    'curiosity': '🔍 Curiosity',
    'gratitude': '🙏 Gratitude',
    'vulnerability': '💫 Vulnerability',
    'connection': '🤝 Connection'
  };
  return map[value] || value;
}

/**
 * Get display text for lore type
 */
function getLoreTypeDisplay(value) {
  const map = {
    'origin': '🌱 Origin Story',
    'quest': '⚔️ Quest/Mission',
    'ritual': '🕯️ Ritual/Ceremony',
    'revelation': '💡 Revelation',
    'alliance': '🤝 Alliance Formation',
    'challenge': '🎯 Challenge/Trial',
    'celebration': '🎉 Celebration',
    'transformation': '🦋 Transformation'
  };
  return map[value] || value;
}

/**
 * Get display text for contributor status
 */
function getContributorStatusDisplay(value) {
  const map = {
    'ready': '✅ Ready',
    'reflecting': '🤔 Reflecting',
    'needs-support': '🆘 Needs Support',
    'inspired': '💫 Inspired',
    'focused': '🎯 Focused',
    'collaborating': '🤝 Collaborating'
  };
  return map[value] || value;
}

/**
 * Convert Outlook event ID to Graph API format
 */
function convertEventId(outlookId) {
  // Simple conversion - may need adjustment based on actual ID format
  return outlookId;
}

/**
 * Escape HTML for safe display
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Show status message
 */
function showStatus(message, type = 'info') {
  const statusDiv = document.getElementById('statusMessage');
  statusDiv.textContent = message;
  statusDiv.className = `status-message ${type}`;
  statusDiv.style.display = 'block';

  // Auto-hide after 3 seconds
  setTimeout(() => {
    statusDiv.style.display = 'none';
  }, 3000);
}

// Export for console debugging
window.protocolApp = {
  loadCurrentEvent,
  handleSaveMetadata,
  handleLoadMetadata,
  displaySavedMetadata
};
