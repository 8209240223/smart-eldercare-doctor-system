import { useEffect, useState } from "react";

export type PetAction =
  | "idle"
  | "runningRight"
  | "runningLeft"
  | "waving"
  | "jumping"
  | "failed"
  | "waiting"
  | "running"
  | "review";

const ACTIONS: Record<PetAction, { row: number; frames: number; loop: boolean; frameMs: number }> = {
  idle: { row: 0, frames: 6, loop: true, frameMs: 280 },
  runningRight: { row: 1, frames: 8, loop: true, frameMs: 135 },
  runningLeft: { row: 2, frames: 8, loop: true, frameMs: 135 },
  waving: { row: 3, frames: 4, loop: false, frameMs: 170 },
  jumping: { row: 4, frames: 5, loop: false, frameMs: 150 },
  failed: { row: 5, frames: 8, loop: false, frameMs: 165 },
  waiting: { row: 6, frames: 6, loop: true, frameMs: 230 },
  running: { row: 7, frames: 6, loop: true, frameMs: 145 },
  review: { row: 8, frames: 6, loop: false, frameMs: 180 },
};

interface AssistantPetProps {
  action: PetAction;
  reducedMotion: boolean;
  onActionComplete?: () => void;
}

export function AssistantPet({ action, reducedMotion, onActionComplete }: AssistantPetProps) {
  const [frame, setFrame] = useState(0);
  const config = ACTIONS[action];

  useEffect(() => {
    setFrame(0);
    if (reducedMotion || config.frames <= 1) {
      if (!config.loop) {
        const timeout = window.setTimeout(() => onActionComplete?.(), 280);
        return () => window.clearTimeout(timeout);
      }
      return undefined;
    }

    const interval = window.setInterval(() => {
      setFrame((current) => {
        const next = current + 1;
        if (next >= config.frames) {
          if (config.loop) return 0;
          window.clearInterval(interval);
          window.setTimeout(() => onActionComplete?.(), 0);
          return config.frames - 1;
        }
        return next;
      });
    }, config.frameMs);

    return () => window.clearInterval(interval);
  }, [action, config.frameMs, config.frames, config.loop, onActionComplete, reducedMotion]);

  return (
    <span
      aria-hidden="true"
      className="rana-assistant-pet-sprite"
      style={{ backgroundPosition: `${frame * -108}px ${config.row * -117}px` }}
    />
  );
}
