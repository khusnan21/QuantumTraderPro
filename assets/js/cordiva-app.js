// Cordova App Initialization
document.addEventListener('deviceready', onDeviceReady, false);

let notificationManager;
let backgroundService;
let exportManager;

function onDeviceReady() {
    console.log('Cordova initialized successfully');
    
    // Initialize managers
    notificationManager = new NotificationManager();
    backgroundService = new BackgroundService();
    exportManager = new ExportManager();
    
    // Request notification permissions
    notificationManager.requestPermission();
    
    // Start background service
    backgroundService.initialize();
    
    // Initialize trading app dengan callback untuk notifikasi
    tradingApp = new ProTradingScanner({
        onNewSignal: (signal) => {
            notificationManager.notifyNewSignal(signal);
        },
        onTargetHit: (signal, targetNumber) => {
            notificationManager.notifyTargetHit(signal, targetNumber);
        },
        onStopLoss: (signal) => {
            notificationManager.notifyStopLoss(signal);
        }
    });
    
    // Setup enhanced export functionality
    setupEnhancedExport();
    
    console.log('Quantum Trader Pro Mobile App Ready!');
}

// Enhanced export functionality
function setupEnhancedExport() {
    // Override export function di tradingApp
    const originalExport = tradingApp.exportResults;
    
    tradingApp.exportResults = function() {
        const allResults = JSON.parse(localStorage.getItem('trading_results') || '[]');
        const timeframe = document.getElementById('timeframe-filter').value;
        const filteredResults = this.filterResultsByTimeframe(allResults, timeframe);
        
        if (filteredResults.length === 0) {
            this.showNotification('No results to export for selected period', 'warning');
            return;
        }
        
        const timeframeLabel = {
            'today': 'today',
            'week': 'this-week', 
            'month': 'this-month',
            'last_month': 'last-month',
            'all': 'all-time'
        }[timeframe];
        
        const filename = `quantum-results-${timeframeLabel}-${new Date().toISOString().split('T')[0]}.csv`;
        
        exportManager.exportToCSV(filteredResults, filename)
            .then(() => {
                this.showNotification(`Exported ${filteredResults.length} results`, 'success');
            })
            .catch(error => {
                console.error('Export error:', error);
                this.showNotification('Export failed', 'error');
            });
    };
}

// Handle pause/resume events
document.addEventListener('pause', onPause, false);
document.addEventListener('resume', onResume, false);

function onPause() {
    console.log('App paused');
    // Optional: pause intensive operations
}

function onResume() {
    console.log('App resumed');
    // Refresh data ketika app dibuka kembali
    if (typeof tradingApp !== 'undefined') {
        tradingApp.loadHomeData();
    }
}