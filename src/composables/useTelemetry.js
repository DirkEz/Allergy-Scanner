

export function useTelemetry() {
  return {
    consent,
    enabled,
    isModalOpen,
    events,
    sending,
    lastSendError,
    setConsent,
    openModal,
    closeModal,
    track,
    trackBarcodeDetected,
    clearLogs,
    exportJson,
    downloadJson,
    copyJson,
    sendToBackend
  }
}
