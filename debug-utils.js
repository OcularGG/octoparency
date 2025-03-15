// Debug utilities to help troubleshoot XLSX data loading and chart issues

(function() {
    // Create debug panel
    function createDebugPanel() {
        const panel = document.createElement('div');
        panel.id = 'debug-panel';
        panel.style.cssText = `
            position: fixed;
            bottom: 0;
            right: 0;
            width: 400px;
            height: 300px;
            background: rgba(0,0,0,0.85);
            color: #00ff00;
            font-family: monospace;
            font-size: 12px;
            padding: 10px;
            overflow: auto;
            z-index: 9999;
            display: none;
            border-top-left-radius: 8px;
        `;
        
        const header = document.createElement('div');
        header.innerHTML = '<h3>Debug Console</h3>';
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            border-bottom: 1px solid #333;
            padding-bottom: 5px;
        `;
        
        const closeBtn = document.createElement('button');
        closeBtn.textContent = 'Close';
        closeBtn.style.cssText = `
            background: #333;
            color: white;
            border: none;
            padding: 2px 8px;
            cursor: pointer;
        `;
        closeBtn.onclick = () => {
            panel.style.display = 'none';
        };
        
        const clearBtn = document.createElement('button');
        clearBtn.textContent = 'Clear';
        clearBtn.style.cssText = `
            background: #333;
            color: white;
            border: none;
            padding: 2px 8px;
            margin-right: 5px;
            cursor: pointer;
        `;
        clearBtn.onclick = () => {
            logContainer.innerHTML = '';
        };
        
        const buttonContainer = document.createElement('div');
        buttonContainer.appendChild(clearBtn);
        buttonContainer.appendChild(closeBtn);
        
        header.appendChild(buttonContainer);
        panel.appendChild(header);
        
        const logContainer = document.createElement('div');
        logContainer.id = 'debug-log';
        panel.appendChild(logContainer);
        
        document.body.appendChild(panel);
        
        return {
            panel,
            logContainer
        };
    }
    
    // Initialize debug panel when DOM is loaded
    function init() {
        // Create debug panel
        const { panel, logContainer } = createDebugPanel();
        
        // Add keyboard shortcut (Ctrl+Shift+D) to show/hide debug panel
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
                e.preventDefault();
            }
        });
        
        // Override console.log and other methods to also show in debug panel
        const originalLog = console.log;
        const originalWarn = console.warn;
        const originalError = console.error;
        
        function formatTimestamp() {
            const now = new Date();
            return `[${now.toLocaleTimeString()}.${now.getMilliseconds().toString().padStart(3, '0')}]`;
        }
        
        console.log = function() {
            const args = Array.from(arguments);
            originalLog.apply(console, args);
            
            const message = args.map(arg => {
                if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg);
                    } catch (e) {
                        return arg.toString();
                    }
                }
                return arg;
            }).join(' ');
            
            const logEntry = document.createElement('div');
            logEntry.innerHTML = `<span style="color:#888">${formatTimestamp()}</span> ${message}`;
            logContainer.appendChild(logEntry);
            logContainer.scrollTop = logContainer.scrollHeight;
        };
        
        console.warn = function() {
            const args = Array.from(arguments);
            originalWarn.apply(console, args);
            
            const message = args.map(arg => {
                if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg);
                    } catch (e) {
                        return arg.toString();
                    }
                }
                return arg;
            }).join(' ');
            
            const logEntry = document.createElement('div');
            logEntry.innerHTML = `<span style="color:#888">${formatTimestamp()}</span> <span style="color:yellow">⚠️ ${message}</span>`;
            logContainer.appendChild(logEntry);
            logContainer.scrollTop = logContainer.scrollHeight;
        };
        
        console.error = function() {
            const args = Array.from(arguments);
            originalError.apply(console, args);
            
            const message = args.map(arg => {
                if (typeof arg === 'object' && arg instanceof Error) {
                    return arg.message + '\n' + arg.stack;
                } else if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg);
                    } catch (e) {
                        return arg.toString();
                    }
                }
                return arg;
            }).join(' ');
            
            const logEntry = document.createElement('div');
            logEntry.innerHTML = `<span style="color:#888">${formatTimestamp()}</span> <span style="color:red">🛑 ${message}</span>`;
            logContainer.appendChild(logEntry);
            logContainer.scrollTop = logContainer.scrollHeight;
        };
        
        // Add XLSX test button to the page
        const testBtn = document.createElement('button');
        testBtn.id = 'xlsx-test-btn';
        testBtn.textContent = 'Test XLSX Data';
        testBtn.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            background: #4299e1;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            z-index: 9998;
        `;
        
        testBtn.onclick = async () => {
            panel.style.display = 'block';
            console.log('Testing XLSX data loading...');
            
            try {
                const startTime = performance.now();
                const response = await fetch('OCULAR Accounting - Book Keeping.xlsx');
                const endTime = performance.now();
                
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                
                const arrayBuffer = await response.arrayBuffer();
                const responseTime = (endTime - startTime).toFixed(2);
                
                console.log(`✅ XLSX data loaded successfully! Response time: ${responseTime}ms`);
                console.log(`XLSX data size: ${arrayBuffer.byteLength} bytes`);
                
                // Try parsing the XLSX using SheetJS
                try {
                    if (typeof XLSX === 'undefined') {
                        throw new Error('XLSX library not loaded. Make sure you included the SheetJS library in your HTML.');
                    }
                    
                    // Parse the workbook
                    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
                    console.log('Workbook loaded:', workbook.SheetNames);
                    
                    // Get the first worksheet
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    
                    // Convert to JSON to inspect first few rows
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: "" });
                    console.log(`Worksheet "${sheetName}" has ${jsonData.length} rows`);
                    
                    if (jsonData.length > 0) {
                        console.log('Headers:', jsonData[0]);
                    }
                    
                    if (jsonData.length > 1) {
                        console.log('First data row:', jsonData[1]);
                    }
                    
                    // Try parsing with our custom parser
                    if (typeof parseXLSX === 'function') {
                        const parsed = parseXLSX(arrayBuffer);
                        console.log(`Parsed ${parsed.length} rows from XLSX`);
                        if (parsed.length > 0) {
                            console.log('Sample data (first row):', parsed[0]);
                        }
                    } else {
                        console.warn('parseXLSX function not available in global scope');
                    }
                } catch (parseError) {
                    console.error('XLSX parsing error:', parseError);
                }
            } catch (error) {
                console.error('XLSX data loading failed:', error);
            }
        };
        
        document.body.appendChild(testBtn);
        
        // Add a reload data button
        const reloadBtn = document.createElement('button');
        reloadBtn.id = 'reload-data-btn';
        reloadBtn.textContent = 'Reload Data';
        reloadBtn.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 120px;
            background: #48bb78;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            z-index: 9998;
        `;
        
        reloadBtn.onclick = () => {
            panel.style.display = 'block';
            console.log('Triggering data reload...');
            
            // Call the global loadXLSXData function if it exists
            if (typeof window.loadXLSXData === 'function') {
                window.loadXLSXData();
                console.log('Data reload initiated');
            } else {
                console.error('loadXLSXData function not found in global scope');
            }
        };
        
        document.body.appendChild(reloadBtn);
        
        console.log('Debug utilities loaded. Press Ctrl+Shift+D to toggle debug panel.');
    }
    
    // Initialize when DOM is loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
