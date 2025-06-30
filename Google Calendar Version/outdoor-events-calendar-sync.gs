/**
 * =============================================================================
 * OUTDOOR CONNECTOR EVENTS CALENDAR SYNC - PRODUCTION VERSION
 * =============================================================================
 * 
 * Automatically syncs events from the Appalachian Mountain Club (Delaware Valley Chapter)
 * to your Google Calendar with intelligent change detection and daily updates.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Run setupDailySync() once to enable automatic daily synchronization
 * 2. The system will run every night between midnight and 1 AM
 * 3. You'll receive email summaries of any changes
 * 
 * FEATURES:
 * - Intelligent sync: Only processes new, modified, or cancelled events
 * - Timezone-aware date parsing: Events appear on correct days
 * - Duplicate prevention: Verifies against existing calendar events
 * - Automatic cleanup: Removes cancelled events from calendar
 * - Email notifications: Daily summaries of changes (if any)
 * - Event URLs: Placed in location field for easy access
 * 
 * =============================================================================
 */

// Configuration - Update this calendar ID if needed
const CALENDAR_ID = 'c_7a2cff57ce3ddcb2c513a590d9214988fefe041d4d6f1bd1e6436702e5d25dfb@group.calendar.google.com';

/**
 * =============================================================================
 * MAIN SETUP FUNCTION - Run this once to enable daily sync
 * =============================================================================
 */

/**
 * Set up daily automatic sync between midnight and 1 AM
 * Run this function once to enable daily syncing
 */
function setupDailySync() {
  // Delete any existing daily triggers to avoid duplicates
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'dailySyncOutdoorEvents') {
      ScriptApp.deleteTrigger(trigger);
    }
  }
  
  // Create new daily trigger (random minute to spread server load)
  const randomMinute = Math.floor(Math.random() * 60);
  ScriptApp.newTrigger('dailySyncOutdoorEvents')
    .timeBased()
    .everyDays(1)
    .atHour(0) // Midnight
    .nearMinute(randomMinute)
    .create();
    
  Logger.log(`✅ Daily sync enabled for 12:${randomMinute.toString().padStart(2, '0')} AM every day`);
  
  // Send confirmation email
  GmailApp.sendEmail(
    Session.getActiveUser().getEmail(),
    'Outdoor Events - Daily Sync Enabled',
    `Daily automatic sync has been set up!\n\nSchedule: Every day at 12:${randomMinute.toString().padStart(2, '0')} AM\n\nThe system will:\n- Check for new events and add them\n- Update any modified existing events\n- Remove cancelled events\n- Skip unchanged events for better performance\n- Send you an email summary of changes (if any)`
  );
}

/**
 * =============================================================================
 * DAILY SYNC SYSTEM - Automatically called by trigger
 * =============================================================================
 */

/**
 * Main daily sync function - intelligently processes only changed events
 * Called automatically by the daily trigger
 */
function dailySyncOutdoorEvents() {
  try {
    Logger.log('🔄 Starting daily sync of outdoor events...');
    
    // Fetch current events from API
    const apiEvents = getOutdoorEvents();
    Logger.log(`Fetched ${apiEvents.length} events from API`);
    
    // Get tracking data from previous runs
    const tracking = getEventTrackingData();
    
    // Initialize tracking if this is the first run
    if (Object.keys(tracking).length === 0) {
      Logger.log('⚠️ No tracking data found - initializing from existing calendar events...');
      initializeTrackingFromCalendar();
    }
    
    // Get updated tracking data
    const updatedTracking = getEventTrackingData();
    
    // Analyze what's changed since last run
    const changes = analyzeEventChanges(apiEvents, updatedTracking);
    
    // Verify changes against actual calendar to prevent duplicates
    const safeChanges = verifyChangesAgainstCalendar(changes);
    
    // Process only verified changes
    const results = processEventChanges(safeChanges);
    
    // Update tracking data for next run
    updateEventTrackingData(apiEvents);
    
    // Send email summary
    sendDailySyncSummary(results);
    
    Logger.log('✅ Daily sync completed successfully');
    
  } catch (error) {
    Logger.log(`❌ Daily sync failed: ${error.toString()}`);
    
    // Send error notification
    GmailApp.sendEmail(
      Session.getActiveUser().getEmail(),
      'Outdoor Events Daily Sync - FAILED',
      `Daily sync failed with error:\n\n${error.toString()}\n\nTimestamp: ${new Date()}\n\nPlease check the Apps Script execution log for details.`
    );
  }
}

