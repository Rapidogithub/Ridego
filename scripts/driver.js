// Driver-specific functionality
document.addEventListener('DOMContentLoaded', function() {
    console.log("Driver app initialized");
    
    // Request notification permission for ride alerts
    if (typeof Notification !== 'undefined' && Notification.permission !== 'granted') {
        Notification.requestPermission();
    }
    
    // Check if we're on the driver dashboard
    if (window.location.pathname.includes('driver.html')) {
        initDriverInterface();
    }
    
    // Check for Supabase ready event to get driver data
    document.addEventListener('supabase-ready', getDriverData);
    
    // IMPORTANT: Listen for ride requests from any page
    // This ensures we capture requests even if they originate from user.html
    console.log("Setting up global ride-request event listener");
    document.addEventListener('ride-request', handleRideRequest);
    
    // Listen for localStorage changes to catch ride requests from other tabs
    window.addEventListener('storage', function(event) {
        if (event.key === 'latest-ride-request') {
            console.log("Detected ride request in localStorage:", event.newValue);
            try {
                const data = JSON.parse(event.newValue);
                // Check if this is a recent request (last 5 minutes)
                if (data && data.timestamp && (Date.now() - data.timestamp < 5 * 60 * 1000)) {
                    console.log("Processing ride request from localStorage");
                    handleRideRequest({ detail: data });
                }
            } catch (error) {
                console.error("Error processing localStorage ride request:", error);
            }
        }
    });
    
    // Also retrieve any pending ride requests from sessionStorage on load
    const pendingRide = sessionStorage.getItem('pending-ride-request');
    if (pendingRide && window.location.pathname.includes('driver.html')) {
        console.log("Found pending ride in session storage:", pendingRide);
        try {
            showRideRequest(JSON.parse(pendingRide));
        } catch (error) {
            console.error("Error showing pending ride:", error);
        }
    }
    
    // Check localStorage for any recent ride requests
    try {
        const latestRequest = localStorage.getItem('latest-ride-request');
        if (latestRequest) {
            const data = JSON.parse(latestRequest);
            // Check if this is a recent request (last 5 minutes)
            if (data && data.timestamp && (Date.now() - data.timestamp < 5 * 60 * 1000)) {
                console.log("Found recent ride request in localStorage");
                // Only process if we don't already have a pending request in sessionStorage
                if (!pendingRide) {
                    console.log("Processing ride request from localStorage");
                    handleRideRequest({ detail: data.ride });
                }
            }
        }
    } catch (error) {
        console.error("Error checking localStorage for ride requests:", error);
    }
});

// Initialize driver interface
async function initDriverInterface() {
    setupDriverUI();
    setupBottomNavigation();
    
    console.log("Checking for pending ride requests...");
    
    // Start the ride request simulator for demo purposes only if we don't have a real ride request
    // In a real app, this would use Supabase real-time subscriptions
    if (!sessionStorage.getItem('pending-ride-request')) {
        console.log("No pending ride requests, will start simulator in 3 seconds");
        setTimeout(startRideRequestSimulator, 3000);
    } else {
        // If we have a pending ride request, show it immediately
        console.log("Found pending ride request, showing it now");
        const rideRequest = JSON.parse(sessionStorage.getItem('pending-ride-request'));
        showRideRequest(rideRequest);
    }
    
    console.log("Driver interface initialized, listening for ride requests...");
}

// Handle a ride request event from user app
function handleRideRequest(event) {
    console.log("Ride request received:", event.detail);
    
    // Store in session storage for persistence
    sessionStorage.setItem('pending-ride-request', JSON.stringify(event.detail));
    
    // If on driver page, show right away
    if (window.location.pathname.includes('driver.html')) {
        console.log("On driver page, showing ride request");
        showRideRequest(event.detail);
    } else {
        console.log("Not on driver page, showing notification");
        // Show notification to navigate to driver page
        if (typeof Notification !== 'undefined' && Notification.permission === "granted") {
            const notification = new Notification("New Ride Request", {
                body: `From: ${event.detail.pickup}\nTo: ${event.detail.dropoff}`,
                icon: "/assets/logo.png"
            });
            
            notification.onclick = function() {
                window.open('/driver.html', '_blank');
            };
        } else {
            console.log("Notifications not available or permission not granted");
        }
    }
}

