/**
 * Examinator Excel Download Automation
 * Handles communication with the Osiris Chrome extension for automated report downloading.
 */

// Constants
const DOWNLOAD_BUTTON_AUTOMATION_ID = 'download-examinator';
const AUTOMATION_STATUS_ID = 'status-examinator';
const FILTER_CONFIG_AREA_ID = 'filter-config-area'; // Added for filter UI
const ADD_FILTER_TAB_BUTTON_ID = 'add-filter-tab-button'; // Added for filter UI

let currentReportConfig = {
    reportname: "9.1.06", // Rapportcode zoals gebruikt in Osiris
    fileType: "html",    // Gewenst bestandstype
    filters: [
        {
            tab: "docent",
            fields: [{ name: "rol", value: "EXAMINATOR" }],
        },
        {
            tab: "cursus",
            fields: [{ name: "collegejaar", value: new Date(new Date().setMonth(new Date().getMonth() - 9)).getFullYear().toString() }],
        },
    ],
};

/**
 * Check if file system permissions are available and granted.
 * @returns {Promise<boolean>} True if permissions are available and granted.
 */
async function hasFileSystemPermission() {
    try {
        // Check if File System Access API is supported
        if (!('showDirectoryPicker' in window)) {
            return false;
        }

        // Check if we have a stored directory handle
        const permissionInfo = await getStoredDirectoryHandle();
        if (!permissionInfo) {
            return false;
        }

        // Verify the handle still has permission
        const permission = await permissionInfo.handle.queryPermission({ mode: 'readwrite' });
        return permission === 'granted';
    } catch (error) {
        console.error('Error checking file system permission:', error);
        return false;
    }
}

/**
 * Get stored directory handle from IndexedDB.
 * @returns {Promise<Object|null>} Directory handle info or null if not found.
 */
async function getStoredDirectoryHandle() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('FileSystemHandles', 1);

        request.onerror = () => reject(request.error);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('handles')) {
                db.createObjectStore('handles');
            }
        };

        request.onsuccess = (event) => {
            const db = event.target.result;
            const transaction = db.transaction(['handles'], 'readonly');
            const store = transaction.objectStore('handles');

            const getRequest = store.get(`downloadFolder_${window.location.hostname}`);

            getRequest.onsuccess = () => {
                resolve(getRequest.result);
            };

            getRequest.onerror = () => reject(getRequest.error);
        };
    });
}

/**
 * Auto-process downloaded file using file system permissions.
 * @param {string} filename - The name of the downloaded file.
 */
async function autoProcessDownloadedFile(filename) {
    try {
        const permissionInfo = await getStoredDirectoryHandle();
        if (!permissionInfo) {
            console.warn('No directory handle available for auto-processing');
            updateAutomationStatus('Geen toestemming voor automatisch verwerken. Selecteer bestand handmatig.', 'error');
            return;
        }

        updateAutomationStatus('Bezig met automatisch verwerken van gedownload bestand...', 'info');

        // Log the filename for debugging
        console.log(`[examinator_automation] Original filename: "${filename}"`);

        // Extract just the filename from potential full path and sanitize
        let baseFilename = filename.split(/[/\\]/).pop() || filename;

        // Remove URL parameters and fragments if present
        baseFilename = baseFilename.split(/[?#]/)[0];

        console.log(`[examinator_automation] Base filename: "${baseFilename}""`);

        // First try: exact match with sanitized filename
        let fileHandle;
        try {
            console.log(`[examinator_automation] Trying exact match: "${baseFilename}"`);
            fileHandle = await permissionInfo.handle.getFileHandle(baseFilename);
            console.log(`[examinator_automation] Found exact match: "${baseFilename}"`);
        } catch (getFileError) {
            console.log(`[examinator_automation] Exact match failed: ${getFileError.message}`);
        }

        const file = await fileHandle.getFile();

        // Check if it's an HTML file
        if (!file.name.toLowerCase().endsWith('.html') && !file.name.toLowerCase().endsWith('.htm')) {
            throw new Error('Het gedownloade bestand is geen HTML-bestand');
        }

        // Trigger the same processing as manual file selection
        await processFileContent(file);

    } catch (error) {
        console.error('Error auto-processing downloaded file:', error);

        if (error.name === 'NotFoundError') {
            updateAutomationStatus(`Bestand "${filename}" niet gevonden in downloadmap. Controleer of de download is voltooid.`, 'error');
        } else if (error.name === 'TypeError' && error.message.includes('Name is not allowed')) {
            updateAutomationStatus(`Ongeldige bestandsnaam: "${filename}". Gebruik handmatige selectie.`, 'error');
        } else {
            updateAutomationStatus(`Fout bij automatisch verwerken: ${error.message}. Gebruik handmatige selectie.`, 'error');
        }
    }
}

/**
 * Process file content (extracted from manual processing logic).
 * @param {File} file - The file to process.
 */
async function processFileContent(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                // Trigger the Python processing by setting the file and dispatching the event
                const fileInput = document.getElementById('examinatorFile');

                // Create a mock file list to satisfy the Python script expectations
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInput.files = dataTransfer.files;

                // Trigger the processing event
                fileInput.dispatchEvent(new Event('process-excel'));

                resolve();
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
    });
}

