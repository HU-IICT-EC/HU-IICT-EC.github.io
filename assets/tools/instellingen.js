
document.addEventListener('DOMContentLoaded', () => {
    // Display current domain
    const currentDomainEl = document.getElementById('current-domain');
    if (currentDomainEl) {
        currentDomainEl.textContent = window.location.hostname;
    }

    const extensionStatusEl = document.getElementById('extension-status');
    const installInstructionsEl = document.getElementById('install-instructions');
    const requestPermissionBtn = document.getElementById('request-permission-btn');

    // --- Extension Status & Installation Instructions Logic ---
    let isExtensionInstalled = false; // Placeholder

    function updateExtensionStatusDisplay() {
        if (!extensionStatusEl) return;

        // Set up listener for extension response
        const handleExtensionResponse = (event) => {
            if (event.source !== window || !event.data || event.data.source !== 'osiris-extension') {
                return;
            }

            if (event.data.payload.version) {
                // Remove the listener after receiving response
                window.removeEventListener('message', handleExtensionResponse);

                console.log("Extension version:", event.data.payload.version);
                isExtensionInstalled = true;
                extensionStatusEl.innerHTML = `Status: <span class="fw-bold text-success">Geïnstalleerd (v${event.data.payload.version})</span>`;
                setInstallInstructionsVisibility(true);
            }
        };

        // Listen for extension response
        window.addEventListener('message', handleExtensionResponse);

        // Post message to window for extension to pick up
        window.postMessage({
            source: 'osiris-web',
            payload: {
                type: 'VERSION',
            }
        }, '*');

        // Set timeout to handle case where extension doesn't respond
        setTimeout(() => {
            window.removeEventListener('message', handleExtensionResponse);
            if (!isExtensionInstalled) {
                console.warn("No response from extension - assuming not installed");
                extensionStatusEl.innerHTML = `Status: <span class="fw-bold text-danger">Niet geïnstalleerd (geen reactie van extensie)</span>`;
                setInstallInstructionsVisibility(false);
            }
        }, 2000); // 2 second timeout
    }

    function setInstallInstructionsVisibility(installed) {
        if (installInstructionsEl) {
            const collapse = new bootstrap.Collapse(installInstructionsEl, {
                toggle: false // Initialize collapsed state based on logic, don't toggle on init
            });
            if (installed) {
                collapse.hide();
            } else {
                collapse.show();
            }
        }
    }

    // Initialize extension status and instruction visibility
    updateExtensionStatusDisplay();

    // --- Persistent Storage Permission Logic ---
    if (requestPermissionBtn) {
        requestPermissionBtn.addEventListener('click', async () => {
            await requestFileSystemPermission();
        });
    }

    async function requestFileSystemPermission() {
        try {
            // Check if File System Access API is supported
            if (!('showDirectoryPicker' in window)) {
                console.warn('File System Access API not supported in this browser');
                return;
            }

            // Show directory picker for downloads folder
            const directoryHandle = await window.showDirectoryPicker({
                mode: 'readwrite',
                startIn: 'downloads'
            });

            // Request permission for the directory
            const permission = await directoryHandle.requestPermission({ mode: 'readwrite' });

            if (permission === 'granted') {
                try {
                    // Store the actual handle using IndexedDB
                    await storeDirectoryHandle(directoryHandle);
                    await updatePermissionStatus();
                } catch (storageError) {
                    console.error('Error storing directory handle:', storageError);
                }
            } else {
                console.log('Permission denied for file system access');
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                // User cancelled the picker
                console.log('User cancelled directory picker');
            } else {
                console.error('Error requesting file system permission:', error);
            }
        }
    }

    async function storeDirectoryHandle(directoryHandle) {
        // Store directory handle with metadata in IndexedDB
        const handleData = {
            handle: directoryHandle,
            name: directoryHandle.name,
            timestamp: Date.now(),
            domain: window.location.hostname
        };

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
                const transaction = db.transaction(['handles'], 'readwrite');
                const store = transaction.objectStore('handles');

                const storeRequest = store.put(handleData, `downloadFolder_${window.location.hostname}`);

                storeRequest.onsuccess = () => resolve();
                storeRequest.onerror = () => reject(storeRequest.error);
            };
        });
    }

    async function getPermissionInfo() {
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

    async function updatePermissionStatus() {
        const permissionStatusEl = document.getElementById('permission-status');

        if (!permissionStatusEl) return;

        try {
            const permissionInfo = await getPermissionInfo();

            if (permissionInfo) {
                // Verify the handle still has permission
                const permission = await permissionInfo.handle.queryPermission({ mode: 'readwrite' });

                if (permission === 'granted') {
                    permissionStatusEl.innerHTML = `<small class="text-success">Toestemming verleend voor map: "${permissionInfo.name}" (${new Date(permissionInfo.timestamp).toLocaleDateString('nl-NL')})</small>`;
                } else {
                    permissionStatusEl.innerHTML = `<small class="text-warning">Toestemming verlopen voor map: "${permissionInfo.name}". Klik op "Downloadmap Selecteren" om opnieuw toestemming te geven.</small>`;
                }
            } else {
                permissionStatusEl.innerHTML = `<small class="text-muted">Geen downloadmap geselecteerd. Klik op "Downloadmap Selecteren" om een map te kiezen.</small>`;
            }
        } catch (error) {
            console.error('Error checking permission status:', error);
            permissionStatusEl.innerHTML = `<small class="text-muted">Geen downloadmap geselecteerd. Klik op "Downloadmap Selecteren" om een map te kiezen.</small>`;
        }
    }

    // Initialize permission status display
    updatePermissionStatus();
});