// Function to display ride request in UI
function showRideRequest(rideData) {
    console.log("Showing ride request in UI:", rideData);
    
    // Get ride request panel element
    const panel = document.getElementById('ride-request-panel');
    if (!panel) {
        console.error("Ride request panel not found in DOM");
        return;
    }
    
    // Update UI with ride details
    const pickupElement = panel.querySelector('.pickup');
    const dropoffElement = panel.querySelector('.dropoff');
    const priceElement = panel.querySelector('.price');
    const timerElement = panel.querySelector('.timer');
    
    if (pickupElement) pickupElement.textContent = rideData.pickup || 'Unknown';
    if (dropoffElement) dropoffElement.textContent = rideData.dropoff || 'Unknown';
    if (priceElement) priceElement.textContent = rideData.price || '$0.00';
    
    // Make panel visible
    panel.classList.add('active');
    
    // Play sound to alert driver
    playSound('/assets/notification.mp3');
    
    // Set up timer for ride request (30 seconds countdown)
    let timeLeft = 30;
    
    if (timerElement) timerElement.textContent = timeLeft + 's';
    
    const timerId = setInterval(() => {
        timeLeft--;
        if (timerElement) timerElement.textContent = timeLeft + 's';
        
        if (timeLeft <= 0) {
            clearInterval(timerId);
            panel.classList.remove('active');
            sessionStorage.removeItem('pending-ride-request');
        }
    }, 1000);
    
    // Store timer ID to clear it if request is accepted/declined
    panel.dataset.timerId = timerId;
    
    // Set up ride action buttons
    setupRideActionButtons(rideData, panel, timerId);
}

// Function to play a sound for notifications
function playSound(src) {
    try {
        const sound = new Audio(src);
        sound.play().catch(error => {
            console.error("Error playing sound:", error);
        });
    } catch (error) {
        console.error("Error creating audio:", error);
    }
}

// Setup ride request buttons
function setupRideRequestButtons(ride, timer, requestPanel) {
    const acceptButton = requestPanel.querySelector('.ride-action-button.accept');
    const declineButton = requestPanel.querySelector('.ride-action-button.decline');
    
    if (!acceptButton || !declineButton) return;
    
    // Remove existing event listeners
    const newAcceptButton = acceptButton.cloneNode(true);
    const newDeclineButton = declineButton.cloneNode(true);
    
    acceptButton.parentNode.replaceChild(newAcceptButton, acceptButton);
    declineButton.parentNode.replaceChild(newDeclineButton, declineButton);
    
    // Add new event listeners
    newAcceptButton.addEventListener('click', () => {
        clearInterval(timer);
        requestPanel.classList.remove('active');
        
        // Clear the pending ride request
        sessionStorage.removeItem('pending-ride-request');
        
        // Show current ride panel
        const currentRidePanel = document.getElementById('active-ride-panel');
        if (currentRidePanel) {
            currentRidePanel.classList.add('active');
        }
        
        // Update ride status in "database"
        if (typeof updateRideStatus === 'function') {
            updateRideStatus(ride.id, 'accepted', 'driver-demo');
        }
        
        // Setup the ride with updated status
        const acceptedRide = { ...ride, status: 'accepted' };
        setupRideActionButtons(acceptedRide);
    });
    
    newDeclineButton.addEventListener('click', () => {
        clearInterval(timer);
        requestPanel.classList.remove('active');
        
        // Clear the pending ride request
        sessionStorage.removeItem('pending-ride-request');
        
        // Update ride status in "database"
        if (typeof updateRideStatus === 'function') {
            updateRideStatus(ride.id, 'declined', null);
        }
        
        // Wait a bit and then try to simulate another request
        setTimeout(startRideRequestSimulator, 10000);
    });
}

// Get driver data from Supabase
async function getDriverData() {
    try {
        const user = await getCurrentUser();
        if (user) {
            // Update driver name in greeting
            const driverNameEl = document.getElementById('driver-name');
            if (driverNameEl) {
                driverNameEl.textContent = user.user_metadata.first_name || 'Driver';
            }
            
            // Check active rides for this driver
            checkActiveDriverRides(user.id);
        }
    } catch (error) {
        console.error('Error getting driver data:', error);
    }
}

