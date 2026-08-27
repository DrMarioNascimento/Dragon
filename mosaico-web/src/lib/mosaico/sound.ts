let storm: HTMLAudioElement | null = null;
let oneshot: HTMLAudioElement | null = null;
let armed = false;

function make(src: string, loop = false, volume = 0.22) {
  const a = new Audio(src);
  a.loop = loop;
  a.volume = volume;
  a.preload = "auto";
  a.setAttribute("playsinline", "true");
  return a;
}

/** iOS only starts audio after a tap. Call from the first gesture. */
export function armAudio() {
  if (armed || typeof window === "undefined") return;
  armed = true;
  const a = new Audio("/audio/tempestade-rajada.mp3");
  a.setAttribute("playsinline", "true");
  a.muted = true;
  void a.play().then(() => {
    a.pause();
    a.src = "";
  }).catch(() => {});
}

export function playStorm(on: boolean) {
  if (typeof window === "undefined") return;
  armAudio();
  if (!storm) storm = make("/audio/tempestade-loop.mp3", true, 0.18);
  if (on) void storm.play().catch(() => {});
  else {
    storm.pause();
    storm.currentTime = 0;
  }
}

export function playOnce(src: string, volume = 0.7) {
  if (typeof window === "undefined") return;
  armAudio();
  if (oneshot) {
    oneshot.pause();
    oneshot = null;
  }
  oneshot = make(src, false, volume);
  void oneshot.play().catch(() => {});
}

export function stopVoice() {
  if (oneshot) {
    oneshot.pause();
    oneshot = null;
  }
}
