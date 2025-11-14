/**
 * Microsoft Graph API Module
 * Handles calendar event operations and metadata storage using open extensions
 */

const GRAPH_API_ENDPOINT = 'https://graph.microsoft.com/v1.0';
const EXTENSION_NAME = 'com.aetherwave.protocol';

/**
 * Make authenticated Graph API request
 */
async function graphRequest(endpoint, method = 'GET', body = null) {
  try {
    const token = await window.authModule.getAccessToken();

    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    const options = {
      method,
      headers
    };

    if (body && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${GRAPH_API_ENDPOINT}${endpoint}`, options);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Graph API request failed');
    }

    // Handle no content responses
    if (response.status === 204) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Graph API Error:', error);
    throw error;
  }
}

/**
 * Get current calendar event
 */
async function getCurrentEvent() {
  try {
    // In Outlook add-in context, get the current item
    const item = Office.context.mailbox.item;

    if (!item) {
      throw new Error('No calendar event is currently selected');
    }

    // Get event ID from Outlook
    const eventId = item.itemId;

    if (!eventId) {
      throw new Error('Could not retrieve event ID');
    }

    // Fetch full event details from Graph API
    const event = await graphRequest(`/me/events/${convertToRestId(eventId)}`);
    return event;
  } catch (error) {
    console.error('Error getting current event:', error);
    throw error;
  }
}

/**
 * Convert EWS ID to REST ID format
 */
function convertToRestId(ewsId) {
  // Remove "RgAAAA" prefix if present
  if (ewsId.startsWith('RgAAAA')) {
    return ewsId;
  }
  return ewsId;
}

/**
 * Save protocol metadata to event using open extension
 */
async function saveProtocolMetadata(eventId, metadata) {
  try {
    const extensionData = {
      '@odata.type': 'microsoft.graph.openTypeExtension',
      extensionName: EXTENSION_NAME,
      ...metadata
    };

    // Try to update existing extension first
    try {
      await graphRequest(
        `/me/events/${eventId}/extensions/${EXTENSION_NAME}`,
        'PATCH',
        metadata
      );
      return { success: true, action: 'updated' };
    } catch (error) {
      // If extension doesn't exist, create it
      if (error.message.includes('404') || error.message.includes('not found')) {
        await graphRequest(
          `/me/events/${eventId}/extensions`,
          'POST',
          extensionData
        );
        return { success: true, action: 'created' };
      }
      throw error;
    }
  } catch (error) {
    console.error('Error saving protocol metadata:', error);
    throw error;
  }
}

/**
 * Load protocol metadata from event
 */
async function loadProtocolMetadata(eventId) {
  try {
    const extension = await graphRequest(
      `/me/events/${eventId}/extensions/${EXTENSION_NAME}`
    );

    // Remove metadata fields
    delete extension['@odata.type'];
    delete extension['@odata.context'];
    delete extension.id;
    delete extension.extensionName;

    return extension;
  } catch (error) {
    // Return null if extension doesn't exist
    if (error.message.includes('404') || error.message.includes('not found')) {
      return null;
    }
    throw error;
  }
}

/**
 * Delete protocol metadata from event
 */
async function deleteProtocolMetadata(eventId) {
  try {
    await graphRequest(
      `/me/events/${eventId}/extensions/${EXTENSION_NAME}`,
      'DELETE'
    );
    return { success: true };
  } catch (error) {
    console.error('Error deleting protocol metadata:', error);
    throw error;
  }
}

/**
 * Get user's calendar events with protocol metadata
 */
async function getEventsWithProtocol(startDate, endDate) {
  try {
    const start = startDate || new Date().toISOString();
    const end = endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const events = await graphRequest(
      `/me/calendarview?startDateTime=${start}&endDateTime=${end}&$expand=extensions($filter=id eq '${EXTENSION_NAME}')`
    );

    return events.value || [];
  } catch (error) {
    console.error('Error getting events with protocol:', error);
    throw error;
  }
}

/**
 * Search events by protocol metadata
 */
async function searchEventsByMetadata(field, value) {
  try {
    // Get all events with protocol extensions
    const events = await getEventsWithProtocol();

    // Filter by metadata field
    return events.filter(event => {
      if (!event.extensions || event.extensions.length === 0) {
        return false;
      }

      const protocolExt = event.extensions.find(ext => ext.extensionName === EXTENSION_NAME);
      return protocolExt && protocolExt[field] === value;
    });
  } catch (error) {
    console.error('Error searching events by metadata:', error);
    throw error;
  }
}

/**
 * Get user profile
 */
async function getUserProfile() {
  try {
    return await graphRequest('/me');
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
}

// Export functions
window.graphAPI = {
  getCurrentEvent,
  saveProtocolMetadata,
  loadProtocolMetadata,
  deleteProtocolMetadata,
  getEventsWithProtocol,
  searchEventsByMetadata,
  getUserProfile
};
