import { useCallback, useEffect, useRef, useState } from "react";

interface SpeechRecognitionAlternativeLike {
  transcript: string;
}

interface SpeechRecognitionResultLike {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
}

interface SpeechRecognitionEventLike extends Event {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: SpeechRecognitionResultLike;
  };
}

interface SpeechRecognitionErrorEventLike extends Event {
  error?: string;
}

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface UseAssistantSpeechOptions {
  onTranscript: (transcript: string) => void;
  onListeningChange?: (listening: boolean) => void;
  onRecognitionError?: (message: string) => void;
}

function recognitionErrorMessage(error?: string) {
  if (error === "not-allowed" || error === "service-not-allowed") return "请允许浏览器使用麦克风";
  if (error === "no-speech") return "没有听清，请再说一次";
  if (error === "audio-capture") return "没有检测到可用麦克风";
  if (error === "network") return "语音识别网络连接失败";
  return "语音识别暂时不可用";
}

export function useAssistantSpeech({
  onTranscript,
  onListeningChange,
  onRecognitionError,
}: UseAssistantSpeechOptions) {
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(true);

  const recognitionSupported =
    typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);
  const synthesisSupported = typeof window !== "undefined" && "speechSynthesis" in window;

  const updateListening = useCallback(
    (next: boolean) => {
      setIsListening(next);
      onListeningChange?.(next);
    },
    [onListeningChange]
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    updateListening(false);
  }, [updateListening]);

  const startListening = useCallback(() => {
    if (!recognitionSupported || isListening) return;

    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) return;

    const recognition = new Recognition();
    recognition.lang = "zh-CN";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let combined = "";
      for (let index = 0; index < event.results.length; index += 1) {
        combined += event.results[index][0]?.transcript || "";
      }
      onTranscript(combined.trim());
    };

    recognition.onerror = (event) => {
      updateListening(false);
      onRecognitionError?.(recognitionErrorMessage(event.error));
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      updateListening(false);
    };

    recognitionRef.current = recognition;
    updateListening(true);

    try {
      recognition.start();
    } catch {
      recognitionRef.current = null;
      updateListening(false);
      onRecognitionError?.("语音识别启动失败，请稍后重试");
    }
  }, [isListening, onRecognitionError, onTranscript, recognitionSupported, updateListening]);

  const speak = useCallback(
    (text: string) => {
      if (!speechEnabled || !synthesisSupported || !text.trim()) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "zh-CN";
      utterance.rate = 1;
      utterance.pitch = 1.05;
      window.speechSynthesis.speak(utterance);
    },
    [speechEnabled, synthesisSupported]
  );

  const toggleSpeech = useCallback(() => {
    setSpeechEnabled((enabled) => {
      if (enabled && synthesisSupported) window.speechSynthesis.cancel();
      return !enabled;
    });
  }, [synthesisSupported]);

  useEffect(
    () => () => {
      recognitionRef.current?.abort();
      if (synthesisSupported) window.speechSynthesis.cancel();
    },
    [synthesisSupported]
  );

  return {
    isListening,
    recognitionSupported,
    synthesisSupported,
    speechEnabled,
    startListening,
    stopListening,
    speak,
    toggleSpeech,
  };
}
