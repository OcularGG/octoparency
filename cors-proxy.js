// This is a simple CORS proxy server for local development
// Run with Node.js: node cors-proxy.js

const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 3000;
const TARGET_URL = 'https://script.google.com/macros/s/AKfycbwqtDif0ZKw4dfCrIN12L93XQwX9GeZPmC2nj72kbs-KFJpfHlqoQ2lp4iMzVsseCHZ/exec';

const server = http.createServer((req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    // Handle preflight request
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    console.log(`Proxying request to: ${TARGET_URL}`);
    
    // Forward the request to the target URL
    const targetUrl = url.parse(TARGET_URL);
    
    const options = {
        hostname: targetUrl.hostname,
        path: targetUrl.path,
        method: req.method,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    const proxyReq = https.request(options, (proxyRes) => {
        res.writeHead(proxyRes.statusCode, proxyRes.headers);
        
        let data = '';
        proxyRes.on('data', (chunk) => {
            data += chunk;
            res.write(chunk);
        });
        
        proxyRes.on('end', () => {
            console.log('Response received and forwarded');
            console.log('First 200 chars of response:', data.substring(0, 200));
            res.end();
        });
    });
    
    proxyReq.on('error', (err) => {
        console.error('Proxy request error:', err);
        res.writeHead(500);
        res.end(`Proxy error: ${err.message}`);
    });
    
    req.on('data', (chunk) => {
        proxyReq.write(chunk);
    });
    
    req.on('end', () => {
        proxyReq.end();
    });
});

server.listen(PORT, () => {
    console.log(`CORS Proxy running on http://localhost:${PORT}`);
    console.log(`Forwarding requests to ${TARGET_URL}`);
    console.log(`To use this proxy, replace your API URL with http://localhost:${PORT}`);
});
