'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X,
  FileText,
  Image as ImageIcon,
  Mic,
  Phone,
  MapPin,
  StickyNote,
  Download,
  Share2,
  Calendar,
  User,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Maximize2,
  Crosshair,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import type { CaseDocument, CasePerson, Location, CallLogRow, EvidenceRelation, PhotoHotspot } from '@/lib/archive-data';
import { cn } from '@/lib/utils';

export type ViewerItem = {
  id: string;
  archiveId?: string;
  title: string;
  kind: 'document' | 'photo' | 'audio' | 'note' | 'map' | 'call';
  date?: string;
  source?: string;
  meta?: string;
  content?: string;
  mediaUrl?: string;
  duration?: string;
  locationId?: string;
  personIds?: string[];
  relatedIds?: string[];
  transcript?: string;
  participants?: string[];
  caller?: string;
  number?: string;
  summary?: string;
  hotspots?: PhotoHotspot[];
};

type EvidenceViewerProps = {
  item: ViewerItem | null;
  onClose: () => void;
  onSelectEntity?: (id: string) => void;
  allDocuments?: CaseDocument[];
  allPeople?: CasePerson[];
  allLocations?: Location[];
  allCalls?: CallLogRow[];
  allRelations?: EvidenceRelation[];
  embedded?: boolean;
  onExpandModal?: () => void;
};

