// User-specific functionality
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the user dashboard or ride confirmation page
    if (window.location.pathname.includes('user.html') || window.location.pathname.includes('ride-confirm.html')) {
        initUserInterface();
        
        // Check for URL parameters
        checkURLParameters();
        
        // Load previous destinations
        loadSavedDestinations();
    }
    
    // Check for Supabase ready event to get user data
    document.addEventListener('supabase-ready', getUserData);
});

// Initialize user interface
async function initUserInterface() {
    // Set up bottom navigation
    setupBottomNavigation();
    
    // Setup UI components based on the current page
    if (window.location.pathname.includes('user.html')) {
        setupUserDashboardUI();
    } else if (window.location.pathname.includes('ride-confirm.html')) {
        setupRideConfirmationUI();
    }
}

// Load saved destinations from localStorage
function loadSavedDestinations() {
    if (!window.location.pathname.includes('user.html')) return;
    
    try {
        const savedDestinations = JSON.parse(localStorage.getItem('savedDestinations')) || [];
        
        // Get the container for suggestion cards
        const suggestionCardsContainer = document.querySelector('.suggestion-cards');
        if (!suggestionCardsContainer) return;
        
        // Keep the default suggestions if no saved destinations
        if (savedDestinations.length === 0) return;
        
        // Clear existing suggestion cards and add saved ones
        // But keep at least the first two default cards (Home, Office)
        const defaultCards = suggestionCardsContainer.querySelectorAll('.suggestion-card');
        const homeCard = defaultCards[0];
        const officeCard = defaultCards[1];
        
        // Clear container
        suggestionCardsContainer.innerHTML = '';
        
        // Add back the default cards
        if (homeCard) suggestionCardsContainer.appendChild(homeCard);
        if (officeCard) suggestionCardsContainer.appendChild(officeCard);
        
        // Add saved destinations (up to 3 more)
        for (let i = 0; i < Math.min(savedDestinations.length, 3); i++) {
            const dest = savedDestinations[i];
            
            // Create a new suggestion card
            const card = document.createElement('div');
            card.className = 'suggestion-card';
            card.innerHTML = `
                <i class="fas fa-map-marker-alt"></i>
                <span>${dest.name}</span>
            `;
            
            // Add click event
            card.addEventListener('click', function() {
                const locationText = dest.name;
                
                // Show booking panel
                const bookingPanel = document.getElementById('ride-booking-panel');
                if (bookingPanel) {
                    bookingPanel.classList.add('active');
                    updateStepIndicator(1);
                }
                
                // Pre-fill dropoff location
                const dropoffInput = document.querySelector('#dropoff-location input');
                if (dropoffInput) {
                    dropoffInput.value = locationText;
                    dropoffInput.dispatchEvent(new Event('change'));
                }
                
                // Pre-fill pickup with current location placeholder
                const pickupInput = document.querySelector('#pickup-location input');
                if (pickupInput && !pickupInput.value) {
                    pickupInput.value = 'Current Location';
                    
                    // Trigger location inputs check 
                    pickupInput.dispatchEvent(new Event('change'));
                }
            });
            
            // Add to container
            suggestionCardsContainer.appendChild(card);
        }
    } catch (error) {
        console.error('Error loading saved destinations:', error);
    }
}

// Save destination to history
function saveDestination(name, location) {
    try {
        const savedDestinations = JSON.parse(localStorage.getItem('savedDestinations')) || [];
        
        // Check if this destination already exists
        const existingIndex = savedDestinations.findIndex(dest => dest.name === name);
        
        // If it exists, remove it (we'll add it to the top)
        if (existingIndex !== -1) {
            savedDestinations.splice(existingIndex, 1);
        }
        
        // Add to the beginning of the array (most recent first)
        savedDestinations.unshift({
            name: name,
            location: location,
            timestamp: new Date().toISOString()
        });
        
        // Keep only the most recent 10 destinations
        const trimmedDestinations = savedDestinations.slice(0, 10);
        
        // Save back to localStorage
        localStorage.setItem('savedDestinations', JSON.stringify(trimmedDestinations));
    } catch (error) {
        console.error('Error saving destination:', error);
    }
}