/**
 * =============================================================================
 * EVENT FETCHING AND FORMATTING
 * =============================================================================
 */

/**
 * Fetches events from the outdoors.org API
 * @return {Array} Array of formatted event objects
 */
function getOutdoorEvents() {
  const url = 'https://activities.outdoors.org/s/sfsites/aura?r=135&aura.ApexAction.execute=1';
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:139.0) Gecko/20100101 Firefox/139.0',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.5',
    'Referer': 'https://activities.outdoors.org/',
    'X-SFDC-LDS-Endpoints': 'ApexActionController.execute:OC_ActivitySearchController.searchForActivitiesApplyFilters',
    'X-SFDC-Page-Scope-Id': 'd188486d-32f1-41ed-8594-51b92a3349b6',
    'X-SFDC-Request-Id': '2218902000000f217e',
    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    'X-B3-TraceId': '92ad774e97511890',
    'X-B3-SpanId': '23f721a599592d41',
    'X-B3-Sampled': '0',
    'Origin': 'https://activities.outdoors.org',
    'DNT': '1',
    'Connection': 'keep-alive',
    'Cookie': 'renderCtx=%7B%22pageId%22%3A%223e01151f-cdd6-4058-af41-906813477461%22%2C%22schema%22%3A%22Published%22%2C%22viewType%22%3A%22Published%22%2C%22brandingSetId%22%3A%22457e5b18-486f-4d74-97c2-cc6e6662c03a%22%2C%22audienceIds%22%3A%226AuUN0000001lD2%2C6AuUN0000001lD1%2C6AuUN0000002FMN%22%7D; CookieConsentPolicy=0:1; LSKey-c$CookieConsentPolicy=0:1; pctrk=843a204b-8e06-4e18-b893-eb4e4b616028; _gcl_au=1.1.1317254722.1750805931'
  };
  
  // API payload with search filters (currently set for Delaware Valley Chapter)
  const payload = 'message=%7B%22actions%22%3A%5B%7B%22id%22%3A%22425%3Ba%22%2C%22descriptor%22%3A%22aura%3A%2F%2FApexActionController%2FACTION%24execute%22%2C%22callingDescriptor%22%3A%22UNKNOWN%22%2C%22params%22%3A%7B%22namespace%22%3A%22%22%2C%22classname%22%3A%22OC_ActivitySearchController%22%2C%22method%22%3A%22searchForActivitiesApplyFilters%22%2C%22params%22%3A%7B%22filtersJsonSpecs%22%3A%22%7B%5C%22location%5C%22%3A%7B%5C%22latitude%5C%22%3A0%2C%5C%22longitude%5C%22%3A0%2C%5C%22radius%5C%22%3A100%2C%5C%22address%5C%22%3A%5C%22%5C%22%7D%2C%5C%22additionalFilters%5C%22%3A%7B%5C%22audiences%5C%22%3A%5C%22--all--%5C%22%2C%5C%22programTypes%5C%22%3A%5C%22--all--%5C%22%2C%5C%22openForRegistration%5C%22%3Afalse%2C%5C%22noCostTrips%5C%22%3Afalse%2C%5C%22chapters%5C%22%3A%5C%220015000001Sg06BAAR%5C%22%7D%7D%22%7D%2C%22cacheable%22%3Afalse%2C%22isContinuation%22%3Afalse%7D%7D%5D%7D%5E&aura.context=%7B%22mode%22%3A%22PROD%22%2C%22fwuid%22%3A%22VXlnM1FET1BLV0NVVUNZMW9MNmU3UWdLNVAwNUkzRVNnOFJ1eVRYdHBvVVExMi42MjkxNDU2LjE2Nzc3MjE2%22%2C%22app%22%3A%22siteforce%3AcommunityApp%22%2C%22loaded%22%3A%7B%22APPLICATION%40markup%3A%2F%2Fsiteforce%3AcommunityApp%22%3A%221296_E-0fs7eMs-UxUK_92StDMQ%22%7D%2C%22dn%22%3A%5B%5D%2C%22globals%22%3A%7B%7D%2C%22uad%22%3Atrue%7D%5E&aura.pageURI=%2Fs%2F%3Fchapters%3D0015000001Sg06BAAR%5E&aura.token=null';
  
  const options = {
    'method': 'POST',
    'headers': headers,
    'payload': payload
  };
  
  const response = UrlFetchApp.fetch(url, options);
  const responseData = JSON.parse(response.getContentText());
  
  return formatEvents(responseData);
}

