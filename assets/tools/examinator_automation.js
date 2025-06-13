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
            fields: [{ name: "collegejaar", value: "2024" }, { name: "cursus", value: "TICT-AFSTUD-19" }],
        },
    ],
};

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
                updateAutomationStatus(`Download van ${payload.filename} voltooid.`, 'info');
            } else {
                updateAutomationStatus('Download voltooid, maar bestandsnaam niet ontvangen. Controleer je downloadmap.', 'error');
            }
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
