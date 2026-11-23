type OrderNotificationSound = "placed" | "accepted" | "delivered";

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined" || !window.AudioContext) return null;
  audioContext ??= new window.AudioContext();
  return audioContext;
}

export function unlockOrderNotificationSound(): void {
  try {
    const context = getAudioContext();
    if (context?.state === "suspended") {
      void context.resume().catch((error: unknown) => {
        console.warn("Could not enable order notification sound", error);
      });
    }
  } catch (error) {
    console.warn("Could not enable order notification sound", error);
  }
}

export function playOrderNotificationSound(sound: OrderNotificationSound): void {
  try {
    const context = getAudioContext();
    if (!context) {
      console.warn("Order notification sound is not supported by this browser");
      return;
    }

    const frequencies = sound === "placed"
      ? [880, 1174]
      : sound === "accepted"
        ? [988, 1318]
        : [784, 988, 1174, 1568];
    const play = () => {
      const startAt = context.currentTime;
      frequencies.forEach((frequency, index) => {
        const start = startAt + index * 0.13;
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, start);
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.12, start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.2);
        oscillator.connect(gain);
        gain.connect(context.destination);
        oscillator.start(start);
        oscillator.stop(start + 0.21);
      });
    };

    if (context.state === "running") {
      play();
    } else {
      void context.resume().then(play).catch((error: unknown) => {
        console.warn("Could not play order notification sound", error);
      });
    }
  } catch (error) {
    console.warn("Could not play order notification sound", error);
  }
}

export function isDeliveredOrderStatus(status?: string | null): boolean {
  const normalizedStatus = status?.toUpperCase() ?? "";
  return ["DELIVER", "SERVED", "COMPLETED"].some((value) => normalizedStatus.includes(value));
}

export function isAcceptedOrderStatus(status?: string | null): boolean {
  const normalizedStatus = status?.toUpperCase() ?? "";
  return ["ACCEPT", "PREPAR"].some((value) => normalizedStatus.includes(value));
}
