import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, Upload, X, RotateCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

interface BusinessCardUploadProps {
  eventId: string;
  onImageCapture: (imageData: string) => void;
  isProcessing?: boolean;
}

export function BusinessCardUpload({ eventId, onImageCapture, isProcessing = false }: BusinessCardUploadProps) {
  const [mode, setMode] = useState<'select' | 'camera' | 'preview'>('select');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const webcamRef = useRef<Webcam>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: facingMode
  };

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current?.getScreenshot();
    if (imageSrc) {
      setCapturedImage(imageSrc);
      setMode('preview');
    }
  }, [webcamRef]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const imageData = reader.result as string;
        setCapturedImage(imageData);
        setMode('preview');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onImageCapture(capturedImage);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setMode('select');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleCamera = () => {
    setFacingMode(prevMode => prevMode === 'user' ? 'environment' : 'user');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Upload Business Card</CardTitle>
      </CardHeader>
      <CardContent>
        {mode === 'select' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                onClick={() => setMode('camera')}
                variant="outline"
                className="h-32 flex flex-col gap-2"
                disabled={isProcessing}
              >
                <Camera className="h-8 w-8" />
                <span>Take Photo</span>
              </Button>
              
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="h-32 flex flex-col gap-2"
                disabled={isProcessing}
              >
                <Upload className="h-8 w-8" />
                <span>Upload Image</span>
              </Button>
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}

        {mode === 'camera' && (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden bg-black">
              <Webcam
                ref={webcamRef}
                audio={false}
                screenshotFormat="image/jpeg"
                videoConstraints={videoConstraints}
                className="w-full"
              />
              <div className="absolute top-4 right-4 flex gap-2">
                <Button
                  onClick={toggleCamera}
                  size="sm"
                  variant="secondary"
                  className="bg-white/80 hover:bg-white/90"
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button
                  onClick={handleRetake}
                  size="sm"
                  variant="secondary"
                  className="bg-white/80 hover:bg-white/90"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex justify-center gap-4">
              <Button
                onClick={capture}
                size="lg"
                disabled={isProcessing}
              >
                <Camera className="h-5 w-5 mr-2" />
                Capture
              </Button>
            </div>
          </div>
        )}

        {mode === 'preview' && capturedImage && (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden">
              <img
                src={capturedImage}
                alt="Captured business card"
                className="w-full"
              />
            </div>
            
            <div className="flex justify-center gap-4">
              <Button
                onClick={handleRetake}
                variant="outline"
                disabled={isProcessing}
              >
                Retake
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Process Card'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}