export function EvidenceViewer({
  item,
  onClose,
  onSelectEntity,
  allDocuments = [],
  allPeople = [],
  allLocations = [],
  allCalls = [],
  allRelations = [],
  embedded = false,
  onExpandModal,
  discoveredHotspotIds = [],
  onDiscoverHotspot,
}: EvidenceViewerProps & {
  discoveredHotspotIds?: string[];
  onDiscoverHotspot?: (evidenceId: string, hotspotId: string) => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isInspectMode, setIsInspectMode] = useState(false);
  const [activeHotspot, setActiveHotspot] = useState<PhotoHotspot | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reset audio playback and inspect mode on item change
  useEffect(() => {
    setIsPlaying(false);
    setPlaybackTime(0);
    setIsInspectMode(false);
    setActiveHotspot(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [item?.id]);

  // Handle ESC key to close
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // Audio playback interval
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackTime((prev) => {
          if (prev >= 47) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  if (!item) return null;

  // Audio simulation / timer if no real audio file
  const maxDuration = 47; // 47 seconds for auto-attendant recording
  const togglePlay = () => {
    if (audioRef.current && item.mediaUrl) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {
          // Fallback to synthetic playback simulation
          setIsPlaying(true);
        });
      }
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  // Find related entities
  const relatedDocs = allDocuments.filter(
    (d) => d.id !== item.id && (item.relatedIds?.includes(d.id) || d.relatedIds?.includes(item.id))
  );
  const relatedPeople = allPeople.filter(
    (p) => item.personIds?.includes(p.id) || p.relatedEvidenceIds?.includes(item.id)
  );
  const relatedLocs = allLocations.filter(
    (l) => item.locationId === l.id || l.relatedEvidenceIds?.includes(item.id) || item.relatedIds?.includes(l.id)
  );

  // Connected relations in the graph
  const directRelations = allRelations.filter(
    (r) =>
      r.fromId === item.id ||
      r.toId === item.id ||
      r.sourceId === item.id ||
      r.targetId === item.id ||
      (item.personIds && (item.personIds.includes(r.fromId) || item.personIds.includes(r.toId)))
  );

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const getKindBadge = (kind: ViewerItem['kind']) => {
    switch (kind) {
      case 'document':
        return { label: 'ПРОТОКОЛ / ДОКУМЕНТ', icon: FileText, stamp: 'АРХИВ ОВР' };
      case 'photo':
        return { label: 'ФОТОМАТЕРИАЛ', icon: ImageIcon, stamp: 'ВЕЩДОК' };
      case 'audio':
        return { label: 'АУДИОЗАПИСЬ / ПЛЁНКА', icon: Mic, stamp: 'ФОНОГРАММА' };
      case 'call':
        return { label: 'ТЕЛЕФОННЫЙ БИЛЛИНГ', icon: Phone, stamp: 'СПЕЦСВЯЗЬ' };
      case 'map':
        return { label: 'ПЛАН-СХЕМА МЕСТНОСТИ', icon: MapPin, stamp: 'СХЕМА ОВР' };
      case 'note':
        return { label: 'СЛУЖЕБНАЯ ЗАМЕТКА', icon: StickyNote, stamp: 'ЗАПИСИ ОРЛОВА' };
      default:
        return { label: 'МАТЕРИАЛ ДЕЛА', icon: FileText, stamp: 'АРХИВ' };
    }
  };

  const badge = getKindBadge(item.kind);
  const Icon = badge.icon;

  const content = (
    <div
      className={cn(
        "relative flex w-full flex-col border border-border/80 bg-card overflow-hidden shadow-2xl",
        embedded ? "h-full min-h-[560px]" : "max-h-[92vh] max-w-4xl"
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top archival banner */}
      <div className="flex items-center justify-between border-b border-border/70 bg-secondary/70 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex size-7 items-center justify-center border border-border bg-background text-primary">
            <Icon className="size-4" />
          </span>
          <div>
            <span className="block label-xs text-primary">{badge.label}</span>
            <span className="text-xs text-muted-foreground font-mono">
              {item.archiveId ?? `АРХ-${item.id.toUpperCase()}`}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block border border-stamp/50 bg-stamp/10 px-2 py-0.5 text-[10px] tracking-widest text-stamp font-display uppercase">
            {badge.stamp}
          </span>
          {embedded && onExpandModal && (
            <button
              type="button"
              onClick={onExpandModal}
              className="border border-border/60 p-1.5 text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
              title="Развернуть на весь экран"
            >
              <Maximize2 className="size-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="border border-border/60 p-1.5 text-muted-foreground transition-colors hover:border-destructive/60 hover:text-destructive"
            title={embedded ? "Очистить рабочий стол" : "Закрыть (Esc)"}
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Document Header inside Case Paper */}
          <div className="paper-card p-5 sm:p-7 relative border-t-4 border-t-amber-700/60">
            {/* Stamp on paper */}
            <div className="absolute right-4 top-4 rotate-[-8deg] border-2 border-stamp/70 px-3 py-1 text-xs font-display tracking-widest uppercase text-stamp select-none opacity-85">
              ОВР г. Н.
            </div>

            <div className="max-w-2xl">
              <span className="label-xs text-ink/70">
                {item.date ? `ДАТА ФИКСАЦИИ: ${item.date}` : 'МАТЕРИАЛ ДЕЛА №001'}
              </span>
              <h2 className="mt-1 font-display text-2xl sm:text-3xl uppercase tracking-wide text-ink">
                {item.title}
              </h2>
              {item.source && (
                <p className="mt-1 text-xs font-mono text-ink/70">
                  Источник: {item.source}
                </p>
              )}
            </div>

            {/* Kind-specific viewer render */}
            <div className="mt-6 border-t border-ink/20 pt-5">
              {/* PHOTO KIND */}
              {item.kind === 'photo' && (
                <div className="space-y-4">
                  {item.mediaUrl && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between bg-black/80 px-3 py-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] text-amber-300">
                            ФОТОФИКСАЦИЯ // {item.archiveId ?? item.id}
                          </span>
                          {item.hotspots && item.hotspots.length > 0 && (
                            <span className="border border-amber-500/40 px-1.5 py-0.2 font-mono text-[10px] text-amber-400">
                              {(discoveredHotspotIds ?? []).filter((id) =>
                                item.hotspots?.some((h) => h.id === id)
                              ).length} / {item.hotspots.length} деталей
                            </span>
                          )}
                        </div>

                        {item.hotspots && item.hotspots.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setIsInspectMode(!isInspectMode)}
                            className={cn(
                              'flex items-center gap-1.5 border px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider transition-colors',
                              isInspectMode
                                ? 'border-amber-400 bg-amber-400 text-black font-bold'
                                : 'border-amber-400/70 text-amber-300 hover:bg-amber-400/20'
                            )}
                          >
                            <Crosshair className="size-3.5" />
                            <span>{isInspectMode ? 'Режим осмотра ВКЛ' : 'Осмотреть детали снимка'}</span>
                          </button>
                        )}
                      </div>

                      <div
                        className={cn(
                          'relative overflow-hidden border-4 border-white/80 shadow-md bg-black/40 select-none',
                          isInspectMode && 'cursor-crosshair'
                        )}
                      >
                        <img
                          src={item.mediaUrl}
                          alt={item.title}
                          className="max-h-[380px] w-full object-cover grayscale-[0.2] contrast-110"
                        />

                        {/* Hotspots layer */}
                        {item.hotspots?.map((hs, idx) => {
                          const isDiscovered = (discoveredHotspotIds ?? []).includes(hs.id);
                          const isActive = activeHotspot?.id === hs.id;

                          return (
                            <div
                              key={hs.id}
                              onClick={() => {
                                setActiveHotspot(hs);
                                onDiscoverHotspot?.(item.id, hs.id);
                              }}
                              style={{
                                left: `${hs.x * 100}%`,
                                top: `${hs.y * 100}%`,
                                width: `${hs.width * 100}%`,
                                height: `${hs.height * 100}%`,
                              }}
                              title={isDiscovered ? hs.title : 'Нажмите для криминалистического осмотра'}
                              className={cn(
                                'absolute transition-all cursor-pointer',
                                isInspectMode
                                  ? isDiscovered
                                    ? 'border-2 border-emerald-400 bg-emerald-400/20 shadow-md'
                                    : 'border-2 border-dashed border-amber-300 bg-amber-400/20 animate-pulse hover:bg-amber-400/40'
                                  : isDiscovered
                                  ? 'border border-amber-400/70 bg-amber-400/10'
                                  : 'opacity-0 pointer-events-none',
                                isActive && 'ring-2 ring-white ring-offset-1'
                              )}
                            >
                              {isDiscovered && (
                                <span className="absolute -top-2.5 -left-2.5 flex size-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white shadow">
                                  {idx + 1}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Active Hotspot Inspector Card */}
                      {activeHotspot && (
                        <div className="border border-amber-500/80 bg-amber-950/20 p-4 space-y-2 animate-in fade-in">
                          <div className="flex items-center justify-between border-b border-amber-500/30 pb-2">
                            <div className="flex items-center gap-2">
                              <Sparkles className="size-4 text-amber-400 animate-pulse" />
                              <span className="font-display text-xs uppercase tracking-wider text-amber-400 font-bold">
                                {activeHotspot.title}
                              </span>
                            </div>
                            <span className="font-mono text-[10px] text-emerald-400 uppercase border border-emerald-500/50 bg-emerald-950/30 px-2 py-0.5 flex items-center gap-1">
                              <CheckCircle className="size-3" />
                              <span>ЗАФИКСИРОВАНО</span>
                            </span>
                          </div>

                          <p className="text-xs font-mono text-ink/90 leading-relaxed whitespace-pre-wrap">
                            {activeHotspot.description}
                          </p>

                          {activeHotspot.resultEvidenceId && (
                            <div className="pt-2 flex justify-end">
                              <button
                                type="button"
                                onClick={() => onSelectEntity?.(activeHotspot.resultEvidenceId!)}
                                className="flex items-center gap-1.5 border border-primary bg-primary/20 px-3 py-1.5 text-xs font-display uppercase tracking-wider text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                              >
                                <span>Открыть найденную улику {activeHotspot.resultEvidenceId.toUpperCase()}</span>
                                <ArrowRight className="size-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                  {item.content && (
                    <div className="bg-[oklch(0.92_0.02_82)] p-4 border border-ink/20 font-mono text-xs text-ink leading-relaxed whitespace-pre-wrap">
                      {item.content}
                    </div>
                  )}
                </div>
              )}

              {/* AUDIO KIND */}
              {item.kind === 'audio' && (
                <div className="space-y-5">
                  {/* Tape recorder visualizer widget */}
                  <div className="border border-border/80 bg-background/90 p-4 text-foreground shadow-inner">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
                      <div className="flex items-center gap-2">
                        <span className={cn('size-2.5 rounded-full', isPlaying ? 'bg-red-500 animate-pulse' : 'bg-muted-foreground')} />
                        <span className="font-display uppercase tracking-widest text-xs text-primary">
                          МАГНИТНАЯ ЛЕНТА // АВТООТВЕТЧИК
                        </span>
                      </div>
                      <div className="font-mono text-sm tracking-wider text-primary">
                        {formatSeconds(playbackTime)} / {item.duration ?? '00:47'}
                      </div>
                    </div>

                    {/* Waveform bars simulation */}
                    <div className="my-4 flex h-12 items-center justify-between gap-1 px-2 bg-black/40 border border-border/40 overflow-hidden">
                      {Array.from({ length: 48 }).map((_, i) => {
                        const active = isPlaying && i < (playbackTime / maxDuration) * 48;
                        const height = Math.sin(i * 0.4) * 18 + 24;
                        return (
                          <div
                            key={i}
                            style={{ height: `${active ? height : 6}px` }}
                            className={cn(
                              'w-1.5 transition-all duration-150',
                              active ? 'bg-primary' : 'bg-muted-foreground/30'
                            )}
                          />
                        );
                      })}
                    </div>

                    {/* Audio Controls */}
                    <div className="flex items-center justify-between pt-2">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={togglePlay}
                          className="flex size-10 items-center justify-center border border-primary bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                        >
                          {isPlaying ? <Pause className="size-5" /> : <Play className="size-5 ml-0.5" />}
                        </button>
                        <span className="label-xs text-muted-foreground">
                          {isPlaying ? 'Воспроизведение фонограммы...' : 'Нажмите для воспроизведения'}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsMuted(!isMuted)}
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {isMuted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                      </button>
                    </div>

                    {/* Hidden HTML5 audio element */}
                    {item.mediaUrl && (
                      <audio
                        ref={audioRef}
                        src={item.mediaUrl}
                        onTimeUpdate={() => {
                          if (audioRef.current) setPlaybackTime(Math.floor(audioRef.current.currentTime));
                        }}
                        onEnded={() => setIsPlaying(false)}
                      />
                    )}
                  </div>

                  {/* Transcript */}
                  {item.transcript && (
                    <div className="border border-ink/20 bg-[oklch(0.93_0.02_82)] p-4">
                      <span className="label-xs text-ink/70 block mb-2 font-display">
                        РАСШИФРОВКА ФОНОГРАММЫ ЭКСПЕРТАМИ ОВР:
                      </span>
                      <p className="font-mono text-xs sm:text-sm text-ink leading-relaxed whitespace-pre-wrap">
                        {item.transcript}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* CALL / BILLING KIND */}
              {item.kind === 'call' && (
                <div className="space-y-4">
                  <div className="border border-ink/20 bg-[oklch(0.92_0.02_82)] p-4 font-mono text-xs text-ink space-y-2">
                    {item.number && (
                      <div className="flex justify-between border-b border-ink/10 pb-1">
                        <span className="text-ink/60">Номер абонента:</span>
                        <span className="font-bold text-stamp">{item.number}</span>
                      </div>
                    )}
                    {item.date && (
                      <div className="flex justify-between border-b border-ink/10 pb-1">
                        <span className="text-ink/60">Дата и время:</span>
                        <span>{item.date}</span>
                      </div>
                    )}
                    {item.duration && (
                      <div className="flex justify-between border-b border-ink/10 pb-1">
                        <span className="text-ink/60">Длительность:</span>
                        <span>{item.duration}</span>
                      </div>
                    )}
                    {item.participants && (
                      <div className="flex justify-between border-b border-ink/10 pb-1">
                        <span className="text-ink/60">Участники:</span>
                        <span>{item.participants.join(' ↔ ')}</span>
                      </div>
                    )}
                    {item.summary && (
                      <div className="pt-2">
                        <span className="text-ink/60 block mb-1">Сводка оператора:</span>
                        <p className="font-sans text-sm text-ink">{item.summary}</p>
                      </div>
                    )}
                  </div>
                  {item.content && (
                    <div className="whitespace-pre-wrap text-sm leading-relaxed text-ink font-sans">
                      {item.content}
                    </div>
                  )}
                </div>
              )}

              {/* DOCUMENT / REPORT / NOTE KIND */}
              {(item.kind === 'document' || item.kind === 'note' || item.kind === 'map') && (
                <div className="space-y-4">
                  {item.content && (
                    <div
                      className={cn(
                        'text-sm leading-relaxed whitespace-pre-wrap',
                        item.kind === 'note' ? 'font-hand text-xl text-ink leading-snug' : 'font-sans text-ink'
                      )}
                    >
                      {item.content}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RELATIONSHIPS / KNOWLEDGE GRAPH SECTION */}
          <div className="border border-border/70 bg-card/60 p-4 sm:p-5 space-y-4">
            <div className="flex items-center gap-2 border-b border-border/60 pb-2">
              <Share2 className="size-4 text-primary" />
              <h3 className="font-display uppercase tracking-wider text-sm text-foreground">
                Связи и фигуранты дела
              </h3>
            </div>

            {/* Direct relation chains */}
            {directRelations.length > 0 && (
              <div className="space-y-2">
                <span className="label-xs text-muted-foreground block">ЦЕПОЧКА ВЗАИМОСВЯЗЕЙ:</span>
                <div className="flex flex-wrap gap-2">
                  {directRelations.map((rel, idx) => {
                    const targetEntityId =
                      rel.toId === item.id || (item.personIds && item.personIds.includes(rel.toId))
                        ? rel.fromId
                        : rel.toId;
                    const targetPerson = allPeople.find((p) => p.id === targetEntityId);
                    const targetLabel = targetPerson ? targetPerson.name : targetEntityId;

                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-2 border border-border/60 bg-secondary/40 px-3 py-1.5 text-xs text-muted-foreground"
                      >
                        <span className="text-primary font-mono">{rel.label}</span>
                        <ArrowRight className="size-3 text-muted-foreground/60" />
                        <button
                          type="button"
                          onClick={() => onSelectEntity?.(targetEntityId)}
                          className="text-foreground underline decoration-primary/60 underline-offset-2 hover:text-primary transition-colors"
                        >
                          {targetLabel}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Linked People */}
            {relatedPeople.length > 0 && (
              <div className="space-y-2">
                <span className="label-xs text-muted-foreground block">УПОМЯНУТЫЕ ЛЮДИ:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {relatedPeople.map((person) => (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => onSelectEntity?.(person.id)}
                      className="flex items-start gap-2.5 border border-border/60 bg-secondary/30 p-2.5 text-left transition-colors hover:border-primary/60"
                    >
                      <User className="size-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-foreground">{person.name}</span>
                          <span className="border border-border px-1.5 py-0.5 text-[9px] label-xs text-muted-foreground">
                            {person.status}
                          </span>
                        </div>
                        <span className="block text-[11px] text-muted-foreground leading-tight mt-0.5">
                          {person.role}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Linked Documents */}
            {relatedDocs.length > 0 && (
              <div className="space-y-2">
                <span className="label-xs text-muted-foreground block">СОПУТСТВУЮЩИЕ УЛИКИ:</span>
                <div className="flex flex-wrap gap-2">
                  {relatedDocs.map((doc) => (
                    <button
                      key={doc.id}
                      type="button"
                      onClick={() => onSelectEntity?.(doc.id)}
                      className="flex items-center gap-2 border border-border/60 bg-secondary/30 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-primary/60 transition-colors"
                    >
                      <FileText className="size-3.5 text-primary" />
                      <span>{doc.title}</span>
                      <span className="font-mono text-[10px] text-muted-foreground/70">
                        {doc.archiveId ?? doc.id}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Linked Locations */}
            {relatedLocs.length > 0 && (
              <div className="space-y-2">
                <span className="label-xs text-muted-foreground block">СВЯЗАННЫЕ ЛОКАЦИИ ГОРОДА Н.:</span>
                <div className="flex flex-wrap gap-2">
                  {relatedLocs.map((loc) => (
                    <div
                      key={loc.id}
                      className="flex items-center gap-2 border border-border/60 bg-secondary/30 px-3 py-1.5 text-xs text-muted-foreground"
                    >
                      <MapPin className="size-3.5 text-destructive" />
                      <span className="text-foreground">{loc.name}</span>
                      {loc.address && <span className="text-[11px] text-muted-foreground/70">({loc.address})</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="border-t border-border/70 bg-secondary/70 px-4 py-3 sm:px-6 flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-mono text-[11px]">
            АРХИВНЫЙ ФОНД ОВР // КЕЙС 001
          </span>
          <button
            type="button"
            onClick={onClose}
            className="border border-border/70 bg-card px-4 py-1.5 label-xs text-foreground hover:border-primary/60 transition-colors"
          >
            {embedded ? "Очистить рабочий стол" : "Закрыть просмотр"}
          </button>
        </div>
      </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200">
      {content}
    </div>
  );
}
