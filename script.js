// Ensure the entire script runs after the HTML document is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed"); // Log: Script start

    // Get references to all necessary HTML elements
    const urlsInput = document.getElementById('urlsInput');
    const fetchTitlesButton = document.getElementById('fetchTitlesButton');
    const loadingMessage = document.getElementById('loadingMessage');
    const linkEditorSection = document.getElementById('linkEditorSection');
    const linkEditorArea = document.getElementById('linkEditorArea');
    const generateHtmlButton = document.getElementById('generateHtmlButton');
    const outputSection = document.getElementById('outputSection');
    const outputPreview = document.getElementById('outputPreview');
    const outputHtmlTextarea = document.getElementById('outputHtml');
    const copyHtmlButton = document.getElementById('copyHtmlButton');

    // --- Event Listener for Fetching Titles ---
    if (fetchTitlesButton) {
        console.log("Fetch Titles button found."); // Log: Button exists
        fetchTitlesButton.addEventListener('click', async () => {
            console.log("Fetch Titles button clicked!"); // Log: Click detected

            const urls = urlsInput.value.split('\n').filter(url => url.trim() !== '');
            if (urls.length === 0) {
                alert('Please paste some URLs.');
                console.log("No URLs provided."); // Log: No URLs
                return;
            }

            console.log(`Found ${urls.length} URLs to process.`); // Log: URL count

            linkEditorArea.innerHTML = ''; // Clear previous items
            loadingMessage.style.display = 'block'; // Show loading indicator
            fetchTitlesButton.disabled = true; // Disable button during processing

            // Process each URL sequentially
            for (let i = 0; i < urls.length; i++) {
                const url = urls[i].trim();
                console.log(`Processing URL ${i + 1}: ${url}`); // Log: Processing URL

                let title = ''; // Initialize title variable
                try {
                    // Construct the request URL for the backend endpoint
                    const fetchUrl = `/fetch-title?url=${encodeURIComponent(url)}`;
                    console.log(`Fetching title from backend: ${fetchUrl}`); // Log: Fetch URL

                    // Make the asynchronous request to the backend
                    const response = await fetch(fetchUrl);
                    console.log(`Backend response status for ${url}: ${response.status}`); // Log: Response status

                    if (response.ok) {
                        // If response is successful (status 200-299)
                        const data = await response.json(); // Parse JSON response
                        title = data.title || 'Title not found'; // Get title or use fallback
                        console.log(`Title fetched successfully for ${url}: ${title}`); // Log: Success
                    } else {
                        // If response indicates an error (status outside 200-299)
                        const errorData = await response.text(); // Get error text
                        title = `Error fetching title (Status: ${response.status})`;
                        console.error(`Error response from backend for ${url}: ${response.status}`, errorData); // Log: Backend error response
                    }
                } catch (error) {
                    // Catch errors during the fetch operation itself (e.g., network error)
                    console.error(`Network or fetch error for ${url}:`, error); // Log: Fetch error
                    title = 'Error: Could not connect to server or fetch title.';
                }

                // Create the HTML elements to display the URL and editable title field
                const itemDiv = document.createElement('div');
                itemDiv.classList.add('link-item');
                itemDiv.innerHTML = `
                    <label for="url-${i}">URL:</label>
                    <input type="url" id="url-${i}" value="${url}" readonly>
                    <label for="title-${i}">Fetched Article Title (Editable):</label>
                    <input type="text" id="title-${i}" value="${title}" placeholder="Enter article title here">
                `;
                linkEditorArea.appendChild(itemDiv); // Add the new elements to the page
            }

            // Hide loading message and re-enable button after processing all URLs
            loadingMessage.style.display = 'none';
            fetchTitlesButton.disabled = false;
            linkEditorSection.style.display = 'block'; // Show the editor section
            outputSection.style.display = 'none'; // Hide output section if previously shown
            console.log("Finished processing all URLs."); // Log: Processing complete
        });
    } else {
        console.error("Fetch Titles button not found!"); // Log: Button missing error
    }

    // --- Event Listener for Generating HTML ---
    // Corrected structure: addEventListener('click', () => { /* function body */ });
    if (generateHtmlButton) {
        generateHtmlButton.addEventListener('click', () => { // This is the start of the actual function body
            console.log("Generate HTML button clicked."); // Log: Generate click

            const items = linkEditorArea.querySelectorAll('.link-item');
            let allFormattedHtml = ''; // Accumulator for preview HTML
            let rawHtmlOutput = ''; // Accumulator for textarea HTML

            items.forEach((item, index) => {
                const urlInput = item.querySelector(`#url-${index}`);
                const titleInput = item.querySelector(`#title-${index}`);

                // Basic check if inputs exist before accessing value
                if (!urlInput || !titleInput) {
                    console.warn(`Skipping item index ${index}, inputs not found.`);
                    return; // Skip this item if inputs are missing
                }

                const url = urlInput.value;
                const title = titleInput.value;

                // Skip processing if title is empty or indicates a previous error
                if (!title.trim() || title.toLowerCase().includes("error") || title.toLowerCase().includes("title not found")) {
                    console.log(`Skipping link for ${url} due to missing or error in title.`); // Log: Skipping link
                    allFormattedHtml += `<p><em>Skipped link for ${url} due to missing or error in title.</em></p>\n`;
                    // Add a comment in the raw HTML output for skipped items
                    rawHtmlOutput += `\n`;
                    return; // Go to the next item
                }

                // Generate the formatted HTML snippet using the rule-based segmentation
                const formattedLinkHtml = segmentTitleRuleBased(title, url);
                allFormattedHtml += formattedLinkHtml;
                rawHtmlOutput += formattedLinkHtml + '\n'; // Add newline for textarea readability
            });

            // Update the preview and HTML textarea, then show the output section
            outputPreview.innerHTML = allFormattedHtml;
            outputHtmlTextarea.value = rawHtmlOutput.trim();
            outputSection.style.display = 'block';
            console.log("HTML generation complete."); // Log: Generation complete
        }); // This is the closing parenthesis and brace for the event listener function
    } else {
        console.error("Generate HTML button not found!"); // Log: Button missing error
    }

    // --- Event Listener for Copying HTML ---
    if (copyHtmlButton) {
        copyHtmlButton.addEventListener('click', () => {
            console.log("Copy HTML button clicked."); // Log: Copy click
            copyHtmlToClipboard(outputHtmlTextarea.value);
        });
    } else {
        console.error("Copy HTML button not found!"); // Log: Button missing error
    }


    // --- Helper Functions ---

    /**
     * Converts a string to sentence case (first letter uppercase, rest lowercase).
     * @param {string} text - The input string.
     * @returns {string} The sentence-cased string.
     */
    function toSentenceCase(text) {
        if (!text || typeof text !== 'string') return '';
        const trimmed = text.trim();
        if (trimmed.length === 0) return '';
        const lower = trimmed.toLowerCase();
        return lower.charAt(0).toUpperCase() + lower.slice(1);
    }

    /**
     * Trims, lowercases, and removes trailing periods from a string.
     * @param {string} text - The input string.
     * @returns {string} The cleaned and lowercased string.
     */
    function cleanAndLower(text) {
        if (!text || typeof text !== 'string') return '';
        // Trim, lowercase, remove trailing period
        return text.trim().toLowerCase().replace(/\.$/, '');
    }

    /**
     * Segments the title based on predefined rules and generates the HTML snippet.
     * @param {string} title - The article title.
     * @param {string} url - The article URL.
     * @returns {string} The formatted HTML string for the link.
     */
    function segmentTitleRuleBased(title, url) {
        const cleanedTitle = title.trim();
        // Split by one or more whitespace characters and filter empty strings
        const words = cleanedTitle.split(/\s+/).filter(w => w);
        const totalWords = words.length;

        // Handle empty titles
        if (totalWords === 0) {
            console.warn("segmentTitleRuleBased called with empty title."); // Log: Empty title warning
            return '<p><em>(Title was empty)</em></p>';
        }

        // Handle 1-word titles: Make the single word bold and linked
        if (totalWords === 1) {
            const processedSingleWord = toSentenceCase(words[0]);
            return `<p><strong><a href="${url}" target="_blank">${processedSingleWord}</a></strong>.</p>`;
        }

        // Initialize parts
        let rawBoldedPart, rawMiddlePart, rawLinkedPart;

        // Determine Bold Part: 2 words if title > 5 words AND leaves >= 1 word after; otherwise 1 word.
        const numBoldWords = (totalWords > 5 && totalWords - 2 >= 1) ? 2 : 1;
        const boldWords = words.slice(0, numBoldWords);
        rawBoldedPart = boldWords.join(" ");

        // Words remaining after taking the bold part
        const remainingWordsAfterBold = words.slice(numBoldWords);

        // Determine Linked Part: Target ~35% of total words, minimum 1.
        let numLinkedWordsTarget = Math.max(1, Math.round(totalWords * 0.35));

        // Check remaining words
        if (remainingWordsAfterBold.length === 0) {
            // This should ideally not happen if totalWords > 1, but as a fallback:
            console.warn("No remaining words after bolding for title:", title); // Log: Edge case warning
            rawMiddlePart = "";
            rawLinkedPart = rawBoldedPart; // Link the bold part if nothing else remains
        } else if (remainingWordsAfterBold.length <= numLinkedWordsTarget) {
            // If what's left is less than or equal to our target for linking, link all of it.
            rawMiddlePart = "";
            rawLinkedPart = remainingWordsAfterBold.join(" ");
        } else {
            // We have enough remaining words for a middle part and a linked part.
            // Ensure we don't try to take more linked words than available.
            const actualNumLinkedWords = Math.min(numLinkedWordsTarget, remainingWordsAfterBold.length);

            const linkedWords = remainingWordsAfterBold.slice(-actualNumLinkedWords);
            rawLinkedPart = linkedWords.join(" ");

            // The middle part is everything between bold and linked
            const middleWords = remainingWordsAfterBold.slice(0, remainingWordsAfterBold.length - actualNumLinkedWords);
            rawMiddlePart = middleWords.join(" ");
        }

        // Final processing for casing and cleaning
        let processedBoldedPart = toSentenceCase(rawBoldedPart);
        let processedMiddlePart = rawMiddlePart.trim().toLowerCase(); // Middle part is always lowercase
        let processedLinkedPart = cleanAndLower(rawLinkedPart);   // Linked part is cleaned and lowercased

        // Construct HTML snippet
        let htmlSnippet = "<p>";
        htmlSnippet += `<strong>${processedBoldedPart}</strong>`; // Add bold part

        if (processedMiddlePart) {
            htmlSnippet += ` ${processedMiddlePart}`; // Add middle part if it exists
        }

        // Determine if the linked part needs to be added
        let addLink = processedLinkedPart && !(rawLinkedPart === rawBoldedPart && !processedMiddlePart);

        if (addLink) {
            // Add linked part if it exists and is distinct from the bold part (or if there's a middle part)
             htmlSnippet += ` <a href="${url}" target="_blank">${processedLinkedPart}</a>`;
        } else if (!processedMiddlePart && rawLinkedPart === rawBoldedPart) {
             // Special case: If the fallback linked the bold part because nothing else remained,
             // reconstruct the bold part to include the link.
             htmlSnippet = `<p><strong><a href="${url}" target="_blank">${processedBoldedPart}</a></strong>`;
             // Note: Period will be added below.
        }
        // If linked part is empty or was the same as bold part without a middle, we don't add a separate link tag here.

        htmlSnippet += ".</p>"; // Add the final period
        return htmlSnippet;
    }


    /**
     * Copies the provided HTML string to the clipboard, attempting rich text first.
     * @param {string} htmlString - The HTML string to copy.
     */
    async function copyHtmlToClipboard(htmlString) {
        if (!htmlString) {
            console.log("Nothing to copy."); // Log: Empty copy attempt
            return;
        }
        try {
            // Use ClipboardItem for rich text (HTML) copy
            const blobHtml = new Blob([htmlString], { type: 'text/html' });
            // Also create a plain text version for broader compatibility
            const blobText = new Blob([htmlString], { type: 'text/plain' });
            const clipboardItem = new ClipboardItem({
                'text/html': blobHtml,
                'text/plain': blobText
             });
            await navigator.clipboard.write([clipboardItem]);
            alert('Formatted HTML copied to clipboard!');
            console.log("HTML copied successfully (rich text)."); // Log: Copy success
        } catch (err) {
            console.warn('Rich text copy failed, attempting plain text copy:', err); // Log: Rich text fail
            try {
                // Fallback: Use navigator.clipboard.writeText for plain text HTML code
                await navigator.clipboard.writeText(htmlString);
                alert('Copied as plain text (HTML code). You may need to paste into an HTML editor or adjust formatting.');
                console.log("HTML copied successfully (plain text fallback)."); // Log: Plain text success
            } catch (fallbackErr) {
                console.error('Fallback plain text copy failed:', fallbackErr); // Log: Plain text fail
                // Last resort: textarea selection method (less reliable)
                const textArea = document.createElement("textarea");
                textArea.value = htmlString;
                textArea.style.position = "fixed"; // Avoid scrolling
                textArea.style.opacity = "0"; // Make invisible
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                try {
                    document.execCommand('copy');
                    alert('Formatted HTML copied to clipboard (using legacy method).');
                     console.log("HTML copied successfully (legacy execCommand)."); // Log: Legacy success
                } catch (execErr) {
                    alert('Failed to copy automatically. Please copy manually from the text area.');
                    console.error('Legacy execCommand copy failed:', execErr); // Log: Legacy fail
                }
                document.body.removeChild(textArea);
            }
        }
    }

}); // End of DOMContentLoaded listener