/**
 * Formats raw API response into clean event objects with timezone-aware date parsing
 * @param {Object} responseData - Raw API response
 * @return {Array} Array of formatted event objects
 */
function formatEvents(responseData) {
  const actions = responseData.actions;
  const actionsData = actions[0].returnValue.returnValue;
  const events = [];
  
  for (const event of actionsData) {
    // Parse dates as LOCAL dates to avoid timezone conversion issues
    const startDateParts = event.Start_Date__c.split('-');
    const endDateParts = event.End_Date__c.split('-');
    
    // Create dates in local timezone (year, month-1, day)
    const startDate = new Date(
      parseInt(startDateParts[0]), 
      parseInt(startDateParts[1]) - 1, 
      parseInt(startDateParts[2])
    );
    
    let endDate = new Date(
      parseInt(endDateParts[0]), 
      parseInt(endDateParts[1]) - 1, 
      parseInt(endDateParts[2])
    );
    
    // For Google Calendar all-day events, end date must be day after last day
    endDate = new Date(endDate.getTime() + (24 * 60 * 60 * 1000));
    
    events.push({
      title: event.Activity_Name__c,
      startDate: startDate,
      endDate: endDate,
      url: 'https://activities.outdoors.org/s/oc-activity/' + event.Id,
      description: event.Description__c ? event.Description__c.replace(/\n/g, ' ') : '',
      location: event.Location__c || ''
    });
  }
  
  return events;
}

/**
 * =============================================================================
 * CHANGE DETECTION AND TRACKING
 * =============================================================================
 */

/**
 * Initialize tracking data from existing calendar events
 * Called automatically on first run if no tracking data exists
 */
function initializeTrackingFromCalendar() {
  const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  if (!calendar) {
    throw new Error(`Cannot access calendar with ID: ${CALENDAR_ID}`);
  }
  
  // Get events from next 12 months
  const startDate = new Date();
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1);
  
  const allEvents = calendar.getEvents(startDate, endDate);
  const apiEvents = getOutdoorEvents();
  
  const tracking = {};
  let matchedEvents = 0;
  
  for (const calEvent of allEvents) {
    // Check if this looks like an outdoor event
    const isOutdoorEvent = isOutdoorEventPattern(calEvent.getTitle(), calEvent.getDescription());
    
    if (isOutdoorEvent) {
      // Find matching API event
      const matchingApiEvent = apiEvents.find(apiEvent => 
        apiEvent.title === calEvent.getTitle() &&
        Math.abs(apiEvent.startDate.getTime() - calEvent.getStartTime().getTime()) < (24 * 60 * 60 * 1000)
      );
      
      if (matchingApiEvent) {
        const checksum = createEventChecksum(matchingApiEvent);
        tracking[matchingApiEvent.url] = {
          title: matchingApiEvent.title,
          checksum: checksum,
          lastSeen: new Date().toISOString(),
          startDate: matchingApiEvent.startDate.toISOString(),
          endDate: matchingApiEvent.endDate.toISOString()
        };
        matchedEvents++;
      }
    }
  }
  
  // Save tracking data
  const properties = PropertiesService.getScriptProperties();
  properties.setProperty('outdoorEventsTracking', JSON.stringify(tracking));
  
  Logger.log(`📊 Initialized tracking for ${matchedEvents} existing events`);
  return { matchedEvents, totalTracked: Object.keys(tracking).length };
}

/**
 * Get stored tracking data for events
 * @return {Object} Tracking data object
 */
function getEventTrackingData() {
  const properties = PropertiesService.getScriptProperties();
  const trackingData = properties.getProperty('outdoorEventsTracking');
  
  if (!trackingData) {
    return {};
  }
  
  try {
    return JSON.parse(trackingData);
  } catch (error) {
    Logger.log(`⚠️ Error parsing tracking data: ${error.toString()}`);
    return {};
  }
}

/**
 * Update stored tracking data with current event state
 * @param {Array} events - Current events from API
 */
function updateEventTrackingData(events) {
  const tracking = {};
  
  for (const event of events) {
    const checksum = createEventChecksum(event);
    tracking[event.url] = {
      title: event.title,
      checksum: checksum,
      lastSeen: new Date().toISOString(),
      startDate: event.startDate.toISOString(),
      endDate: event.endDate.toISOString()
    };
  }
  
  const properties = PropertiesService.getScriptProperties();
  properties.setProperty('outdoorEventsTracking', JSON.stringify(tracking));
}

