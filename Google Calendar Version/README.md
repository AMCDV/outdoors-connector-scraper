# Outdoor Events Calendar Sync - Google Apps Script

Automatically syncs Appalachian Mountain Club (Delaware Valley Chapter) events to Google Calendar with intelligent change detection and daily updates.

## Features
- Daily automatic sync between midnight and 1 AM
- Only processes new, modified, or cancelled events (performance optimized)
- Timezone-aware date parsing ensures events appear on correct days
- Duplicate prevention with calendar verification
- Email notifications for sync summaries
- Automatic cleanup of cancelled events

## Setup Instructions

### 1. Create Google Apps Script Project
1. Go to [script.google.com](https://script.google.com)
2. Click "New Project"
3. Delete default code and paste the contents of `outdoor-events-calendar-sync.gs`
4. Save the project with a descriptive name

### 2. Update Calendar ID
1. Get your Google Calendar ID from calendar settings
2. Update the `CALENDAR_ID` constant in the code (line 23)

### 3. Enable Daily Sync
1. Run the `setupDailySync()` function once
2. Approve permissions when prompted
3. You'll receive a confirmation email with the schedule

### 4. Monitor
- Check email for daily sync summaries (only sent when there are changes)
- View execution logs in Apps Script for troubleshooting

## Available Functions

- `setupDailySync()` - Enable daily automatic synchronization
- `dailySyncOutdoorEvents()` - Main sync function (auto-triggered daily)
- `clearTrackingData()` - Reset tracking data if needed
- `disableDailySync()` - Turn off automatic sync

## Troubleshooting

If you need to start fresh:
1. Run `clearTrackingData()` to reset
2. Re-run `setupDailySync()` to re-enable

## Configuration

The script is currently configured for:
- **Chapter:** Delaware Valley Chapter (AMC)
- **Sync Time:** Daily between midnight and 1 AM
- **Email Notifications:** Enabled for changes and errors

To modify these settings, update the relevant constants and payload in the code.
