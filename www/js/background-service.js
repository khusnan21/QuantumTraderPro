class BackgroundService {
    constructor() {
        this.backgroundMode = null;
        this.scanInterval = null;
        this.isBackground = false;
    }
    
    initialize() {
        if (typeof cordova !== 'undefined' && cordova.plugins.backgroundMode) {
            this.backgroundMode = cordova.plugins.backgroundMode;
            
            // Enable background mode
            this.backgroundMode.enable();
            this.backgroundMode.setDefaults({
                title: 'Quantum Trader Pro',
                text: 'Monitoring trading signals...',
                hidden: false,
                silent: false
            });
            
            // Event handlers
            this.backgroundMode.on('activate', () => {
                this.onBackgroundActivate();
            });
            
            this.backgroundMode.on('deactivate', () => {
                this.onBackgroundDeactivate();
            });
            
            console.log('Background service initialized');
        } else {
            console.log('Background mode not available - running in foreground only');
        }
    }
    
    onBackgroundActivate() {
        this.isBackground = true;
        console.log('App entered background mode');
        
        // Start background scanning (kurang frequent untuk hemat battery)
        this.scanInterval = setInterval(() => {
            if (typeof tradingApp !== 'undefined' && !tradingApp.isScanning) {
                console.log('Background scan running...');
                tradingApp.executeAutoScan().then(() => {
                    // Update notification dengan hasil scan
                    if (typeof cordova !== 'undefined' && cordova.plugins.backgroundMode) {
                        const activeSignals = Array.from(tradingApp.activeSignals.values())
                            .filter(s => s.status === 'ACTIVE').length;
                        
                        cordova.plugins.backgroundMode.configure({
                            text: `${activeSignals} active signals - ${new Date().toLocaleTimeString()}`
                        });
                    }
                });
            }
        }, 300000); // Scan setiap 5 menit di background
        
        // Reduced frequency price updates di background
        if (tradingApp.priceUpdateInterval) {
            clearInterval(tradingApp.priceUpdateInterval);
            tradingApp.priceUpdateInterval = setInterval(() => {
                tradingApp.updateAllSignalPrices();
            }, 30000); // 30 detik di background
        }
    }
    
    onBackgroundDeactivate() {
        this.isBackground = false;
        console.log('App returned to foreground');
        
        // Clear background intervals
        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }
        
        // Restore normal frequency
        if (tradingApp.priceUpdateInterval) {
            clearInterval(tradingApp.priceUpdateInterval);
            tradingApp.startLivePriceMonitoring();
        }
        
        // Refresh data ketika kembali ke foreground
        if (typeof tradingApp !== 'undefined') {
            setTimeout(() => {
                tradingApp.loadHomeData();
                tradingApp.updateAllSignalPrices();
            }, 1000);
        }
    }
    
    // Manual background mode control
    enableBackgroundMode() {
        if (this.backgroundMode) {
            this.backgroundMode.enable();
        }
    }
    
    disableBackgroundMode() {
        if (this.backgroundMode) {
            this.backgroundMode.disable();
        }
    }
}