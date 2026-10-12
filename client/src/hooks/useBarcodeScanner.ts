import { useEffect, useRef } from 'react';
import { playScannerBeep } from '../utils/audioChime';

export interface UseBarcodeScannerOptions {
  onScan: (barcode: string) => void;
  enabled?: boolean;
  minLength?: number;
  maxIntervalMs?: number;
  playSound?: boolean;
}

/**
 * Custom React hook for auto-detecting hardware USB/Bluetooth barcode & QR scanners
 * operating in HID Keyboard-Wedge mode.
 *
 * Scanners transmit barcode digits in rapid bursts (<35ms inter-character interval)
 * ending with an Enter or Tab key.
 */
export function useBarcodeScanner({
  onScan,
  enabled = true,
  minLength = 3,
  maxIntervalMs = 40,
  playSound = true,
}: UseBarcodeScannerOptions): void {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  const onScanRef = useRef(onScan);

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore functional modifier keys
      if (e.ctrlKey || e.altKey || e.metaKey) return;

      const now = performance.now();
      const elapsed = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // If too much time has passed between characters, reset buffer (indicates human typing)
      if (elapsed > maxIntervalMs) {
        bufferRef.current = '';
      }

      // Scanner completion trigger: Enter or Tab
      if (e.key === 'Enter' || e.key === 'Tab') {
        const scannedCode = bufferRef.current.trim();
        bufferRef.current = '';

        if (scannedCode.length >= minLength) {
          // Prevent form submit or carriage return propagation
          e.preventDefault();
          e.stopPropagation();

          if (playSound) {
            playScannerBeep('success');
          }

          onScanRef.current(scannedCode);
        }
        return;
      }

      // Capture single printable characters (letters, numbers, hyphens)
      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [enabled, minLength, maxIntervalMs, playSound]);
}
