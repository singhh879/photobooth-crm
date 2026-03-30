# Photobooth CRM — Design Spec
**Date:** 2026-03-29
**Status:** Approved

---

## Overview

A mobile CRM app for one user (coordinator) to manage photobooth events across 4 cities — Delhi, Mumbai, Nagpur, and Hyderabad. Tracks each event from initial enquiry through to payment. Delivered as an Android APK (sideloaded, no Play Store required). Core principle: minimum taps, minimum typing.

---

## Architecture

| Layer | Technology |
|---|---|
| Mobile App | React Native (Expo) — Android APK |
| Backend API | Node.js + Express (hosted on Render free tier) |
| Database | PostgreSQL via Supabase (free tier) |
| Notifications | Telegram Bot API (free, no setup overhead) |
| Scheduled Jobs | cron-job.org (free external scheduler) pings a backend endpoint at the configured time |

**Data flow:**
- App ↔ API ↔ Database (all create/update operations)
- cron-job.org → Backend endpoint (wakes up Render free tier) → Telegram Bot API → User's Telegram (daily briefing)
- "Send to Boss" tap → API → Telegram Bot API → Boss's Telegram

**Cost: $0/month.** Everything runs on free tiers.

**Note on Render free tier cold start:** Render free tier spins down after 15 minutes of inactivity. When cron-job.org hits the briefing endpoint, Render wakes up (~30 seconds cold start). The daily briefing may arrive ~30 seconds after the scheduled time — acceptable tradeoff to stay free.

**Telegram Bot prerequisites (5-minute setup before development):**
1. Message @BotFather on Telegram, create a new bot, get the bot token
2. She starts a chat with the bot once (so it can message her)
3. Boss starts a chat with the bot once (so it can message the boss)
4. Both chat IDs are saved in Settings

---

## Screens & Navigation

### Bottom Tab Navigation (3 tabs + Settings)

**1. Events Tab**
- City filter at the top: segmented control with options All / Delhi / Mumbai / Nagpur / Hyderabad. Default: All.
- Two sub-sections within the list: **Upcoming** (event date today or future, sorted soonest first) and **Past** (event date has passed, sorted most recent first, collapsed by default with a "Show past events" toggle).
- Each event card shows: client name, event date, city, status badge (Soft Block / Confirmed), completion progress bar
- Tap an event card to open Event Detail screen
- Floating action button (+) in the bottom-right corner to add a new event
- Empty state message: "No events yet — tap + to add one"

**2. Team Tab**
- Roster of saved team members
- Add a person once (name + phone number), available to assign to any event going forward
- Team members can only be archived (not hard-deleted) to preserve historical event records
- Archived members are hidden from the assignment checklist but their names remain on past events

**3. Settings Tab**
- Boss's Telegram chat ID (for "Send to Boss")
- Her own Telegram chat ID (for receiving daily briefing)
- Daily briefing time (default 9am IST)
- App version number displayed at the bottom (e.g. v1.0.0)

### Add Event (Floating Action Button)
- Tapping + opens a minimal creation form: Status, City, Event Date, Client Name
- On save, immediately opens the full Event Detail screen for that event
- If navigated away from before filling Client Name and Event Date (the two meaningful required fields), the event is discarded. Status and City are excluded from this check as they always have defaults.

### Event Detail Screen (from Events tab)
- Tap any field to edit in place
- Auto-saves instantly — no save button
- Fields grouped by lifecycle stage (see below)
- "Send to Boss" button at the top — one tap sends a Telegram summary to boss

---

## Event Fields

All fields live on the Event Detail screen, grouped logically:

### Enquiry
| Field | Input Type |
|---|---|
| Status | Toggle: Soft Block / Confirmed |
| City | 4-option selector: Delhi / Mumbai / Nagpur / Hyderabad |

### Event Details
| Field | Input Type |
|---|---|
| Event Date | Date picker |
| Client Name | Free text |
| Venue | Free text |
| Timings | Time range picker (From / To) |

