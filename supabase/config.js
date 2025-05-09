// Supabase configuration
const SUPABASE_URL = "https://exqfwhrcxmlzuffsymib.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4cWZ3aHJjeG1senVmZnN5bWliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY3NjIwOTQsImV4cCI6MjA2MjMzODA5NH0.5X3bhnmpYlnHn3dyEP3s5DN1Q2JXYDL_e62RBNpO978";

// Initialize Supabase immediately to avoid potential timing issues
// Define global functions immediately even though they'll be implemented properly later
window.signUp = async function(email, password, firstName, lastName, phone, role) {
    console.log('signUp called before initialization');
    return { user: null, error: new Error('Supabase not initialized yet') };
};

window.signIn = async function(email, password) {
    console.log('signIn called before initialization');
    return { user: null, error: new Error('Supabase not initialized yet') };
};

window.signOut = async function() {
    console.log('signOut called before initialization');
    return { error: new Error('Supabase not initialized yet') };
};

window.getCurrentUser = async function() {
    console.log('getCurrentUser called before initialization');
    return null;
};

window.getUserRole = async function() {
    console.log('getUserRole called before initialization');
    return null;
};

window.createRide = async function() {
    console.log('createRide called before initialization');
    return null;
};

window.getUserRides = async function() {
    console.log('getUserRides called before initialization');
    return [];
};

window.getDriverRides = async function() {
    console.log('getDriverRides called before initialization');
    return [];
};

// Initialize the Supabase client
let supabase = null;

// Load the Supabase JavaScript client and initialize immediately
(function loadSupabaseClient() {
    console.log('Loading Supabase client...');
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.4.0/dist/umd/supabase.min.js';
    script.onload = function() {
        console.log('Supabase script loaded, initializing...');
        initializeSupabase();
    };
    script.onerror = function() {
        console.error('Failed to load Supabase script');
    };
    document.head.appendChild(script);
})();

function initializeSupabase() {
    try {
        if (typeof window.supabase === 'undefined') {
            console.error('Supabase library loaded but window.supabase is undefined');
            setTimeout(initializeSupabase, 500); // Try again after a short delay
            return;
        }
        
        // Initialize Supabase client
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('Supabase client initialized');
        
        // Define and override the global functions with proper implementations
        window.signUp = async function(email, password, firstName, lastName, phone, role) {
            if (!supabase) {
                throw new Error('Supabase client is not initialized');
            }
            
            try {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            first_name: firstName,
                            last_name: lastName,
                            phone: phone,
                            role: role
                        }
                    }
                });
                
                if (error) throw error;
                console.log('User signed up successfully:', data);
                return data;
            } catch (error) {
                console.error('Error signing up:', error.message);
                throw error;
            }
        };
        
        window.signIn = async function(email, password) {
            if (!supabase) {
                throw new Error('Supabase client is not initialized');
            }
            
            try {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password
                });
                
                if (error) throw error;
                console.log('User signed in successfully:', data);
                return data;
            } catch (error) {
                console.error('Error signing in:', error.message);
                throw error;
            }
        };
        
        window.signOut = async function() {
            if (!supabase) {
                throw new Error('Supabase client is not initialized');
            }
            
            try {
                const { error } = await supabase.auth.signOut();
                if (error) throw error;
                console.log('User signed out successfully');
                return true;
            } catch (error) {
                console.error('Error signing out:', error.message);
                throw error;
            }
        };
        
        window.getCurrentUser = async function() {
            if (!supabase) {
                console.error('getCurrentUser: Supabase client is not initialized');
                return null;
            }
            
            try {
                const { data, error } = await supabase.auth.getUser();
                if (error) {
                    console.error('Error getting current user:', error.message);
                    return null;
                }
                return data.user;
            } catch (error) {
                console.error('Error getting current user:', error.message);
                return null;
            }
        };
        
        window.getUserRole = async function() {
            if (!supabase) {
                return null;
            }
            
            try {
                const { data, error } = await supabase.auth.getUser();
                if (error) throw error;
                return data.user?.user_metadata?.role || null;
            } catch (error) {
                console.error('Error getting user role:', error.message);
                return null;
            }
        };
        
        // Mock functions for demo purposes
        window.createRide = async function(pickup, dropoff, price) {
            // This would normally save to Supabase
            return {
                id: 'demo-' + Date.now(),
                pickup_location: pickup,
                dropoff_location: dropoff,
                fare: price,
                status: 'scheduled',
                created_at: new Date().toISOString()
            };
        };
        
        window.getUserRides = async function(status = null) {
            // This would normally fetch from Supabase
            const rides = [
                {
                    id: 'demo-1',
                    pickup_location: 'Sector 8, Jaipur',
                    dropoff_location: 'IT Park, Mansarovar, Jaipur',
                    fare: 150,
                    status: 'scheduled',
                    created_at: new Date().toISOString()
                }
            ];
            
            return status ? rides.filter(ride => ride.status === status) : rides;
        };
        
        window.getDriverRides = async function(status = null) {
            // This would normally fetch from Supabase
            const rides = [
                {
                    id: 'demo-1',
                    pickup_location: 'Sector 8, Jaipur',
                    dropoff_location: 'IT Park, Mansarovar, Jaipur',
                    fare: 150,
                    status: 'scheduled',
                    created_at: new Date().toISOString()
                }
            ];
            
            return status ? rides.filter(ride => ride.status === status) : rides;
        };
        
        // Signal that Supabase is ready
        document.dispatchEvent(new Event('supabase-ready'));
        
    } catch (error) {
        console.error('Error initializing Supabase:', error);
    }
}

// Helper function to check if Supabase is initialized (for other scripts to use)
window.isSupabaseReady = function() {
    return supabase !== null;
};

// Additional Supabase functions that aren't used in auth.js but might be needed elsewhere
function updateRideStatus(rideId, status, driverId = null) {
    if (!supabase) return null;
    
    // Demo implementation
    console.log(`Updating ride ${rideId} status to ${status}${driverId ? ' with driver ' + driverId : ''}`);
    return { id: rideId, status: status, driver_id: driverId };
}

function getRideRequests() {
    if (!supabase) return [];
    
    // Demo implementation
    return [
        {
            id: 'demo-req-1',
            pickup_location: 'Sector 8, Jaipur',
            dropoff_location: 'IT Park, Mansarovar, Jaipur',
            fare: 150,
            status: 'requested',
            created_at: new Date().toISOString()
        }
    ];
}

// Subscribe to real-time updates (demo implementation)
function subscribeToRideUpdates(rideId, callback) {
    console.log(`Subscribing to updates for ride ${rideId}`);
    // In a real implementation, this would use Supabase's real-time subscriptions
    return {
        unsubscribe: function() {
            console.log(`Unsubscribed from updates for ride ${rideId}`);
        }
    };
}

// Make these additional functions available globally too
window.updateRideStatus = updateRideStatus;
window.getRideRequests = getRideRequests;
window.subscribeToRideUpdates = subscribeToRideUpdates; 