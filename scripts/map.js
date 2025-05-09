// Map Variables
let map;
let userMarker;
let directionsService;
let directionsRenderer;
let userLocation = null;
let mapInitialized = false;
let pickupMarker;
let dropoffMarker;

// Initialize the map
function initMap() {
    // Check if the map is already initialized to prevent duplicate initialization
    if (mapInitialized || !document.getElementById('map')) {
        return;
    }
    
    mapInitialized = true;
    
    // Default center (will update when we get user's location)
    const defaultCenter = { lat: 26.9124, lng: 75.7873 }; // Jaipur coordinates
    
    // Initialize map with basic options (removed mapId to avoid conflict with styles)
    map = new google.maps.Map(document.getElementById('map'), {
        center: defaultCenter,
        zoom: 13,
        disableDefaultUI: true,
        zoomControl: true,
        styles: mapStyles // Using styles without mapId
    });
    
    // Initialize directions service
    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        map: map,
        suppressMarkers: true,
        polylineOptions: {
            strokeColor: '#8568FF',
            strokeWeight: 5,
            strokeOpacity: 0.7
        }
    });
    
    // Get user location
    getCurrentLocation();
    
    // If we're on the user dashboard, set up autocomplete and ride booking
    if (window.location.pathname.includes('user.html')) {
        setupUserDashboard();
    }
    
    // If we're on the ride confirmation page, show the route
    if (window.location.pathname.includes('ride-confirm.html')) {
        setupRideConfirmationUI();
    }
    
    // If we're on the driver dashboard, set up driver functionality
    if (window.location.pathname.includes('driver.html')) {
        setupDriverDashboard();
    }
    
    // Add location button
    addMyLocationButton();
}

// Get current location using Geolocation API
function getCurrentLocation() {
    if (!map) return;
    
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                userLocation = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                
                // Center map on user location
                map.setCenter(userLocation);
                
                // Add user marker using standard Marker to avoid deprecation warnings
                if (!userMarker) {
                    userMarker = new google.maps.Marker({
                        position: userLocation,
                        map: map,
                        icon: {
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 7,
                            fillColor: '#8568FF',
                            fillOpacity: 1,
                            strokeColor: '#FFFFFF',
                            strokeWeight: 2
                        }
                    });
                } else {
                    userMarker.setPosition(userLocation);
                }
                
                // If we're on user dashboard, populate pickup with current location
                if (window.location.pathname.includes('user.html')) {
                    reverseGeocode(userLocation, (address) => {
                        const pickupInput = document.querySelector('#pickup-location input');
                        if (pickupInput) {
                            pickupInput.value = address;
                        }
                    });
                }
                
                // Trigger event for other components to use
                document.dispatchEvent(new CustomEvent('user-location-updated', {
                    detail: { location: userLocation }
                }));
            },
            (error) => {
                console.error('Error getting location:', error);
                console.log('Could not get your location. Please enable location services and try again.');
            }
        );
    } else {
        console.log('Geolocation is not supported by this browser.');
    }
}

// Helper function to create marker icon
function createMarkerIcon(color) {
    return {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 7,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2
    };
}

// Reverse geocode to get address from coordinates
function reverseGeocode(location, callback) {
    if (!location || !callback) return;
    
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode({ location: location }, (results, status) => {
        if (status === 'OK' && results[0]) {
            callback(results[0].formatted_address);
        } else {
            console.error('Reverse geocoding failed:', status);
            callback('Location unavailable');
        }
    });
}

// Add custom "My Location" button
function addMyLocationButton() {
    const locationButton = document.getElementById('my-location');
    
    if (locationButton) {
        locationButton.addEventListener('click', () => {
            getCurrentLocation();
        });
    }
}

