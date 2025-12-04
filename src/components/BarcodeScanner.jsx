import React, { useState, useEffect, useRef } from 'react'
import { BrowserMultiFormatReader } from '@zxing/browser'

export default function BarcodeScanner({ onScan, onClose }) {
    const [error, setError] = useState(null)
    const [manualCode, setManualCode] = useState('')
    const videoRef = useRef(null)
    const inputRef = useRef(null)
    const controlsRef = useRef(null)

    // Auto-focus input for physical scanners
    useEffect(() => {
        if (inputRef.current) inputRef.current.focus()
    }, [])

    useEffect(() => {
        const codeReader = new BrowserMultiFormatReader()
        let mounted = true

        async function startScanning() {
            try {
                // Get user media to ensure permissions
                const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })

                if (mounted && videoRef.current) {
                    videoRef.current.srcObject = stream
                    // Start decoding from video element
                    controlsRef.current = await codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
                        if (result && mounted) {
                            onScan(result.getText())
                            // Stop scanning after successful scan if desired, or keep scanning
                            // For now, we rely on parent to close or handle it. 
                            // Usually parent closes modal on scan.
                        }
                        // if (err && !(err instanceof NotFoundException)) {
                        //     console.error(err)
                        // }
                    })
                }
            } catch (err) {
                if (mounted) setError(err)
            }
        }

        startScanning()

        return () => {
            mounted = false
            if (controlsRef.current) {
                controlsRef.current.stop()
            }
            // Also stop tracks manually to be safe
            if (videoRef.current && videoRef.current.srcObject) {
                videoRef.current.srcObject.getTracks().forEach(track => track.stop())
            }
        }
    }, [onScan])

    function handleManualSubmit(e) {
        e.preventDefault()
        if (manualCode.trim()) {
            onScan(manualCode.trim())
        }
    }

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 100,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
        }}>
            <div className="card" style={{ width: '90%', maxWidth: '500px', padding: '1rem', position: 'relative' }}>
                <h3 style={{ textAlign: 'center', marginBottom: '1rem' }}>Scan Barcode</h3>

                {error ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: '#ef4444' }}>
                        Camera error: {error.message}
                    </div>
                ) : (
                    <div style={{ borderRadius: '0.5rem', overflow: 'hidden', background: '#000', position: 'relative', minHeight: 300 }}>
                        <video
                            ref={videoRef}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            autoPlay
                            muted
                            playsInline
                        />
                        <div style={{
                            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                            width: '80%', height: '2px', background: 'rgba(255, 0, 0, 0.5)', boxShadow: '0 0 4px red'
                        }} />
                    </div>
                )}

                <form onSubmit={handleManualSubmit} style={{ marginTop: '1rem' }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <input
                            ref={inputRef}
                            className="input"
                            placeholder="Or type barcode / use scanner..."
                            value={manualCode}
                            onChange={e => setManualCode(e.target.value)}
                        />
                        <button className="btn">Add</button>
                    </div>
                </form>

                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                    <button className="btn secondary" onClick={onClose} style={{ width: '100%' }}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}
