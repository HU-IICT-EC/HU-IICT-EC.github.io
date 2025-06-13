/**
 * Examinator Excel Download Automation
 * Handles communication with the Osiris Chrome extension for automated report downloading.
 */

// Constants
const DOWNLOAD_BUTTON_AUTOMATION_ID = 'download-automation-examinator';
const AUTOMATION_STATUS_ID = 'automation-status-examinator';

// Default report configuration for examinator data
const DEFAULT_REPORT_CONFIG = {
    reportname: "9.1.06", // Rapportcode zoals gebruikt in Osiris
    fileType: "html",    // Gewenst bestandstype
    filters: [
        {
            tab: "docent",
            fields: [{ name: "rol", value: "EXAMINATOR" }],
        },
        {
            tab: "cursus",
            fields: [{ name: "collegejaar", value: "2024" }, { name: "cursus", value: "TICT-AFSTUD-19" }], // As per user request
        },
    ],
};

/**
 * Update the automation status display.
 * @param {string} message - Status message to display.
 * @param {'info' | 'success' | 'error'} type - Type of status.
 */
function updateAutomationStatus(message, type = 'info') {
    const statusElement = document.getElementById(AUTOMATION_STATUS_ID);
    if (!statusElement) return;

    statusElement.textContent = message;
    statusElement.className = 'alert mt-2'; // Base class
    if (type === 'error') {
        statusElement.classList.add('alert-danger');
    } else if (type === 'success') {
        statusElement.classList.add('alert-success');
    } else {
        statusElement.classList.add('alert-info');
    }
    statusElement.style.display = 'block';
}

/**
 * Hide the automation status display.
 */
function hideAutomationStatus() {
    const statusElement = document.getElementById(AUTOMATION_STATUS_ID);
    if (statusElement) {
        statusElement.style.display = 'none';
    }
}

/**
 * Handle automated report download trigger.
 */
function triggerAutomatedDownload() {

    updateAutomationStatus('Bezig met automatisch downloaden van rapport via de Osiris extensie...', 'info');

    // Send message to Chrome extension via the content script relay
    window.postMessage({
        source: 'osiris-web', // Source identifier expected by the extension's content script
        payload: {
            type: 'NAVIGATE_AND_OPEN_REPORT',
            reportConfig: DEFAULT_REPORT_CONFIG
        }
    }, '*'); // Target all origins, as the extension content script will filter
}

/**
 * Handle messages received from the Chrome extension (via content script relay).
 * @param {MessageEvent} event - The message event.
 */
function handleExtensionMessage(event) {
    // Ensure the message is from our extension relay
    // Based on assets/osiris-chrome-extension/content-scripts/github-pages.js, responses come from 'osiris-extension-response'
    if (!event.data || event.data.source !== 'osiris-extension') {
        return;
    }

    const { payload } = event.data;

    if (!payload) return;

    switch (payload.type) {
        case 'DOWNLOAD_COMPLETED':
            if (payload.filename) {
                updateAutomationStatus(`Download van ${payload.filename} voltooid.`, 'info');
            } else {
                updateAutomationStatus('Download voltooid, maar bestandsnaam niet ontvangen. Controleer je downloadmap.', 'error');
            }
            break;

        case 'DOWNLOAD_ERROR':
            updateAutomationStatus(
                `Fout bij downloaden via extensie: ${payload.error || 'Onbekende fout'}`,
                'error'
            );
            break;

        default:
            console.log('Onbekend bericht ontvangen van extensie-relay:', payload);
            break;
    }
}

/**
 * Initialize the automation functionality.
 */
function initializeAutomation() {
    // Listen for messages from the Chrome extension relay
    window.addEventListener('message', handleExtensionMessage);

    // Set up the automated download button
    const downloadButton = document.getElementById(DOWNLOAD_BUTTON_AUTOMATION_ID);
    if (downloadButton) {
        downloadButton.addEventListener('click', triggerAutomatedDownload);
    } else {
        console.error(`Button with ID '${DOWNLOAD_BUTTON_AUTOMATION_ID}' not found.`);
    }

    // Initially hide the status
    hideAutomationStatus();
}

document.getElementById('examinatorFile').addEventListener('change', function () {
    const indicator = document.getElementById('processing-indicator-examinator');
    indicator.style.display = 'inline-block';

    setTimeout(function () {
        document.dispatchEvent(new Event('process-excel'));
    }, 50);
});


// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAutomation);
} else {
    initializeAutomation(); // DOMContentLoaded has already fired
}