// Setup user dashboard map functionality
function setupUserDashboard() {
    // Set up ride booking panel
    const rideBookingPanel = document.getElementById('ride-booking-panel');
    if (!rideBookingPanel) return;
    
    try {
        // Set up search destination functionality with new gmpx-placeautocomplete
        const destinationSearch = document.querySelector('#destination-search');
        if (destinationSearch) {
            destinationSearch.addEventListener('place_changed', (event) => {
                const place = event.detail.place;
                if (!place.geometry) return;
                
                // Update map view
                map.setCenter(place.geometry.location);
                map.setZoom(15);
                
                // Add marker for destination using standard Marker
                new google.maps.Marker({
                    position: place.geometry.location,
                    map: map,
                    icon: createMarkerIcon('#FF6B6B')
                });
                
                // Pre-fill dropoff location in the booking panel
                const dropoffInput = document.querySelector('#dropoff-location input');
                if (dropoffInput) {
                    dropoffInput.value = place.formatted_address || place.name;
                    
                    // Trigger change event on the input
                    dropoffInput.dispatchEvent(new Event('change'));
                }
                
                // Pre-fill pickup with current location if empty
                const pickupInput = document.querySelector('#pickup-location input');
                if (pickupInput && !pickupInput.value) {
                    if (userLocation) {
                        // Use reverse geocoding to get address from coordinates
                        const geocoder = new google.maps.Geocoder();
                        geocoder.geocode({ location: userLocation }, (results, status) => {
                            if (status === 'OK' && results[0]) {
                                pickupInput.value = results[0].formatted_address;
                            } else {
                                pickupInput.value = 'Current Location';
                            }
                            // Trigger change event to update step indicator
                            pickupInput.dispatchEvent(new Event('change'));
                        });
                    } else {
                        pickupInput.value = 'Current Location';
                        // Trigger change event to update step indicator
                        pickupInput.dispatchEvent(new Event('change'));
                    }
                }
                
                // Show ride booking panel
                rideBookingPanel.classList.add('active');
                rideBookingPanel.classList.add('slide-up');
                
                // Trigger the step indicator if function exists
                if (typeof updateStepIndicator === 'function') {
                    updateStepIndicator(1);
                }
                
                // Set up step progress listeners if function exists
                if (typeof setupStepProgressListeners === 'function') {
                    setupStepProgressListeners();
                }
            });
        }
        
        // Set up pickup location input with new gmpx-placeautocomplete
        const pickupElement = document.querySelector('#pickup-location');
        if (pickupElement) {
            pickupElement.addEventListener('place_changed', (event) => {
                const place = event.detail.place;
                if (!place.geometry) return;
                
                // Add marker for pickup using standard Marker
                if (pickupMarker) pickupMarker.setMap(null); // Remove old marker
                
                pickupMarker = new google.maps.Marker({
                    position: place.geometry.location,
                    map: map,
                    icon: createMarkerIcon('#4CAF50')
                });
                
                // Calculate route if both pickup and dropoff are set
                const dropoffInput = document.querySelector('#dropoff-location input');
                if (dropoffInput && dropoffInput.value) {
                    calculateAndDisplayRoute();
                }
            });
        }
        
        // Set up dropoff location input with new gmpx-placeautocomplete
        const dropoffElement = document.querySelector('#dropoff-location');
        if (dropoffElement) {
            dropoffElement.addEventListener('place_changed', (event) => {
                const place = event.detail.place;
                if (!place.geometry) return;
                
                // Add marker for dropoff using standard Marker
                if (dropoffMarker) dropoffMarker.setMap(null); // Remove old marker
                
                dropoffMarker = new google.maps.Marker({
                    position: place.geometry.location,
                    map: map,
                    icon: createMarkerIcon('#FF6B6B')
                });
                
                // Calculate route if both pickup and dropoff are set
                const pickupInput = document.querySelector('#pickup-location input');
                if (pickupInput && pickupInput.value) {
                    calculateAndDisplayRoute();
                }
            });
        }
        
        // Setup manual change events for inputs to handle cases where place_changed doesn't fire
        const pickupInput = document.querySelector('#pickup-location input');
        const dropoffInput = document.querySelector('#dropoff-location input');
        
        if (pickupInput) {
            pickupInput.addEventListener('change', () => {
                if (pickupInput.value && dropoffInput && dropoffInput.value) {
                    calculateAndDisplayRoute();
                }
            });
        }
        
        if (dropoffInput) {
            dropoffInput.addEventListener('change', () => {
                if (dropoffInput.value && pickupInput && pickupInput.value) {
                    calculateAndDisplayRoute();
                }
            });
        }
    } catch (error) {
        console.error('Error setting up place autocomplete:', error);
    }
    
    // Set up ride option selection
    const rideOptions = document.querySelectorAll('.ride-option');
    rideOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove selected class from all options
            rideOptions.forEach(opt => opt.classList.remove('selected'));
            // Add selected class to clicked option
            option.classList.add('selected');
        });
    });
    
    // Book ride button
    const bookRideButton = document.querySelector('.book-ride-button');
    if (bookRideButton) {
        bookRideButton.addEventListener('click', () => {
            console.log("Book ride button clicked");
            
            const pickup = document.querySelector('#pickup-location input')?.value;
            const dropoff = document.querySelector('#dropoff-location input')?.value;
            
            if (!pickup || !dropoff) {
                alert('Please enter pickup and dropoff locations');
                return;
            }
            
            // Get selected ride option
            const selectedRide = document.querySelector('.ride-option.selected');
            if (!selectedRide) {
                alert('Please select a ride type');
                return;
            }
            
            const rideName = selectedRide.querySelector('.ride-name')?.textContent;
            const ridePrice = selectedRide.querySelector('.ride-price')?.textContent;
            
            // Save ride details to session storage for confirmation page
            sessionStorage.setItem('ride-pickup', pickup);
            sessionStorage.setItem('ride-dropoff', dropoff);
            sessionStorage.setItem('ride-type', rideName || 'Rapido 3D');
            sessionStorage.setItem('ride-price', ridePrice || '₹150');
            
            // Set the current step to 3 (if the function exists)
            if (typeof updateStepIndicator === 'function') {
                updateStepIndicator(3);
            }
            
            // Save destination to history if the function exists
            if (typeof saveDestination === 'function') {
                saveDestination(dropoff, null);
            }
            
            console.log("Creating ride from", pickup, "to", dropoff);
            
            // Create a ride in the database
            if (typeof createRide === 'function') {
                const fare = parseInt(ridePrice?.replace(/\D/g, '') || 150);
                
                createRide(pickup, dropoff, fare)
                    .then(ride => {
                        console.log('Created ride:', ride);
                        
                        // Store the ride ID in session storage
                        sessionStorage.setItem('current-ride-id', ride.id);
                        
                        // Create a detailed ride object
                        const rideDetails = {
                            id: ride.id,
                            pickup_location: pickup,
                            dropoff_location: dropoff,
                            fare: fare,
                            status: 'waiting',
                            created_at: new Date().toISOString()
                        };
                        
                        console.log("Broadcasting ride request:", rideDetails);
                        
                        // Create and save ride details to localStorage for cross-tab communication
                        localStorage.setItem('latest-ride-request', JSON.stringify({
                            ride: rideDetails,
                            timestamp: Date.now()
                        }));
                        
                        // Notify any waiting drivers by broadcasting a ride request event
                        try {
                            const rideRequestEvent = new CustomEvent('ride-request', { 
                                detail: {
                                    ride: rideDetails
                                },
                                bubbles: true,  // Allow event to bubble up
                                cancelable: true // Allow event to be cancelled
                            });
                            
                            // Dispatch event from document to ensure it's properly broadcast
                            document.dispatchEvent(rideRequestEvent);
                            console.log("Ride request event dispatched");
                        } catch (error) {
                            console.error("Error dispatching ride request event:", error);
                        }
                        
                        // Also save the ride details to sessionStorage for later access
                        sessionStorage.setItem('pending-ride-details', JSON.stringify(rideDetails));
                        
                        // Redirect to confirmation page
                        window.location.href = 'ride-confirm.html';
                    })
                    .catch(error => {
                        console.error('Error creating ride:', error);
                        alert('Failed to create ride. Please try again.');
                    });
            } else {
                console.error("createRide function not available - check Supabase initialization");
                
                // Create a fallback ride for demo purposes
                const rideDetails = {
                    id: 'demo-' + Date.now(),
                    pickup_location: pickup,
                    dropoff_location: dropoff,
                    fare: parseInt(ridePrice?.replace(/\D/g, '') || 150),
                    status: 'waiting',
                    created_at: new Date().toISOString()
                };
                
                // Store the ride ID in session storage
                sessionStorage.setItem('current-ride-id', rideDetails.id);
                
                // Save ride details to localStorage for cross-tab communication
                localStorage.setItem('latest-ride-request', JSON.stringify({
                    ride: rideDetails,
                    timestamp: Date.now()
                }));
                
                // Broadcast ride request event
                console.log("Broadcasting fallback ride request:", rideDetails);
                
                try {
                    document.dispatchEvent(new CustomEvent('ride-request', { 
                        detail: {
                            ride: rideDetails
                        },
                        bubbles: true,
                        cancelable: true
                    }));
                    console.log("Fallback ride request event dispatched");
                } catch (error) {
                    console.error("Error dispatching fallback ride request event:", error);
                }
                
                // Fallback if createRide is not available
                window.location.href = 'ride-confirm.html';
            }
        });
    }
    
    // Ride Now button in primary CTA
    const rideNowBtn = document.getElementById('ride-now-btn');
    if (rideNowBtn) {
        rideNowBtn.addEventListener('click', () => {
            // Show ride booking panel
            if (rideBookingPanel) {
                rideBookingPanel.classList.add('active');
                rideBookingPanel.classList.add('slide-up');
                
                // Focus on pickup input
                const pickupInput = document.querySelector('#pickup-location input');
                if (pickupInput) {
                    setTimeout(() => pickupInput.focus(), 300);
                }
                
                // Update step indicator
                if (typeof updateStepIndicator === 'function') {
                    updateStepIndicator(1);
                }
            }
        });
    }
    
    // Set up suggestion cards to open booking panel with predefined locations
    const suggestionCards = document.querySelectorAll('.suggestion-card');
    if (suggestionCards.length > 0) {
        suggestionCards.forEach(card => {
            card.addEventListener('click', () => {
                const locationName = card.querySelector('span')?.textContent;
                if (!locationName) return;
                
                // Open booking panel
                if (rideBookingPanel) {
                    rideBookingPanel.classList.add('active');
                    rideBookingPanel.classList.add('slide-up');
                    
                    // Pre-fill dropoff with location name
                    const dropoffInput = document.querySelector('#dropoff-location input');
                    if (dropoffInput) {
                        dropoffInput.value = locationName;
                        
                        // Geocode the location name to get coordinates
                        const geocoder = new google.maps.Geocoder();
                        geocoder.geocode({ address: locationName }, (results, status) => {
                            if (status === 'OK' && results[0]) {
                                // Add marker for dropoff
                                if (dropoffMarker) dropoffMarker.setMap(null); // Remove old marker
                                
                                dropoffMarker = new google.maps.Marker({
                                    position: results[0].geometry.location,
                                    map: map,
                                    icon: createMarkerIcon('#FF6B6B')
                                });
                                
                                // Calculate route if pickup is already set
                                const pickupInput = document.querySelector('#pickup-location input');
                                if (pickupInput && pickupInput.value) {
                                    calculateAndDisplayRoute();
                                }
                            }
                        });
                    }
                    
                    // Pre-fill pickup with current location if available
                    const pickupInput = document.querySelector('#pickup-location input');
                    if (pickupInput && !pickupInput.value) {
                        if (userLocation) {
                            const geocoder = new google.maps.Geocoder();
                            geocoder.geocode({ location: userLocation }, (results, status) => {
                                if (status === 'OK' && results[0]) {
                                    pickupInput.value = results[0].formatted_address;
                                    
                                    // Add marker for pickup
                                    if (pickupMarker) pickupMarker.setMap(null); // Remove old marker
                                    
                                    pickupMarker = new google.maps.Marker({
                                        position: userLocation,
                                        map: map,
                                        icon: createMarkerIcon('#4CAF50')
                                    });
                                    
                                    // Calculate route
                                    calculateAndDisplayRoute();
                                }
                            });
                        } else {
                            pickupInput.value = 'Current Location';
                        }
                    }
                    
                    // Update step indicator
                    if (typeof updateStepIndicator === 'function') {
                        updateStepIndicator(1);
                    }
                }
            });
        });
    }
    
    // Bottom navigation Ride Now button
    const rideNowNavItem = document.querySelector('.nav-item:nth-child(2)');
    if (rideNowNavItem) {
        rideNowNavItem.addEventListener('click', () => {
            // Show ride booking panel
            if (rideBookingPanel) {
                rideBookingPanel.classList.add('active');
                rideBookingPanel.classList.add('slide-up');
                
                // Update step indicator
                if (typeof updateStepIndicator === 'function') {
                    updateStepIndicator(1);
                }
            }
        });
    }
}