/**
 * Update UI based on file system permissions availability.
 */
async function updateUIForPermissions() {
    const hasPermission = await hasFileSystemPermission();

    const manualStep = document.getElementById('manual-file-selection-step');
    const autoStep = document.getElementById('auto-processing-step');
    const autoDownloadStep = document.getElementById('auto-download-step');
    const manualDownloadHelp = document.getElementById('manual-download-help');
    const autoDownloadHelp = document.getElementById('auto-download-help');

    if (hasPermission) {
        // Hide manual file selection, show auto processing and auto download messages
        if (manualStep) manualStep.style.display = 'none';
        if (autoStep) autoStep.style.display = 'block';
        if (autoDownloadStep) autoDownloadStep.style.display = 'block';
        if (manualDownloadHelp) manualDownloadHelp.style.display = 'none';
        if (autoDownloadHelp) autoDownloadHelp.style.display = 'block';

        console.log('[examinator_automation] Auto-processing and auto-download enabled due to file system permissions');
    } else {
        // Show manual file selection, hide auto processing and auto download messages
        if (manualStep) manualStep.style.display = 'block';
        if (autoStep) autoStep.style.display = 'none';
        if (autoDownloadStep) autoDownloadStep.style.display = 'none';
        if (manualDownloadHelp) manualDownloadHelp.style.display = 'block';
        if (autoDownloadHelp) autoDownloadHelp.style.display = 'none';

        console.log('[examinator_automation] Manual file selection required - no file system permissions');
    }
}

/**
 * Renders the filter configuration UI based on currentReportConfig.
 */
function renderFilterConfigUI() {
    const configArea = document.getElementById(FILTER_CONFIG_AREA_ID);
    if (!configArea) return;

    configArea.innerHTML = ''; // Clear existing UI

    currentReportConfig.filters.forEach((tabConfig, tabIndex) => {
        const tabDiv = document.createElement('div');
        tabDiv.className = 'mb-3 p-2 border rounded';

        const tabHeader = document.createElement('div');
        tabHeader.className = 'd-flex justify-content-between align-items-center mb-2';

        const tabNameInput = document.createElement('input');
        tabNameInput.type = 'text';
        tabNameInput.className = 'form-control form-control-sm d-inline-block w-auto';
        tabNameInput.value = tabConfig.tab;
        tabNameInput.placeholder = 'Tab Naam';
        tabNameInput.addEventListener('change', (e) => {
            currentReportConfig.filters[tabIndex].tab = e.target.value;
        });
        tabHeader.appendChild(tabNameInput);

        const removeTabButton = document.createElement('button');
        removeTabButton.type = 'button';
        removeTabButton.className = 'btn btn-danger btn-sm';
        removeTabButton.textContent = 'Tab Verwijderen';
        removeTabButton.addEventListener('click', () => {
            currentReportConfig.filters.splice(tabIndex, 1);
            renderFilterConfigUI(); // Re-render
        });
        tabHeader.appendChild(removeTabButton);
        tabDiv.appendChild(tabHeader);

        const fieldsDiv = document.createElement('div');
        fieldsDiv.className = 'ms-3';

        tabConfig.fields.forEach((field, fieldIndex) => {
            const fieldGroup = document.createElement('div');
            fieldGroup.className = 'input-group input-group-sm mb-2';

            const fieldNameInput = document.createElement('input');
            fieldNameInput.type = 'text';
            fieldNameInput.className = 'form-control';
            fieldNameInput.value = field.name;
            fieldNameInput.placeholder = 'Veld Naam';
            fieldNameInput.addEventListener('change', (e) => {
                currentReportConfig.filters[tabIndex].fields[fieldIndex].name = e.target.value;
            });

            const fieldValueInput = document.createElement('input');
            fieldValueInput.type = 'text';
            fieldValueInput.className = 'form-control';
            fieldValueInput.value = field.value;
            fieldValueInput.placeholder = 'Veld Waarde';
            fieldValueInput.addEventListener('change', (e) => {
                currentReportConfig.filters[tabIndex].fields[fieldIndex].value = e.target.value;
            });

            const removeFieldButton = document.createElement('button');
            removeFieldButton.type = 'button';
            removeFieldButton.className = 'btn btn-outline-danger';
            removeFieldButton.textContent = 'X';
            removeFieldButton.addEventListener('click', () => {
                currentReportConfig.filters[tabIndex].fields.splice(fieldIndex, 1);
                renderFilterConfigUI(); // Re-render
            });

            fieldGroup.appendChild(fieldNameInput);
            fieldGroup.appendChild(fieldValueInput);
            fieldGroup.appendChild(removeFieldButton);
            fieldsDiv.appendChild(fieldGroup);
        });

        const addFieldButton = document.createElement('button');
        addFieldButton.type = 'button';
        addFieldButton.className = 'btn btn-outline-success btn-sm';
        addFieldButton.textContent = 'Veld Toevoegen';
        addFieldButton.addEventListener('click', () => {
            currentReportConfig.filters[tabIndex].fields.push({ name: '', value: '' });
            renderFilterConfigUI(); // Re-render
        });

        fieldsDiv.appendChild(addFieldButton);
        tabDiv.appendChild(fieldsDiv);
        configArea.appendChild(tabDiv);
    });
}