// Check if driver has any active rides
async function checkActiveDriverRides(driverId) {
    try {
        // This would normally be a Supabase query
        const activeRides = await getDriverRides('accepted');
        
        if (activeRides && activeRides.length > 0) {
            // Driver has an active ride, show appropriate UI
            showActiveRideUI(activeRides[0]);
        }
    } catch (error) {
        console.error('Error checking active rides:', error);
    }
}

// Show UI for an active ride
function showActiveRideUI(ride) {
    // Show current ride panel
    const currentRidePanel = document.getElementById('active-ride-panel');
    if (currentRidePanel) {
        currentRidePanel.classList.add('active');
        
        // Update the status based on ride status
        updateRideStatusUI(ride.status);
        
        // Setup ride action buttons
        setupRideActionButtons(ride);
    }
}

// Update ride status UI based on ride status
function updateRideStatusUI(status) {
    const statusCircles = document.querySelectorAll('.status-circle');
    const arrivedButton = document.getElementById('arrived-button');
    const startRideButton = document.getElementById('start-ride-button');
    const completeRideButton = document.getElementById('complete-ride-button');
    
    // Reset all buttons and status circles
    arrivedButton.disabled = false;
    startRideButton.disabled = true;
    completeRideButton.disabled = true;
    
    statusCircles.forEach(circle => circle.classList.remove('active'));
    
    // Mark the appropriate status circle as active
    switch (status) {
        case 'accepted':
            statusCircles[0].classList.add('active');
            break;
        case 'arrived':
            statusCircles[0].classList.add('active');
            statusCircles[1].classList.add('active');
            arrivedButton.disabled = true;
            startRideButton.disabled = false;
            break;
        case 'in_progress':
            statusCircles[0].classList.add('active');
            statusCircles[1].classList.add('active');
            arrivedButton.disabled = true;
            startRideButton.disabled = true;
            completeRideButton.disabled = false;
            break;
        case 'completed':
            statusCircles[0].classList.add('active');
            statusCircles[1].classList.add('active');
            statusCircles[2].classList.add('active');
            arrivedButton.disabled = true;
            startRideButton.disabled = true;
            completeRideButton.disabled = true;
            break;
    }
}

// Setup driver UI
function setupDriverUI() {
    // Menu toggle functionality
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            // This would normally open a side menu
            alert('Menu feature coming soon!');
        });
    }
    
    // Driver availability toggle
    const availabilityToggle = document.getElementById('driver-availability');
    const statusText = document.getElementById('status-text');
    
    if (availabilityToggle && statusText) {
        availabilityToggle.addEventListener('change', function() {
            if (this.checked) {
                statusText.textContent = 'Available';
                // In a real app, this would update driver status in Supabase
            } else {
                statusText.textContent = 'Offline';
                // In a real app, this would update driver status in Supabase
            }
        });
    }
    
    // My location button
    const myLocationBtn = document.getElementById('my-location');
    if (myLocationBtn) {
        myLocationBtn.addEventListener('click', () => {
            // This is handled in map.js
        });
    }
}

// Set up bottom navigation for driver
function setupBottomNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            // Remove active class from all items
            navItems.forEach(i => i.classList.remove('active'));
            
            // Add active class to clicked item
            this.classList.add('active');
            
            // Handle navigation actions
            const itemText = this.querySelector('span').textContent.toLowerCase();
            
            if (itemText.includes('ride')) {
                // Already on the rides screen in driver.html
                // Just reset the UI if needed
            } else if (itemText.includes('history')) {
                showRideHistory();
            } else if (itemText.includes('earning')) {
                showEarnings();
            } else if (itemText.includes('profile')) {
                showDriverProfile();
            }
        });
    });
}

// Show ride history UI for driver
function showRideHistory() {
    // This would normally fetch ride history from Supabase and show it
    alert('Ride History feature coming soon!');
}

// Show earnings UI for driver
function showEarnings() {
    // This would normally show earnings data
    alert('Earnings feature coming soon!');
}

// Show driver profile UI
function showDriverProfile() {
    // This would normally show driver profile data
    alert('Driver Profile feature coming soon!');
}