// Calculate and display route between pickup and dropoff
function calculateAndDisplayRoute() {
    if (!directionsService || !directionsRenderer) return;
    
    const pickup = document.querySelector('#pickup-location input')?.value;
    const dropoff = document.querySelector('#dropoff-location input')?.value;
    
    if (!pickup || !dropoff) return;
    
    // Set step indicator to show progress (if function exists)
    if (typeof updateStepIndicator === 'function') {
        updateStepIndicator(2);
    }
    
    directionsService.route(
        {
            origin: pickup,
            destination: dropoff,
            travelMode: google.maps.TravelMode.DRIVING
        },
        (response, status) => {
            if (status === 'OK') {
                // Display route
                directionsRenderer.setDirections(response);
                
                // Calculate fare based on distance
                const route = response.routes[0];
                const distanceInMeters = route.legs[0].distance.value;
                const fare = calculateFare(distanceInMeters);
                
                // Update ride options with calculated fare
                document.querySelectorAll('.ride-price').forEach((el, index) => {
                    // First option is standard, second is premium (higher price)
                    const price = index === 0 ? fare : Math.round(fare * 1.25);
                    el.textContent = `₹${price}`;
                });
            } else {
                console.error('Directions request failed:', status);
                console.log('Could not calculate directions. Please try different locations.');
            }
        }
    );
}