/**
 * Create a checksum for an event to detect changes
 * @param {Object} event - Event object
 * @return {String} Checksum string
 */
function createEventChecksum(event) {
  const combined = `${event.title}|${event.startDate.toISOString()}|${event.endDate.toISOString()}|${event.description}|${event.location}`;
  
  // Simple hash function for change detection
  let hash = 0;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString();
}

/**
 * Analyze what events have changed since last run
 * @param {Array} apiEvents - Current events from API
 * @param {Object} tracking - Previous tracking data
 * @return {Object} Changes analysis
 */
function analyzeEventChanges(apiEvents, tracking) {
  const changes = {
    new: [],
    modified: [],
    unchanged: [],
    removed: []
  };
  
  // Check each API event against tracking data
  for (const event of apiEvents) {
    const currentChecksum = createEventChecksum(event);
    
    if (!tracking[event.url]) {
      changes.new.push(event);
    } else if (tracking[event.url].checksum !== currentChecksum) {
      changes.modified.push(event);
    } else {
      changes.unchanged.push(event);
    }
  }
  
  // Check for removed events (in tracking but not in current API)
  const currentUrls = new Set(apiEvents.map(e => e.url));
  for (const trackedUrl of Object.keys(tracking)) {
    if (!currentUrls.has(trackedUrl)) {
      changes.removed.push(tracking[trackedUrl]);
    }
  }
  
  Logger.log(`📈 Changes: ${changes.new.length} new, ${changes.modified.length} modified, ${changes.removed.length} removed`);
  return changes;
}

/**
 * Verify changes against actual calendar to prevent duplicates
 * @param {Object} changes - Changes from analysis
 * @return {Object} Verified safe changes
 */
function verifyChangesAgainstCalendar(changes) {
  const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  const safeChanges = {
    new: [],
    modified: changes.modified,
    unchanged: changes.unchanged,
    removed: changes.removed
  };
  
  // Double-check "new" events to ensure they don't already exist
  for (const event of changes.new) {
    const existingEvents = calendar.getEvents(event.startDate, event.endDate, {
      search: event.title
    });
    
    const alreadyExists = existingEvents.some(existing => 
      existing.getTitle() === event.title &&
      Math.abs(existing.getStartTime().getTime() - event.startDate.getTime()) < (24 * 60 * 60 * 1000)
    );
    
    if (!alreadyExists) {
      safeChanges.new.push(event);
    } else {
      safeChanges.unchanged.push(event);
    }
  }
  
  return safeChanges;
}

/**
 * =============================================================================
 * CALENDAR OPERATIONS
 * =============================================================================
 */

/**
 * Process verified changes and update calendar
 * @param {Object} changes - Verified changes to process
 * @return {Object} Results summary
 */
function processEventChanges(changes) {
  const calendar = CalendarApp.getCalendarById(CALENDAR_ID);
  const results = {
    newAdded: 0,
    modified: 0,
    removed: 0,
    errors: []
  };
  
  // Add new events
  for (const event of changes.new) {
    try {
      calendar.createAllDayEvent(
        event.title,
        event.startDate,
        event.endDate,
        {
          description: event.description,
          location: event.url // URL in location field
        }
      );
      Logger.log(`➕ Added: ${event.title}`);
      results.newAdded++;
    } catch (error) {
      Logger.log(`❌ Error adding ${event.title}: ${error.toString()}`);
      results.errors.push(`Add ${event.title}: ${error.toString()}`);
    }
  }
  
  // Update modified events
  for (const event of changes.modified) {
    try {
      const existingEvents = calendar.getEvents(event.startDate, event.endDate, {
        search: event.title
      });
      
      if (existingEvents.length > 0) {
        const existingEvent = existingEvents[0];
        existingEvent.setTitle(event.title);
        existingEvent.setDescription(event.description);
        existingEvent.setLocation(event.url); // URL in location field
        
        Logger.log(`✏️ Updated: ${event.title}`);
        results.modified++;
      }
    } catch (error) {
      Logger.log(`❌ Error updating ${event.title}: ${error.toString()}`);
      results.errors.push(`Update ${event.title}: ${error.toString()}`);
    }
  }
  
  // Remove cancelled events
  for (const removedEvent of changes.removed) {
    try {
      const startDate = new Date(removedEvent.startDate);
      const endDate = new Date(removedEvent.endDate);
      const existingEvents = calendar.getEvents(startDate, endDate, {
        search: removedEvent.title
      });
      
      for (const existingEvent of existingEvents) {
        if (existingEvent.getTitle() === removedEvent.title) {
          existingEvent.deleteEvent();
          Logger.log(`🗑️ Removed: ${removedEvent.title}`);
          results.removed++;
        }
      }
    } catch (error) {
      Logger.log(`❌ Error removing ${removedEvent.title}: ${error.toString()}`);
      results.errors.push(`Remove ${removedEvent.title}: ${error.toString()}`);
    }
  }
  
  return results;
}

