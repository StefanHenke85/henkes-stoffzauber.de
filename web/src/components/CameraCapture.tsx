import { useRef, useState, useEffect } from 'react';
import { Camera, X, Check, RotateCw } from 'lucide-react';
import { cn } from '@/utils/helpers';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onCancel: () => void;
}

export function CameraCapture({ onCapture, onCancel }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();

    return () => {
      stopCamera();
    };
  }, [facingMode]);

  const startCamera = async () => {
    try {
      setError(null);

      // Stop existing stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError(
        'Kamera-Zugriff verweigert. Bitte erlauben Sie den Kamera-Zugriff in Ihren Browser-Einstellungen.'
      );
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedImage(imageDataUrl);
    stopCamera();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirmPhoto = () => {
    if (!capturedImage) return;

    // Convert data URL to File
    fetch(capturedImage)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], `photo-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });
        onCapture(file);
        stopCamera();
      });
  };

  const switchCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50">
        <button
          onClick={() => {
            stopCamera();
            onCancel();
          }}
          className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
          aria-label="Abbrechen"
        >
          <X className="h-6 w-6" />
        </button>

        <h2 className="text-white font-semibold">Foto aufnehmen</h2>

        {!capturedImage && (
          <button
            onClick={switchCamera}
            className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
            aria-label="Kamera wechseln"
          >
            <RotateCw className="h-6 w-6" />
          </button>
        )}
        {capturedImage && <div className="w-10" />}
      </div>

      {/* Camera View / Preview */}
      <div className="flex-1 relative flex items-center justify-center bg-black">
        {error ? (
          <div className="text-center p-8">
            <Camera className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <p className="text-white mb-4">{error}</p>
            <button
              onClick={startCamera}
              className="px-6 py-3 bg-primary-400 text-white rounded-lg hover:bg-primary-500 transition-colors"
            >
              Erneut versuchen
            </button>
          </div>
        ) : capturedImage ? (
          <img
            src={capturedImage}
            alt="Captured"
            className="max-w-full max-h-full object-contain"
          />
        ) : (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="max-w-full max-h-full object-contain"
          />
        )}

        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Controls */}
      <div className="p-6 bg-black/50 flex items-center justify-center gap-8">
        {capturedImage ? (
          <>
            <button
              onClick={retakePhoto}
              className="flex flex-col items-center gap-2 text-white"
            >
              <div className="w-16 h-16 rounded-full bg-white/20 hover:bg-white/30 transition-colors flex items-center justify-center">
                <RotateCw className="h-8 w-8" />
              </div>
              <span className="text-sm">Erneut</span>
            </button>

            <button
              onClick={confirmPhoto}
              className="flex flex-col items-center gap-2 text-white"
            >
              <div className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 transition-colors flex items-center justify-center">
                <Check className="h-8 w-8" />
              </div>
              <span className="text-sm">Verwenden</span>
            </button>
          </>
        ) : (
          <button
            onClick={capturePhoto}
            disabled={!stream}
            className={cn(
              'w-20 h-20 rounded-full bg-white hover:bg-gray-200 transition-all flex items-center justify-center border-4 border-gray-300',
              !stream && 'opacity-50 cursor-not-allowed'
            )}
            aria-label="Foto aufnehmen"
          >
            <div className="w-16 h-16 rounded-full bg-white border-2 border-black" />
          </button>
        )}
      </div>
    </div>
  );
}