// Calculate fare based on distance
function calculateFare(distanceInMeters) {
    // Base fare: ₹50
    // Per km: ₹10
    const baseFare = 50;
    const perKm = 10;
    const distanceInKm = distanceInMeters / 1000;
    
    return Math.round(baseFare + (distanceInKm * perKm));
}

// Setup ride confirmation page
function setupRideConfirmationUI() {
    // Get ride details from session storage
    const pickup = sessionStorage.getItem('ride-pickup');
    const dropoff = sessionStorage.getItem('ride-dropoff');
    const rideType = sessionStorage.getItem('ride-type');
    const ridePrice = sessionStorage.getItem('ride-price');
    const rideId = sessionStorage.getItem('current-ride-id');
    
    // Update UI with ride details
    document.querySelectorAll('.ride-detail-item')[0].querySelector('span').textContent = pickup || 'Pickup location';
    document.querySelectorAll('.ride-detail-item')[1].querySelector('span').textContent = dropoff || 'Dropoff location';
    document.querySelector('.vehicle-name').textContent = rideType || 'Rapido 3D';
    document.querySelector('.vehicle-price').textContent = ridePrice || '₹ 50';
    
    // Generate and display a random 4-digit PIN
    const pinElement = document.querySelector('.pin-code');
    if (pinElement) {
        const pin = generateRidePin();
        pinElement.textContent = pin;
        // Save pin to session storage for later verification
        sessionStorage.setItem('ride-pin', pin);
    }
    
    // Calculate and display route
    if (pickup && dropoff) {
        directionsService.route(
            {
                origin: pickup,
                destination: dropoff,
                travelMode: google.maps.TravelMode.DRIVING
            },
            (response, status) => {
                if (status === 'OK') {
                    // Display route
                    directionsRenderer.setDirections(response);
                }
            }
        );
    }
    
    // Set up ride status checking
    const rideStatusElement = document.getElementById('ride-status');
    const statusDetailElement = document.getElementById('status-detail');
    const statusIndicator = document.querySelector('.ride-status-indicator');
    const statusIcon = document.querySelector('.status-icon i');
    
    if (rideId && rideStatusElement && statusDetailElement && statusIndicator && statusIcon) {
        // Check ride status every 5 seconds
        const statusChecker = setInterval(() => {
            checkRideStatus(rideId).then(status => {
                // Update UI based on status
                if (status === 'accepted') {
                    rideStatusElement.textContent = 'Driver Found!';
                    statusDetailElement.textContent = 'A driver has accepted your ride and is on the way.';
                    statusIndicator.className = 'ride-status-indicator accepted';
                    statusIcon.className = 'fas fa-user-check';
                } else if (status === 'arrived') {
                    rideStatusElement.textContent = 'Driver has arrived!';
                    statusDetailElement.textContent = 'Your driver has arrived at the pickup point. Please be ready with your PIN.';
                    statusIndicator.className = 'ride-status-indicator on-way';
                    statusIcon.className = 'fas fa-map-marker-alt';
                } else if (status === 'in_progress') {
                    rideStatusElement.textContent = 'Ride in progress';
                    statusDetailElement.textContent = 'You are on your way to the destination. Enjoy your ride!';
                    statusIndicator.className = 'ride-status-indicator in-progress';
                    statusIcon.className = 'fas fa-car';
                } else if (status === 'completed') {
                    rideStatusElement.textContent = 'Ride completed';
                    statusDetailElement.textContent = 'Your ride has been completed. Thank you for riding with us!';
                    statusIndicator.className = 'ride-status-indicator completed';
                    statusIcon.className = 'fas fa-check-circle';
                    
                    // Clear interval after completion
                    clearInterval(statusChecker);
                } else if (status === 'cancelled') {
                    rideStatusElement.textContent = 'Ride cancelled';
                    statusDetailElement.textContent = 'Your ride has been cancelled.';
                    statusIndicator.className = 'ride-status-indicator cancelled';
                    statusIcon.className = 'fas fa-ban';
                    
                    // Clear interval after cancellation
                    clearInterval(statusChecker);
                }
            }).catch(error => {
                console.error('Error checking ride status:', error);
            });
        }, 5000);
        
        // Store interval ID in session storage for cleanup
        sessionStorage.setItem('status-checker-interval', statusChecker);
    }
    
    // Schedule ride button
    const scheduleRideButton = document.querySelector('.schedule-ride-button');
    if (scheduleRideButton) {
        scheduleRideButton.addEventListener('click', async () => {
            try {
                // Get price without the currency symbol
                const price = ridePrice ? parseInt(ridePrice.replace(/[^\d]/g, '')) : 50;
                
                // Call Supabase to create ride
                const ride = await createRide(pickup, dropoff, price);
                
                // Show confirmation dialog with PIN
                const pin = sessionStorage.getItem('ride-pin');
                alert(`Your ride has been booked successfully!\n\nYour confirmation PIN: ${pin}\n\nShare this PIN with your driver when they arrive.`);
                
                // Redirect to user dashboard
                window.location.href = 'user.html';
            } catch (error) {
                console.error('Error scheduling ride:', error);
                alert('Failed to book ride. Please try again.');
            }
        });
    }
}

