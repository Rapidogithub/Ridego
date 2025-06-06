# Ride Go - Ride Sharing Web App

A responsive and user-friendly ride-sharing web application with separate interfaces for riders and drivers.

![Ride Go Preview](assets/app-preview.png)

## 📱 Features

### For Riders
- User registration and login
- Location picker with Google Maps integration
- Dynamic ride fare calculation based on distance
- Ride booking and confirmation
- Ride history (coming soon)
- User profile (coming soon)

### For Drivers
- Driver registration and login
- Online/Offline status toggle
- Ride request notifications
- Real-time ride status updates
- Ride history (coming soon)
- Earnings tracker (coming soon)

## 🧱 Technology Stack

- **Frontend:** HTML, CSS, Vanilla JavaScript
- **Maps:** Google Maps JavaScript API
- **Backend:** Supabase (Authentication, Database, Real-time updates)
- **Hosting:** Any static hosting service

## 🚀 Getting Started

### Prerequisites

- A Google Maps API key with the following APIs enabled:
  - Maps JavaScript API
  - Places API
  - Directions API
  - Geocoding API
- A Supabase account and project

### Setup

1. **Clone the repository**
   ```
   git clone https://github.com/yourusername/ride-go.git
   cd ride-go
   ```

2. **Set up Supabase**
   
   - Create a new Supabase project
   - Create the following tables in your Supabase database:
   
   **Users** (handled by Supabase Auth)
   
   **Rides table**:
   ```sql
   CREATE TABLE rides (
     id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) NOT NULL,
     driver_id UUID REFERENCES auth.users(id),
     pickup_location TEXT NOT NULL,
     dropoff_location TEXT NOT NULL,
     fare INTEGER NOT NULL,
     status TEXT NOT NULL,
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   
   -- Enable RLS
   ALTER TABLE rides ENABLE ROW LEVEL SECURITY;
   
   -- Create policies
   CREATE POLICY "Users can see their own rides"
     ON rides FOR SELECT
     USING (auth.uid() = user_id);
     
   CREATE POLICY "Drivers can see available rides and their assigned rides"
     ON rides FOR SELECT
     USING (status = 'requested' OR auth.uid() = driver_id);
     
   CREATE POLICY "Users can create rides"
     ON rides FOR INSERT
     WITH CHECK (auth.uid() = user_id);
     
   CREATE POLICY "Drivers can update ride status"
     ON rides FOR UPDATE
     USING (auth.uid() = driver_id);
   ```

3. **Configure Supabase**
   
   - Open `supabase/config.js`
   - Replace the placeholder values with your Supabase project URL and anon key:
   ```javascript
   const SUPABASE_URL = "https://your-project.supabase.co";
   const SUPABASE_KEY = "your-anon-key";
   ```

4. **Set up Google Maps API**
   
   - Replace the Google Maps API key in all HTML files:
   ```html
   <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places&callback=initMap" async defer></script>
   ```

5. **Deploy the application**
   
   - Upload the files to any static web hosting service
   - Or serve locally using a development server

## 📂 Project Structure

```
ride-go/
├── index.html          (Landing page with login/register)
├── auth.html           (User registration and login)
├── user.html           (User dashboard)
├── driver.html         (Driver dashboard)
├── ride-confirm.html   (Ride confirmation page)
├── test.html           (Application test utility)
├── styles/
│   └── style.css       (Shared styles)
├── scripts/
│   ├── auth.js         (Login/Register logic using Supabase)
│   ├── user.js         (User-side JS logic)
│   ├── driver.js       (Driver-side JS logic)
│   ├── map.js          (Google Maps integration)
│   └── check-setup.js  (Setup verification utility)
├── assets/
│   ├── icons/          (SVG icons for the application)
│   ├── app-preview.png (Preview image for README)
│   └── onboarding-illustration.svg (Illustration for landing page)
├── supabase/
│   └── config.js       (Supabase configuration)
└── documentation/
    ├── README.md           (This file)
    ├── SETUP_GUIDE.md      (Detailed setup instructions)
    └── FEATURES_OVERVIEW.md (Complete feature documentation)
```

## 🧩 How It Works

1. **Authentication**
   - Users can sign up as either riders or drivers
   - Authentication is managed by Supabase Auth

2. **Booking a Ride (Rider)**
   - Rider enters pickup and dropoff locations
   - App calculates the fare based on distance
   - Rider confirms the ride details
   - Ride request is stored in Supabase

3. **Accepting a Ride (Driver)**
   - Drivers receive notifications for nearby ride requests
   - Driver can accept or decline the request
   - If accepted, driver can update ride status:
     - "Arrived at pickup"
     - "Started ride"
     - "Completed ride"

4. **Real-time Updates**
   - All ride status changes are synchronized in real-time
   - Both rider and driver can track the ride progress

## 🔍 Testing the Application

The application includes a test utility (`test.html`) that helps verify:

1. **Setup Check**: Automatically checks if all required components are available
2. **Navigation Test**: Links to all main pages of the application
3. **Resource Tests**: Verify HTML, CSS, JavaScript, and asset files
4. **API Tests**: Test connections to Supabase and Google Maps

To run the tests:
1. Open `test.html` in your browser
2. Click on "Run Setup Check" to automatically verify all components
3. Use the individual test buttons to check specific functionality

## 🔮 Future Enhancements

- Payment integration
- Driver ratings
- Ride scheduling
- Multiple ride options (economy, premium)
- Ride sharing options
- Package delivery service

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👨‍💻 Created by

Your Name - [Github](https://github.com/yourusername) #   R i d e g o  
 