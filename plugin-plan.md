# 📋 Attio Front Plugin - Implementation Plan

## Overview
This Front sidebar plugin integrates Attio CRM with Front conversations, allowing users to view and update contact details, company information, and deals directly from the Front interface.

### Purpose
- View Attio contact and company data for email senders
- Update contact and company information with save confirmation
- View all related deals sorted by creation date
- Create new contacts when not found in Attio
- Create new deals linked to contacts and companies

### User Problems It Solves
1. **Context Switching**: Eliminates the need to switch between Front and Attio to view CRM data
2. **Data Entry**: Allows quick updates to contact/company information while responding to emails
3. **Deal Tracking**: Provides immediate visibility into active deals with contacts
4. **Lead Capture**: Enables quick person creation for new contacts found in email conversations

---

## Milestones / Phases

### Phase 1: Scaffold Plugin with SDK, Auth, and Context ✅
- [x] Set up project structure with TypeScript and React
- [x] Install and configure Front Plugin SDK
- [x] Create FrontContext provider for SDK integration
- [x] Implement context subscription and updates
- [x] Add Attio API configuration with API key
- [x] Create TypeScript type definitions for Attio API

### Phase 2: Build UI Components ✅
- [x] Create PersonCard component (view/edit contact details)
- [x] Create CompanyCard component (view/edit company details)
- [x] Create DealsSection component (view deals and create new)
- [x] Create CreatePersonCard component (create new contacts)
- [x] Create DebugPanel component (development debugging)
- [x] Implement dark mode support
- [x] Add responsive layout with no horizontal scrolling

### Phase 3: Add API Integration Logic and Main Plugin Functionality ✅
- [x] Implement searchPersonByEmail function
- [x] Implement getPerson and updatePerson functions
- [x] Implement getCompany and updateCompany functions
- [x] Implement listCompanies for organization dropdown
- [x] Implement getDealsForPerson and getDealsForCompany
- [x] Implement createDeal with person/company linking
- [x] Implement getDealStages to fetch stage options dynamically
- [x] Extract "from" email address from Front conversation
- [x] Fetch and display all related deals sorted by creation date

### Phase 4: Add Error Handling and Loading States ✅
- [x] Add try-catch blocks around all API calls
- [x] Display error messages in UI components
- [x] Add loading spinners during data fetching
- [x] Add "Saving..." state for update operations
- [x] Handle API errors gracefully with user-friendly messages
- [x] Add loading banner during initial data load

### Phase 5: Add Edge Case Handling ✅
- [x] Handle case when no conversation is selected
- [x] Handle case when multiple conversations are selected
- [x] Handle case when person not found in Attio (show create option)
- [x] Handle case when person has no company assigned
- [x] Handle case when no deals exist for contact/company
- [x] Handle empty or missing email addresses
- [x] Pre-fill name from email display name when creating person
- [x] Deduplicate deals when contact and company have shared deals

---

## Checklist

### Core Functionality
- [x] Correct plugin type used (sidebar)
- [x] SDK loaded and initialized correctly
- [x] Subscribes to contextUpdates
- [x] Extracts "from" email from conversation messages
- [x] Searches Attio for person by email
- [x] Displays person details (name, email, phone, job title, organization)
- [x] Displays company details (name, domain)
- [x] Displays all deals (name, value, stage) sorted by creation date
- [x] Creates new person when not found
- [x] Creates new deals with automatic person/company linking

### User Interface
- [x] Save buttons required for person updates
- [x] Save buttons required for company updates
- [x] Organization dropdown populated from Attio companies
- [x] Deal stage dropdown populated from Attio API
- [x] US phone number format
- [x] Currency displayed as USD
- [x] Edit/Cancel buttons for person and company cards
- [x] Create/Cancel buttons for new deal form
- [x] Clear visual hierarchy and spacing

### Technical Requirements
- [x] Uses Front SDK methods (listMessages, contextUpdates)
- [x] Uses Front SDK data models/interfaces
- [x] Error handling and fallbacks
- [x] Dark mode support via CSS variables
- [x] Fully typed in TypeScript
- [x] No horizontal scrolling
- [x] Debug mode available with ?debug=true query parameter
- [x] Loading states with spinner animations
- [x] Attio API integration with Bearer token authentication

### Edge Cases
- [x] Handles no conversation selected
- [x] Handles multiple conversations selected
- [x] Handles person not found (show create option)
- [x] Handles missing company assignment
- [x] Handles empty deals list
- [x] Handles API errors gracefully
- [x] Handles missing/invalid email addresses
- [x] Name extraction from email for new person creation

---

## Assumptions

1. **Attio API**: 
   - API key is valid and has necessary permissions
   - Rate limits are sufficient for typical usage
   - Object IDs for People, Companies, and Deals are correct

2. **Email Extraction**:
   - The "from" address in the first message represents the main contact
   - Email addresses are valid and properly formatted
   - Only one email address per "from" field

3. **Data Model**:
   - Person records have standard attributes (name, email, phone, job_title, primary_company)
   - Company records have standard attributes (name, domains)
   - Deal records have standard attributes (name, value, stage, description, people, companies)
   - Currency for deals is always USD

4. **User Workflow**:
   - Users will select a single conversation before using the plugin
   - Users want to see all deals (not filtered by status)
   - Users want deals sorted by creation date (newest first)
   - Phone numbers should be in US format

5. **Front Integration**:
   - Plugin runs as a sidebar (not composer)
   - Users have permissions to view conversation messages
   - Context updates are received in real-time

---

## Front Plugin SDK Methods Used

