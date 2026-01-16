import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { transcribeAudio } from '@/lib/location-api';

interface UseVoiceInputOptions {
  locationId: string | null | undefined;
  onTranscription: (text: string) => void;
}

export function useVoiceInput({ locationId, onTranscription }: UseVoiceInputOptions) {
  const { toast } = useToast();
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const startRecording = useCallback(async () => {
    if (!locationId) {
      toast({
        title: "Not authenticated",
        description: "Please log in to use voice input.",
        variant: "destructive"
      });
      return;
    }

    // Check if mediaDevices is available (requires secure context)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast({
        title: "Microphone not available",
        description: "Your browser doesn't support microphone access. Please use a modern browser.",
        variant: "destructive"
      });
      return;
    }

    // Microphone access inside iframes depends on the embedding page's permissions policy.
    // In the Lovable editor preview iframe, browsers will not show a prompt.
    let isEmbedded = false;
    try {
      isEmbedded = window.self !== window.top;
    } catch {
      isEmbedded = true;
    }

    const referrer = typeof document !== 'undefined' ? document.referrer : '';
    const isEditorPreview =
      isEmbedded &&
      (/lovable\.dev/i.test(referrer) || window.location.hostname.startsWith('id-preview--'));

    if (isEditorPreview) {
      toast({
        title: "Microphone unavailable in editor preview",
        description: "Open this page in a new tab (or use the published site) to allow microphone access.",
        variant: "destructive"
      });
      return;
    }

    // Note: Some browsers/environments (especially embedded contexts) can misreport Permissions API state.
    // We record it for messaging, but we always attempt getUserMedia so a prompt can appear when possible.
    let permissionState: PermissionState | null = null;

    try {
      if (navigator.permissions?.query) {
        try {
          const permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
          permissionState = permissionStatus.state;
          console.log('Microphone permission state:', permissionStatus.state);
        } catch {
          console.log('Permission query not supported, proceeding with getUserMedia');
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        
        if (audioChunksRef.current.length === 0) {
          setIsRecording(false);
          return;
        }
        
        setIsTranscribing(true);
        
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            
            const data = await transcribeAudio(locationId, base64Audio);
            
            if (data.error) {
              throw new Error(data.error);
            }
            
            if (data.text) {
              onTranscription(data.text);
            }
            
            setIsTranscribing(false);
            setIsRecording(false);
          };
        } catch (error) {
          console.error('Transcription error:', error);
          toast({
            title: "Transcription failed",
            description: "Could not transcribe audio. Please try again.",
            variant: "destructive"
          });
          setIsTranscribing(false);
          setIsRecording(false);
        }
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      
    } catch (error: unknown) {
      console.error('Microphone access error:', error);
      
      const err = error as Error & { name?: string };
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        if (isEmbedded && !isEditorPreview) {
          toast({
            title: "Microphone blocked in embed",
            description:
              "This page is running inside an iframe. Your platform must allow microphone access (e.g. <iframe allow=\"microphone\">) and not block it via Permissions Policy, then reload and try again.",
            variant: "destructive"
          });
          return;
        }

        const isBlocked = permissionState === 'denied';
        toast({
          title: isBlocked ? "Microphone blocked" : "Microphone access denied",
          description: isBlocked
            ? "Microphone permission is set to Block for this site. Click the lock/site settings icon, allow microphone, then refresh the page."
            : "Please allow microphone access when prompted. If you don't see a prompt, click the lock/site settings icon, allow microphone, then refresh the page.",
          variant: "destructive"
        });
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        toast({
          title: "No microphone found",
          description: "Please connect a microphone and try again.",
          variant: "destructive"
        });
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        toast({
          title: "Microphone in use",
          description: "Your microphone may be in use by another application. Please close other apps using the microphone and try again.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Microphone error",
          description: err.message || "Could not access microphone. Please check your browser settings.",
          variant: "destructive"
        });
      }
    }
  }, [toast, locationId, onTranscription]);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  return {
    isRecording,
    isTranscribing,
    toggleRecording,
    startRecording,
    stopRecording
  };
}
