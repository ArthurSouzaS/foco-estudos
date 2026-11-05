/** Utilitários de som e notificação usados quando um ciclo do Pomodoro termina. */

type AudioContextCtor = typeof AudioContext;

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor: AudioContextCtor | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: AudioContextCtor }).webkitAudioContext;
  if (!Ctor) return null;
  audioContext ??= new Ctor();
  return audioContext;
}

/**
 * Navegadores só liberam áudio após uma interação do usuário.
 * Chamar isto no clique de "Iniciar" garante que o som toque depois.
 */
export function unlockAudio(): void {
  const ctx = getAudioContext();
  if (ctx?.state === "suspended") void ctx.resume().catch(() => undefined);
}

/** Toca um sinal curto de três notas gerado pela Web Audio API (sem arquivos de áudio). */
export function playChime(): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const notes = [659.25, 783.99, 1046.5]; // Mi, Sol, Dó
  notes.forEach((frequency, i) => {
    const start = ctx.currentTime + i * 0.18;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.25, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
    osc.connect(gain).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + 0.55);
  });
}

export function notificationsSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export async function requestNotificationPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!notificationsSupported()) return "unsupported";
  if (Notification.permission !== "default") return Notification.permission;
  return Notification.requestPermission();
}

export function showNotification(title: string, body: string): void {
  if (!notificationsSupported() || Notification.permission !== "granted") return;
  try {
    new Notification(title, { body, tag: "foco-estudos-pomodoro" });
  } catch {
    // Alguns navegadores móveis não permitem o construtor; ignoramos com segurança.
  }
}
