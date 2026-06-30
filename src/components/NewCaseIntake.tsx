import React, { useState, useEffect, useRef } from "react";

interface NewCaseIntakeProps {
  onNavigate: (tab: string) => void;
}

export default function NewCaseIntake({ onNavigate }: NewCaseIntakeProps) {
  // Generate a short unique ID on load
  const [evidenceId, setEvidenceId] = useState<string>("");
  
  // State for form fields
  const [incidentType, setIncidentType] = useState<string>("");
  const [locationText, setLocationText] = useState<string>("");
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0 });
  const [description, setDescription] = useState<string>("");
  const [imageDataUrl, setImageDataUrl] = useState<string>("");
  const [videoDataUrl, setVideoDataUrl] = useState<string>("");

  // Live Camera/Video Recorder States
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const [cameraMode, setCameraMode] = useState<"photo" | "video">("photo");
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [cameraInitError, setCameraInitError] = useState<string>("");

  // Auto AI classification states
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [detectionConfidence, setDetectionConfidence] = useState<number | null>(null);

  // Validation Error States
  const [photoError, setPhotoError] = useState<string>("");
  const [descError, setDescError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Refs for capture
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  useEffect(() => {
    // Generate evidence ID on component mount: timestamp based short code
    const shortId = `CASE-${Date.now().toString().slice(-6)}`;
    setEvidenceId(shortId);
  }, []);

  // Video recording timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration((prev) => {
          if (prev >= 15) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const handlePolaroidClick = () => {
    // Instead of automatically opening files, let's open our live sensor modal
    setIsCameraModalOpen(true);
    startCamera(cameraMode);
  };

  const startCamera = async (mode: "photo" | "video") => {
    setCameraInitError("");
    try {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
      const constraints = {
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: mode === "video"
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setMediaStream(stream);
      setCameraMode(mode);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(err => console.warn("Video play failed:", err));
      }
    } catch (err: any) {
      console.error("Camera connection failed:", err);
      setCameraInitError("COULD NOT CONNECT TO DEVICE SENSORS. FILE UPLOAD FALLBACK RECOMMENDED.");
    }
  };

  const stopCamera = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
    }
    setIsRecording(false);
    setRecordedChunks([]);
  };

  const handleSwitchMode = (mode: "photo" | "video") => {
    if (isRecording) return;
    startCamera(mode);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        setImageDataUrl(dataUrl);
        setVideoDataUrl(""); // Clear video
        setPhotoError("");
        setIsCameraModalOpen(false);
        stopCamera();
        runAiDetection(dataUrl);
      }
    }
  };

  const startRecording = () => {
    if (!mediaStream) return;
    setRecordedChunks([]);
    setIsRecording(true);
    setRecordingDuration(0);

    // Get a supported mime type
    let options = { mimeType: "video/webm;codecs=vp8,opus" };
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: "video/mp4" };
    }
    if (!MediaRecorder.isTypeSupported(options.mimeType)) {
      options = { mimeType: "" }; // default fallback
    }

    try {
      const recorder = new MediaRecorder(mediaStream, options);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          setRecordedChunks((prev) => [...prev, e.data]);
        }
      };

      recorder.onstop = () => {
        // Triggered when recording stops
      };

      recorder.start(100); // chunk every 100ms
    } catch (err) {
      console.error("Failed to start MediaRecorder:", err);
      alert("UNABLE TO INITIATE RECORDER.");
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  // Process the recorded video chunks
  useEffect(() => {
    if (!isRecording && recordedChunks.length > 0) {
      const blob = new Blob(recordedChunks, { type: "video/webm" });
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (typeof reader.result === "string") {
          const videoUrl = reader.result;
          setVideoDataUrl(videoUrl);
          setIsCameraModalOpen(false);
          stopCamera();

          // Extract frame for thumbnail and AI
          try {
            const frameUrl = await extractVideoFrame(videoUrl);
            setImageDataUrl(frameUrl);
            runAiDetection(frameUrl);
          } catch (err) {
            console.warn("Could not extract frame from video stream:", err);
            // Default blank camera frame
            setImageDataUrl("");
          }
        }
      };
      reader.readAsDataURL(blob);
    }
  }, [isRecording, recordedChunks]);

  const extractVideoFrame = (videoUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video");
      video.src = videoUrl;
      video.crossOrigin = "anonymous";
      video.muted = true;
      video.playsInline = true;
      video.currentTime = 0.5; // seek a bit inside
      
      let resolved = false;
      const timeout = setTimeout(() => {
        if (!resolved) {
          reject(new Error("Video frame extraction timed out."));
        }
      }, 5000);

      video.onseeked = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth || 640;
          canvas.height = video.videoHeight || 480;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            const frameUrl = canvas.toDataURL("image/jpeg", 0.8);
            resolved = true;
            clearTimeout(timeout);
            resolve(frameUrl);
          } else {
            reject(new Error("Canvas context failed."));
          }
        } catch (err) {
          reject(err);
        }
      };
      
      video.onloadeddata = () => {
        video.currentTime = 0.5;
      };

      video.onerror = (err) => {
        reject(err);
      };
    });
  };

  const runAiDetection = async (base64Str: string) => {
    if (!base64Str) return;
    setIsDetecting(true);
    setDetectionConfidence(null);
    try {
      const res = await fetch("/api/detect-incident", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl: base64Str })
      });
      if (res.ok) {
        const data = await res.json();
        if (data.incidentType) {
          setIncidentType(data.incidentType);
          setDetectionConfidence(data.confidence);
        }
      }
    } catch (err) {
      console.warn("Auto classification of uploaded incident failed:", err);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();
      reader.onloadend = async () => {
        if (typeof reader.result === "string") {
          const base64Str = reader.result;
          setPhotoError(""); // Clear error if any

          if (file.type.startsWith("video/")) {
            setVideoDataUrl(base64Str);
            // Extract thumbnail and run AI
            try {
              const frameUrl = await extractVideoFrame(base64Str);
              setImageDataUrl(frameUrl);
              runAiDetection(frameUrl);
            } catch (err) {
              console.warn("Could not extract frame from video file:", err);
              setImageDataUrl("");
            }
          } else {
            setImageDataUrl(base64Str);
            setVideoDataUrl("");
            runAiDetection(base64Str);
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("GEOLOCATION IS NOT SUPPORTED BY YOUR DETECTIVE TERMINAL.");
      return;
    }
    
    // Set a visual placeholder while fetching
    setLocationText("LOCKING GPS COORDINATES...");

    const options = {
      enableHighAccuracy: false, // Set to false for faster, more reliable resolution in virtual/sandbox envs
      timeout: 10000,
      maximumAge: 60000
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setCoordinates({ lat: latitude, lng: longitude });
        setLocationText(`Lat: ${latitude.toFixed(5)}, Lng: ${longitude.toFixed(5)} (captured)`);
      },
      (error) => {
        console.warn("GPS Lock failed. Falling back to headquarters coordinates...", error);
        // Fallback to New York City coordinates (default placeholder location in design)
        const fallbackLat = 40.7128;
        const fallbackLng = -74.0060;
        setCoordinates({ lat: fallbackLat, lng: fallbackLng });
        setLocationText("40.7128° N, 74.0060° W (Simulated HQ Coordinates)");
      },
      options
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;

    // Validate Photo/Video Evidence
    if (!imageDataUrl && !videoDataUrl) {
      setPhotoError("POLAROID OR VIDEO EVIDENCE IS REQUIRED FOR INTAKE.");
      hasError = true;
    } else {
      setPhotoError("");
    }

    // Validate Description (Optional)
    setDescError("");

    if (hasError) return;

    setIsSubmitting(true);

    const loggedInUserStr = localStorage.getItem("civic_user");
    const loggedInUser = loggedInUserStr ? JSON.parse(loggedInUserStr) : null;
    const loggedInUsername = loggedInUser ? loggedInUser.username : "";
    const loggedInCity = loggedInUser ? loggedInUser.city : "New York";
    const sessionId = loggedInUsername || localStorage.getItem("chSessionId") || "";

    const postBody = {
      id: evidenceId,
      incidentType: incidentType || "UNSPECIFIED DEFECT",
      location: {
        lat: coordinates.lat,
        lng: coordinates.lng,
        address: locationText || "No manual address provided"
      },
      description: description,
      imageDataUrl: imageDataUrl,
      videoDataUrl: videoDataUrl,
      status: "REPORTED",
      createdAt: Date.now(),
      reporterSessionId: sessionId,
      city: loggedInCity,
      verifyCount: 0,
      confirmedBy: [],
      caseHistory: [
        {
          action: "Reported",
          timestamp: Date.now()
        }
      ]
    };

    try {
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(postBody)
      });

      if (res.ok) {
        // Navigate to the Evidence Board upon success
        onNavigate("evidence-board");
      } else {
        const errData = await res.json();
        alert(`CRITICAL SERVER ERROR: ${errData.error || "UNKNOWN EXCEPTION"}`);
      }
    } catch (err: any) {
      console.warn("Submission failed:", err);
      alert(`NETWORK CONFLICT: UNABLE TO WIRE DISPATCH DATA. ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-primary-container text-on-surface font-body-md min-h-screen relative overflow-x-hidden corkboard pb-24 pt-20">
      <div className="noise-bg"></div>
      
      {/* Hidden File Input for Image/Video Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*,video/*"
        className="hidden"
      />

      {/* TopAppBar Component */}
      <header className="flex items-center justify-between px-margin-edge h-14 w-full fixed top-0 z-50 bg-surface border-b-2 border-outline-variant shadow-[4px_4px_0px_0px_rgba(0,0,0,0.4)]">
        <button 
          onClick={() => onNavigate("evidence-board")}
          className="text-on-surface-variant hover:bg-surface-variant transition-colors active:translate-y-0.5 p-2 rounded-full flex items-center justify-center cursor-pointer"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>arrow_back</span>
        </button>
        <h1 className="font-headline-md text-primary tracking-widest uppercase text-xl">NEW CASE INTAKE</h1>
        <button className="text-on-surface-variant hover:bg-surface-variant transition-colors active:translate-y-0.5 p-2 rounded-full flex items-center justify-center">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>more_vert</span>
        </button>
      </header>

      <main className="relative z-10 px-margin-edge max-w-4xl mx-auto flex flex-col md:flex-row items-center md:items-start justify-center gap-8 pt-6 pb-12">
        
        {/* Left Side: Header & Polaroid Photo */}
        <div className="flex flex-col gap-6 w-full md:w-1/3">
          <div className="text-left md:mt-4">
            <h2 className="font-headline-lg-mobile text-3xl text-primary uppercase">FILE NEW LEAD</h2>
            <p className="font-label-sm text-on-surface-variant opacity-60 mt-1">PRECINCT 12 // CITIZEN INVESTIGATION UNIT</p>
          </div>

          {/* Polaroid Centerpiece */}
          <div className="relative bg-[#F4EFE6] p-4 pb-10 shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)] transform -rotate-3 w-full max-w-[280px] mx-auto md:mx-0">
            {/* Metal Clip Visual */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-12 bg-gradient-to-b from-gray-400 to-gray-600 rounded-sm shadow-md border border-gray-800 z-20 flex flex-col items-center pt-1">
              <div className="w-6 h-1.5 bg-gray-800 rounded-full"></div>
            </div>
            
            <div 
              onClick={handlePolaroidClick}
              className="aspect-square bg-surface-dim border border-outline-variant relative overflow-hidden flex flex-col items-center justify-center group cursor-pointer hover:bg-surface-variant transition-colors"
            >
              {videoDataUrl ? (
                <video
                  src={videoDataUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : imageDataUrl ? (
                <img
                  src={imageDataUrl}
                  alt="Case Evidence"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <>
                  <span className="material-symbols-outlined text-outline-variant text-5xl mb-2 group-hover:text-primary transition-colors" style={{ fontVariationSettings: "'FILL' 0" }}>photo_camera</span>
                  <p className="font-label-sm text-outline-variant uppercase tracking-widest text-[10px] text-center px-4">Tap to use camera sensors</p>
                </>
              )}
              {videoDataUrl && (
                <div className="absolute top-2 left-2 bg-[#92030f] text-[#F4EFE6] font-mono font-bold text-[8px] tracking-wider py-0.5 px-1.5 uppercase rounded flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
                  RECON REC
                </div>
              )}
              <div className="absolute inset-0 noise-bg opacity-30"></div>
            </div>
            
            <div className="mt-4 font-body-md text-on-surface-variant text-center opacity-70 text-xs">
              EVIDENCE_ID: <span className="font-label-sm text-primary-container font-bold">#{evidenceId || "PENDING"}</span>
            </div>

            {/* Inline Photo Error */}
            {photoError && (
              <p className="text-red-700 font-bold text-[10px] uppercase tracking-wider text-center mt-2 font-mono animate-pulse">
                {photoError}
              </p>
            )}
          </div>

          {/* Quick upload file secondary button */}
          <div className="flex flex-col gap-2 w-full max-w-[280px] mx-auto md:mx-0">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-[#4f453f] hover:border-primary text-[#4f453f] hover:text-primary font-mono text-[10px] py-2 px-3 tracking-widest uppercase transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">upload_file</span>
              Upload Pre-recorded File
            </button>
            {(imageDataUrl || videoDataUrl) && (
              <button
                type="button"
                onClick={() => {
                  setImageDataUrl("");
                  setVideoDataUrl("");
                }}
                className="w-full text-red-700 hover:text-red-900 font-mono text-[9px] tracking-widest uppercase text-center cursor-pointer underline"
              >
                Reset Evidence proof
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Case File Form & Stamp Button */}
        <div className="flex-1 flex flex-col gap-6 w-full">
          {/* Intake Form (Case File Style) */}
          <div className="bg-[#F4EFE6] p-card-padding shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)] transform rotate-1 relative w-full text-on-secondary-fixed">
            {/* Staple Visual */}
            <div className="absolute top-4 left-4 w-6 h-1 bg-gray-600 shadow-sm rotate-45"></div>
            
            <div className="flex flex-col gap-6 mt-2">
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <label className="font-label-lg text-on-secondary-fixed uppercase tracking-widest text-xs">INCIDENT TYPE</label>
                  {isDetecting && (
                    <span className="text-[10px] text-red-700 font-bold font-mono animate-pulse uppercase tracking-wider flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px] animate-spin">orbit</span> AI SCANNING EVIDENCE...
                    </span>
                  )}
                  {!isDetecting && detectionConfidence !== null && (
                    <span className="text-[10px] text-green-800 font-bold font-mono uppercase tracking-wider">
                      ⚡ AI Auto-Detected ({Math.round(detectionConfidence * 100)}% Match)
                    </span>
                  )}
                </div>
                <input 
                  className={`typewriter-input font-body-md text-on-secondary-fixed font-bold placeholder-outline-variant ${isDetecting ? "opacity-60" : ""}`} 
                  placeholder={isDetecting ? "ANALYZING FILE FOR TYPE..." : "Pot-hole / Broken Main / etc..."} 
                  type="text"
                  value={incidentType}
                  onChange={(e) => setIncidentType(e.target.value)}
                  disabled={isDetecting}
                />
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="font-label-lg text-on-secondary-fixed uppercase tracking-widest text-xs">LOCATION</label>
                <div className="relative">
                  <input 
                    className="typewriter-input font-body-md text-on-secondary-fixed font-bold placeholder-outline-variant pr-8" 
                    placeholder="Address or Coordinates" 
                    type="text"
                    value={locationText}
                    onChange={(e) => setLocationText(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    className="absolute right-0 bottom-2 text-primary hover:text-red-700 transition-colors p-1 flex items-center justify-center cursor-pointer"
                    title="Capture Geolocation Coordinates"
                  >
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>location_on</span>
                  </button>
                </div>
              </div>
              
              <div className="flex flex-col gap-1">
                <label className="font-label-lg text-on-secondary-fixed uppercase tracking-widest text-xs">DESCRIPTION (OPTIONAL)</label>
                <textarea 
                  className="typewriter-input font-body-md text-on-secondary-fixed font-bold placeholder-outline-variant h-24 resize-none" 
                  placeholder="Detailed account (can be left blank)..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>

                {/* Inline Description Error */}
                {descError && (
                  <p className="text-red-700 font-bold text-[10px] uppercase tracking-wider mt-1 font-mono animate-pulse">
                    {descError}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end mt-2">
            <button 
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="stamp-button font-headline-sm text-lg hover:bg-surface-variant transition-colors active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {isSubmitting ? "WIRING FILE..." : "SUBMIT EVIDENCE"}
            </button>
          </div>
        </div>
      </main>

      {/* BottomNavBar Component */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-4 py-2 z-50 bg-surface border-t-2 border-outline-variant shadow-[0_-4px_10px_rgba(0,0,0,0.3)]">
        <button 
          onClick={() => onNavigate("evidence-board")}
          className="flex flex-col items-center justify-center text-on-surface-variant p-2 hover:text-primary transition-all active:scale-95 duration-100 cursor-pointer"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>folder_open</span>
        </button>
        <button 
          onClick={() => onNavigate("new-case-intake")}
          className="flex flex-col items-center justify-center bg-primary-container text-on-primary-container rounded-lg p-2 scale-110 hover:text-primary transition-all active:scale-95 duration-100 cursor-pointer"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>photo_camera</span>
        </button>
        <button 
          onClick={() => onNavigate("field-manual")}
          className="flex flex-col items-center justify-center text-on-surface-variant p-2 hover:text-primary transition-all active:scale-95 duration-100 cursor-pointer"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>description</span>
        </button>
        <button 
          onClick={() => onNavigate("terminal-setting")}
          className="flex flex-col items-center justify-center text-on-surface-variant p-2 hover:text-primary transition-all active:scale-95 duration-100 cursor-pointer"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>settings</span>
        </button>
      </nav>

      {/* FIELD EVIDENCE LIVE SENSOR RECORDER MODAL */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-[#1a1412] border-4 border-primary text-[#F4EFE6] max-w-md w-full p-6 shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] relative flex flex-col gap-4 font-mono select-none overflow-hidden">
            {/* Retro CRT Grid Scanlines Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,6px_100%] z-40"></div>

            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-outline-variant pb-2 z-10">
              <div className="flex flex-col">
                <span className="text-[10px] text-primary tracking-widest animate-pulse font-bold">● CIU SENSOR SYSTEMS ACTIVE</span>
                <span className="text-xs uppercase font-bold text-[#F4EFE6]">FIELD EVIDENCE RECORDER</span>
              </div>
              <button 
                type="button"
                onClick={() => {
                  stopCamera();
                  setIsCameraModalOpen(false);
                }}
                className="text-[#9b8e87] hover:text-[#F4EFE6] text-sm cursor-pointer border border-[#4f453f] px-2 py-0.5"
              >
                CLOSE
              </button>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 text-xs z-10">
              <button
                type="button"
                onClick={() => handleSwitchMode("photo")}
                disabled={isRecording}
                className={`py-2 px-3 border-2 flex items-center justify-center gap-2 tracking-wider uppercase transition-all duration-100 cursor-pointer ${
                  cameraMode === "photo" 
                    ? "bg-primary border-primary text-[#F4EFE6] font-bold shadow-[2px_2px_0px_rgba(0,0,0,1)]" 
                    : "border-[#4f453f] hover:bg-[#2c2220] text-[#9b8e87] disabled:opacity-40"
                }`}
              >
                <span className="material-symbols-outlined text-sm">photo_camera</span>
                SNAP PHOTO
              </button>
              <button
                type="button"
                onClick={() => handleSwitchMode("video")}
                disabled={isRecording}
                className={`py-2 px-3 border-2 flex items-center justify-center gap-2 tracking-wider uppercase transition-all duration-100 cursor-pointer ${
                  cameraMode === "video" 
                    ? "bg-[#92030f] border-[#92030f] text-[#F4EFE6] font-bold shadow-[2px_2px_0px_rgba(0,0,0,1)]" 
                    : "border-[#4f453f] hover:bg-[#2c2220] text-[#9b8e87] disabled:opacity-40"
                }`}
              >
                <span className="material-symbols-outlined text-sm">videocam</span>
                RECORD RECON
              </button>
            </div>

            {/* Live Video Viewer Frame */}
            <div className="relative aspect-video bg-black border-2 border-[#4f453f] rounded overflow-hidden flex items-center justify-center shadow-inner z-10">
              {cameraInitError ? (
                <div className="p-4 text-center text-xs text-red-500 font-bold leading-relaxed flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-3xl animate-bounce">warning</span>
                  <span>{cameraInitError}</span>
                  <button
                    type="button"
                    onClick={() => startCamera(cameraMode)}
                    className="mt-2 text-xs underline text-[#F4EFE6] cursor-pointer hover:text-primary"
                  >
                    RETRY SENSOR CONNECTION
                  </button>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              )}

              {/* Status HUD Overlays */}
              {!cameraInitError && (
                <>
                  {/* Blinking Live status */}
                  <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 px-1.5 py-0.5 rounded text-[8px] tracking-widest font-bold">
                    <span className={`w-1.5 h-1.5 rounded-full ${isRecording ? "bg-red-600 animate-ping" : "bg-green-500 animate-pulse"}`}></span>
                    <span>{isRecording ? "RECORDING" : "LIVE FEED"}</span>
                  </div>

                  {/* Recording Time Progress HUD */}
                  {isRecording && (
                    <div className="absolute bottom-2 right-2 bg-black/80 border border-red-600 px-2 py-0.5 rounded text-[10px] text-red-500 font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping"></span>
                      <span>00:{recordingDuration.toString().padStart(2, "0")} / 00:15</span>
                    </div>
                  )}

                  {/* Technical Frame HUD */}
                  <div className="absolute bottom-2 left-2 text-[8px] opacity-40 leading-none">
                    RESOLUTION: 640X480 // FPS: 30<br />
                    BANDWIDTH: STABLE // SENSORS: GOOD
                  </div>
                </>
              )}
            </div>

            {/* Live Controller Buttons */}
            <div className="flex flex-col items-center justify-center py-2 z-10">
              {cameraMode === "photo" ? (
                <button
                  type="button"
                  onClick={capturePhoto}
                  disabled={!!cameraInitError}
                  className="w-16 h-16 rounded-full bg-primary hover:bg-[#b03036] active:scale-95 disabled:opacity-40 shadow-lg border-4 border-black/30 flex items-center justify-center transition-all cursor-pointer group"
                  title="Snap Polaroid Photo"
                >
                  <span className="material-symbols-outlined text-white text-3xl group-hover:scale-110 transition-transform">photo_camera</span>
                </button>
              ) : (
                <div className="flex items-center gap-4">
                  {isRecording ? (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="h-16 px-6 bg-red-700 hover:bg-red-800 text-white font-bold tracking-widest uppercase border-4 border-black/30 rounded shadow-md flex items-center gap-2 active:scale-95 transition-all cursor-pointer animate-pulse"
                    >
                      <span className="material-symbols-outlined text-xl">stop</span>
                      STOP REC (15s Cap)
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={startRecording}
                      disabled={!!cameraInitError}
                      className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 disabled:opacity-40 shadow-lg border-4 border-black/30 flex items-center justify-center transition-all cursor-pointer group"
                      title="Start Recording Video Recon"
                    >
                      <span className="material-symbols-outlined text-white text-3xl group-hover:scale-110 transition-transform">videocam</span>
                    </button>
                  )}
                </div>
              )}
              <span className="text-[9px] text-[#9b8e87] mt-2 tracking-wide text-center">
                {cameraMode === "photo" 
                  ? "TAP SHUTTER TO TAKE EVIDENCE POLAROID FRAME" 
                  : "TAP TO START CAPTURING A 15-SECOND RECON VIDEO FILE"}
              </span>
            </div>

            {/* Secondary Device File Picker shortcut inside modal */}
            <div className="border-t border-[#4f453f] pt-3 flex justify-between items-center text-[10px] z-10">
              <span className="text-[#9b8e87]">HAVE A LOCAL EVIDENCE CLIP?</span>
              <button
                type="button"
                onClick={() => {
                  stopCamera();
                  setIsCameraModalOpen(false);
                  fileInputRef.current?.click();
                }}
                className="text-[#F4EFE6] font-bold underline cursor-pointer hover:text-primary uppercase"
              >
                UPLOAD LOCAL DOSSIER FILE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
