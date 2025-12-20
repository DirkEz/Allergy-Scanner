import { onMounted, onUnmounted, ref } from 'vue'
import { BrowserMultiFormatReader } from '@zxing/browser'

export function useBarcodeScanner({ onBarcode }) {
    const video = ref(null)
    const cameraState = ref('Camera starten...')
    const lastBarcode = ref('')

    const reader = new BrowserMultiFormatReader()

    let activeControls = null
    let lastFetchedBarcode = ''
    let lastFetchAt = 0

    async function startScanner() {
        cameraState.value = 'Camera toestemming vragen...'

        try {
            activeControls?.stop()
            activeControls = await reader.decodeFromConstraints(
                { video: { facingMode: { ideal: 'environment' } } },
                video.value,
                (result, err) => {
                    if (result) {
                        const code = String(result.getText() || '').trim()
                        if (!code) return

                        lastBarcode.value = code
                        cameraState.value = 'Barcode gedetecteerd'
                        handleBarcode(code)
                    } else if (err) {
                        cameraState.value = 'Zoeken naar barcode...'
                    }
                }
            )

            cameraState.value = 'Zoeken naar barcode...'
        } catch {
            cameraState.value = 'Camera error'
        }
    }

    async function handleBarcode(code) {
        const now = Date.now()
        if (code === lastFetchedBarcode && now - lastFetchAt < 1500) return

        lastFetchedBarcode = code
        lastFetchAt = now
        await onBarcode(code)
    }

    function restartScanner() {
        lastBarcode.value = ''
        cameraState.value = 'Herstarten...'
        startScanner()
    }

    onMounted(() => {
        startScanner()
    })

    onUnmounted(() => {
        try {
            activeControls?.stop()
        } catch {}
        try {
            reader.reset()
        } catch {}
    })

    return {
        video,
        cameraState,
        lastBarcode,
        restartScanner,
        startScanner
    }
}
