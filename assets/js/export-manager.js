class ExportManager {
    constructor() {
        this.isCordova = typeof cordova !== 'undefined';
    }
    
    async exportToCSV(data, filename) {
        try {
            const csvContent = this.convertToCSV(data);
            
            if (this.isCordova) {
                const filePath = await this.saveWithCordova(csvContent, filename);
                return filePath;
            } else {
                this.saveInBrowser(csvContent, filename);
                return 'browser_download';
            }
        } catch (error) {
            console.error('Export error:', error);
            throw error;
        }
    }
    
    convertToCSV(data) {
        if (data.length === 0) return '';
        
        const headers = ['Date', 'Time', 'Symbol', 'Direction', 'Entry', 'SL', 'Target1', 'Target2', 'Target3', 'Outcome', 'HitTarget', 'PNL'];
        const csvRows = [headers.join(',')];
        
        data.forEach(row => {
            const date = new Date(row.timestamp);
            const values = [
                date.toLocaleDateString('id-ID'),
                date.toLocaleTimeString('id-ID'),
                row.symbol,
                row.direction,
                row.entry,
                row.sl,
                row.targets[0],
                row.targets[1],
                row.targets[2],
                row.outcome,
                row.hitTarget || 0,
                row.pnl
            ].map(value => `"${value}"`);
            
            csvRows.push(values.join(','));
        });
        
        return csvRows.join('\n');
    }
    
    async saveWithCordova(content, filename) {
        return new Promise((resolve, reject) => {
            // Request permission untuk storage (Android)
            if (typeof cordova !== 'undefined' && cordova.plugins && cordova.plugins.permissions) {
                cordova.plugins.permissions.requestPermission(
                    cordova.plugins.permissions.WRITE_EXTERNAL_STORAGE,
                    function(success) {
                        console.log('Storage permission granted');
                        proceedWithSave();
                    },
                    function(error) {
                        console.log('Storage permission denied, using internal storage');
                        proceedWithSave();
                    }
                );
            } else {
                proceedWithSave();
            }
            
            function proceedWithSave() {
                window.resolveLocalFileSystemURL(cordova.file.externalDataDirectory || cordova.file.dataDirectory, 
                    (dirEntry) => {
                        dirEntry.getFile(filename, { create: true }, 
                            (fileEntry) => {
                                fileEntry.createWriter((fileWriter) => {
                                    fileWriter.onwriteend = () => {
                                        console.log('File saved successfully:', fileEntry.nativeURL);
                                        resolve(fileEntry.nativeURL);
                                    };
                                    fileWriter.onerror = (error) => {
                                        console.error('File write error:', error);
                                        reject(error);
                                    };
                                    fileWriter.write(content);
                                }, reject);
                            }, reject);
                    }, reject);
            }
        });
    }
    
    saveInBrowser(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    
    // Export signals aktif
    async exportActiveSignals() {
        const activeSignals = Array.from(tradingApp.activeSignals.values())
            .filter(signal => signal.status === 'ACTIVE');
        
        if (activeSignals.length === 0) {
            throw new Error('No active signals to export');
        }
        
        const exportData = activeSignals.map(signal => ({
            symbol: signal.symbol,
            direction: signal.direction,
            entry: signal.entry,
            sl: signal.sl,
            target1: signal.targets[0],
            target2: signal.targets[1],
            target3: signal.targets[2],
            confidence: signal.confidence,
            timestamp: signal.timestamp
        }));
        
        const filename = `active-signals-${new Date().toISOString().split('T')[0]}.csv`;
        return await this.exportToCSV(exportData, filename);
    }
}