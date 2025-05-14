const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path'); // To serve static files

const app = express();
const port = 3000; // You can change this port if needed

// Serve static files (HTML, CSS, frontend JS) from the current directory
app.use(express.static(path.join(__dirname)));

app.get('/fetch-title', async (req, res) => {
    const targetUrl = req.query.url;

    if (!targetUrl) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        const { data } = await axios.get(targetUrl, {
            headers: { // Some sites might block requests without a common User-Agent
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 5000 // Set a timeout for requests (e.g., 5 seconds)
        });
        const $ = cheerio.load(data);
        const title = $('title').first().text().trim();
        res.json({ title: title || 'No title found' });
    } catch (error) {
        console.error(`Error fetching title for ${targetUrl}:`, error.message);
        if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
             res.status(error.response.status).json({ error: `Failed to fetch content: Server responded with ${error.response.status}`, details: error.message });
        } else if (error.request) {
            // The request was made but no response was received
            res.status(500).json({ error: 'Failed to fetch content: No response from server', details: error.message });
        } else {
            // Something happened in setting up the request that triggered an Error
            res.status(500).json({ error: 'Failed to fetch content: Error in request setup', details: error.message });
        }
    }
});

// Serve index.html for the root path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
    console.log(`Open http://localhost:${port} in your browser to use the app.`);
});