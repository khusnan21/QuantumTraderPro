class NotificationManager {
    constructor() {
        this.isCordova = typeof cordova !== 'undefined';
    }
    
    requestPermission() {
        if (this.isCordova && cordova.plugins.notification.local) {
            cordova.plugins.notification.local.requestPermission(function(granted) {
                console.log('Notification permission granted:', granted);
            });
        } else if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                console.log('Notification permission:', permission);
            });
        }
    }
    
    showLocalNotification(title, message, data = {}) {
        if (this.isCordova && cordova.plugins.notification.local) {
            cordova.plugins.notification.local.schedule({
                id: Math.floor(Math.random() * 10000),
                title: title,
                text: message,
                data: data,
                foreground: true,
                vibrate: true,
                sound: true,
                priority: 1
            });
        } else {
            // Fallback untuk browser/desktop
            if ('Notification' in window && Notification.permission === 'granted') {
                const notification = new Notification(title, { 
                    body: message,
                    icon: 'www/img/icon.png',
                    tag: 'quantum-trader'
                });
                
                notification.onclick = function() {
                    window.focus();
                    notification.close();
                };
            }
        }
    }
    
    notifyNewSignal(signal) {
        this.showLocalNotification(
            `🎯 New ${signal.direction} Signal`,
            `${signal.symbol} - ${signal.confidence}% confidence\nEntry: $${signal.entry.toFixed(4)}`,
            { 
                symbol: signal.symbol, 
                type: 'new_signal',
                direction: signal.direction
            }
        );
    }
    
    notifyTargetHit(signal, targetNumber) {
        const profit = ((signal.targets[targetNumber-1] - signal.entry) / signal.entry * 100).toFixed(2);
        
        this.showLocalNotification(
            '✅ Target Hit!',
            `${signal.symbol} Target ${targetNumber} achieved\n+${profit}% profit`,
            { 
                symbol: signal.symbol, 
                type: 'target_hit',
                target: targetNumber,
                profit: profit
            }
        );
    }
    
    notifyStopLoss(signal) {
        const loss = ((signal.sl - signal.entry) / signal.entry * 100).toFixed(2);
        
        this.showLocalNotification(
            '🔴 Stop Loss Triggered',
            `${signal.symbol} stopped out\n${loss}% loss`,
            { 
                symbol: signal.symbol, 
                type: 'stop_loss',
                loss: loss
            }
        );
    }
    
    // Notifikasi scan completed
    notifyScanComplete(signalsFound) {
        this.showLocalNotification(
            '🔄 Scan Complete',
            `Found ${signalsFound} trading signals`,
            { type: 'scan_complete' }
        );
    }
}