### Point of Contact
| Field | Input Type |
|---|---|
| POC Name | Free text |
| POC Number | Free text — renders as tap-to-call link |

### Setup
| Field | Input Type |
|---|---|
| Photobooth Type | Dropdown + option to add custom (saved for future use) |
| Package | Dropdown + option to add custom (saved for future use) |
| Number of Prints | Number input |

### Execution
| Field | Input Type |
|---|---|
| Template Status | Dropdown: Not Started / In Progress / Done |
| Team Assignment | Multi-select checklist from saved (non-archived) team roster |

### Financials
| Field | Input Type |
|---|---|
| Invoice Raised | Checkbox |
| Payment Received | Checkbox |

**Free text fields (unavoidable typing):** Client Name, Venue, POC Name, POC Number — 4 fields total. Everything else is tap-based.

---

## Completion Progress Bar

The progress bar on each event card reflects how many of the following 9 key fields are filled (Status is excluded as it always has a default value):

1. City
2. Event Date
3. Client Name
4. Venue
5. Timings (both from and to set)
6. Photobooth Type
7. Package
8. Team Assignment (at least one member assigned)
9. Template Status set to "Done"

Invoice and payment are intentionally excluded from the bar — they are tracked separately with their own checkboxes visible on the card.

---

## Dropdown Options (Persistent Custom Options)

The following fields support fixed defaults + user-added custom options. Custom options are saved to the database and appear in the dropdown for all future events:

- Photobooth Type
- Package

Custom options cannot be deleted (by design — keeps it simple). Typos or stale options are a known tradeoff accepted for this version.

---

## Team Roster

Stored in the database. Each entry has:
- Name
- Phone number (optional)
- Archived flag (default false)

Team members are created once in the Team tab and reused across events via the assignment checklist. Members can be archived to hide them from future assignments while preserving their name on historical event records.

---

## Notifications

### Daily Morning Briefing (automated)
- Triggered by cron-job.org at the user-configured time (default 9am IST). The backend stores and interprets the briefing time as IST (UTC+5:30). cron-job.org must be configured accordingly.
- Sent as a Telegram message to her chat ID
- Content:
  - Events happening today (all cities): venue, timings, team assigned, package
  - Upcoming events in the next 7 days with completion status
  - Any upcoming events where Payment Received is still unchecked

### Send to Boss (on-demand)
- Button on every Event Detail screen
- Sends a formatted Telegram message to boss's chat ID with full event summary
- If any field is empty, it is replaced with "Not set" — the send is never blocked
- Both chat IDs configured in Settings

**Sample "Send to Boss" message:**
```
Event Summary — {{client_name}}
Date: {{event_date}}
City: {{city}}
Venue: {{venue}}
Timings: {{timing_from}} to {{timing_to}}
Package: {{package}}
Setup: {{photobooth_type}}
Team: {{team_members}}
Invoice Raised: {{invoice_raised}}
Payment Received: {{payment_received}}
```

---

## Data Model (simplified)

**events**
- id, status, city, event_date, client_name, venue, timing_from, timing_to
- poc_name, poc_number
- photobooth_type, package, num_prints
- template_status
- invoice_raised (bool), payment_received (bool)
- created_at, updated_at

**team_members**
- id, name, phone_number, archived (bool, default false)

**event_team** (join table)
- event_id, team_member_id

**dropdown_options**
- id, field_name (e.g. "photobooth_type"), value

**settings**
- key, value (boss_telegram_chat_id, user_telegram_chat_id, briefing_time)

---

## Build & Delivery

1. Built with Expo (React Native)
2. APK generated via `eas build --platform android --profile preview`
3. APK sent to her via Telegram or WhatsApp
4. She enables "Install from unknown sources" (one-time) and installs
5. Future updates: new APK sent the same way, she reinstalls (~30 seconds)
6. App version number visible in Settings tab to identify which version is installed
