const https = require('https');

const CFX_CODE = 'zjjmbx5';

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=30');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const cfxUrl = `https://frontend.cfx-services.net/api/servers/single/${CFX_CODE}`;

        const fetchCfx = () => new Promise((resolve, reject) => {
            const request = https.get(cfxUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json'
                },
                timeout: 5000
            }, (response) => {
                let raw = '';
                response.on('data', chunk => raw += chunk);
                response.on('end', () => {
                    try {
                        resolve(JSON.parse(raw));
                    } catch (e) {
                        reject(e);
                    }
                });
            });

            request.on('error', reject);
            request.on('timeout', () => {
                request.destroy();
                reject(new Error('Timeout'));
            });
        });

        const json = await fetchCfx();
        const serverData = json.Data || {};
        const clients = typeof serverData.clients === 'number' ? serverData.clients : 0;
        const maxClients = serverData.sv_maxclients || serverData.svMaxclients || 1000;
        const hostname = serverData.hostname || 'OPHELIA ROLEPLAY';

        return res.status(200).json({
            online: true,
            clients,
            maxClients,
            hostname,
            cfxCode: CFX_CODE,
            connectUrl: `https://cfx.re/join/${CFX_CODE}`,
            updatedAt: new Date().toISOString()
        });
    } catch (err) {
        return res.status(200).json({
            online: false,
            clients: 0,
            maxClients: 1000,
            hostname: 'OPHELIA ROLEPLAY',
            cfxCode: CFX_CODE,
            connectUrl: `https://cfx.re/join/${CFX_CODE}`,
            error: err.message
        });
    }
};