// Get user data from Supabase
async function getUserData() {
    try {
        const user = await getCurrentUser();
        if (user) {
            // Update user name in greeting
            const userNameEl = document.getElementById('user-name');
            if (userNameEl) {
                userNameEl.textContent = user.user_metadata.first_name || 'User';
            }
            
            // Check active rides for this user
            checkActiveRides(user.id);
        }
    } catch (error) {
        console.error('Error getting user data:', error);
    }
}

// Check if user has any active rides
async function checkActiveRides(userId) {
    try {
        // This would normally be a Supabase query
        const activeRides = await getUserRides('accepted');
        
        if (activeRides && activeRides.length > 0) {
            // User has an active ride, show appropriate UI
            showActiveRideUI(activeRides[0]);
        }
    } catch (error) {
        console.error('Error checking active rides:', error);
    }
}

// Show UI for an active ride
function showActiveRideUI(ride) {
    // This would be implemented to show a live-tracking UI for an active ride
    // For demo purposes, we'll just show an alert if we're on the user dashboard
    if (window.location.pathname.includes('user.html')) {
        setTimeout(() => {
            const confirmTracking = confirm('You have an active ride. Do you want to track it?');
            if (confirmTracking) {
                // Redirect to a ride tracking page (not implemented in this demo)
                // For demo purposes, we'll show ride details in an alert
                alert(`
                    Ride Details:
                    Pickup: ${ride.pickup_location}
                    Dropoff: ${ride.dropoff_location}
                    Status: ${ride.status}
                    Fare: ₹${ride.fare}
                `);
            }
        }, 2000);
    }
}

// Set up bottom navigation
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
            
            if (itemText.includes('home')) {
                // Home - Reset the UI to initial state
                resetBookingUI();
            } else if (itemText.includes('ride now') || itemText.includes('ride')) {
                // Ride Now - Show the ride booking panel or redirect to booking page
                showRideBookingPanel();
            } else if (itemText.includes('package')) {
                // Package Delivery - Future feature
                alert('Package delivery feature coming soon!');
            } else if (itemText.includes('profile')) {
                // Profile page
                alert('Profile feature coming soon!');
            }
        });
    });
}

// Reset the booking UI to its initial state
function resetBookingUI() {
    // Only applicable on user dashboard
    if (!window.location.pathname.includes('user.html')) return;
    
    // Clear destination search
    document.getElementById('destination-search').value = '';
    
    // Hide booking panel if visible
    const bookingPanel = document.getElementById('ride-booking-panel');
    if (bookingPanel && bookingPanel.classList.contains('active')) {
        bookingPanel.classList.remove('active');
    }
}

// Show the ride booking panel for Ride Now
function showRideBookingPanel() {
    // Focus on the destination search input
    const destinationSearch = document.getElementById('destination-search');
    if (destinationSearch) {
        destinationSearch.focus();
    }
    
    // Show the booking panel directly if we're already on the user page
    // Otherwise, redirect to user.html
    if (window.location.pathname.includes('user.html')) {
        const bookingPanel = document.getElementById('ride-booking-panel');
        if (bookingPanel) {
            bookingPanel.classList.add('active');
            
            // Update step indicator - currently at step 1
            updateStepIndicator(1);
            
            // Add event listeners for step progress
            setupStepProgressListeners();
        }
    } else {
        window.location.href = 'user.html?action=ride';
    }
}

// Update step indicator to show the current step
function updateStepIndicator(currentStep) {
    const steps = document.querySelectorAll('.step-indicator .step');
    if (!steps || steps.length === 0) return;
    
    steps.forEach((step, index) => {
        if (index + 1 === currentStep) {
            // Current step
            step.classList.add('active');
            step.classList.remove('completed');
        } else if (index + 1 < currentStep) {
            // Completed steps
            step.classList.add('completed');
            step.classList.remove('active');
        } else {
            // Future steps
            step.classList.remove('active');
            step.classList.remove('completed');
        }
    });
}

