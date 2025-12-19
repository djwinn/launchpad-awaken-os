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

    try {
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
      
    } catch (error) {
      console.error('Microphone access error:', error);
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access in your browser settings.",
        variant: "destructive"
      });
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
