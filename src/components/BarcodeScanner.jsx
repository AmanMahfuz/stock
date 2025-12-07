import React, { useState, useEffect, useRef } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'

export default function BarcodeScanner({ onScan, onClose }) {
    const [error, setError] = useState(null)
    const [manualCode, setManualCode] = useState('')
    const [scanning, setScanning] = useState(true)
    const videoRef = useRef(null)
    const controlsRef = useRef(null)
    const inputRef = useRef(null)



    useEffect(() => {
        // Use default hints (null) to match the working image uploader behavior. 
        // This enables all supported barcode formats.
        // We keep the 500ms delay between scans to avoid performance issues.
        const codeReader = new BrowserMultiFormatReader(null, 500)
        let mounted = true

        async function startScanning() {
            try {
                const devices = await BrowserMultiFormatReader.listVideoInputDevices()
                // Prefer Back Camera
                const backCamera = devices.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('rear'))
                const selectedDeviceId = backCamera ? backCamera.deviceId : (devices[0]?.deviceId || undefined)

                if (mounted) {
                    // Start decoding from video device
                    // If we found a specific back camera, use its ID.
                    // Otherwise, pass undefined which lets ZXing choose, but we prefer 'environment' in constraints if possible.
                    // However, BrowserMultiFormatReader.decodeFromVideoDevice takes deviceId (string) or undefined. It doesn't take constraints directly here.
                    // The best way with ZXing is to pass the specific Device ID.

                    controlsRef.current = await codeReader.decodeFromVideoDevice(selectedDeviceId, videoRef.current, (result) => {
                        if (mounted && result) {
                            handleSuccess(result.getText())
                        }
                    })
                } else {
                    setError("No camera found")
                }
            } catch (err) {
                if (mounted) {
                    console.error("Camera error:", err)
                    setError(err.message || "Camera access denied")
                }
            }
        }

        startScanning()

        return () => {
            mounted = false
            if (controlsRef.current) {
                controlsRef.current.stop()
            }
        }
    }, [])

    function handleSuccess(code) {
        if (!code) return

        // Audio Beep
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

        // Haptic Feedback
        if (navigator.vibrate) {
            navigator.vibrate(200)
        }

        onScan(code)
    }

    function handleManualSubmit(e) {
        e.preventDefault()
        if (manualCode.trim()) {
            handleSuccess(manualCode.trim())
        }
    }

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 z-[100]">
            <div className="bg-white dark:bg-[#1c1a16] rounded-2xl p-6 max-w-lg w-full border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Scan Barcode</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                        <span className="material-symbols-outlined text-zinc-600 dark:text-zinc-400">close</span>
                    </button>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-600 dark:text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <div className="relative aspect-video bg-zinc-900 rounded-lg overflow-hidden mb-4">
                    <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                    {scanning && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-48 h-48 border-2 border-primary rounded-lg animate-pulse"></div>
                        </div>
                    )}
                </div>

                {/* Image Upload Option */}
                <div className="mb-4">
                    <label className="block w-full">
                        <div className="flex items-center justify-center gap-2 px-4 py-3 bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white rounded-lg font-medium hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer transition-colors">
                            <span className="material-symbols-outlined">upload_file</span>
                            <span>Upload Barcode Image</span>
                        </div>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0]
                                if (file) {
                                    const reader = new FileReader()
                                    reader.onload = (event) => {
                                        const img = new Image()
                                        img.onload = () => {
                                            const codeReader = new BrowserMultiFormatReader()
                                            codeReader.decodeFromImageElement(img)
                                                .then(result => {
                                                    handleSuccess(result.getText())
                                                })
                                                .catch(() => {
                                                    setError('Could not read barcode from image')
                                                })
                                        }
                                        img.src = event.target.result
                                    }
                                    reader.readAsDataURL(file)
                                }
                            }}
                        />
                    </label>
                </div>

                <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center mb-4">
                    Position the barcode within the frame or upload an image
                </p>

                {/* Manual Input */}
                <form onSubmit={handleManualSubmit} className="flex gap-2">
                    <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">keyboard</span>
                        <input
                            ref={inputRef}
                            type="text"
                            value={manualCode}
                            onChange={e => setManualCode(e.target.value)}
                            placeholder="Or type barcode..."
                            className="w-full pl-10 pr-4 py-3 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-white placeholder-zinc-500 focus:ring-2 focus:ring-primary/50 outline-none"
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