/**
 * Adds a new filter tab to the configuration and re-renders the UI.
 */
function addFilterTab() {
    currentReportConfig.filters.push({ tab: `NieuweTab${currentReportConfig.filters.length + 1}`, fields: [{ name: '', value: '' }] });
    renderFilterConfigUI();
}

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
            reportConfig: currentReportConfig // Use the potentially modified config
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
                updateAutomationStatus(`Download van ${payload.filename} voltooid.`, 'success');

                // Check if we should auto-process the file
                hasFileSystemPermission().then(hasPermission => {
                    if (hasPermission) {
                        // Wait a moment for the file to be fully written
                        setTimeout(async () => {
                            await autoProcessDownloadedFile(payload.filename);
                        }, 1000);
                    } else {
                        updateAutomationStatus('Download voltooid. Selecteer het bestand handmatig in stap 2.', 'info');
                    }
                });
            } else {
                updateAutomationStatus('Download voltooid, maar bestandsnaam niet ontvangen. Controleer je downloadmap.', 'error');
            }
            break;

        default:
            console.log('Onbekend bericht ontvangen van extensie-relay:', payload);
            break;
    }
}

// Listen for when the Python processing completes successfully
document.addEventListener('excelProcessingComplete', async (event) => {
    const hasPermission = await hasFileSystemPermission();
    const autoStepVisible = document.getElementById('auto-processing-step').style.display !== 'none';

    if (hasPermission && autoStepVisible) {
        try {
            const autoSaveEvent = new CustomEvent('requestAutoSave');
            document.dispatchEvent(autoSaveEvent);

        } catch (error) {
            console.error('Error triggering auto-download:', error);
            updateAutomationStatus('Excel bestand verwerkt. Klik op "Download Excel" om te downloaden.', 'success');
        }
    } else if (autoStepVisible) {
        updateAutomationStatus('Bestand automatisch verwerkt! Excel-bestand is klaar voor download.', 'success');
    }
});

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

    // Set up the add filter tab button
    const addTabButton = document.getElementById(ADD_FILTER_TAB_BUTTON_ID);
    if (addTabButton) {
        addTabButton.addEventListener('click', addFilterTab);
    } else {
        console.error(`Button with ID '${ADD_FILTER_TAB_BUTTON_ID}' not found.`);
    }

    // Initially render the filter UI and hide the status
    renderFilterConfigUI();
    hideAutomationStatus();

    // Update UI based on file system permissions
    updateUIForPermissions();

    // Listen for changes in permission status (e.g., when user navigates from settings page)
    window.addEventListener('focus', updateUIForPermissions);
}

document.getElementById('examinatorFile').addEventListener('change', function () {
    const indicator = document.getElementById('processing-indicator-examinator');
    indicator.style.display = 'inline-block';

    setTimeout(function () {
        document.getElementById('examinatorFile').dispatchEvent(new Event('process-excel'));
    }, 50);
});

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAutomation);
} else {
    initializeAutomation(); // DOMContentLoaded has already fired
}