// Check ride status - for demo this would normally fetch from Supabase
async function checkRideStatus(rideId) {
    // In a real app, this would be a Supabase query
    // But for demo, we'll just simulate status changes
    
    // Check if we have a saved demo status
    const demoStatus = sessionStorage.getItem(`ride-${rideId}-status`);
    if (demoStatus) {
        return demoStatus;
    }
    
    // Default to waiting
    return 'waiting';
}

// Generate a random 4-digit PIN for ride confirmation
function generateRidePin() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

// Setup driver dashboard
function setupDriverDashboard() {
    // Driver availability toggle
    const availabilityToggle = document.getElementById('driver-availability');
    const statusText = document.getElementById('status-text');
    
    if (availabilityToggle) {
        availabilityToggle.addEventListener('change', function() {
            if (this.checked) {
                statusText.textContent = 'Available';
                // Here you would update driver status in Supabase
            } else {
                statusText.textContent = 'Offline';
                // Here you would update driver status in Supabase
            }
        });
    }
    
    // Simulate incoming ride request (would normally come from Supabase real-time)
    setTimeout(() => {
        simulateRideRequest();
    }, 5000);
}

// Simulate ride request for demo purposes
function simulateRideRequest() {
    const rideRequestPanel = document.getElementById('ride-request-panel');
    
    if (rideRequestPanel) {
        // Show ride request panel
        rideRequestPanel.classList.add('active');
        
        // Add countdown timer
        let seconds = 30;
        const timerEl = rideRequestPanel.querySelector('.timer');
        
        const timer = setInterval(() => {
            seconds--;
            if (timerEl) {
            timerEl.textContent = `${seconds}s`;
            }
            
            if (seconds <= 0) {
                clearInterval(timer);
                rideRequestPanel.classList.remove('active');
            }
        }, 1000);
        
        // Handle accept/decline buttons
        const acceptButton = rideRequestPanel.querySelector('.accept-button');
        const declineButton = rideRequestPanel.querySelector('.decline-button');
        
        if (acceptButton && declineButton) {
        acceptButton.addEventListener('click', () => {
            clearInterval(timer);
            rideRequestPanel.classList.remove('active');
            
            // Show current ride panel
            const currentRidePanel = document.getElementById('active-ride-panel');
            if (currentRidePanel) {
            currentRidePanel.classList.add('active');
            }
            
            // Here you would update ride status in Supabase
            
            // Handle ride action buttons
            setupRideActionButtons();
        });
        
        declineButton.addEventListener('click', () => {
            clearInterval(timer);
            rideRequestPanel.classList.remove('active');
            
            // Here you would update ride status in Supabase
        });
        }
    }
}