This plugin utilizes the following Front SDK methods:

### Context Subscription
- `Front.contextUpdates.subscribe()` - Subscribe to context changes
- `subscription.unsubscribe()` - Clean up subscription on unmount

### Conversation Methods
- `context.listMessages()` - Fetch messages from the conversation to extract "from" email

### Context Types Used
- `singleConversation` - Main use case with one conversation selected
- `noConversation` - Edge case when no conversation selected
- `multiConversations` - Edge case when multiple conversations selected

### Context Properties Accessed
- `context.teammate` - Current Front user information
- `context.conversation` - Selected conversation details
  - `conversation.subject` - Email subject line
  - `conversation.status` - Conversation status
  - `conversation.type` - Conversation type
  - `conversation.recipient` - Main recipient info

---

## Debug Mode Features

When running with `?debug=true` query parameter, the plugin includes:

1. **Debug Console Panel**:
   - SDK initialization status
   - Teammate information (name, email, ID)
   - Conversation details (subject, status, type, recipient)
   - Full context JSON viewer

2. **Expandable Sections**:
   - Click to expand/collapse different debug sections
   - View raw JSON data from Front SDK

3. **Live Context Updates**:
   - Real-time display of context changes
   - Useful for testing and troubleshooting

---

## Architecture Overview

### Component Hierarchy
```
App (Main Container)
├── FrontContextProvider (Context wrapper)
├── Header (Plugin title and from email)
├── LoadingBanner (During data fetch)
├── ErrorBanner (On API errors)
├── CreatePersonCard (When person not found)
│   └── Form (Name, Email fields)
├── PersonCard (View/Edit contact)
│   ├── Display Mode (Show contact info)
│   └── Edit Mode (Editable fields + Save/Cancel)
├── CompanyCard (View/Edit company)
│   ├── Display Mode (Show company info)
│   └── Edit Mode (Editable fields + Save/Cancel)
├── DealsSection (View/Create deals)
│   ├── Deals List (Existing deals)
│   └── Create Form (New deal form + Save/Cancel)
└── DebugPanel (Debug mode only)
    ├── Status Indicator
    ├── Teammate Info
    ├── Conversation Details
    └── Full Context JSON
```

### Data Flow
1. Front context updates → FrontContextProvider
2. Extract "from" email from conversation messages
3. Search Attio for person by email
4. Load related company and deals
5. Display data in UI components
6. User edits → Save button → API call → Reload data

### State Management
- React useState for component-level state
- FrontContext for Front SDK context
- No external state management library needed

---

## Future Enhancements (Not Implemented)

Potential features for future versions:

1. **Inline Deal Editing**: Edit existing deals directly from the list
2. **Activity Timeline**: Show recent Attio activities for the contact
3. **Notes**: Add notes to contacts from Front
4. **Tasks**: Create Attio tasks linked to the conversation
5. **Company Creation**: Create new companies when not found
6. **Multi-currency Support**: Support for currencies other than USD
7. **Custom Field Support**: Display and edit custom Attio fields
8. **Search**: Search across all Attio records
9. **Bulk Actions**: Update multiple deals at once
10. **Email Tracking**: Link Front conversation to Attio automatically

---

## Testing Recommendations

### Manual Testing Checklist
- [ ] Test with conversation containing valid email
- [ ] Test with conversation containing invalid/missing email
- [ ] Test with person found in Attio
- [ ] Test with person not found in Attio
- [ ] Test person creation workflow
- [ ] Test person update workflow
- [ ] Test company update workflow
- [ ] Test deal creation with all fields
- [ ] Test deal creation with minimal fields
- [ ] Test with person that has no company
- [ ] Test with person that has no deals
- [ ] Test dark mode appearance
- [ ] Test debug mode with ?debug=true
- [ ] Test error handling (disconnect network, invalid API key)
- [ ] Test loading states

### Edge Case Testing
- [ ] No conversation selected
- [ ] Multiple conversations selected
- [ ] Very long person/company names
- [ ] Special characters in names
- [ ] Multiple companies with same name
- [ ] Deals with no stage assigned
- [ ] API rate limit handling
- [ ] Network timeout scenarios

---

## Deployment Notes

### Local Development
- Runs on `localhost:3000` via Vite
- Hot module reloading for fast development
- Debug mode available with `?debug=true`

### Production Deployment (Vercel)
- Static build output in `/dist` folder
- Automatic HTTPS provided by Vercel
- No environment variables needed (API key in code)
- Instant deployment on push to GitHub

### Configuration Required
1. Front Developer App with plugin feature
2. Plugin URL pointing to deployment
3. Attio API key with appropriate permissions
4. Attio object IDs (people, companies, deals)

---

## Success Metrics

How to measure if the plugin is successful:

1. **Adoption**: Number of Front teammates using the plugin
2. **Usage**: Frequency of plugin opens and data updates
3. **Efficiency**: Time saved vs. switching to Attio directly
4. **Data Quality**: Number of contacts/companies updated
5. **Lead Capture**: Number of new persons created from emails

---

## Support and Maintenance

### Common Issues
- **API Key Invalid**: Check Attio API key has not expired
- **Object IDs Wrong**: Verify Attio object IDs are correct
- **Rate Limiting**: Implement request queuing if needed
- **CORS Errors**: Ensure Vercel deployment has correct headers

### Updating the Plugin
1. Make code changes locally
2. Test with `npm run dev`
3. Commit and push to GitHub
4. Vercel auto-deploys new version
5. Clear browser cache if needed

---

**Plugin Status**: ✅ Ready for Deployment

**Last Updated**: 2025-11-09
