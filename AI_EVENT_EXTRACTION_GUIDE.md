# AI Event Extraction System

## How It Works

The smart event creator now **actually fetches and reads webpage content** using Gemini AI to extract event details.

### Architecture

```
User pastes URL
    ↓
1. Check if video conference link (Zoom/Meet/Teams)
   → YES: Use client-side parsing (instant)
   → NO: Continue to step 2
    ↓
2. Fetch actual webpage HTML content
    ↓
3. Clean HTML (remove scripts, styles)
    ↓
4. Send cleaned text to Gemini AI
    ↓
5. AI analyzes page and extracts:
   - Event title
   - Description
   - Date & time
   - Location
   - Organizer
    ↓
6. Display extracted data (user can edit before saving)
```

### Supported Platforms

#### 🎥 Video Conference (Instant Parsing)
- **Zoom**: Extracts meeting ID
- **Google Meet**: Extracts meeting code
- **Microsoft Teams**: Generic meeting title

#### 🎟️ Event Platforms (AI Scraping)
- **Eventbrite**: Full event details
- **Meetup**: Event name, description, location, time
- **Facebook Events**: Event details
- **LinkedIn Events**: Event information
- **Any event website**: AI will try to extract details

### What AI Extracts

From the actual webpage content:

1. **Event Title** - The main event name
2. **Description** - Brief summary of the event
3. **Date & Time** - Converts to YYYY-MM-DDTHH:MM format
4. **Location** - Physical address or "Online"
5. **Organizer** - Who's hosting the event

### Examples

#### Example 1: Eventbrite Event
```
URL: https://eventbrite.com/e/tech-summit-2025-san-francisco
```

**AI Extracts:**
- ✅ Title: "Tech Summit 2025"
- ✅ Description: "Annual technology conference featuring..."
- ✅ Date: "2025-03-15T09:00"
- ✅ Location: "Moscone Center, San Francisco, CA"
- ✅ Organizer: "Tech Events Inc."

#### Example 2: Meetup Event
```
URL: https://meetup.com/javascript-group/events/monthly-coding-session
```

**AI Extracts:**
- ✅ Title: "Monthly Coding Session"
- ✅ Description: "Join us for a collaborative coding..."
- ✅ Date: "2025-02-10T18:00"
- ✅ Location: "123 Main St, New York, NY"

#### Example 3: Zoom Meeting
```
URL: https://zoom.us/j/123456789
```

**Instant Parse (No AI needed):**
- ✅ Title: "Zoom Meeting #123456789"
- ✅ Location: "Zoom (Online)"
- ⏰ Date/Time: User fills in manually

### Technical Details

**API Endpoint:** `/api/scrape-event-page`

**Process:**
1. Fetches webpage with proper User-Agent
2. Strips HTML tags, scripts, styles
3. Limits to first 15,000 characters
4. Sends to Gemini 2.5 Flash with structured prompt
5. Parses JSON response

**AI Prompt Strategy:**
- Instructs AI to only extract explicitly stated information
- No guessing or inferring
- Returns null for missing data
- Converts dates to standard format

### Error Handling

If extraction fails:
- User gets friendly error message
- Can still manually fill in all fields
- Console shows detailed error for debugging

### Performance

- **Video Conference URLs**: < 100ms (client-side)
- **Event Pages**: 2-5 seconds (fetch + AI analysis)
- **Rate Limiting**: Respects Gemini API limits

### Privacy & Security

- ✅ User must be authenticated
- ✅ Only fetches publicly accessible pages
- ✅ Does not store webpage content
- ✅ Only sends cleaned text to AI (no sensitive data)

### Limitations

1. **JavaScript-Heavy Sites**: May not work if event details load via JS
2. **Login-Required Pages**: Can't access private events
3. **Rate Limits**: Gemini API has usage limits
4. **CORS**: Some sites may block requests

### Future Improvements

- [ ] Add caching for frequently accessed URLs
- [ ] Support for iCal/calendar file URLs
- [ ] Batch processing for multiple events
- [ ] Save extracted data history
- [ ] Support for more languages

## Usage Tips

1. **Best Results**: Use direct event page URLs (not registration forms)
2. **Check Data**: Always review extracted data before saving
3. **Edit Freely**: All fields are editable after extraction
4. **Manual Entry**: If extraction fails, just fill in manually
5. **Video Calls**: For Zoom/Meet, you'll need to add date/time manually

## Testing

Try these URLs to see it in action:

1. Any Eventbrite event page
2. Any Meetup event page
3. Zoom meeting link
4. Google Meet link
5. Conference websites
6. Event registration pages

The system is smart enough to handle different formats!

