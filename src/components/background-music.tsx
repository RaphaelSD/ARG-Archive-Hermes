'use client';

import { useEffect, useRef, useState } from 'react';
import { Volume1, Volume2, VolumeX } from 'lucide-react';

const SRC = '/audio/background.mp3';
const VOL_KEY = 'arg_music_volume';
const MUTE_KEY = 'arg_music_muted';

/** Фоновая музыка во время игры + регулятор громкости. Если файла нет — компонент ничего не показывает. */
export function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [available, setAvailable] = useState(true);
  const [volume, setVolume] = useState(0.3);
  const [muted, setMuted] = useState(false);
  const [open, setOpen] = useState(false);
  const [started, setStarted] = useState(false);

  // восстановить настройки
  useEffect(() => {
    try {
      const v = localStorage.getItem(VOL_KEY);
      if (v !== null && !Number.isNaN(Number(v))) setVolume(Math.min(1, Math.max(0, Number(v))));
      if (localStorage.getItem(MUTE_KEY) === '1') setMuted(true);
    } catch {}
  }, []);

  // применить громкость и сохранить
  useEffect(() => {
    const a = audioRef.current;
    if (a) {
      a.volume = volume;
      a.muted = muted;
    }
    try {
      localStorage.setItem(VOL_KEY, String(volume));
      localStorage.setItem(MUTE_KEY, muted ? '1' : '0');
    } catch {}
  }, [volume, muted]);

  // браузеры запрещают автозвук: запускаем после первого клика/нажатия
  useEffect(() => {
    if (started || !available) return;
    const start = () => {
      const a = audioRef.current;
      if (!a) return;
      a.play()
        .then(() => setStarted(true))
        .catch(() => {});
    };
    window.addEventListener('pointerdown', start, { once: true });
    window.addEventListener('keydown', start, { once: true });
    return () => {
      window.removeEventListener('pointerdown', start);
      window.removeEventListener('keydown', start);
    };
  }, [started, available]);

  // закрыть панель по клику снаружи
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  const Icon = muted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <div ref={wrapRef} className="relative">
      <audio
        ref={audioRef}
        src={SRC}
        loop
        preload="auto"
        onError={() => setAvailable(false)}
      />
      {available && (
        <>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            title="Музыка"
            aria-label="Громкость музыки"
            className="p-1.5 rounded-sm text-zinc-400 hover:text-[#c5a059] hover:bg-[#181c24] transition-colors"
          >
            <Icon className="size-4" />
          </button>
          {open && (
            <div className="absolute right-0 top-full mt-2 z-50 w-56 border border-[#1e232d] bg-[#101319] p-3 shadow-xl space-y-2.5">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#c5a059]">
                <span>Музыка</span>
                <span className="text-zinc-400">{muted ? 'выкл' : `${Math.round(volume * 100)}%`}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setMuted((m) => !m)}
                  aria-label={muted ? 'Включить звук' : 'Выключить звук'}
                  className="text-zinc-300 hover:text-[#c5a059] transition-colors"
                >
                  <Icon className="size-4" />
                </button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(volume * 100)}
                  onChange={(e) => {
                    setVolume(Number(e.target.value) / 100);
                    if (muted) setMuted(false);
                  }}
                  aria-label="Громкость"
                  className="h-1 w-full cursor-pointer accent-[#c5a059]"
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