// Setup ride action buttons for driver
function setupRideActionButtons() {
    const arrivedButton = document.getElementById('arrived-button');
    const startRideButton = document.getElementById('start-ride-button');
    const completeRideButton = document.getElementById('complete-ride-button');
    
    // Status circles for visual progress
    const statusCircles = document.querySelectorAll('.status-circle');
    const hasStatusCircles = statusCircles && statusCircles.length > 2;
    
    if (arrivedButton && startRideButton && completeRideButton) {
        arrivedButton.addEventListener('click', () => {
            // Update UI
            arrivedButton.disabled = true;
            startRideButton.disabled = false;
            
            // Only update status circles if they exist
            if (hasStatusCircles) {
            statusCircles[1].classList.add('active');
            }
            
            // Here you would update ride status in Supabase
        });
        
        startRideButton.addEventListener('click', () => {
            // Update UI
            startRideButton.disabled = true;
            completeRideButton.disabled = false;
            
            // Here you would update ride status in Supabase
        });
        
        completeRideButton.addEventListener('click', () => {
            // Update UI
            completeRideButton.disabled = true;
            
            // Only update status circles if they exist
            if (hasStatusCircles) {
            statusCircles[2].classList.add('active');
            }
            
            // Here you would update ride status in Supabase
            
            setTimeout(() => {
                // Hide current ride panel
                const activeRidePanel = document.getElementById('active-ride-panel');
                if (activeRidePanel) {
                    activeRidePanel.classList.remove('active');
                }
                
                // Show completion message
                alert('Ride completed successfully!');
            }, 1000);
        });
    }
}

