/**
 * Ride Go - Setup Check Utility
 * This script checks if all required components of the application are available.
 */

// Check function to be called on page load
function checkSetup() {
    const results = {
        html: checkHTMLFiles(),
        css: checkCSSFiles(),
        js: checkJSFiles(),
        icons: checkIconFiles(),
        api: {
            googleMaps: checkGoogleMapsAPIKey(),
            supabase: checkSupabaseConfig()
        }
    };
    
    return results;
}

// Check if all HTML files are present
function checkHTMLFiles() {
    const requiredFiles = [
        'index.html',
        'auth.html',
        'user.html',
        'driver.html',
        'ride-confirm.html'
    ];
    
    return checkFilesExist(requiredFiles);
}

// Check if CSS files are present
function checkCSSFiles() {
    const requiredFiles = [
        'styles/style.css'
    ];
    
    return checkFilesExist(requiredFiles);
}

// Check if JS files are present
function checkJSFiles() {
    const requiredFiles = [
        'scripts/auth.js',
        'scripts/user.js',
        'scripts/driver.js',
        'scripts/map.js',
        'supabase/config.js'
    ];
    
    return checkFilesExist(requiredFiles);
}

// Check if icon files are present
function checkIconFiles() {
    const requiredFiles = [
        'assets/onboarding-illustration.svg',
        'assets/icons/logo.svg',
        'assets/icons/car.svg',
        'assets/icons/location-pin.svg',
        'assets/icons/user.svg',
        'assets/icons/history.svg',
        'assets/icons/wallet.svg',
        'assets/icons/package.svg',
        'assets/icons/calendar.svg',
        'assets/icons/home.svg'
    ];
    
    return checkFilesExist(requiredFiles);
}

// Utility function to check if files exist
async function checkFilesExist(files) {
    const results = {
        status: 'pending',
        found: 0,
        missing: [],
        total: files.length
    };
    
    const fetchPromises = files.map(file => 
        fetch(file)
            .then(response => {
                if (response.ok) {
                    results.found++;
                    return true;
                } else {
                    results.missing.push(file);
                    return false;
                }
            })
            .catch(() => {
                results.missing.push(file);
                return false;
            })
    );
    
    await Promise.all(fetchPromises);
    
    results.status = results.found === results.total ? 'success' : 'error';
    return results;
}

// Check if Google Maps API key is set
function checkGoogleMapsAPIKey() {
    // Get content of user.html
    return fetch('user.html')
        .then(response => response.text())
        .then(html => {
            const hasRealAPIKey = !html.includes('key=YOUR_API_KEY');
            return {
                status: hasRealAPIKey ? 'success' : 'warning',
                message: hasRealAPIKey 
                    ? 'Google Maps API key appears to be set'
                    : 'Google Maps API key is still set to the placeholder value (YOUR_API_KEY)'
            };
        })
        .catch(() => ({
            status: 'error',
            message: 'Could not check Google Maps API key'
        }));
}

// Check if Supabase config is set
function checkSupabaseConfig() {
    return fetch('supabase/config.js')
        .then(response => response.text())
        .then(js => {
            const hasRealURL = !js.includes('https://exqfwhrcxmlzuffsymib.supabase.co') && 
                              !js.includes('https://your-project-id.supabase.co');
            const hasRealKey = !js.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9') &&
                              !js.includes('your-supabase-anon-key');
            
            let status = 'success';
            let message = 'Supabase configuration appears to be set correctly';
            
            if (!hasRealURL && !hasRealKey) {
                status = 'warning';
                message = 'Supabase URL and key are still set to placeholder values';
            } else if (!hasRealURL) {
                status = 'warning';
                message = 'Supabase URL is still set to a placeholder value';
            } else if (!hasRealKey) {
                status = 'warning';
                message = 'Supabase key is still set to a placeholder value';
            }
            
            return { status, message };
        })
        .catch(() => ({
            status: 'error',
            message: 'Could not check Supabase configuration'
        }));
}

// If directly included in a page, run the check and log results
if (typeof window !== 'undefined' && window.document) {
    console.log('Running Ride Go setup check...');
    checkSetup().then(results => {
        console.log('Setup check complete:', results);
        
        // Display a summary in the console
        const summary = {
            total: 0,
            found: 0,
            missing: []
        };
        
        // Count HTML files
        if (results.html) {
            summary.total += results.html.total;
            summary.found += results.html.found;
            summary.missing = summary.missing.concat(results.html.missing);
        }
        
        // Count CSS files
        if (results.css) {
            summary.total += results.css.total;
            summary.found += results.css.found;
            summary.missing = summary.missing.concat(results.css.missing);
        }
        
        // Count JS files
        if (results.js) {
            summary.total += results.js.total;
            summary.found += results.js.found;
            summary.missing = summary.missing.concat(results.js.missing);
        }
        
        // Count icon files
        if (results.icons) {
            summary.total += results.icons.total;
            summary.found += results.icons.found;
            summary.missing = summary.missing.concat(results.icons.missing);
        }
        
        // Log summary
        console.log(`Found ${summary.found}/${summary.total} required files`);
        
        if (summary.missing.length > 0) {
            console.warn('Missing files:', summary.missing);
        } else {
            console.log('All required files are present!');
        }
        
        // Check API configurations
        if (results.api.googleMaps.status !== 'success') {
            console.warn('Google Maps API:', results.api.googleMaps.message);
        } else {
            console.log('Google Maps API:', results.api.googleMaps.message);
        }
        
        if (results.api.supabase.status !== 'success') {
            console.warn('Supabase:', results.api.supabase.message);
        } else {
            console.log('Supabase:', results.api.supabase.message);
        }
    });
} 