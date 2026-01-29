
/**
 * HSC Native Bridge - Shadow Sync
 * This script is injected by the Native Wrapper.
 * DO NOT MODIFY WEB APP SOURCE.
 */
(function() {
    const STATE_KEY = 'hsc_study_tracker_state';
    
    // Intercept localStorage.setItem
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        originalSetItem.apply(this, arguments);
        
        if (key === STATE_KEY) {
            syncToNative(value);
        }
    };

    function syncToNative(stateJson) {
        try {
            // Android Bridge
            if (window.AndroidBridge && window.AndroidBridge.updateWidgetData) {
                window.AndroidBridge.updateWidgetData(stateJson);
            }
            
            // iOS Bridge
            if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.HSCBridge) {
                window.webkit.messageHandlers.HSCBridge.postMessage({
                    type: 'UPDATE_STATE',
                    data: stateJson
                });
            }
        } catch (e) {
            console.error("Native sync failed", e);
        }
    }

    // Initial Sync
    const initialState = localStorage.getItem(STATE_KEY);
    if (initialState) syncToNative(initialState);
})();
