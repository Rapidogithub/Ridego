# Ride Go - Setup Guide

This guide will help you set up and run the Ride Go ride-sharing application on your local system.

## Prerequisites

Before you begin, ensure you have the following:

1. A Google Maps API key with the following APIs enabled:
   - Maps JavaScript API
   - Places API
   - Directions API
   - Geocoding API

2. A Supabase account and project set up with the following:
   - Authentication enabled
   - Database with the rides table (schema provided in README.md)

## Local Setup

### 1. Configure Google Maps API

Open the following files and replace `YOUR_API_KEY` with your actual Google Maps API key:

- user.html (line 103)
- ride-confirm.html (line 74)
- driver.html (line 159)

```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places&callback=initMap" async defer></script>
```

### 2. Configure Supabase

Open `supabase/config.js` and replace the placeholder values with your Supabase project URL and anon key:

```javascript
const SUPABASE_URL = "https://your-project-id.supabase.co";
const SUPABASE_KEY = "your-supabase-anon-key";
```

### 3. Run the Application

#### Option 1: Using a Local Server

The easiest way to run the application is using a local development server:

**Using Python:**

```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Then open your browser and navigate to `http://localhost:8000`

**Using Node.js:**

First, install the http-server package:

```bash
npm install -g http-server
```

Then run the server:

```bash
http-server -p 8000
```

Navigate to `http://localhost:8000` in your browser.

#### Option 2: Using VS Code Live Server

If you're using Visual Studio Code:

1. Install the "Live Server" extension
2. Right-click on `index.html` and select "Open with Live Server"

### 4. Testing the Application

After setting up, you can use the `test.html` page to verify that all components of the application are working correctly:

1. Navigate to `http://localhost:8000/test.html`
2. Use the test buttons to check if all resources are loading correctly
3. Test the navigation to different pages of the application

## Troubleshooting

### CORS Issues

If you encounter CORS (Cross-Origin Resource Sharing) issues when making requests to Supabase or Google Maps, you may need to:

1. Ensure you're running the app from a server, not opening files directly
2. Check that your API keys and URLs are correctly configured
3. Verify that your Supabase project has the correct CORS settings:
   - Go to Supabase Dashboard → Project Settings → API
   - Add your local development URL (e.g., `http://localhost:8000`) to the allowed origins

### Authentication Issues

If you're having trouble with authentication:

1. Check browser console for specific error messages
2. Verify your Supabase configuration
3. Ensure email confirmation is properly set up in your Supabase project

## Next Steps

After successfully setting up the application, you can:

1. Create test user and driver accounts
2. Test the ride booking flow
3. Experiment with the driver dashboard
4. Modify the code to add new features

For more information on the application structure and features, refer to the `README.md` file. 