// Setup listeners for transitioning between steps
function setupStepProgressListeners() {
    // When user has entered both pickup and dropoff locations, move to step 2
    const pickupInput = document.getElementById('pickup-location');
    const dropoffInput = document.getElementById('dropoff-location');
    
    if (pickupInput && dropoffInput) {
        const checkLocationInputs = () => {
            if (pickupInput.value && dropoffInput.value) {
                // Both inputs have values, move to step 2
                updateStepIndicator(2);
            }
        };
        
        pickupInput.addEventListener('change', checkLocationInputs);
        dropoffInput.addEventListener('change', checkLocationInputs);
        
        // Also check if inputs already have values (e.g. from autocomplete)
        const inputEvent = new Event('change');
        setTimeout(() => {
            pickupInput.dispatchEvent(inputEvent);
        }, 1000);
    }
    
    // When user selects a ride option and clicks book ride, move to step 3 (by going to confirmation page)
    const bookRideButton = document.querySelector('.book-ride-button');
    if (bookRideButton) {
        // The existing event listener in map.js will handle the transition to the confirmation page
        // where step 3 will be shown as active
    }
}

// Check if there's an action parameter in the URL
function checkURLParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    
    if (action === 'ride') {
        // Trigger Ride Now action
        setTimeout(showRideBookingPanel, 1000);
    }
}

// Setup user dashboard UI components
function setupUserDashboardUI() {
    // Menu toggle functionality
    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', () => {
            // This would normally open a side menu
            alert('Menu feature coming soon!');
        });
    }

    // Setup notification button
    const notificationButton = document.querySelector('.notification-btn');
    if (notificationButton) {
        notificationButton.addEventListener('click', () => {
            alert('You have 2 new notifications.');
        });
    }
    
    // Setup ride now main button
    const rideNowBtn = document.getElementById('ride-now-btn');
    if (rideNowBtn) {
        rideNowBtn.addEventListener('click', showRideBookingPanel);
    }
    
    // Setup quick action items
    const quickActionItems = document.querySelectorAll('.quick-action-item');
    if (quickActionItems.length > 0) {
        quickActionItems.forEach(item => {
            item.addEventListener('click', function() {
                const actionText = this.querySelector('span').textContent.toLowerCase();
                
                if (actionText.includes('schedule')) {
                    alert('Schedule ride feature coming soon!');
                } else if (actionText.includes('package')) {
                    alert('Package delivery feature coming soon!');
                } else if (actionText.includes('history')) {
                    alert('Ride history feature coming soon!');
                } else if (actionText.includes('saved')) {
                    alert('Saved locations feature coming soon!');
                }
            });
        });
    }
    
    // Setup suggestion cards
    setupSuggestionCards();
}

// Setup ride confirmation UI components
function setupRideConfirmationUI() {
    // Current date and time for the ride
    const now = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'short' };
    const formattedDate = now.toLocaleDateString('en-US', options);
    
    // Format time in 12-hour format with AM/PM
    let hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // 0 should be displayed as 12
    const formattedTime = `${hours}:${minutes.toString().padStart(2, '0')}`;
    
    // Update date and time in the UI
    const dayTimeEl = document.querySelector('.day-time');
    const rideHourEl = document.querySelector('.ride-hour');
    
    if (dayTimeEl) {
        dayTimeEl.textContent = `(${formattedDate})`;
    }
    
    if (rideHourEl) {
        rideHourEl.innerHTML = `${formattedTime}<span class="am-pm">${ampm}</span>`;
    }
    
    // Terms and conditions link
    const termsLink = document.querySelector('.terms-link');
    if (termsLink) {
        termsLink.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Terms & Conditions feature coming soon!');
        });
    }
}

// Setup suggestion cards
function setupSuggestionCards() {
    const suggestionCards = document.querySelectorAll('.suggestion-card');
    if (suggestionCards.length > 0) {
        suggestionCards.forEach(card => {
            card.addEventListener('click', function() {
                const locationText = this.querySelector('span').textContent;
                
                // Show booking panel
                const bookingPanel = document.getElementById('ride-booking-panel');
                if (bookingPanel) {
                    bookingPanel.classList.add('active');
                    updateStepIndicator(1);
                }
                
                // Pre-fill dropoff location
                const dropoffInput = document.querySelector('#dropoff-location input');
                if (dropoffInput) {
                    dropoffInput.value = locationText;
                    dropoffInput.dispatchEvent(new Event('change'));
                }
                
                // Pre-fill pickup with current location placeholder
                const pickupInput = document.querySelector('#pickup-location input');
                if (pickupInput && !pickupInput.value) {
                    pickupInput.value = 'Current Location';
                    
                    // Trigger change event
                    pickupInput.dispatchEvent(new Event('change'));
                }
            });
        });
    }
} 