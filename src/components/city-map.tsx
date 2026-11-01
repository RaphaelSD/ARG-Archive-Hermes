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

// Схематичная карта города Белмонт: река с востока, парк у набережной, квартальная сетка, вокзал
function CityBackdrop() {
  const hStreets = [18, 40, 62, 84];
  const vStreets = [30, 62, 94, 124];
  const xs = [0, ...vStreets, 160];
  const ys = [0, ...hStreets, 110];
  const blocks: Array<{ x: number; y: number; w: number; h: number; tone: number }> = [];
  for (let i = 0; i < xs.length - 1; i++) {
    for (let j = 0; j < ys.length - 1; j++) {
      const x = xs[i] + 2.2;
      const y = ys[j] + 2.2;
      const w = xs[i + 1] - xs[i] - 4.4;
      const h = ys[j + 1] - ys[j] - 4.4;
      if (x > 128) continue; // восточнее — река и набережная
      blocks.push({ x, y, w, h, tone: (i * 7 + j * 13) % 4 });
    }
  }
  const tones = [
    'oklch(0.23 0.01 70)',
    'oklch(0.25 0.012 70)',
    'oklch(0.22 0.009 68)',
    'oklch(0.26 0.012 72)',
  ];
  return (
    <svg viewBox="0 0 160 110" preserveAspectRatio="none" className="absolute inset-0 size-full" aria-hidden>
      <rect width="160" height="110" fill="oklch(0.17 0.008 70)" />
      {/* кварталы */}
      {blocks.map((b, i) => (
        <rect key={i} x={b.x} y={b.y} width={b.w} height={b.h} fill={tones[b.tone]} stroke="oklch(0.3 0.01 70)" strokeWidth="0.25" />
      ))}
      {/* парк Riverside у набережной */}
      <path
        d="M104 10 C122 6, 138 12, 136 30 C134 42, 112 44, 104 36 C98 28, 98 16, 104 10 Z"
        fill="oklch(0.27 0.035 150)"
        stroke="oklch(0.36 0.04 150)"
        strokeWidth="0.4"
      />
      <g fill="oklch(0.33 0.05 150)">
        {[[110, 16], [118, 14], [126, 20], [114, 28], [124, 32], [131, 26]].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="1.7" />
        ))}
      </g>
      {/* диагональный проспект */}
      <path d="M0 98 L128 8" stroke="oklch(0.36 0.012 75)" strokeWidth="2.2" fill="none" />
      <path d="M0 98 L128 8" stroke="oklch(0.18 0.008 70)" strokeWidth="0.5" strokeDasharray="2 2" fill="none" />
      {/* улицы */}
      <g stroke="oklch(0.34 0.011 72)" strokeWidth="1.6" fill="none">
        {hStreets.map((y) => (
          <path key={y} d={`M0 ${y} H134`} />
        ))}
        {vStreets.slice(0, 3).map((x) => (
          <path key={x} d={`M${x} 0 V110`} />
        ))}
      </g>
      {/* железная дорога у вокзала */}
      <path d="M0 101 H160" stroke="oklch(0.4 0.012 75)" strokeWidth="1.4" fill="none" />
      <path d="M0 101 H160" stroke="oklch(0.17 0.008 70)" strokeWidth="1" strokeDasharray="1.2 2.2" fill="none" />
      {/* река */}
      <path
        d="M146 0 C154 24, 140 46, 150 70 S144 100, 152 110 L160 110 L160 0 Z"
        fill="oklch(0.27 0.03 235)"
      />
      <path
        d="M146 0 C154 24, 140 46, 150 70 S144 100, 152 110"
        stroke="oklch(0.42 0.04 235)"
        strokeWidth="0.6"
        fill="none"
      />
      <path d="M138 0 C146 24, 132 46, 142 70 S136 100, 144 110" stroke="oklch(0.3 0.012 72)" strokeWidth="0.8" fill="none" />
      {/* подписи */}
      <g fontFamily="var(--font-display)" fill="oklch(0.58 0.02 75)" fontSize="3" letterSpacing="0.5">
        <text x="33" y="16.2">ГЛАВНАЯ УЛ.</text>
        <text x="3" y="60.2">МЕЛЬНИЧНАЯ УЛ.</text>
        <text x="65" y="82.2">СТАНЦИОННАЯ УЛ.</text>
        <text x="3" y="99.2">ВОКЗАЛ / АВТОСТАНЦИЯ</text>
        <text x="75" y="52" transform="rotate(-35 75 52)">ПАЙНКРЕСТ-АВЕНЮ</text>
        <text x="146" y="60" transform="rotate(90 146 60)" fill="oklch(0.55 0.04 235)">РЕКА ВЕСНА</text>
        <text x="106" y="40.5" fill="oklch(0.55 0.05 150)">ПАРК RIVERSIDE</text>
      </g>
      <text x="80" y="108" textAnchor="middle" fontFamily="var(--font-display)" fontSize="3.2" letterSpacing="2" fill="oklch(0.45 0.015 75)">
        БЕЛМОНТ // 1999
      </text>
      {/* север */}
      <g transform="translate(8 9)" stroke="oklch(0.6 0.03 75)" fill="oklch(0.6 0.03 75)" strokeWidth="0.5">
        <path d="M0 6 L0 -4" fill="none" />
        <path d="M0 -6 L-1.6 -2.5 L1.6 -2.5 Z" />
        <text x="2.5" y="-1.5" fontSize="3" stroke="none" fontFamily="var(--font-display)">С</text>
      </g>
      <rect x="0.5" y="0.5" width="159" height="109" fill="none" stroke="oklch(0.34 0.01 70)" strokeWidth="0.6" />
    </svg>
  );
}

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
        <CityBackdrop />

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
