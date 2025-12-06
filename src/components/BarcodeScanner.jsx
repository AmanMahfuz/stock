import React, { useState, useEffect, useRef } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'

export default function BarcodeScanner({ onScan, onClose }) {
    const [error, setError] = useState(null)
    const [manualCode, setManualCode] = useState('')
    const [permissionGranted, setPermissionGranted] = useState(false)
    const videoRef = useRef(null)
    const controlsRef = useRef(null)
    const inputRef = useRef(null)

    // Auto-focus input for manual entry or hardware scanners
    useEffect(() => {
        if (inputRef.current) inputRef.current.focus()
    }, [])

    useEffect(() => {
        const codeReader = new BrowserMultiFormatReader()
        let mounted = true

        async function startScanning() {
            try {
                // 1. Request permission first to ensure we can list devices with labels
                const initialStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })

                // Stop the initial stream immediately, we just needed permissions
                initialStream.getTracks().forEach(track => track.stop())
                setPermissionGranted(true)

                // 2. Find the best camera (Back/Environment)
                const devices = await BrowserMultiFormatReader.listVideoInputDevices()
                const backCamera = devices.find(device =>
                    device.label.toLowerCase().includes('back') ||
                    device.label.toLowerCase().includes('environment')
                )
                const selectedDeviceId = backCamera ? backCamera.deviceId : (devices[0]?.deviceId || undefined)

                if (mounted && selectedDeviceId !== undefined) {
                    // 3. Start decoding with specific device
                    controlsRef.current = await codeReader.decodeFromVideoDevice(selectedDeviceId, videoRef.current, (result, err) => {
                        if (mounted && result) {
                            handleSuccess(result.getText())
                        }
                    })
                } else if (mounted) {
                    // Fallback if no devices found (unlikely if getUserMedia worked)
                    controlsRef.current = await codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
                        if (mounted && result) handleSuccess(result.getText())
                    })
                }

            } catch (err) {
                if (mounted) {
                    console.error("Camera error:", err)
                    setError(err)
                }
            }
        }

        startScanning()

        return () => {
            mounted = false
            if (controlsRef.current) {
                controlsRef.current.stop()
            }
            if (videoRef.current && videoRef.current.srcObject) {
                try {
                    videoRef.current.srcObject.getTracks().forEach(track => track.stop())
                } catch (e) { }
            }
        }
    }, [onScan]) // Dependencies should effectively restart if onScan changes, which usually doesn't

    function handleSuccess(code) {
        if (!code) return

        // 1. Audio Beep
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext
            if (AudioContext) {
                const ctx = new AudioContext()
                const osc = ctx.createOscillator()
                const gain = ctx.createGain()
                osc.connect(gain)
                gain.connect(ctx.destination)
                osc.type = 'sine'
                osc.frequency.setValueAtTime(1000, ctx.currentTime)
                gain.gain.setValueAtTime(0.1, ctx.currentTime)
                osc.start()
                osc.stop(ctx.currentTime + 0.1)
            }
        } catch (e) { console.warn('Audio feedback failed', e) }

        // 2. Haptic Feedback
        if (navigator.vibrate) {
            navigator.vibrate(200)
        }

        // 3. Callback
        onScan(code)
    }

    function handleManualSubmit(e) {
        e.preventDefault()
        if (manualCode.trim()) {
            handleSuccess(manualCode.trim())
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-zinc-900 border-b border-zinc-800">
                <h3 className="text-lg font-bold">Scan Barcode</h3>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-zinc-800 transition-colors"
                >
                    <span className="material-symbols-outlined text-zinc-400 hover:text-white">close</span>
                </button>
            </div>

            {/* Camera Viewport */}
            <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center">
                {error ? (
                    <div className="p-8 text-center max-w-sm">
                        <span className="material-symbols-outlined text-4xl text-red-500 mb-4">no_photography</span>
                        <p className="text-red-400 font-medium mb-2">Camera Access Error</p>
                        <p className="text-zinc-500 text-sm mb-6">{error.message || "Please allow camera access to scan barcodes."}</p>
                        <button onClick={onClose} className="px-6 py-2 bg-zinc-800 rounded-lg text-sm font-medium">Cancel</button>
                    </div>
                ) : !permissionGranted ? (
                    <div className="text-zinc-500 flex flex-col items-center">
                        <span className="material-symbols-outlined animate-bounce mb-2">video_camera_front</span>
                        <p>Requesting camera...</p>
                    </div>
                ) : (
                    <>
                        <video
                            ref={videoRef}
                            className="absolute inset-0 w-full h-full object-cover"
                            muted
                            playsInline
                        />
                        {/* Darken outer area logic could be complex, using simple overlay frame instead */}

                        {/* Viewfinder Frame */}
                        <div className="relative w-72 h-48 border-2 border-white/30 rounded-lg overflow-hidden shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
                            {/* Laser Line */}
                            <div className="absolute top-0 left-0 w-full h-0.5 bg-red-500 shadow-[0_0_10px_red] animate-[laser_2s_infinite_ease-in-out]"></div>

                            {/* Corner Markers (Optional purely decorative) */}
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-primary"></div>
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-primary"></div>
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-primary"></div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-primary"></div>
                        </div>

                        <p className="absolute bottom-8 left-0 w-full text-center text-white/80 text-sm font-medium drop-shadow-md">
                            Align barcode within frame
                        </p>
                    </>
                )}
            </div>

            {/* Footer / Manual Input */}
            <div className="p-4 bg-zinc-900 border-t border-zinc-800">
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                    <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">keyboard</span>
                        <input
                            ref={inputRef}
                            type="text"
                            value={manualCode}
                            onChange={e => setManualCode(e.target.value)}
                            placeholder="Or type barcode..."
                            className="w-full pl-10 pr-4 py-3 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-zinc-500 focus:ring-2 focus:ring-primary/50 outline-none"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={!manualCode.trim()}
                        className="px-6 font-bold bg-primary text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Add
                    </button>
                </form>
            </div>
        </div>
    )
}