// Map styles for a cleaner look
const mapStyles = [
    {
        "featureType": "administrative",
        "elementType": "geometry",
        "stylers": [{"visibility": "off"}]
    },
    {
        "featureType": "poi",
        "stylers": [{"visibility": "off"}]
    },
    {
        "featureType": "road",
        "elementType": "labels.icon",
        "stylers": [{"visibility": "off"}]
    },
    {
        "featureType": "transit",
        "stylers": [{"visibility": "off"}]
    },
    {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [{"color": "#e9e9e9"}]
    }
]; 

// Setup ride booking form
function setupRideBookingForm() {
    // ... existing code ...
    
    // Set up book ride button
    bookRideBtn.addEventListener('click', function() {
        console.log("Book ride button clicked");
        
        // Check that pickup and dropoff locations are set
        if (!pickupInput.value || !dropoffInput.value) {
            showError("Please enter pickup and dropoff locations");
            return;
        }
        
        // Check that a ride type is selected
        const selectedRideType = document.querySelector('.ride-type-option.selected');
        if (!selectedRideType) {
            showError("Please select a ride type");
            return;
        }
        
        const rideDetails = {
            id: 'ride_' + Date.now(),
            pickup: pickupInput.value,
            dropoff: dropoffInput.value,
            rideType: selectedRideType.dataset.type,
            price: selectedRideType.dataset.price,
            estimatedTime: selectedRideType.dataset.time,
            timestamp: Date.now()
        };
        
        console.log("Ride details:", rideDetails);
        
        // Store in session storage for this tab
        sessionStorage.setItem('current-ride', JSON.stringify(rideDetails));
        sessionStorage.setItem('current-ride-id', rideDetails.id);
        
        // Store in localStorage for cross-tab communication
        const rideRequest = {
            ride: rideDetails,
            timestamp: Date.now()
        };
        localStorage.setItem('latest-ride-request', JSON.stringify(rideRequest));
        
        try {
            // Create ride in database if Supabase is available
            if (typeof createRide === 'function') {
                createRide(rideDetails)
                    .then(response => {
                        console.log("Ride created:", response);
                    })
                    .catch(error => {
                        console.error("Error creating ride:", error);
                    });
            }
        } catch (error) {
            console.error("Error creating ride:", error);
        }
        
        // Broadcast ride request event
        console.log("Broadcasting ride-request event");
        try {
            const event = new CustomEvent('ride-request', { 
                detail: rideDetails,
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(event);
            console.log("Ride request event dispatched");
        } catch (error) {
            console.error("Error dispatching ride request event:", error);
        }
        
        // Show ride confirmation
        showPanel('ride-confirm-panel');
        setupRideConfirmationUI(rideDetails);
    });
} 