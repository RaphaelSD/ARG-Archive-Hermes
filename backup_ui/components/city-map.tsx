'use client';

import { useState } from 'react';
import { 
  MapPin, 
  FileText, 
  User, 
  Search, 
  CheckCircle2, 
  X, 
  Compass, 
  ArrowRight,
  Eye
} from 'lucide-react';
import { locations as defaultLocations, type CaseLocation } from '@/lib/locations-data';
import { cn } from '@/lib/utils';

export function CityMap({
  locations: customLocations,
  exploredLocationIds,
  compact = false,
  onSelectEvidence,
  onExploreLocation,
}: {
  locations?: CaseLocation[];
  exploredLocationIds?: string[];
  compact?: boolean;
  onSelectEvidence?: (evidenceId: string) => void;
  onExploreLocation?: (locationId: string) => void;
}) {
  const allLocations = customLocations || defaultLocations;
  const [active, setActive] = useState(
    allLocations.find((l) => l.current)?.id ?? allLocations[0]?.id ?? 'archive'
  );
  const [inspectingScene, setInspectingScene] = useState<boolean>(false);

  const selected = allLocations.find((l) => l.id === active) || allLocations[0]!;

  const isExplored = (loc: CaseLocation) => {
    if (exploredLocationIds) {
      return exploredLocationIds.includes(loc.id);
    }
    return loc.explored;
  };

  const handleStartInspection = () => {
    if (onExploreLocation && !isExplored(selected)) {
      onExploreLocation(selected.id);
    }
    setInspectingScene(true);
  };

  return (
    <div className={cn('grid gap-5', compact ? 'md:grid-cols-[1fr_240px]' : 'lg:grid-cols-[1fr_300px]')}>
      <div className="relative aspect-[16/11] overflow-hidden border border-border/70 bg-[oklch(0.19_0.008_70)]">
        <svg viewBox="0 0 100 62" className="absolute inset-0 size-full" aria-hidden>
          <g stroke="oklch(0.34 0.01 70)" strokeWidth="0.6" fill="none">
            <path d="M0 30 H100" />
            <path d="M20 0 V62" />
            <path d="M66 0 V62" />
            <path d="M0 48 C25 44, 45 52, 100 42" />
            <path d="M8 8 C40 14, 60 4, 96 18" />
            <path d="M40 0 C44 20, 34 40, 46 62" />
          </g>
          <g stroke="oklch(0.28 0.01 70)" strokeWidth="0.3" fill="none">
            {Array.from({ length: 12 }).map((_, i) => (
              <path key={i} d={`M0 ${i * 5.5} H100`} />
            ))}
          </g>
        </svg>

        {allLocations.map((loc) => {
          const explored = isExplored(loc);
          return (
            <button
              key={loc.id}
              type="button"
              onClick={() => {
                setActive(loc.id);
                setInspectingScene(false);
              }}
              aria-label={loc.name}
              style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
              className={cn(
                'absolute -translate-x-1/2 -translate-y-1/2 transition-transform hover:scale-125 z-10',
                loc.current ? 'text-destructive' : explored ? 'text-primary/70' : 'text-muted-foreground/50',
                active === loc.id && 'scale-125',
              )}
            >
              <MapPin className="size-5 drop-shadow" fill={active === loc.id ? 'currentColor' : 'none'} />
            </button>
          );
        })}

        {/* Selected location overlay on map */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-border/60 bg-background/95 p-3 sm:px-4 sm:py-3 space-y-2 backdrop-blur-sm z-20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <p className="label-xs text-primary font-semibold">{selected.name}</p>
              <span className={cn(
                'text-[10px] font-mono px-1.5 py-0.2 border',
                isExplored(selected)
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-muted-foreground/40 bg-muted/20 text-muted-foreground'
              )}>
                {isExplored(selected) ? 'ИССЛЕДОВАНО' : 'ТРЕБУЕТ ОСМОТРА'}
              </span>
            </div>
            {selected.address && (
              <span className="text-[11px] font-mono text-muted-foreground">
                {selected.address}
              </span>
            )}
          </div>
          
          <p className="text-xs text-muted-foreground leading-relaxed">{selected.description}</p>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-border/40">
            {/* Linked evidence on location */}
            {selected.relatedEvidenceIds && selected.relatedEvidenceIds.length > 0 ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-display flex items-center gap-1">
                  <FileText className="size-3 text-primary" /> Улики:
                </span>
                {selected.relatedEvidenceIds.map((evId) => (
                  <button
                    key={evId}
                    type="button"
                    onClick={() => onSelectEvidence?.(evId)}
                    className="border border-border/60 bg-secondary/70 px-1.5 py-0.5 text-[10px] font-mono text-primary hover:border-primary transition-colors"
                  >
                    {evId.toUpperCase()}
                  </button>
                ))}
              </div>
            ) : <div />}

            {/* Explore Scene Action Button */}
            {selected.scene && (
              <button
                type="button"
                onClick={handleStartInspection}
                className="flex items-center gap-1.5 border border-primary/60 bg-secondary/80 px-2.5 py-1 text-xs font-display uppercase tracking-wider text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
              >
                <Compass className="size-3.5" />
                <span>{isExplored(selected) ? 'Протокол осмотра' : 'Осмотреть место'}</span>
              </button>
            )}
          </div>

          {/* Linked people */}
          {selected.relatedPeople && selected.relatedPeople.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-muted-foreground">
              <span className="uppercase tracking-wider font-display flex items-center gap-1">
                <User className="size-3 text-primary" /> Связанные лица:
              </span>
              <span className="text-foreground">{selected.relatedPeople.join(', ')}</span>
            </div>
          )}
        </div>

        {/* Scene Inspection Modal Overlay */}
        {inspectingScene && selected.scene && (
          <div className="absolute inset-0 z-30 bg-background/95 backdrop-blur-md p-5 flex flex-col justify-between overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="space-y-3">
              <div className="flex items-start justify-between border-b border-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Compass className="size-4 text-primary" />
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      Оперативный выезд / Осмотр места
                    </span>
                    <h3 className="text-sm font-display uppercase font-bold text-foreground">
                      {selected.scene.sceneTitle}
                    </h3>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setInspectingScene(false)}
                  className="border border-border/60 p-1 text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="space-y-2">
                <p className="text-xs text-foreground/90 leading-relaxed font-sans">
                  {selected.scene.sceneDescription}
                </p>
              </div>

              {/* Findings */}
              {selected.scene.findings && selected.scene.findings.length > 0 && (
                <div className="border border-border/50 bg-secondary/30 p-3 space-y-2">
                  <h4 className="text-[11px] font-display uppercase tracking-wider text-primary flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5 text-primary" />
                    Результаты оперативного осмотра:
                  </h4>
                  <ul className="space-y-1.5">
                    {selected.scene.findings.map((finding, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2">
                        <span className="text-primary font-mono select-none">•</span>
                        <span>{finding}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Unlocked evidence */}
              {selected.scene.unlockedEvidenceIds && selected.scene.unlockedEvidenceIds.length > 0 && (
                <div className="pt-2">
                  <span className="text-[10px] font-mono uppercase text-muted-foreground block mb-1">
                    Обнаруженные на месте материалы:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selected.scene.unlockedEvidenceIds.map((evId) => (
                      <button
                        key={evId}
                        type="button"
                        onClick={() => {
                          setInspectingScene(false);
                          onSelectEvidence?.(evId);
                        }}
                        className="flex items-center gap-1.5 border border-primary/60 bg-primary/10 px-2.5 py-1 text-xs font-mono text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                      >
                        <Eye className="size-3.5" />
                        <span>Изучить улика [{evId.toUpperCase()}]</span>
                        <ArrowRight className="size-3" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border/60 flex justify-end">
              <button
                type="button"
                onClick={() => setInspectingScene(false)}
                className="border border-border/60 px-4 py-1.5 text-xs font-display uppercase tracking-wider hover:bg-secondary text-foreground"
              >
                Вернуться к карте
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Locations list */}
      <ul className="space-y-1.5">
        {allLocations.map((loc) => {
          const explored = isExplored(loc);
          return (
            <li key={loc.id}>
              <button
                type="button"
                onClick={() => {
                  setActive(loc.id);
                  setInspectingScene(false);
                }}
                className={cn(
                  'flex w-full items-center justify-between gap-2 border border-transparent px-2.5 py-2 text-left text-sm transition-colors',
                  active === loc.id ? 'border-border/70 bg-secondary/60 text-foreground' : 'text-muted-foreground hover:text-foreground',
                  loc.current && 'text-destructive',
                  !explored && 'italic opacity-60',
                )}
              >
                <span className="flex items-center gap-2">
                  <MapPin className="size-3.5 shrink-0" />
                  <span>{loc.name}</span>
                </span>
                <div className="flex items-center gap-1">
                  {loc.scene && !explored && (
                    <span className="size-2 rounded-full bg-primary animate-pulse" title="Требует осмотра" />
                  )}
                  {loc.relatedEvidenceIds && loc.relatedEvidenceIds.length > 0 && (
                    <span className="border border-border/60 px-1 py-0.2 text-[9px] font-mono text-muted-foreground">
                      {loc.relatedEvidenceIds.length} ул.
                    </span>
                  )}
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