/**
 * =============================================================================
 * UTILITY FUNCTIONS
 * =============================================================================
 */

/**
 * Check if event matches outdoor event patterns
 * @param {String} title - Event title
 * @param {String} description - Event description
 * @return {Boolean} True if appears to be outdoor event
 */
function isOutdoorEventPattern(title, description) {
  return (
    description.includes('activities.outdoors.org/s/oc-activity/') ||
    title.includes('Hike') ||
    title.includes('Evening') ||
    title.includes('Morning') ||
    title.includes('Valley Forge') ||
    title.includes('French Creek') ||
    title.includes('AMC') ||
    title.includes('Backpacking') ||
    title.includes('Campout') ||
    title.includes('Trail') ||
    title.includes('Walk') ||
    title.includes('Delaware Valley Chapter')
  );
}

/**
 * Send email summary of daily sync results
 * @param {Object} results - Sync results
 */
function sendDailySyncSummary(results) {
  const hasChanges = results.newAdded > 0 || results.modified > 0 || results.removed > 0;
  
  if (!hasChanges && results.errors.length === 0) {
    // Brief summary for no changes
    GmailApp.sendEmail(
      Session.getActiveUser().getEmail(),
      'Outdoor Events Daily Sync - No Changes',
      `Daily sync completed successfully at ${new Date().toLocaleString()}\n\nNo new, modified, or cancelled events detected.\n\nNext sync: Tomorrow at the same time.`
    );
    return;
  }
  
  // Detailed summary for changes or errors
  let summary = `Daily Outdoor Events Sync Summary\n`;
  summary += `Time: ${new Date().toLocaleString()}\n\n`;
  summary += `📊 CHANGES PROCESSED:\n`;
  summary += `   ➕ New events added: ${results.newAdded}\n`;
  summary += `   ✏️ Events updated: ${results.modified}\n`;
  summary += `   🗑️ Cancelled events removed: ${results.removed}\n\n`;
  
  if (results.errors.length > 0) {
    summary += `❌ ERRORS (${results.errors.length}):\n`;
    for (const error of results.errors) {
      summary += `   • ${error}\n`;
    }
    summary += `\n`;
  }
  
  summary += `Next sync: Tomorrow at the same time.`;
  
  const subject = results.errors.length > 0 
    ? 'Outdoor Events Daily Sync - Completed with Errors'
    : 'Outdoor Events Daily Sync - Changes Processed';
  
  GmailApp.sendEmail(
    Session.getActiveUser().getEmail(),
    subject,
    summary
  );
}

/**
 * =============================================================================
 * MAINTENANCE FUNCTIONS
 * =============================================================================
 */

/**
 * Clear all tracking data - use if you need to start fresh
 */
function clearTrackingData() {
  const properties = PropertiesService.getScriptProperties();
  properties.deleteProperty('outdoorEventsTracking');
  Logger.log('🗑️ Cleared all tracking data - next sync will treat all events as new');
  
  GmailApp.sendEmail(
    Session.getActiveUser().getEmail(),
    'Outdoor Events - Tracking Data Cleared',
    `Event tracking data has been cleared.\n\nThe next daily sync will treat all events as new.\n\nThis is useful if you want to start fresh or if you suspect the tracking data is corrupted.`
  );
}

/**
 * Disable daily sync by removing all triggers
 */
function disableDailySync() {
  const triggers = ScriptApp.getProjectTriggers();
  let removedCount = 0;
  
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'dailySyncOutdoorEvents') {
      ScriptApp.deleteTrigger(trigger);
      removedCount++;
    }
  }
  
  Logger.log(`🛑 Disabled daily sync - removed ${removedCount} triggers`);
  
  GmailApp.sendEmail(
    Session.getActiveUser().getEmail(),
    'Outdoor Events - Daily Sync Disabled',
    `Daily sync has been disabled.\n\nRemoved ${removedCount} automatic triggers.\n\nTo re-enable, run setupDailySync() again.`
  );
}
