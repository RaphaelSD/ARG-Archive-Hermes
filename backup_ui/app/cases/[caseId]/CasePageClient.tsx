'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Image as ImageIcon,
  Mic,
  Phone,
  Clock,
  MapPin,
  Terminal,
  X,
  User,
  ShieldAlert,
  ArrowRight,
  Maximize2,
  FolderOpen,
  Sparkles,
  AlertTriangle,
  Layers,
  StickyNote,
  ChevronRight,
  RotateCcw,
  Unlock,
} from 'lucide-react';

import { Panel, StatusBadge } from '@/components/archive-ui';
import { CallLog, DocumentGrid, NotesBoard } from '@/components/case-widgets';
import { EvidenceViewer, type ViewerItem } from '@/components/evidence-viewer';
import { PlayerNotes } from '@/components/player-notes';
import { InvestigativeTerminal } from '@/components/investigative-terminal';
import { InterviewDialog } from '@/components/interview-dialog';
import { DeductionBoard } from '@/components/deduction-board';
import { CityMap } from '@/components/city-map';
import { useCaseEngine } from '@/lib/engine/useCaseEngine';
import { isConditionMet } from '@/lib/engine/evaluator';
import {
  locations,
  type CaseFile,
  type CaseDocument,
  type CallLogRow,
  type PersonStatus,
  type CasePerson,
} from '@/lib/archive-data';
import { cn } from '@/lib/utils';

type MaterialTab = 'all' | 'document' | 'photo' | 'audio' | 'call' | 'timeline' | 'map' | 'interview' | 'deduction';
type RightSidebarTab = 'orlov_notes' | 'player_notes' | 'people';

const personStatusConfig: Record<PersonStatus, { label: string; badgeClass: string }> = {
  SUSPECT: {
    label: 'ПОДОЗРЕВАЕМЫЙ',
    badgeClass: 'border-stamp text-stamp bg-stamp/10 font-bold',
  },
  PERSON_OF_INTEREST: {
    label: 'КЛЮЧЕВОЙ ФИГУРАНТ',
    badgeClass: 'border-primary text-primary bg-primary/10 font-medium',
  },
  CONNECTED: {
    label: 'СВЯЗАННЫЙ СВИДЕТЕЛЬ',
    badgeClass: 'border-amber-600/80 text-amber-500 bg-amber-950/20',
  },
  IDENTIFIED: {
    label: 'ОПОЗНАН',
    badgeClass: 'border-foreground/40 text-foreground/80 bg-foreground/5',
  },
  MENTIONED: {
    label: 'УПОМЯНУТ В ДЕЛЕ',
    badgeClass: 'border-muted-foreground/40 text-muted-foreground bg-secondary/30',
  },
  CLEARED: {
    label: 'ВНЕ ПОДОЗРЕНИЙ',
    badgeClass: 'border-emerald-600/80 text-emerald-400 bg-emerald-950/20',
  },
};