// Setup ride action buttons
function setupRideActionButtons(ride, panel, timerId) {
    // Set up accept and decline buttons in the request panel
    const acceptButton = panel.querySelector('.accept-button');
    const declineButton = panel.querySelector('.decline-button');
    
    if (acceptButton) {
        acceptButton.onclick = function() {
            console.log("Ride accepted:", ride);
            clearInterval(timerId);
            panel.classList.remove('active');
            
            // Clear pending ride request
            sessionStorage.removeItem('pending-ride-request');
            
            // Store current ride
            sessionStorage.setItem('current-accepted-ride', JSON.stringify(ride));
            
            // Update ride status
            sessionStorage.setItem('ride-status', JSON.stringify({
                rideId: ride.id,
                status: 'accepted',
                timestamp: Date.now()
            }));
            
            // Show driver navigation
            showDriverNavigation(ride);
        };
    }
    
    if (declineButton) {
        declineButton.onclick = function() {
            console.log("Ride declined");
            clearInterval(timerId);
            panel.classList.remove('active');
            
            // Clear pending ride request
            sessionStorage.removeItem('pending-ride-request');
        };
    }
    
    // Handle active ride buttons
    const arrivedButton = document.getElementById('arrived-button');
    const startRideButton = document.getElementById('start-ride-button');
    const completeRideButton = document.getElementById('complete-ride-button');
    
    if (arrivedButton) {
        arrivedButton.addEventListener('click', function() {
            console.log("Driver arrived at pickup location");
            
            // Update ride status in sessionStorage
            const currentRide = JSON.parse(sessionStorage.getItem('current-accepted-ride') || '{}');
            sessionStorage.setItem('ride-status', JSON.stringify({
                rideId: currentRide.id,
                status: 'arrived',
                timestamp: Date.now()
            }));
            
            // Show PIN verification section
            const pinVerification = document.getElementById('pin-verification');
            if (pinVerification) {
                pinVerification.classList.add('active');
            }
            
            // Enable start ride button after PIN verification
            const pinSubmitButton = document.getElementById('pin-submit');
            if (pinSubmitButton) {
                pinSubmitButton.addEventListener('click', function() {
                    const pinInput = document.getElementById('pin-input');
                    if (pinInput && pinInput.value === '1234') { // Demo PIN
                        // Enable start ride button
                        startRideButton.disabled = false;
                        showSuccess("PIN verified successfully");
                        // Hide PIN verification
                        pinVerification.classList.remove('active');
                } else {
                        showError("Incorrect PIN. Please try again.");
                    }
                });
                }
            });
        }
        
    if (startRideButton) {
        startRideButton.addEventListener('click', function() {
            console.log("Ride started");
            
            // Update ride status in sessionStorage
            const currentRide = JSON.parse(sessionStorage.getItem('current-accepted-ride') || '{}');
            sessionStorage.setItem('ride-status', JSON.stringify({
                rideId: currentRide.id,
                status: 'in_progress',
                timestamp: Date.now()
            }));
            
            // Enable complete ride button
            completeRideButton.disabled = false;
        });
    }
    
    if (completeRideButton) {
        completeRideButton.addEventListener('click', function() {
            console.log("Ride completed");
            
            // Update ride status in sessionStorage
            const currentRide = JSON.parse(sessionStorage.getItem('current-accepted-ride') || '{}');
            sessionStorage.setItem('ride-status', JSON.stringify({
                rideId: currentRide.id,
                status: 'completed',
                timestamp: Date.now()
            }));
            
            // Show completion message
            setTimeout(() => {
                showSuccess("Ride completed successfully!");
                
                // Reset driver status
                sessionStorage.removeItem('current-accepted-ride');
                
                // Redirect to driver dashboard
                setTimeout(() => {
                    window.location.href = "/driver.html";
                }, 2000);
            }, 1000);
        });
    }
}

// Show driver navigation UI
function showDriverNavigation(ride) {
    console.log("Showing driver navigation for ride:", ride);
    
    // Update active ride details in the UI
    const activeRidePanel = document.getElementById('active-ride-panel');
    if (activeRidePanel) {
        activeRidePanel.classList.add('active');
        
        // Update details
        const pickupElement = activeRidePanel.querySelector('.pickup-location');
        const dropoffElement = activeRidePanel.querySelector('.dropoff-location');
        const fareElement = activeRidePanel.querySelector('.ride-fare');
        
        if (pickupElement) pickupElement.textContent = ride.pickup || 'Unknown';
        if (dropoffElement) dropoffElement.textContent = ride.dropoff || 'Unknown';
        if (fareElement) fareElement.textContent = ride.price || '$0.00';
    }
    
    // Hide other panels
    const driverDashboard = document.getElementById('driver-dashboard');
    if (driverDashboard) {
        driverDashboard.classList.remove('active');
    }
    
    // Initially disable start ride button until arrival
    const startRideButton = document.getElementById('start-ride-button');
    if (startRideButton) {
        startRideButton.disabled = true;
    }
    
    // Initially disable complete ride button until ride starts
    const completeRideButton = document.getElementById('complete-ride-button');
    if (completeRideButton) {
        completeRideButton.disabled = true;
    }
}

