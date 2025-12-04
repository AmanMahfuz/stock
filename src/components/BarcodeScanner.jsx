import React, { useState } from 'react'
import BarcodeScannerComponent from 'react-qr-barcode-scanner'

export default function BarcodeScanner({ onScan, onClose }) {
    const [error, setError] = useState(null)

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
                    <div style={{ borderRadius: '0.5rem', overflow: 'hidden', background: '#000' }}>
                        <BarcodeScannerComponent
                            width={500}
                            height={500}
                            onUpdate={(err, result) => {
                                if (result) onScan(result.text)
                                // if (err) setError(err) // Optional: handle transient errors
                            }}
                            onError={(err) => setError(err)}
                        />
                    </div>
                )}

                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center' }}>
                    <button className="btn secondary" onClick={onClose} style={{ width: '100%' }}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}