export function CasePageClient({
  item,
  isGuest = false,
}: {
  item: CaseFile;
  isGuest?: boolean;
}) {
  const [materialTab, setMaterialTab] = useState<MaterialTab>('all');
  const [rightTab, setRightTab] = useState<RightSidebarTab>('orlov_notes');
  const [selectedEvidence, setSelectedEvidence] = useState<ViewerItem | null>(null);
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);
  const [isModalViewerOpen, setIsModalViewerOpen] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const router = useRouter();

  const {
    state: engineState,
    progressPercentage,
    availableDocuments,
    availableNotes,
    availableLocations,
    availableInterviews,
    availableDeductions,
    availableRelations,
    isArchiveUnlocked,
    newlyUnlockedTitle,
    dismissUnlockNotification,
    markEvidenceViewed,
    solveQuestion,
    discoverHotspot,
    askQuestion,
    presentClue,
    completeDeduction,
    exploreLocation,
  } = useCaseEngine({ caseFile: item, isGuest });

  const isFinaleTriggered = Boolean(
    engineState.completedDeductions?.includes('ded_unknown_visitor_confirmed') ||
    engineState.completedDeductions?.some((d) => d.includes('ded_unknown_visitor_confirmed')) ||
    (engineState.viewedEvidence?.includes('D10') && engineState.completedDeductions?.includes('ded_logbook_unreliable'))
  );

  const [hasAutoOpenedFinale, setHasAutoOpenedFinale] = useState(false);
  const [showFinaleModal, setShowFinaleModal] = useState(false);

  useEffect(() => {
    if (isFinaleTriggered && !hasAutoOpenedFinale) {
      setShowFinaleModal(true);
      setHasAutoOpenedFinale(true);
    }
  }, [isFinaleTriggered, hasAutoOpenedFinale]);

  const isDevMode = process.env.NODE_ENV === 'development';

  const handleResetProgressDev = () => {
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('arg_') || key.includes('case'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
      window.location.reload();
    } catch (e) {
      console.error('Failed to reset dev progress:', e);
    }
  };

  const handleCompleteAndReturnToArchive = () => {
    try {
      localStorage.setItem('arg_case_001_status', 'completed');
      localStorage.setItem('arg_case_status_001', 'completed');
      localStorage.setItem('arg_case_state_001_completed', 'true');
    } catch {
      // Ignore
    }
    router.push('/');
  };

  const activeInterview =
    availableInterviews.find((i) => i.id === selectedInterviewId) ?? availableInterviews[0] ?? null;

  const allCaseLocations = availableLocations.length > 0 ? availableLocations : (item.locations ?? locations);

  const handleSelectEntityById = (id: string) => {
    // 1. Documents
    const doc = item.documents.find((d) => d.id === id);
    if (doc) {
      setSelectedEvidence(doc);
      markEvidenceViewed(doc.id);
      return;
    }
    // 2. Call log rows
    const call = item.callLog?.rows.find((c) => c.id === id);
    if (call) {
      setSelectedEvidence({
        id: call.id ?? `call-${call.time}`,
        archiveId: 'ТЕЛ-БИЛЛИНГ',
        title: `Звонок: ${call.number}`,
        kind: 'call',
        date: `${call.date}, ${call.time}`,
        number: call.number,
        duration: call.duration,
        caller: call.caller,
        participants: call.participants,
        summary: call.summary,
        transcript: call.transcript,
        relatedIds: call.relatedIds,
      });
      return;
    }
    // 3. Persons
    const person = item.people?.find((p) => p.id === id);
    if (person) {
      setSelectedEvidence({
        id: person.id,
        archiveId: 'ЛИЧНОЕ-ДЕЛО',
        title: person.name,
        kind: 'document',
        meta: person.role,
        content: `ЛИЧНАЯ КАРТОЧКА ФИГУРАНТА
ФИО: ${person.name}
Статус в расследовании: ${personStatusConfig[person.status]?.label ?? person.status}
Роль / Должность: ${person.role}
Телефон: ${person.phone ?? 'Не установлен'}

ОПЕРАТИВНЫЕ СВЕДЕНИЯ ОВР:
${person.description}`,
        personIds: [person.id],
        relatedIds: person.relatedEvidenceIds,
      });
      return;
    }
    // 4. Locations
    const loc = allCaseLocations.find((l) => l.id === id);
    if (loc) {
      setSelectedEvidence({
        id: loc.id,
        archiveId: 'КАРТОГРАФИЯ-ОВР',
        title: loc.name,
        kind: 'map',
        meta: loc.address,
        content: `ОБЪЕКТ НАБЛЮДЕНИЯ: ${loc.name}
Адрес / Координаты: ${loc.address}

ОПИСАНИЕ ОБЪЕКТА:
${loc.description}

СВЯЗЬ С МАТЕРИАЛАМИ РАССЛЕДОВАНИЯ:
${loc.relatedEvidenceIds?.join(', ') || 'Прямых улик не прикреплено'}`,
        relatedIds: loc.relatedEvidenceIds,
      });
      return;
    }
  };

  // Filter materials for Left Column (only show unlocked materials)
  const filteredDocs = availableDocuments.filter((d) => {
    if (materialTab === 'document') return d.kind === 'document';
    if (materialTab === 'photo') return d.kind === 'photo';
    if (materialTab === 'audio') return d.kind === 'audio';
    return true;
  });

  return (
    <div className="mx-auto max-w-[1600px] space-y-4 px-4 py-4 sm:px-6">
      {/* 1. ВЕРХНИЙ БАР ДЕЛА */}
      <div className="border border-border/80 bg-card p-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="border border-border/70 bg-secondary/50 px-3 py-1.5 label-xs text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
          >
            ← В архив
          </Link>
          <span className="font-mono label-xs text-primary">{item.number}</span>
          <h1 className="font-display text-xl sm:text-2xl uppercase tracking-[0.08em] text-foreground">
            {item.title}
          </h1>
          <StatusBadge status={item.status} />

          {isDevMode && (
            <span className="inline-flex items-center gap-1 border border-emerald-500/70 bg-emerald-950/60 px-2 py-0.5 text-[10px] font-mono uppercase text-emerald-400 font-bold">
              <Unlock className="size-3" />
              <span>DEV ДОСТУП</span>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          {/* Dev Mode quick reset progress button */}
          {isDevMode && (
            <button
              type="button"
              onClick={handleResetProgressDev}
              className="flex items-center gap-1.5 border border-emerald-500/80 bg-emerald-950/70 px-2.5 py-1.5 label-xs text-emerald-300 hover:bg-emerald-900/80 hover:text-white transition-colors shadow-sm active:scale-95"
              title="Очистить весь прогресс в localStorage и перезагрузить дело с чистого листа"
            >
              <RotateCcw className="size-3.5 text-emerald-400" />
              <span className="font-bold">СБРОС ПРОГРЕССА (DEV)</span>
            </button>
          )}

          {isFinaleTriggered && (
            <button
              type="button"
              onClick={() => setShowFinaleModal(true)}
              className="flex items-center gap-1.5 border border-red-500/80 bg-red-950/50 px-3 py-1.5 label-xs text-red-400 hover:bg-red-900/60 transition-colors animate-pulse shadow-sm"
              title="Открыть сводку завершения расследования"
            >
              <ShieldAlert className="size-3.5 text-red-400" />
              <span className="font-bold">ФИНАЛ ДЕЛА</span>
            </button>
          )}
          <div className="flex items-center gap-2 border border-border/70 bg-secondary/50 px-3 py-1.5 label-xs text-muted-foreground">
            <span>ПРОГРЕСС:</span>
            <span className="font-mono font-bold text-primary">{progressPercentage}%</span>
          </div>
          <button
            type="button"
            onClick={() => setIsTerminalOpen(true)}
            className="flex items-center gap-2 border border-primary/60 bg-primary/15 px-4 py-2 font-display text-xs uppercase tracking-[0.14em] text-primary transition-colors hover:bg-primary hover:text-primary-foreground shadow-sm"
          >
            <Terminal className="size-4" />
            <span>Следственный терминал</span>
          </button>
        </div>
      </div>

      {/* Уведомление об открытии нового материала */}
      {newlyUnlockedTitle && (
        <div className="flex items-center justify-between gap-3 border border-primary/60 bg-primary/20 px-4 py-2.5 text-xs text-primary animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 shrink-0 text-primary animate-pulse" />
            <span>
              <strong>АРХИВ ОБНОВЛЁН:</strong> Получен доступ к новому материалу «{newlyUnlockedTitle}»!
            </span>
          </div>
          <button
            type="button"
            onClick={dismissUnlockNotification}
            className="text-primary hover:text-foreground text-[10px] uppercase font-mono border border-primary/40 px-2 py-0.5"
          >
            Закрыть [✕]
          </button>
        </div>
      )}

      {/* Гостевой баннер */}
      {isGuest && (
        <div className="flex items-center justify-between gap-3 border border-primary/40 bg-primary/10 px-4 py-2.5 text-xs text-primary">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 shrink-0" />
            <span>
              <strong>РЕЖИМ ГОСТЕВОГО ИССЛЕДОВАТЕЛЯ:</strong> Материалы {item.number} открыты для ознакомления. Личные гипотезы сохраняются в локальном дневнике на вашем устройстве.
            </span>
          </div>
          <span className="hidden sm:inline-block font-mono text-[10px] uppercase border border-primary/40 px-2 py-0.5">
            ОВР // ДЕМО
          </span>
        </div>
      )}

      {/* 2. ТРЕХКОЛОНОЧНЫЙ РАБОЧИЙ СТОЛ РАССЛЕДОВАНИЯ */}
      <div className="grid items-start gap-4 grid-cols-1 lg:grid-cols-12">
        {/* ЛЕВАЯ КОЛОНКА: МАТЕРИАЛЫ ДЕЛА (3 колонки из 12) */}
        <div className="lg:col-span-3 space-y-3">
          <Panel
            title="Материалы дела"
            back="Назад в архив"
            backTo="/"
            action={
              <span className="font-mono text-[10px] text-muted-foreground uppercase">
                {materialTab === 'call'
                  ? `${item.callLog?.rows.length ?? 0} звонков`
                  : materialTab === 'timeline'
                  ? `${item.timeline.length} событий`
                  : materialTab === 'map'
                  ? `${allCaseLocations.length} точек`
                  : materialTab === 'interview'
                  ? `${availableInterviews.length} допросов`
                  : materialTab === 'deduction'
                  ? `${availableDeductions.length} дедукций`
                  : `Открыто ${filteredDocs.length} из ${item.documents.length}`}
              </span>
            }
          >
            {/* Вкладки-фильтры */}
            <div className="flex flex-wrap gap-1 border-b border-border/60 pb-2 mb-3">
              {[
                { id: 'all', label: 'Все' },
                { id: 'document', label: 'Документы' },
                { id: 'photo', label: 'Фото' },
                { id: 'audio', label: 'Аудио' },
                { id: 'call', label: 'Звонки' },
                { id: 'timeline', label: 'Хронология' },
                { id: 'map', label: 'Карта' },
                { id: 'interview', label: availableInterviews.length > 0 ? `Допросы (${availableInterviews.length})` : 'Допросы' },
                { id: 'deduction', label: availableDeductions.length > 0 ? `Дедукция (${availableDeductions.length})` : 'Дедукция' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setMaterialTab(tab.id as MaterialTab);
                    if (tab.id === 'interview' || tab.id === 'deduction' || tab.id === 'map') {
                      setSelectedEvidence(null);
                    }
                  }}
                  className={cn(
                    'px-2 py-1 text-[11px] uppercase tracking-wider transition-colors border font-mono',
                    materialTab === tab.id
                      ? 'border-primary/80 bg-primary/10 text-primary font-medium'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Список материалов */}
            <div className="max-h-[640px] overflow-y-auto space-y-2 pr-1">
              {/* Если выбраны звонки */}
              {materialTab === 'call' && (
                <div className="space-y-1.5">
                  {item.callLog?.rows.map((c, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() =>
                        setSelectedEvidence({
                          id: c.id ?? `call-${c.time}`,
                          archiveId: 'ТЕЛ-БИЛЛИНГ',
                          title: `Звонок: ${c.number}`,
                          kind: 'call',
                          date: `${c.date}, ${c.time}`,
                          number: c.number,
                          duration: c.duration,
                          caller: c.caller,
                          participants: c.participants,
                          summary: c.summary,
                          transcript: c.transcript,
                          relatedIds: c.relatedIds,
                        })
                      }
                      className={cn(
                        'w-full text-left p-2.5 border transition-all flex flex-col gap-1',
                        selectedEvidence?.number === c.number && selectedEvidence?.date?.includes(c.time)
                          ? 'border-primary bg-primary/15'
                          : 'border-border/60 bg-secondary/30 hover:border-primary/60 hover:bg-secondary/60'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {`${c.date} — ${c.time}`}
                        </span>
                        {c.flagged && (
                          <span className="border border-stamp/70 px-1 py-0.2 font-mono text-[9px] text-stamp bg-stamp/10 uppercase">
                            ПОДОЗРИТЕЛЬНЫЙ
                          </span>
                        )}
                      </div>
                      <span className="font-mono text-xs font-semibold text-foreground">
                        {c.number}
                      </span>
                      <span className="text-[11px] text-muted-foreground line-clamp-1">
                        {c.summary || c.caller || c.type}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {/* Если выбрана хронология */}
              {materialTab === 'timeline' && (
                <div className="space-y-2">
                  {item.timeline
                    .filter((entry) => isConditionMet(entry.unlockCondition, engineState))
                    .map((entry, idx) => (
                    <div
                      key={entry.id ?? idx}
                      className="border border-border/60 bg-secondary/30 p-2.5 text-xs hover:border-primary/60 transition-colors"
                    >
                      <div className="flex items-center justify-between font-mono text-[10px] text-primary border-b border-border/40 pb-1">
                        <span>{entry.date ? `${entry.date}, ${entry.time}` : entry.time}</span>
                      </div>
                      <p className="mt-1.5 text-foreground leading-relaxed text-[11px]">
                        {entry.text || entry.event}
                      </p>
                      {entry.sourceId && (
                        <button
                          type="button"
                          onClick={() => handleSelectEntityById(entry.sourceId!)}
                          className="mt-2 inline-flex items-center gap-1 border border-primary/40 bg-primary/10 px-2 py-0.5 text-[10px] text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          <span>{entry.sourceTitle || entry.sourceId}</span>
                          <ArrowRight className="size-2.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Если выбрана карта */}
              {materialTab === 'map' && (
                <div className="space-y-1.5">
                  {allCaseLocations.map((loc) => (
                    <button
                      key={loc.id}
                      type="button"
                      onClick={() => handleSelectEntityById(loc.id)}
                      className={cn(
                        'w-full text-left p-2.5 border transition-all flex flex-col gap-1',
                        selectedEvidence?.id === loc.id
                          ? 'border-primary bg-primary/15'
                          : 'border-border/60 bg-secondary/30 hover:border-primary/60 hover:bg-secondary/60'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display text-xs uppercase tracking-wide text-foreground">
                          {loc.name}
                        </span>
                        <MapPin className="size-3.5 text-destructive" />
                      </div>
                      <span className="text-[11px] text-muted-foreground font-mono">
                        {loc.address}
                      </span>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                        {loc.description}
                      </p>
                    </button>
                  ))}
                </div>
              )}

              {/* Если выбраны допросы */}
              {materialTab === 'interview' && (
                <div className="space-y-1.5">
                  {availableInterviews.map((intv) => {
                    const isSelected = (selectedInterviewId ?? availableInterviews[0]?.id) === intv.id;
                    return (
                      <button
                        key={intv.id}
                        type="button"
                        onClick={() => {
                          setSelectedInterviewId(intv.id);
                          setSelectedEvidence(null);
                        }}
                        className={cn(
                          'w-full text-left p-2.5 border transition-all flex items-start gap-2.5',
                          isSelected
                            ? 'border-primary bg-primary/15'
                            : 'border-border/60 bg-secondary/30 hover:border-primary/60 hover:bg-secondary/60'
                        )}
                      >
                        <span className="flex size-7 shrink-0 items-center justify-center border border-border bg-background text-primary mt-0.5">
                          <User className="size-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="block text-xs font-medium text-foreground leading-snug">
                            {intv.title}
                          </span>
                          <span className="text-[10px] text-muted-foreground font-mono block mt-0.5">
                            {intv.role}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                  {availableInterviews.length === 0 && (
                    <div className="p-4 text-center text-xs font-mono text-muted-foreground border border-dashed border-border/70">
                      Нет активных протоколов допроса.
                    </div>
                  )}
                </div>
              )}

              {/* Если выбрана дедукция */}
              {materialTab === 'deduction' && (
                <div className="space-y-1.5">
                  {availableDeductions.map((ded) => {
                    const isCompleted = engineState.completedDeductions.includes(ded.id);
                    return (
                      <div
                        key={ded.id}
                        className={cn(
                          'w-full text-left p-2.5 border transition-all flex flex-col gap-1',
                          isCompleted
                            ? 'border-emerald-600/60 bg-emerald-950/20'
                            : 'border-border/60 bg-secondary/30'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-display text-xs uppercase tracking-wide text-foreground">
                            {ded.title}
                          </span>
                          <span
                            className={cn(
                              'text-[9px] font-mono px-1 border',
                              isCompleted
                                ? 'border-emerald-500 text-emerald-400'
                                : 'border-muted-foreground text-muted-foreground'
                            )}
                          >
                            {isCompleted ? 'РЕШЕНО' : 'АКТИВНО'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                          <span>
                            Связка: [{ded.clueIds[0].toUpperCase()}] + [{ded.clueIds[1].toUpperCase()}]
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {availableDeductions.length === 0 && (
                    <div className="p-4 text-center text-xs font-mono text-muted-foreground border border-dashed border-border/70">
                      Нет зарегистрированных дедукций.
                    </div>
                  )}
                </div>
              )}

              {/* Если выбраны документы / фото / аудио / все */}
              {materialTab !== 'call' &&
                materialTab !== 'timeline' &&
                materialTab !== 'map' &&
                materialTab !== 'interview' &&
                materialTab !== 'deduction' && (
                <div className="space-y-1.5">
                  {filteredDocs.map((doc) => {
                    const isSelected = selectedEvidence?.id === doc.id;
                    return (
                      <button
                        key={doc.id}
                        type="button"
                        onClick={() => {
                          setSelectedEvidence(doc);
                          markEvidenceViewed(doc.id);
                        }}
                        className={cn(
                          'w-full text-left p-2.5 border transition-all flex items-start gap-2.5',
                          isSelected
                            ? 'border-primary bg-primary/15'
                            : 'border-border/60 bg-secondary/30 hover:border-primary/60 hover:bg-secondary/60'
                        )}
                      >
                        <span className="flex size-7 shrink-0 items-center justify-center border border-border bg-background text-primary mt-0.5">
                          {doc.kind === 'photo' ? (
                            <ImageIcon className="size-3.5" />
                          ) : doc.kind === 'audio' ? (
                            <Mic className="size-3.5" />
                          ) : (
                            <FileText className="size-3.5" />
                          )}
                        </span>
                        <div className="min-w-0 flex-1">
                          <span className="block text-xs font-medium text-foreground leading-snug line-clamp-2">
                            {doc.title}
                          </span>
                          <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground font-mono">
                            <span>{doc.archiveId ?? `АРХ-${doc.id}`}</span>
                            <span>{doc.date}</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </Panel>
        </div>

        {/* ЦЕНТРАЛЬНАЯ ОБЛАСТЬ: РАБОЧИЙ СТОЛ РАССЛЕДОВАНИЯ (6 колонок из 12) */}
        <div className="lg:col-span-6 space-y-3">
          <Panel
            title="Рабочий стол расследования"
            back="Назад в архив"
            backTo="/"
            action={
              materialTab === 'interview' ? (
                <span className="font-mono text-[10px] text-primary uppercase">
                  ПРОТОКОЛ ДОПРОСА
                </span>
              ) : materialTab === 'deduction' ? (
                <span className="font-mono text-[10px] text-primary uppercase">
                  ДЕДУКТИВНЫЙ АНАЛИЗ
                </span>
              ) : materialTab === 'map' && !selectedEvidence ? (
                <span className="font-mono text-[10px] text-primary uppercase">
                  КАРТА МЕСТНОСТИ
                </span>
              ) : selectedEvidence ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalViewerOpen(true)}
                    className="flex items-center gap-1 border border-border/70 px-2 py-1 text-[11px] text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    title="Развернуть на весь экран"
                  >
                    <Maximize2 className="size-3" />
                    <span className="hidden sm:inline">Во весь экран</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedEvidence(null)}
                    className="border border-border/70 px-2 py-1 text-[11px] text-muted-foreground hover:border-destructive hover:text-destructive transition-colors"
                  >
                    Очистить стол
                  </button>
                </div>
              ) : (
                <span className="font-mono text-[10px] text-primary uppercase">
                  {`${item.number} // СВОДНЫЙ СТОЛ`}
                </span>
              )
            }
            className="min-h-[660px] flex flex-col"
          >
            {materialTab === 'deduction' ? (
              <div className="flex-1 py-1">
                <DeductionBoard
                  deductions={item.deductions ?? []}
                  availableEvidence={availableDocuments}
                  completedDeductionIds={engineState.completedDeductions}
                  onCompleteDeduction={completeDeduction}
                  onSelectEvidence={handleSelectEntityById}
                />
              </div>
            ) : materialTab === 'interview' ? (
              <div className="flex-1 py-1">
                {activeInterview ? (
                  <InterviewDialog
                    interview={activeInterview}
                    availableQuestions={activeInterview.questions.filter((q) => {
                      if (!q.unlockCondition) return true;
                      return isConditionMet(q.unlockCondition, engineState);
                    })}
                    askedQuestionIds={engineState.askedQuestions}
                    onAskQuestion={(intId, qId) => askQuestion(intId, qId)}
                    onPresentClue={(intId, qId, cId) => presentClue(intId, qId, cId)}
                    allUnlockedDocuments={availableDocuments}
                    onOpenEvidence={handleSelectEntityById}
                  />
                ) : (
                  <div className="p-8 text-center text-xs text-muted-foreground font-mono">
                    Нет доступных протоколов допроса.
                  </div>
                )}
              </div>
            ) : materialTab === 'map' && !selectedEvidence ? (
              <div className="flex-1 py-1">
                <CityMap
                  locations={allCaseLocations}
                  exploredLocationIds={engineState.exploredLocations}
                  onExploreLocation={exploreLocation}
                  onSelectEvidence={handleSelectEntityById}
                />
              </div>
            ) : selectedEvidence ? (
              /* Встроенный EvidenceViewer прямо на рабочем столе */
              <div className="flex-1 flex flex-col">
                <EvidenceViewer
                  item={selectedEvidence}
                  embedded={true}
                  onClose={() => setSelectedEvidence(null)}
                  onSelectEntity={handleSelectEntityById}
                  onExpandModal={() => setIsModalViewerOpen(true)}
                  allDocuments={availableDocuments}
                  allPeople={item.people}
                  allLocations={allCaseLocations}
                  allCalls={item.callLog?.rows}
                  allRelations={availableRelations}
                  discoveredHotspotIds={engineState.discoveredHotspots}
                  onDiscoverHotspot={discoverHotspot}
                />

                {/* Блок противоречий и оперативных замечаний */}
                {item.contradictions && item.contradictions.length > 0 && (
                  <div className="mt-4 border border-amber-900/50 bg-amber-950/20 p-3.5 space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="size-4 text-amber-500" />
                      <span className="font-display text-xs uppercase tracking-wider text-amber-500">
                        СЛЕДСТВЕННЫЕ ПРОТИВОРЕЧИЯ И АНОМАЛИИ В ДЕЛЕ
                      </span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-muted-foreground pl-6 list-disc">
                      {item.contradictions.map((c, idx) => (
                        <li key={idx}>
                          <strong>{c.title}:</strong> {c.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              /* Начальное состояние рабочего стола: Сводный лист дела */
              <div className="flex-1 flex flex-col justify-between space-y-5 p-2 sm:p-4">
                <div className="paper-card p-6 relative border-t-4 border-t-primary/70">
                  <div className="absolute right-4 top-4 border-2 border-stamp/70 px-3 py-1 font-display text-xs uppercase tracking-widest text-stamp rotate-[-5deg]">
                    ОВР // В ПРОИЗВОДСТВЕ
                  </div>

                  <span className="font-mono text-xs text-primary block">
                    АРХИВНЫЙ НОМЕР: {item.archiveCode || `${item.number} / 2009-С`}
                  </span>
                  <h2 className="mt-1 font-display text-2xl uppercase tracking-wider text-ink">
                    {item.title}
                  </h2>
                  <p className="mt-1 text-xs text-ink/70 font-mono">
                    {`Следователь: ${item.intro?.investigator || 'М. Орлов'} // Дата возбуждения: ${item.intro?.dateOpened || '11.05.2009'}`}
                  </p>

                  <div className="mt-4 border-t border-ink/20 pt-4 space-y-2 text-sm text-ink/90 leading-relaxed font-body">
                    <p>
                      <strong>ФАБУЛА ДЕЛА:</strong> {item.summary}
                    </p>
                    {item.intro?.lead && (
                      <p>{item.intro.lead}</p>
                    )}
                    {item.intro?.details && item.intro.details !== item.intro.lead && (
                      <p>{item.intro.details}</p>
                    )}
                  </div>

                  {item.intro?.startingClues && item.intro.startingClues.length > 0 && (
                    <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-ink/20 pt-4">
                      {item.intro.startingClues.map((clue) => (
                        <button
                          key={clue.evidenceId}
                          type="button"
                          onClick={() => handleSelectEntityById(clue.evidenceId)}
                          className="flex items-center justify-between border border-ink/30 bg-ink/5 p-3 text-left hover:bg-ink/10 transition-colors"
                        >
                          <div>
                            <span className="block font-display text-xs uppercase text-ink">
                              {clue.title}
                            </span>
                            <span className="text-[11px] text-ink/70">{clue.subtitle}</span>
                          </div>
                          <ArrowRight className="size-4 text-ink/70" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border border-border/70 bg-secondary/30 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-display text-xs uppercase tracking-wider text-foreground">
                      КЛЮЧЕВЫЕ ФИГУРАНТЫ ДЕЛА
                    </span>
                    <span className="label-xs text-muted-foreground font-mono">
                      {item.people?.length ?? 0} ЧЕЛ.
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {item.people?.map((person) => {
                      const conf = personStatusConfig[person.status];
                      return (
                        <button
                          key={person.id}
                          type="button"
                          onClick={() => handleSelectEntityById(person.id)}
                          className="flex items-center justify-between p-2 border border-border/60 bg-card hover:border-primary transition-colors text-left"
                        >
                          <div>
                            <span className="block text-xs font-medium text-foreground">
                              {person.name}
                            </span>
                            <span className="text-[10px] text-muted-foreground">{person.role}</span>
                          </div>
                          <span className={cn('border px-1.5 py-0.2 text-[9px] uppercase', conf.badgeClass)}>
                            {conf.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="p-3 border border-dashed border-border/80 text-center text-xs text-muted-foreground">
                  ← Выберите документ, аудиозапись или звонок слева для детального изучения на рабочем столе.
                </div>
              </div>
            )}
          </Panel>
        </div>

        {/* ПРАВАЯ КОЛОНКА: ЗАМЕТКИ ОРЛОВА И АНАЛИТИКА (3 колонки из 12) */}
        <div className="lg:col-span-3 space-y-3">
          <Panel
            title="Заметки и анализ"
            back="Назад в архив"
            backTo="/"
            action={
              <span className="font-mono text-[10px] text-muted-foreground uppercase">
                {rightTab === 'orlov_notes' ? 'ОРЛОВ' : rightTab === 'player_notes' ? 'ДНЕВНИК' : 'ФИГУРАНТЫ'}
              </span>
            }
          >
            {/* Переключатель вкладок правой колонки */}
            <div className="grid grid-cols-3 border-b border-border/60 pb-2 mb-3">
              <button
                type="button"
                onClick={() => setRightTab('orlov_notes')}
                className={cn(
                  'py-1 text-[11px] uppercase tracking-wider text-center transition-colors border-b-2 font-mono',
                  rightTab === 'orlov_notes'
                    ? 'border-primary text-primary font-medium'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                Орлов
              </button>
              <button
                type="button"
                onClick={() => setRightTab('player_notes')}
                className={cn(
                  'py-1 text-[11px] uppercase tracking-wider text-center transition-colors border-b-2 font-mono',
                  rightTab === 'player_notes'
                    ? 'border-primary text-primary font-medium'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                Дневник
              </button>
              <button
                type="button"
                onClick={() => setRightTab('people')}
                className={cn(
                  'py-1 text-[11px] uppercase tracking-wider text-center transition-colors border-b-2 font-mono',
                  rightTab === 'people'
                    ? 'border-primary text-primary font-medium'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                Люди
              </button>
            </div>

            {/* Содержимое вкладок */}
            <div className="min-h-[580px]">
              {rightTab === 'orlov_notes' && (
                <NotesBoard notes={availableNotes} />
              )}

              {rightTab === 'player_notes' && (
                <PlayerNotes caseId={item.id} />
              )}

              {rightTab === 'people' && (
                <div className="space-y-2.5">
                  <p className="text-[11px] text-muted-foreground">
                    Фигуранты и свидетели, проходящие по материалам дела:
                  </p>
                  {item.people?.map((p) => {
                    const conf = personStatusConfig[p.status];
                    return (
                      <div
                        key={p.id}
                        className="border border-border/70 bg-secondary/30 p-3 space-y-2 hover:border-primary/60 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <div>
                            <button
                              type="button"
                              onClick={() => handleSelectEntityById(p.id)}
                              className="font-display text-sm uppercase text-foreground hover:text-primary transition-colors text-left"
                            >
                              {p.name}
                            </button>
                            <span className="block text-[11px] text-primary/90 font-mono">
                              {p.role}
                            </span>
                          </div>
                          <span className={cn('border px-1.5 py-0.2 text-[9px] uppercase', conf.badgeClass)}>
                            {conf.label}
                          </span>
                        </div>
                        {p.phone && (
                          <div className="font-mono text-[11px] text-muted-foreground flex items-center gap-1">
                            <Phone className="size-3 text-primary" /> {p.phone}
                          </div>
                        )}
                        <p className="text-[11px] text-muted-foreground line-clamp-3 leading-relaxed">
                          {p.description}
                        </p>
                        {p.relatedEvidenceIds && p.relatedEvidenceIds.length > 0 && (
                          <div className="border-t border-border/40 pt-1.5 flex flex-wrap items-center gap-1">
                            <span className="text-[9px] text-muted-foreground">Улики:</span>
                            {p.relatedEvidenceIds.map((evId) => (
                              <button
                                key={evId}
                                type="button"
                                onClick={() => handleSelectEntityById(evId)}
                                className="border border-border/60 bg-secondary px-1.5 py-0.2 text-[9px] font-mono text-primary hover:border-primary transition-colors"
                              >
                                {evId.toUpperCase()}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </Panel>
        </div>
      </div>

      {/* 3. НИЖНЯЯ ЧАСТЬ: ДЕТАЛИЗАЦИЯ ЗВОНКОВ НА ВСЮ ШИРИНУ */}
      {item.callLog ? (
        <Panel
          title="Детализация телефонных звонков"
          back="Назад в архив"
          backTo="/"
          action={
            <span className="border border-border/70 bg-secondary/50 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-primary">
              {`БИЛЛИНГ ОВР // ${item.callLog.rows.length} ЗАПИСЕЙ`}
            </span>
          }
        >
          <CallLog
            log={item.callLog}
            onSelectCall={(call) => {
              setSelectedEvidence({
                id: call.id ?? `call-${call.time}`,
                archiveId: 'ТЕЛ-БИЛЛИНГ',
                title: `Звонок: ${call.number}`,
                kind: 'call',
                date: `${call.date}, ${call.time}`,
                number: call.number,
                duration: call.duration,
                caller: call.caller,
                participants: call.participants,
                summary: call.summary,
                transcript: call.transcript,
                relatedIds: call.relatedIds,
              });
              // Scroll workbench into view if needed
              window.scrollTo({ top: 180, behavior: 'smooth' });
            }}
          />
          <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-muted-foreground border-t border-border/60 pt-2">
            <span>
              Нажмите на любую запись звонка в таблице, чтобы открыть её досье и проанализировать взаимосвязи на рабочем столе.
            </span>
            {item.callLog.highlightedNumber ? (
              <span className="font-mono text-stamp font-medium">
                {item.callLog.pin ? `${item.callLog.pin} ` : ''}{item.callLog.highlightedNumber}
              </span>
            ) : item.callLog.pin ? (
              <span className="font-mono text-stamp font-medium">
                {item.callLog.pin}
              </span>
            ) : null}
          </div>
        </Panel>
      ) : null}

      {/* Полноэкранный модал EvidenceViewer (при нажатии "Во весь экран") */}
      {isModalViewerOpen && (
        <EvidenceViewer
          item={selectedEvidence}
          embedded={false}
          onClose={() => setIsModalViewerOpen(false)}
          onSelectEntity={handleSelectEntityById}
          allDocuments={availableDocuments}
          allPeople={item.people}
          allLocations={allCaseLocations}
          allCalls={item.callLog?.rows}
          allRelations={availableRelations}
          discoveredHotspotIds={engineState.discoveredHotspots}
          onDiscoverHotspot={discoverHotspot}
        />
      )}

      {/* Модал следственного терминала (ARG Terminal) */}
      {isTerminalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col border border-border/80 bg-card shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-border/70 bg-secondary/70 px-4 py-3 sm:px-6">
              <div className="flex items-center gap-2">
                <Terminal className="size-4 text-primary" />
                <span className="label-xs text-primary font-display uppercase tracking-wider">
                  СЛУЖЕБНЫЙ ТЕРМИНАЛ ОВР // {item.number.toUpperCase()} «{item.title.toUpperCase()}»
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsTerminalOpen(false)}
                className="border border-border/60 p-1.5 text-muted-foreground hover:border-destructive hover:text-destructive transition-colors"
                title="Закрыть терминал"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <InvestigativeTerminal
                caseId={item.id}
                terminalConfig={item.terminal}
                solvedQuestionIds={engineState.solvedQuestions}
                onSolveQuestion={solveQuestion}
                isArchiveUnlocked={isArchiveUnlocked}
                viewedEvidenceIds={engineState.viewedEvidence}
                onOpenEvidence={(evId) => {
                  setIsTerminalOpen(false);
                  handleSelectEntityById(evId);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ФИНАЛЬНЫЙ МОДАЛ ЗАВЕРШЕНИЯ ДЕЛА №001 (DEMO ENDING) */}
      {showFinaleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-6 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative flex max-h-[92vh] w-full max-w-2xl flex-col border-2 border-red-600/80 bg-card shadow-[0_0_60px_rgba(220,38,38,0.35)] overflow-hidden">
            <div className="flex items-center justify-between border-b border-red-600/60 bg-red-950/40 px-5 py-3.5">
              <div className="flex items-center gap-2.5">
                <ShieldAlert className="size-5 text-red-500 animate-pulse" />
                <span className="font-display text-xs sm:text-sm uppercase tracking-wider text-red-400 font-bold">
                  СИСТЕМА ОВР // ОСОБЫЙ СТАТУС РАССЛЕДОВАНИЯ
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="border border-red-500/50 bg-red-950/60 px-2 py-0.5 text-[10px] font-mono text-red-400 uppercase">
                  ДЕЛО №001
                </span>
                <button
                  type="button"
                  onClick={() => setShowFinaleModal(false)}
                  className="text-red-400 hover:text-white border border-red-500/40 bg-red-950/40 px-2 py-0.5 text-xs font-mono"
                  title="Закрыть модальное окно"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-foreground font-mono">
              <div className="border-l-2 border-red-500 pl-4 space-y-3 bg-red-950/20 py-2 pr-3">
                <div className="text-[11px] text-red-400 uppercase tracking-widest font-bold">
                  СИСТЕМНОЕ ЗАКЛЮЧЕНИЕ СЛЕДСТВИЯ:
                </div>
                <p className="font-mono text-sm sm:text-base leading-relaxed text-foreground font-medium">
                  «РАССЛЕДОВАНИЕ ПРИОСТАНОВЛЕНО. Лицо, совершившее преступление по делу № 99-34, не установлено. Автоматизированный анализ выявил высокую вероятность связи с закрытыми делами № 96-1042 и № 94-0815.»
                </p>
              </div>

              <div className="border border-border/80 bg-secondary/50 p-4 space-y-3 text-xs">
                <span className="text-[10px] uppercase tracking-wider text-primary block font-bold font-display">
                  ВЫЯВЛЕННЫЕ СЕРИЙНЫЕ СИГНАТУРЫ:
                </span>
                <ul className="space-y-2 text-muted-foreground list-disc pl-4">
                  <li><strong className="text-foreground">Остановка часового механизма</strong> — наручные часы остановлены ровно на 03:00 с вытянутой головкой.</li>
                  <li><strong className="text-foreground">Ритуальное сокрытие зеркала</strong> — зеркало в номере плотно завешено черной тканью.</li>
                  <li><strong className="text-foreground">Изъятие личного трофея</strong> — с руки жертвы снято серебряное кольцо.</li>
                  <li><strong className="text-foreground">Слепое окно портье</strong> — доказан сон портье и неконтролируемый доступ в здание с 00:30 до 02:00.</li>
                </ul>
              </div>

              <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setShowFinaleModal(false)}
                  className="w-full sm:w-auto border border-border/70 bg-secondary px-4 py-2.5 text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors font-mono"
                >
                  Изучить материалы дела
                </button>
                <button
                  type="button"
                  onClick={handleCompleteAndReturnToArchive}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 border-2 border-red-600 bg-red-600 px-6 py-3 font-display text-xs uppercase tracking-[0.14em] text-white hover:bg-red-700 transition-all shadow-lg hover:shadow-red-600/40 font-bold"
                >
                  <span>ЗАКРЫТЬ ТЕРМИНАЛ / ВЕРНУТЬСЯ В АРХИВ</span>
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