// Ride request simulator for demo purposes
function startRideRequestSimulator() {
    // Only simulate if there's no active ride
    const currentRidePanel = document.getElementById('active-ride-panel');
    if (currentRidePanel && currentRidePanel.classList.contains('active')) {
        return;
    }
    
    // Check if driver is available
    const availabilityToggle = document.getElementById('driver-availability');
    if (!availabilityToggle || !availabilityToggle.checked) {
        return;
    }
    
    // Get the request panel
    const requestPanel = document.getElementById('ride-request-panel');
    if (!requestPanel) return;
    
    // Show the request panel
    requestPanel.classList.add('active');
    
    // Set up a timer
    let seconds = 30;
    const timerEl = requestPanel.querySelector('.timer');
    if (!timerEl) return;
    
    const timer = setInterval(() => {
        seconds--;
        timerEl.textContent = `${seconds}s`;
        
        if (seconds <= 0) {
            clearInterval(timer);
            requestPanel.classList.remove('active');
        }
    }, 1000);
    
    // Handle accept/decline buttons
    const acceptButton = requestPanel.querySelector('.accept-button');
    const declineButton = requestPanel.querySelector('.decline-button');
    
    if (!acceptButton || !declineButton) {
        console.error("Accept or decline buttons not found");
        clearInterval(timer);
        return;
    }
    
    // Remove existing event listeners
    const newAcceptButton = acceptButton.cloneNode(true);
    const newDeclineButton = declineButton.cloneNode(true);
    
    acceptButton.parentNode.replaceChild(newAcceptButton, acceptButton);
    declineButton.parentNode.replaceChild(newDeclineButton, declineButton);
    
    // Add new event listeners
    newAcceptButton.addEventListener('click', () => {
        clearInterval(timer);
        requestPanel.classList.remove('active');
        
        // Show current ride panel
        const activeRidePanel = document.getElementById('active-ride-panel');
        if (activeRidePanel) {
            activeRidePanel.classList.add('active');
        
        // Create fake ride object
        const fakeRide = {
            id: 'demo-' + Date.now(),
            status: 'accepted',
            pickup_location: 'Sector 8, Jaipur',
            dropoff_location: 'IT Park, Mansarovar, Jaipur',
            fare: 150,
            user_id: 'demo-user',
            created_at: new Date().toISOString()
        };
        
        // Setup ride action buttons
        setupRideActionButtons(fakeRide);
        }
    });
    
    newDeclineButton.addEventListener('click', () => {
        clearInterval(timer);
        requestPanel.classList.remove('active');
        
        // Wait a bit and then try to simulate another request
        setTimeout(startRideRequestSimulator, 10000);
    });
} 

// Utility functions for displaying messages
function showSuccess(message, duration = 3000) {
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message';
    successMessage.textContent = message;
    
    document.body.appendChild(successMessage);
    
    // Add active class to trigger animation
    setTimeout(() => {
        successMessage.classList.add('active');
    }, 10);
    
    // Remove after duration
    setTimeout(() => {
        successMessage.classList.remove('active');
        
        // Remove from DOM after animation completes
        setTimeout(() => {
            document.body.removeChild(successMessage);
        }, 300);
    }, duration);
}

function showError(message, duration = 3000) {
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.textContent = message;
    
    document.body.appendChild(errorMessage);
    
    // Add active class to trigger animation
    setTimeout(() => {
        errorMessage.classList.add('active');
    }, 10);
    
    // Remove after duration
    setTimeout(() => {
        errorMessage.classList.remove('active');
        
        // Remove from DOM after animation completes
        setTimeout(() => {
            document.body.removeChild(errorMessage);
        }, 300);
    }, duration);
} 