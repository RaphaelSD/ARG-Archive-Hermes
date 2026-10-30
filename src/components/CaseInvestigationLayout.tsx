'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import {
  FileText,
  Image as ImageIcon,
  Phone,
  User,
  MapPin,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  Search,
  Settings,
  Crosshair,
  ArrowRight,
  Lightbulb,
  Edit3,
  BookText,
  Columns,
  Maximize2,
  X,
  CheckCircle2,
  Shield,
  BookOpen,
  Lock,
  Unlock,
  Terminal,
  RotateCcw,
  AlertCircle,
  Eye,
  KeyRound,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Home,
  Sparkles,
} from 'lucide-react';


// Import raw archival data
import rawCaseMeta from '../../content/cases/case-001/case.json';
import rawCaseDocs from '../../content/cases/case-001/documents.json';
import rawCaseCalls from '../../content/cases/case-001/calls.json';
import rawCasePeople from '../../content/cases/case-001/people.json';
import rawCaseTimeline from '../../content/cases/case-001/timeline.json';

export type HotspotItem = {
  id: string;
  name: string;
  x: number; // percentage
  y: number; // percentage
  iconType?: 'dot' | 'user';
  description: string;
  resultEvidenceId?: string;
  targetPhotoId?: string;
};

export type CaseMaterial = {
  id: string;
  type?: 'photo' | 'document' | 'map' | 'call';
  kind?: 'photo' | 'document' | 'map' | 'call';
  title: string;
  subTitle?: string;
  description?: string;
  content?: string;
  mediaUrl?: string;
  image_asset?: string;
  source?: string;
  date?: string;
  author?: string;
  note?: string;
  subNote?: string;
  search_tags?: string[];
  hotspots?: HotspotItem[];
  unlockedByDefault?: boolean;
  access_level?: 'unlocked' | 'locked' | 'hidden';
  duration?: string;
  caller?: string;
  recipient?: string;
  summary?: string;
  transcript?: string;
};

export type CaseCharacter = {
  id: string;
  name: string;
  role: string;
  status: string;
  age?: string;
  profession?: string;
  address?: string;
  avatarUrl?: string;
  image_asset?: string;
  description?: string;
  linkedEvidence?: string[];
};

// Fallback hotspots for P01 room overview
const P01_HOTSPOTS: HotspotItem[] = [
  {
    id: 'bed',
    name: 'Кровать',
    x: 28.5,
    y: 62.5,
    iconType: 'dot',
    description: 'Тело Клары Вэнс обнаружено поверх покрывала. Видимых следов ожесточенной борьбы нет. Предположительная причина — асфиксия.',
  },
  {
    id: 'nightstand',
    name: 'Тумбочка',
    x: 34.5,
    y: 53.5,
    iconType: 'dot',
    description: 'На прикроватной тумбочке у лампы обнаружены женские наручные часы Клары. Механизм остановлен на 03:00.',
    resultEvidenceId: 'P03',
  },
  {
    id: 'window',
    name: 'Окно',
    x: 48.0,
    y: 46.0,
    iconType: 'dot',
    description: 'Окно номера 12 закрыто на внутренний шпингалет. Следов проникновения снаружи не обнаружено.',
  },
  {
    id: 'mirror',
    name: 'Зеркало',
    x: 68.0,
    y: 50.5,
    iconType: 'user',
    description: 'Большое зеркало на туалетном столике плотно завешено плотной темной тканью. Странная деталь — для сушки ткани это не подходит.',
    resultEvidenceId: 'P02',
  },
  {
    id: 'door',
    name: 'Дверь',
    x: 70.0,
    y: 68.5,
    iconType: 'dot',
    description: 'Входная дверь была заперта снаружи на ключ. Сам ключ в номере не обнаружен. Чемодан жертвы стоит нераспакованным.',
  },
];

const TOTAL_INVESTIGATION_TIME = 20 * 60; // 20 минут в секундах (1200 сек)

const FINALE_TEXT_PARAGRAPHS = [
  'РАССЛЕДОВАНИЕ ПРИОСТАНОВЛЕНО...',
  'Указанные материалы изъяты Отделом внутренних расследований.',
  'Доступ к делу закрыт по приказу руководства.',
  'Благодарим за участие в тестировании архива.',
];

const FINALE_FULL_TEXT = FINALE_TEXT_PARAGRAPHS.join('\n\n');

const playKeyClickSound = () => {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320 + Math.random() * 80, ctx.currentTime);
    gain.gain.setValueAtTime(0.015, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.04);
  } catch {}
};

const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
};

export default function CaseInvestigationLayout({
  caseFile,
  playerEmail = '',
}: {
  caseFile?: any;
  playerEmail?: string;
} = {}) {
  // ==========================================================
  // 1. СНАЧАЛА ВСЕ ХУКИ (useState, useEffect, useMemo, useRef)
  // ==========================================================
  const caseId = caseFile?.id || rawCaseMeta?.id || 'case-001';

  // Состояние разблокированных материалов: на старте открыт только 1 стартовый материал (D01)
  const [unlockedDocIds, setUnlockedDocIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`arg_unlocked_docs_${caseId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch {}
    }
    return ['D01']; // Стартовый материал: Рапорт патрульного
  });

  const [selectedItemId, setSelectedItemId] = useState<string>('D01');
  const [activeTab, setActiveTab] = useState<'people' | 'orlov' | 'diary'>('people');
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>('char_clara');

  // Дедукция: игрок сам выбирает три материала, образующих повторяющийся «почерк» преступника
  const [deductionPicks, setDeductionPicks] = useState<string[]>(['', '', '']);
  const [deductionConfirmed, setDeductionConfirmed] = useState(false);
  const [deductionMisses, setDeductionMisses] = useState(0);
  const [deductionMessage, setDeductionMessage] = useState<string | null>(null);

  // Раскрытие категорий в левом меню
  const [isDocsOpen, setIsDocsOpen] = useState(true);
  const [isPhotosOpen, setIsPhotosOpen] = useState(true);
  const [isCallsOpen, setIsCallsOpen] = useState(false);
  const [isMapsOpen, setIsMapsOpen] = useState(false);
  const [isNewBannerVisible, setIsNewBannerVisible] = useState(true);

  // Поиск и ввод ключей разблокировки
  const [searchQuery, setSearchQuery] = useState('');
  const [keyInput, setKeyInput] = useState('');
  const [unlockFeedback, setUnlockFeedback] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  // Заметки с автосохранением в localStorage
  const [notesText, setNotesText] = useState(
    'Здесь можно делать заметки, фиксировать версии и вопросы...'
  );

  // Модальные окна
  const [activeHotspotModal, setActiveHotspotModal] = useState<HotspotItem | null>(null);
  const [isInspectModalOpen, setIsInspectModalOpen] = useState(false);
  const [isHintModalOpen, setIsHintModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const unlockInputRef = useRef<HTMLInputElement>(null);

  // ----------------------------------------------------------
  // СОСТОЯНИЯ ТАЙМЕРА И ФИНАЛЬНОЙ КАТ-СЦЕНЫ
  // ----------------------------------------------------------

  // Таймер обратного отсчета расследования (20:00)
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedEnd = localStorage.getItem(`arg_timer_end_${caseId}`);
        if (storedEnd) {
          const diff = Math.max(0, Math.floor((parseInt(storedEnd, 10) - Date.now()) / 1000));
          return diff;
        } else {
          const endTime = Date.now() + TOTAL_INVESTIGATION_TIME * 1000;
          localStorage.setItem(`arg_timer_end_${caseId}`, endTime.toString());
          return TOTAL_INVESTIGATION_TIME;
        }
      } catch {}
    }
    return TOTAL_INVESTIGATION_TIME;
  });

  const [isTimerExpired, setIsTimerExpired] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedEnd = localStorage.getItem(`arg_timer_end_${caseId}`);
        if (storedEnd && parseInt(storedEnd, 10) <= Date.now()) {
          return true;
        }
      } catch {}
    }
    return false;
  });

  // Завершенные дедукции дела
  const [completedDeductions, setCompletedDeductions] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(`arg_completed_deductions_${caseId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {}
    }
    return [];
  });

  // Финальная кат-сцена (TEXT-05)
  const [isFinaleActive, setIsFinaleActive] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        return localStorage.getItem(`arg_finale_active_${caseId}`) === 'true';
      } catch {}
    }
    return false;
  });

  const [finaleCharIndex, setFinaleCharIndex] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      try {
        if (localStorage.getItem(`arg_finale_active_${caseId}`) === 'true') {
          return FINALE_FULL_TEXT.length;
        }
      } catch {}
    }
    return 0;
  });

  const [isFinaleTypingDone, setIsFinaleTypingDone] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        if (localStorage.getItem(`arg_finale_active_${caseId}`) === 'true') {
          return true;
        }
      } catch {}
    }
    return false;
  });

  // Таймер обратного отсчета расследования (20:00) с автосохранением в localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let storedEnd = localStorage.getItem(`arg_timer_end_${caseId}`);
    if (!storedEnd) {
      const end = Date.now() + TOTAL_INVESTIGATION_TIME * 1000;
      localStorage.setItem(`arg_timer_end_${caseId}`, end.toString());
      storedEnd = end.toString();
    }

    const endTimestamp = parseInt(storedEnd, 10);

    const checkTime = () => {
      const remaining = Math.max(0, Math.floor((endTimestamp - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) {
        setIsTimerExpired(true);
      }
    };

    checkTime();
    const interval = setInterval(checkTime, 1000);
    return () => clearInterval(interval);
  }, [caseId]);

  // Сохранение разблокированных документов в localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`arg_unlocked_docs_${caseId}`, JSON.stringify(unlockedDocIds));
    } catch {}
  }, [unlockedDocIds, caseId]);

  // Сохранение выполненных дедукций в localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`arg_completed_deductions_${caseId}`, JSON.stringify(completedDeductions));
    } catch {}
  }, [completedDeductions, caseId]);

  // Эффект печатной машинки для финальной кат-сцены TEXT-05
  useEffect(() => {
    if (!isFinaleActive) return;

    if (finaleCharIndex < FINALE_FULL_TEXT.length) {
      const char = FINALE_FULL_TEXT[finaleCharIndex];
      const delay = char === '\n' ? 260 : char === '.' ? 180 : 32;
      const timer = setTimeout(() => {
        setFinaleCharIndex((prev) => prev + 1);
        playKeyClickSound();
      }, delay);
      return () => clearTimeout(timer);
    } else {
      setIsFinaleTypingDone(true);
    }
  }, [isFinaleActive, finaleCharIndex]);

  // Загрузка заметок из localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`arg_case_notes_${caseId}`);
      if (saved) setNotesText(saved);
    } catch {}
  }, [caseId]);

  // ==========================================================
  // 2. ДИНАМИЧЕСКИЕ ДАННЫЕ И ВЫЧИСЛЕНИЯ
  // ==========================================================

  // Все документы дела (из props или rawCaseDocs)
  const allDocuments: CaseMaterial[] = useMemo(() => {
    const raw = (caseFile?.documents && caseFile.documents.length > 0)
      ? caseFile.documents
      : rawCaseDocs;
    return raw.map((d: any) => ({
      ...d,
      type: (d.type || d.kind || 'document') as CaseMaterial['type'],
      kind: (d.kind || d.type || 'document') as CaseMaterial['kind'],
      hotspots: d.id === 'P01' ? (d.hotspots || P01_HOTSPOTS) : d.hotspots,
    }));
  }, [caseFile?.documents]);

  // Звонки (из calls.json или caseFile)
  const allCalls: CaseMaterial[] = useMemo(() => {
    const raw = caseFile?.callLog?.rows || rawCaseCalls || [];
    return raw.map((c: any) => ({
      id: c.id,
      type: 'call' as const,
      kind: 'call' as const,
      title: `Звонок: ${c.time || c.number}`,
      date: `13.10.1999, ${c.time || '22:00'}`,
      author: 'АТС Pinecrest',
      source: 'Выписка телефонных соединений',
      caller: c.caller || c.number,
      recipient: c.recipient,
      duration: c.duration,
      summary: c.summary,
      content: `ВЫПИСКА АТС // ЗВОНОК ${c.id}\nВремя: ${c.time}\nНомер: ${c.number}\nНаправление: ${c.direction || '—'}\nАбонент: ${c.caller || '—'} -> ${c.recipient || '—'}\nДлительность: ${c.duration || '—'}\nСтатус: ${c.status || '—'}\n\nСВОДКА:\n${c.summary || 'Нет комментариев'}`,
      search_tags: ['звонки', 'биллинг', 'атс', c.caller?.toLowerCase(), c.recipient?.toLowerCase()].filter(Boolean),
    }));
  }, [caseFile?.callLog?.rows]);

  // Персонажи дела (из people.json или caseFile.people)
  const allPeople: CaseCharacter[] = useMemo(() => {
    return caseFile?.people || rawCasePeople || [];
  }, [caseFile?.people]);

  // Хронология дела
  const timelineEntries = useMemo(() => {
    return caseFile?.timeline || rawCaseTimeline || [];
  }, [caseFile?.timeline]);

  // Проверка, разблокирован ли документ
  const isDocUnlocked = (id: string) => {
    return unlockedDocIds.includes(id);
  };

  // Разделение материалов по типам
  const docsList = useMemo(() => {
    return allDocuments.filter((d) => d.kind === 'document');
  }, [allDocuments]);

  const photosList = useMemo(() => {
    return allDocuments.filter((d) => d.kind === 'photo');
  }, [allDocuments]);

  const mapsList = useMemo(() => {
    return allDocuments.filter((d) => d.kind === 'map');
  }, [allDocuments]);

  // ДИНАМИЧЕСКИЙ ПРОГРЕСС РАССЛЕДОВАНИЯ:
  // [Количество открытых материалов] / [Общее количество материалов в деле]
  const totalMaterialsCount = allDocuments.length;
  const unlockedMaterialsCount = allDocuments.filter((d) => isDocUnlocked(d.id)).length;
  const progressPercent = totalMaterialsCount > 0
    ? Math.min(100, Math.round((unlockedMaterialsCount / totalMaterialsCount) * 100))
    : 0;

  // Новые разблокированные материалы (для подкатегории "НОВЫЕ МАТЕРИАЛЫ")
  const newMaterials = useMemo(() => {
    return allDocuments
      .filter((d) => isDocUnlocked(d.id) && (d.kind === 'photo' || d.id === 'D01' || d.id === 'D02'))
      .slice(0, 3);
  }, [allDocuments, unlockedDocIds]);

  // Текущий выбранный элемент в просмотрщике
  const currentItem: CaseMaterial = useMemo(() => {
    // 1. Ищем среди документов дела
    const doc = allDocuments.find((d) => d.id === selectedItemId);
    if (doc) return doc;

    // 2. Ищем среди звонков
    const call = allCalls.find((c) => c.id === selectedItemId);
    if (call) return call;

    // 3. Fallback: первый открытый документ
    const firstUnlocked = allDocuments.find((d) => isDocUnlocked(d.id)) || allDocuments[0];
    return firstUnlocked;
  }, [allDocuments, allCalls, selectedItemId, unlockedDocIds]);

  // Проверка открытости персонажа:
  // Клара Вэнс и горничная Джулия известны сразу из рапорта D01.
  // Остальные открываются, если разблокированы связанные с ними улики (или упомянуты в найденных тегах).
  const isCharacterUnlocked = (char: CaseCharacter) => {
    if (char.id === 'char_clara' || char.id === 'char_julia') return true;
    if (char.linkedEvidence && char.linkedEvidence.some((evId) => isDocUnlocked(evId))) {
      return true;
    }
    // Если открыт журнал портье (D04) или выписка звонков (D05), круг лиц расширяется
    if (unlockedDocIds.includes('D04') || unlockedDocIds.includes('D05')) {
      return true;
    }
    return false;
  };

  const activeCharacter = useMemo(() => {
    return allPeople.find((p) => p.id === selectedCharacterId) || allPeople[0];
  }, [allPeople, selectedCharacterId]);

  // ==========================================================
  // 3. ИГРОВЫЕ ДЕЙСТВИЯ (UNLOCK, HOTSPOTS, NOTES)
  // ==========================================================

  // Три константы дела (ритуал, трофей, счётчик). Игроку они не подписаны:
  // он сам выбирает материалы. Для каждой константы подходит один из перечисленных материалов.
  const DEDUCTION_CONSTANTS: string[][] = [
    ['P02'], // чёрная ткань на зеркале
    ['P03'], // часы со стрелками на 3
    ['P06', 'D03', 'clue_ring_confirmed_stolen'], // пропавшее кольцо
  ];

  // Выбирать можно только уже открытые фотографии и документы
  const deductionCandidates = allDocuments.filter(
    (d) => (d.kind === 'photo' || d.kind === 'document') && isDocUnlocked(d.id)
  );

  const isDeductionSetCorrect = (picks: string[]) => {
    if (picks.some((id) => !id) || new Set(picks).size !== picks.length) return false;
    return DEDUCTION_CONSTANTS.every((group) => picks.some((id) => group.includes(id)));
  };

  const handleCheckDeduction = () => {
    if (deductionPicks.some((id) => !id)) {
      setDeductionMessage('Выберите материал в каждой из трёх ячеек.');
      return;
    }
    if (isDeductionSetCorrect(deductionPicks)) {
      setDeductionConfirmed(true);
      setDeductionMessage(null);
      return;
    }
    const misses = deductionMisses + 1;
    setDeductionMisses(misses);
    setDeductionMessage(
      misses >= 3
        ? 'Недостаточно оснований. Подсказка: ищите то, что не принадлежит гостинице, то, что пропало, и то, что остановилось.'
        : 'Недостаточно оснований: эти материалы не образуют повторяющийся признак. Попробуйте другое сочетание.'
    );
  };

  const isAllThreeCluesFound = deductionConfirmed;
  const isFinalDeductionUnlocked = completedDeductions.includes('ded_unknown_visitor_confirmed');

  // Запуск финальной кат-сцены (ded_unknown_visitor_confirmed + старые архивные дела)
  const handleTriggerFinale = () => {
    const updatedDeductions = Array.from(
      new Set([...completedDeductions, 'ded_unknown_visitor_confirmed'])
    );
    setCompletedDeductions(updatedDeductions);

    const updatedDocs = Array.from(
      new Set([...unlockedDocIds, 'D10', 'archive_96_1042', 'archive_94_0815'])
    );
    setUnlockedDocIds(updatedDocs);

    setIsFinaleActive(true);
    setFinaleCharIndex(0);
    setIsFinaleTypingDone(false);

    try {
      localStorage.setItem(`arg_finale_active_${caseId}`, 'true');
      localStorage.setItem(`arg_completed_deductions_${caseId}`, JSON.stringify(updatedDeductions));
      localStorage.setItem(`arg_unlocked_docs_${caseId}`, JSON.stringify(updatedDocs));
      localStorage.setItem('arg_case_001_status', 'completed');
      localStorage.setItem('arg_case_status_001', 'completed');
    } catch {}
  };

  const handleRestartTimer = () => {
    try {
      const newEnd = Date.now() + TOTAL_INVESTIGATION_TIME * 1000;
      localStorage.setItem(`arg_timer_end_${caseId}`, newEnd.toString());
      setTimeLeft(TOTAL_INVESTIGATION_TIME);
      setIsTimerExpired(false);
    } catch {}
  };

  const handleReturnToMainMenu = () => {
    try {
      localStorage.setItem('arg_case_001_status', 'completed');
      localStorage.setItem('arg_case_status_001', 'completed');
    } catch {}
    window.location.href = '/';
  };

  const handleRestartEntireInvestigation = () => {
    try {
      localStorage.removeItem(`arg_unlocked_docs_${caseId}`);
      localStorage.removeItem(`arg_completed_deductions_${caseId}`);
      localStorage.removeItem(`arg_finale_active_${caseId}`);
      localStorage.removeItem(`arg_timer_end_${caseId}`);
      localStorage.removeItem(`arg_case_notes_${caseId}`);
    } catch {}
    window.location.reload();
  };

  const handleSkipTyping = () => {
    setFinaleCharIndex(FINALE_FULL_TEXT.length);
    setIsFinaleTypingDone(true);
  };

  // Ввод ключа / разблокировка
  const handleUnlockKey = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = keyInput.trim().toLowerCase();
    if (!query) return;

    // Проверка специальных триггеров финала расследования
    // Только для разработки: быстрый переход к финалу. На боевом сайте слова-триггеры не работают,
    // финал открывается через блок «Синтез улик».
    if (process.env.NODE_ENV === 'development' && query === 'ded_unknown_visitor_confirmed') {
      setUnlockFeedback({
        message: '⚡ [ФИНАЛЬНАЯ ДЕДУКЦИЯ]: Подтвержден неизвестный посетитель! Переход к закрытию дела...',
        type: 'success',
      });
      setTimeout(() => {
        handleTriggerFinale();
      }, 600);
      setKeyInput('');
      return;
    }

    // Ищем заблокированные материалы, совпадающие по search_tags, названию или id
    const newlyUnlocked = allDocuments.filter((doc) => {
      if (isDocUnlocked(doc.id)) return false;

      const matchesTag = doc.search_tags?.some((tag) => {
        const t = tag.toLowerCase();
        return t === query || query.includes(t) || t.includes(query);
      });
      const matchesTitle = doc.title.toLowerCase().includes(query);
      const matchesId =
        doc.id.toLowerCase() === query ||
        doc.id.toLowerCase().replace(/[^a-z0-9]/g, '') === query.replace(/[^a-z0-9]/g, '');

      return matchesTag || matchesTitle || matchesId;
    });

    if (newlyUnlocked.length > 0) {
      const newIds = newlyUnlocked.map((d) => d.id);
      const updated = Array.from(new Set([...unlockedDocIds, ...newIds]));
      setUnlockedDocIds(updated);

      // Автоматически открываем первый разблокированный документ
      setSelectedItemId(newlyUnlocked[0].id);

      setUnlockFeedback({
        message: `[ДОСТУП РАЗРЕШЕН]: Разблокировано материалов: ${newlyUnlocked.length} (${newlyUnlocked.map((d) => d.title).join(', ')})`,
        type: 'success',
      });
      setKeyInput('');
    } else {
      // Проверяем, возможно этот материал уже был открыт ранее
      const alreadyOpen = allDocuments.find((d) => {
        const matchesTag = d.search_tags?.some((t) => t.toLowerCase() === query);
        return (matchesTag || d.title.toLowerCase().includes(query)) && isDocUnlocked(d.id);
      });

      if (alreadyOpen) {
        setSelectedItemId(alreadyOpen.id);
        setUnlockFeedback({
          message: `[СВЕДЕНИЯ В АРХИВЕ]: Материал «${alreadyOpen.title}» уже разблокирован и открыт на столе.`,
          type: 'info',
        });
        setKeyInput('');
      } else {
        setUnlockFeedback({
          message: `[ОТКАЗ В ДОСТУПЕ]: Идентификатор «${keyInput}» не найден в заблокированных реестрах.`,
          type: 'error',
        });
      }
    }
  };

  // Клик по заблокированному материалу
  const handleLockedItemClick = (item: CaseMaterial) => {
    setUnlockFeedback({
      message: `🔒 ТРЕБУЕТСЯ КЛЮЧ ДОСТУПА для материала [${item.id}: ${item.title}]. Введите ключевой идентификатор в консоль ниже.`,
      type: 'error',
    });
    if (unlockInputRef.current) {
      unlockInputRef.current.focus();
    }
  };

  // Клик по интерактивной точке (hotspot) на фото
  const handleHotspotClick = (hotspot: HotspotItem) => {
    // Если точка открывает улику (например, Зеркало -> P02, Тумбочка -> P03)
    if (hotspot.resultEvidenceId) {
      const targetId = hotspot.resultEvidenceId;
      if (!isDocUnlocked(targetId)) {
        const updated = Array.from(new Set([...unlockedDocIds, targetId]));
        setUnlockedDocIds(updated);
        setUnlockFeedback({
          message: `[УЛИКА ОБНАРУЖЕНА]: При детальном осмотре обнаружен новый материал «${targetId}»!`,
          type: 'success',
        });
      }
      setSelectedItemId(targetId);
      return;
    }

    if (hotspot.targetPhotoId) {
      setSelectedItemId(hotspot.targetPhotoId);
      return;
    }

    // Иначе открываем модалку осмотра точки
    setActiveHotspotModal(hotspot);
  };

  // Сохранение заметок
  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNotesText(val);
    try {
      localStorage.setItem(`arg_case_notes_${caseId}`, val);
    } catch {}
  };

  // Сброс прогресса (для тестирования)
  const handleResetProgress = () => {
    if (confirm('Сбросить весь игровой прогресс к стартовому состоянию (1 материал)?')) {
      try {
        localStorage.removeItem(`arg_unlocked_docs_${caseId}`);
        localStorage.removeItem(`arg_completed_deductions_${caseId}`);
        localStorage.removeItem(`arg_finale_active_${caseId}`);
        localStorage.removeItem(`arg_timer_end_${caseId}`);
        localStorage.removeItem(`arg_case_notes_${caseId}`);
        setUnlockedDocIds(['D01']);
        setSelectedItemId('D01');
        setCompletedDeductions([]);
        setIsFinaleActive(false);
        setFinaleCharIndex(0);
        setIsFinaleTypingDone(false);
        setIsTimerExpired(false);
        setTimeLeft(TOTAL_INVESTIGATION_TIME);
        setUnlockFeedback(null);
      } catch {}
    }
  };

  // Доступные фотографии для пагинации
  const unlockedPhotos = photosList.filter((p) => isDocUnlocked(p.id));
  const currentPhotoIndex = unlockedPhotos.findIndex((p) => p.id === currentItem.id);

  return (
    <div className="min-h-screen bg-[#0e1015] text-[#e2e8f0] font-sans antialiased flex flex-col selection:bg-[#c5a059]/30 selection:text-white relative">
      {/* ======================================================== */}
      {/* 1. ВЕРХНИЙ БАР (HEADER)                                  */}
      {/* ======================================================== */}
      <header className="h-14 border-b border-[#1e232d] bg-[#0e1015] px-4 flex items-center justify-between shrink-0 sticky top-0 z-40">
        {/* Логотип с гербом слева */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group transition-opacity hover:opacity-90">
            {/* SVG Герб Отдела Внутренних Расследований */}
            <svg
              width="32"
              height="38"
              viewBox="0 0 34 40"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="shrink-0 transition-transform group-hover:scale-105"
            >
              <path
                d="M17 1.5 L31.5 5.5 V18 C31.5 28.5 22 36.5 17 38.5 C12 36.5 2.5 28.5 2.5 18 V5.5 L17 1.5 Z"
                stroke="#c5a059"
                strokeWidth="1.5"
                fill="none"
              />
              <path
                d="M17 4.5 L28.5 7.8 V17.5 C28.5 26 21 33.2 17 35 C13 33.2 5.5 26 5.5 17.5 V7.8 L17 4.5 Z"
                stroke="#c5a059"
                strokeWidth="0.8"
                strokeOpacity="0.6"
                fill="none"
              />
              <line x1="17" y1="8" x2="17" y2="30" stroke="#c5a059" strokeWidth="1.2" />
              <circle cx="17" cy="8" r="1.2" fill="#c5a059" />
              <line x1="13" y1="12" x2="21" y2="12" stroke="#c5a059" strokeWidth="1.2" />
              <path
                d="M11 15 C11 20, 14 24, 17 26 C20 24, 23 20, 23 15"
                stroke="#c5a059"
                strokeWidth="1"
                fill="none"
              />
              <path
                d="M8.5 13 C8.5 21, 13 27, 17 29 C21 27, 25.5 21, 25.5 13"
                stroke="#c5a059"
                strokeWidth="0.8"
                strokeOpacity="0.7"
                fill="none"
              />
            </svg>
            <div className="flex flex-col">
              <span className="text-[13px] font-semibold uppercase tracking-[0.08em] text-zinc-100 leading-tight">
                АРХИВ ГОРОДА Н.
              </span>
              <span className="text-[11px] text-zinc-400 font-normal leading-tight">
                Отдел внутренних расследований
              </span>
            </div>
          </Link>
        </div>

        {/* По центру: "Дело №001 / Комната 12" + Терминальный таймер расследования */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center text-xs tracking-wide">
            <span className="text-zinc-500 font-medium">{caseFile?.number || 'Дело №001'}</span>
            <span className="text-zinc-600 mx-2.5">/</span>
            <span className="text-zinc-200 font-medium">{caseFile?.title || 'Комната 12'}</span>
          </div>

          {/* Стилизованный под терминал таймер обратного отсчета на 20:00 */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xs font-mono text-xs border tracking-wider uppercase transition-all shadow-sm ${
              timeLeft <= 180
                ? 'bg-red-950/70 border-red-500/80 text-red-400 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.4)]'
                : 'bg-[#141820] border-[#c5a059]/40 text-[#c5a059]'
            }`}
            title="Оставшееся время следственной сессии: 20:00"
          >
            <Clock className={`size-3.5 ${timeLeft <= 180 ? 'text-red-400' : 'text-[#c5a059]'}`} />
            <span className="font-bold tabular-nums text-xs sm:text-sm tracking-widest">{formatTime(timeLeft)}</span>
            <span className="text-[9px] opacity-70 hidden sm:inline">СЕССИЯ ОВР</span>
          </div>
        </div>

        {/* Справа: статус доступа, поиск, кнопка сброса и настройки */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Индикатор статуса доступа */}
          {playerEmail && (
            <div className="hidden sm:flex items-center gap-1.5 border border-emerald-500/40 bg-emerald-950/30 px-2 py-1 rounded-xs text-[10px] font-mono text-emerald-400">
              <ShieldCheck className="size-3 text-emerald-400" />
              <span className="truncate max-w-[130px]" title={playerEmail}>
                {playerEmail}
              </span>
            </div>
          )}

          <form onSubmit={handleUnlockKey} className="relative w-36 sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500" />
            <input
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Поиск по архиву..."
              className="w-full bg-[#12151b] border border-[#1e232d] pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 rounded-sm focus:outline-none focus:border-[#c5a059]/60 transition-colors"
            />
          </form>

          <button
            type="button"
            onClick={handleResetProgress}
            title="Сбросить прогресс к началу (1/Всего)"
            className="text-zinc-400 hover:text-amber-400 transition-colors p-1.5 rounded-sm hover:bg-[#181c24] flex items-center gap-1"
          >
            <RotateCcw className="size-3.5" />
          </button>

          <button
            type="button"
            title="Настройки архива"
            className="text-zinc-400 hover:text-zinc-200 transition-colors p-1.5 rounded-sm hover:bg-[#181c24]"
          >
            <Settings className="size-4" />
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* ОСНОВНОЙ КОНТЕНТ: СЕТКА ИЗ 3 ПАНЕЛЕЙ (GRID LAYOUT)        */}
      {/* ======================================================== */}
      <main
        className={`flex-1 p-3 sm:p-4 grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_280px] xl:grid-cols-[275px_minmax(0,1fr)_295px] gap-3.5 max-w-[1720px] mx-auto w-full transition-all duration-300 ${
          isTimerExpired ? 'filter blur-[2px] pointer-events-none select-none opacity-40' : ''
        }`}
      >
        {/* ====================================================== */}
        {/* ЛЕВАЯ ПАНЕЛЬ: "МАТЕРИАЛЫ ДЕЛА"                         */}
        {/* ====================================================== */}
        <aside className="flex flex-col justify-between bg-[#101319] border border-[#1e232d] rounded-sm p-3.5 min-h-[720px]">
          <div className="space-y-3.5">
            {/* Заголовок панели */}
            <div className="flex items-center justify-between pb-1">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                МАТЕРИАЛЫ ДЕЛА
              </h2>
            </div>

            {/* Подкатегория "НОВЫЕ МАТЕРИАЛЫ (X)" */}
            {isNewBannerVisible && newMaterials.length > 0 && (
              <div className="space-y-1.5">
                <div className="bg-[#141820] border border-[#1e232d] px-2.5 py-1.5 rounded-sm flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-1.5 rounded-full bg-[#c5a059] shadow-[0_0_6px_#c5a059]" />
                    <span className="text-[11px] text-zinc-200 font-medium tracking-wide">
                      НОВЫЕ МАТЕРИАЛЫ ({newMaterials.length})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsNewBannerVisible(false)}
                    className="text-zinc-500 hover:text-zinc-300 text-xs transition-colors"
                    title="Скрыть оповещение"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-1 pl-1">
                  {newMaterials.map((mat) => {
                    const isSelected = selectedItemId === mat.id;
                    return (
                      <button
                        key={mat.id}
                        type="button"
                        onClick={() => setSelectedItemId(mat.id)}
                        className={`w-full flex items-center gap-2 p-1.5 rounded-sm transition-all text-left ${
                          isSelected
                            ? 'bg-[#161a22] border border-[#c5a059]/40 shadow-sm'
                            : 'bg-transparent border border-transparent hover:bg-[#141720] hover:border-[#1e232d]'
                        }`}
                      >
                        {mat.mediaUrl || mat.image_asset || mat.content?.startsWith?.('/images') ? (
                          <img
                            src={mat.mediaUrl || mat.image_asset || mat.content}
                            alt=""
                            className="w-10 h-7 object-cover rounded-xs border border-[#1e232d] shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-7 bg-[#0b0d11] border border-[#1e232d] rounded-xs flex items-center justify-center shrink-0">
                            <FileText className="size-3 text-zinc-400" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-medium text-zinc-200 truncate leading-snug">
                            {mat.id} {mat.title.replace(/^Фото:\s*|Макро-фото:\s*/i, '')}
                          </div>
                          <span className="inline-block mt-0.5 border border-[#c5a059]/70 text-[#c5a059] bg-[#c5a059]/10 text-[8px] px-1 py-0 uppercase font-mono font-semibold rounded-xs">
                            НОВОЕ
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Категории с иконками, счетчиками и стрелочками */}
            <div className="space-y-1 text-xs">
              {/* 1. ДОКУМЕНТЫ */}
              <div>
                <button
                  type="button"
                  onClick={() => setIsDocsOpen(!isDocsOpen)}
                  className="w-full flex items-center justify-between px-2.5 py-2 text-zinc-300 hover:text-white hover:bg-[#161a22] rounded-sm transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="size-4 text-zinc-400 group-hover:text-zinc-200" />
                    <span>Документы</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <span className="font-mono text-xs">{docsList.length}</span>
                    {isDocsOpen ? (
                      <ChevronUp className="size-3 text-zinc-400" />
                    ) : (
                      <ChevronDown className="size-3 text-zinc-600" />
                    )}
                  </div>
                </button>

                {isDocsOpen && (
                  <div className="mt-1 space-y-1 pl-1">
                    {docsList.map((doc) => {
                      const unlocked = isDocUnlocked(doc.id);
                      const isSelected = selectedItemId === doc.id;

                      return (
                        <button
                          key={doc.id}
                          type="button"
                          onClick={() => {
                            if (unlocked) {
                              setSelectedItemId(doc.id);
                            } else {
                              handleLockedItemClick(doc);
                            }
                          }}
                          className={`w-full flex items-center justify-between p-2 rounded-sm transition-all text-left ${
                            isSelected
                              ? 'bg-[#161a22] border border-[#c5a059]/40 text-white'
                              : unlocked
                              ? 'text-zinc-300 hover:bg-[#141720] hover:text-white border border-transparent'
                              : 'text-zinc-600 hover:text-zinc-400 hover:bg-[#12141a] border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {unlocked ? (
                              <FileText className="size-3.5 text-[#c5a059] shrink-0" />
                            ) : (
                              <Lock className="size-3.5 text-zinc-600 shrink-0" />
                            )}
                            <span className="text-[11px] truncate">
                              {unlocked ? `${doc.id} ${doc.title}` : `[${doc.id}] Заблокировано`}
                            </span>
                          </div>
                          {!unlocked && (
                            <span className="text-[9px] font-mono text-zinc-600 border border-zinc-800 px-1 py-0.2 rounded-xs uppercase">
                              КЛЮЧ
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. ФОТОГРАФИИ */}
              <div>
                <button
                  type="button"
                  onClick={() => setIsPhotosOpen(!isPhotosOpen)}
                  className="w-full flex items-center justify-between px-2.5 py-2 text-zinc-200 hover:bg-[#161a22] rounded-sm transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <ImageIcon className="size-4 text-zinc-400 group-hover:text-zinc-200" />
                    <span>Фотографии</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <span className="font-mono text-xs">{photosList.length}</span>
                    {isPhotosOpen ? (
                      <ChevronUp className="size-3 text-zinc-400" />
                    ) : (
                      <ChevronDown className="size-3 text-zinc-600" />
                    )}
                  </div>
                </button>

                {isPhotosOpen && (
                  <div className="mt-1 space-y-1 pl-1">
                    {photosList.map((photo) => {
                      const unlocked = isDocUnlocked(photo.id);
                      const isSelected = selectedItemId === photo.id;
                      const photoUrl = photo.mediaUrl || photo.image_asset || photo.content;

                      return (
                        <button
                          key={photo.id}
                          type="button"
                          onClick={() => {
                            if (unlocked) {
                              setSelectedItemId(photo.id);
                            } else {
                              handleLockedItemClick(photo);
                            }
                          }}
                          className={`w-full flex items-center gap-2.5 p-1.5 rounded-sm transition-all text-left ${
                            isSelected
                              ? 'bg-[#161a22] border border-[#c5a059]/40 shadow-sm'
                              : unlocked
                              ? 'bg-transparent border border-transparent hover:bg-[#141720] hover:border-[#1e232d]'
                              : 'opacity-55 hover:opacity-80 bg-transparent border border-transparent'
                          }`}
                        >
                          <div className="relative w-12 h-9 rounded-xs overflow-hidden border border-[#1e232d] shrink-0 bg-[#0b0d11]">
                            {photoUrl ? (
                              <img
                                src={photoUrl}
                                alt=""
                                className={`w-full h-full object-cover ${!unlocked ? 'blur-xs grayscale brightness-40' : ''}`}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="size-3 text-zinc-600" />
                              </div>
                            )}
                            {!unlocked && (
                              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                                <Lock className="size-3 text-zinc-400" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-[11px] font-medium text-zinc-200 truncate leading-snug">
                              {unlocked ? `${photo.id} ${photo.title.replace(/^Фото:\s*|Макро-фото:\s*/i, '')}` : `[${photo.id}] Заблокировано`}
                            </div>
                            {unlocked ? (
                              <span className="inline-block mt-0.5 border border-[#c5a059]/70 text-[#c5a059] bg-[#c5a059]/10 text-[8px] px-1 py-0 uppercase font-mono font-semibold rounded-xs">
                                ДОСТУПНО
                              </span>
                            ) : (
                              <span className="inline-block mt-0.5 text-zinc-600 text-[8px] font-mono">
                                ТРЕБУЕТСЯ КЛЮЧ
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 3. ЗВОНКИ */}
              <div>
                <button
                  type="button"
                  disabled={allCalls.length === 0}
                  onClick={() => setIsCallsOpen(!isCallsOpen)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-sm transition-colors group ${
                    allCalls.length === 0
                      ? 'text-zinc-600 cursor-not-allowed opacity-50'
                      : 'text-zinc-300 hover:text-white hover:bg-[#161a22]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Phone className="size-4 text-zinc-400 group-hover:text-zinc-200" />
                    <span>Звонки</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <span className="font-mono text-xs">{allCalls.length}</span>
                    {isCallsOpen ? (
                      <ChevronUp className="size-3 text-zinc-400" />
                    ) : (
                      <ChevronRight className="size-3 text-zinc-600 group-hover:text-zinc-400" />
                    )}
                  </div>
                </button>

                {isCallsOpen && allCalls.length > 0 && (
                  <div className="mt-1 space-y-1 pl-1">
                    {allCalls.map((call) => {
                      const isSelected = selectedItemId === call.id;
                      return (
                        <button
                          key={call.id}
                          type="button"
                          onClick={() => setSelectedItemId(call.id)}
                          className={`w-full flex items-center justify-between p-2 rounded-sm text-left transition-all ${
                            isSelected
                              ? 'bg-[#161a22] border border-[#c5a059]/40 text-white'
                              : 'text-zinc-300 hover:bg-[#141720] hover:text-white'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-[11px] font-medium truncate">{call.title}</div>
                            <div className="text-[10px] text-zinc-500 font-mono">{call.duration}</div>
                          </div>
                          <ChevronRight className="size-3 text-zinc-600 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 4. ЛЮДИ */}
              <button
                type="button"
                onClick={() => setActiveTab('people')}
                className="w-full flex items-center justify-between px-2.5 py-2 text-zinc-300 hover:text-white hover:bg-[#161a22] rounded-sm transition-colors group"
              >
                <div className="flex items-center gap-2.5">
                  <User className="size-4 text-zinc-400 group-hover:text-zinc-200" />
                  <span>Люди</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-500">
                  <span className="font-mono text-xs">{allPeople.length}</span>
                  <ChevronRight className="size-3 text-zinc-600 group-hover:text-zinc-400" />
                </div>
              </button>

              {/* 5. КАРТА */}
              <div>
                <button
                  type="button"
                  disabled={mapsList.length === 0}
                  onClick={() => setIsMapsOpen(!isMapsOpen)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-sm transition-colors group ${
                    mapsList.length === 0
                      ? 'text-zinc-600 cursor-not-allowed opacity-50'
                      : 'text-zinc-300 hover:text-white hover:bg-[#161a22]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <MapPin className="size-4 text-zinc-400 group-hover:text-zinc-200" />
                    <span>Карта</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <span className="font-mono text-xs">{mapsList.length}</span>
                    {isMapsOpen ? (
                      <ChevronUp className="size-3 text-zinc-400" />
                    ) : (
                      <ChevronRight className="size-3 text-zinc-600 group-hover:text-zinc-400" />
                    )}
                  </div>
                </button>

                {isMapsOpen && mapsList.length > 0 && (
                  <div className="mt-1 space-y-1 pl-1">
                    {mapsList.map((mapItem) => {
                      const isSelected = selectedItemId === mapItem.id;
                      return (
                        <button
                          key={mapItem.id}
                          type="button"
                          onClick={() => setSelectedItemId(mapItem.id)}
                          className={`w-full flex items-center justify-between p-2 rounded-sm text-left transition-all ${
                            isSelected
                              ? 'bg-[#161a22] border border-[#c5a059]/40 text-white'
                              : 'text-zinc-300 hover:bg-[#141720] hover:text-white'
                          }`}
                        >
                          <span className="text-[11px] truncate">{mapItem.title}</span>
                          <ChevronRight className="size-3 text-zinc-600 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Внизу виджет "ПРОГРЕСС ДЕЛА" — ДИНАМИЧЕСКИЙ РАСЧЕТ [Открыто] / [Всего] */}
          <div className="border-t border-[#1e232d] pt-3.5 mt-4">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mb-2.5">
              ПРОГРЕСС ДЕЛА
            </h3>
            <div className="flex items-center gap-3">
              {/* Круговой динамический SVG прогресс-бар */}
              <div className="relative size-[52px] shrink-0">
                <svg className="size-full -rotate-90" viewBox="0 0 36 36">
                  {/* Фоновое кольцо */}
                  <path
                    className="text-[#1c212b]"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Активная дуга: вычисляется динамически */}
                  <path
                    className="text-[#c5a059] transition-all duration-700 ease-out"
                    strokeDasharray={`${progressPercent}, 100`}
                    strokeLinecap="round"
                    strokeWidth="3"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                {/* Динамическое число [Открыто] / [Всего] */}
                <div className="absolute inset-0 flex items-center justify-center font-mono text-xs font-medium text-zinc-200">
                  {unlockedMaterialsCount}/{totalMaterialsCount}
                </div>
              </div>
              <p className="text-[11px] text-zinc-400 leading-snug">
                Изучите материалы, чтобы восстановить картину происшествия.
              </p>
            </div>
          </div>
        </aside>

        {/* ====================================================== */}
        {/* ЦЕНТРАЛЬНАЯ ПАНЕЛЬ: ПРОСМОТРЩИК И КОНСОЛЬ РАЗБЛОКИРОВКИ */}
        {/* ====================================================== */}
        <section className="flex flex-col gap-3 min-w-0">
          {/* Шапка дела */}
          <div className="bg-[#101319] border border-[#1e232d] rounded-sm p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-mono tracking-widest text-[#c5a059] uppercase font-semibold">
                {caseFile?.number || 'ДЕЛО №001'}
              </div>
              <h1 className="text-2xl font-bold uppercase tracking-wider text-white mt-0.5">
                {caseFile?.title || 'КОМНАТА 12'}
              </h1>
              <p className="text-xs text-zinc-400 mt-1 max-w-lg leading-relaxed">
                {caseFile?.summary ||
                  'Клара Вэнс обнаружена мёртвой в номере 12 гостиницы Pinecrest. Обстоятельства смерти устанавливаются.'}
              </p>
            </div>

            {/* Блок "ТЕКУЩАЯ ЗАДАЧА" */}
            <div className="md:max-w-xs flex flex-col items-start md:items-end text-left md:text-right shrink-0">
              <div className="flex items-center gap-1.5 text-[#c5a059] text-xs font-semibold uppercase tracking-wider">
                <Crosshair className="size-3.5" />
                <span>ТЕКУЩАЯ ЗАДАЧА</span>
              </div>
              <p className="text-[11px] text-zinc-300 mt-1 leading-snug">
                {isDocUnlocked('P01')
                  ? 'Изучите общий вид номера 12 и найдите, что может быть важным для дела.'
                  : 'Ознакомьтесь с первичным рапортом (D01) и введите ключевые теги для доступа к фотографиям.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  if (isDocUnlocked('P01')) {
                    setSelectedItemId('P01');
                  } else {
                    setSelectedItemId('D01');
                  }
                }}
                className="mt-2.5 bg-[#c5a059] hover:bg-[#d4af66] text-[#0e1015] font-semibold text-xs tracking-wider uppercase px-4 py-2 rounded-sm transition-colors flex items-center gap-1.5 shadow-sm active:scale-98"
              >
                <span>ПЕРЕЙТИ К МАТЕРИАЛАМ</span>
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </div>

          {/* ПАНЕЛЬ ДЕДУКЦИИ И СОПОСТАВЛЕНИЯ УЛИК ОВР (ТРИГГЕР ФИНАЛА) */}
          <div className="bg-[#12151c] border border-[#1e232d] rounded-sm p-3.5 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-[#c5a059]" />
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-zinc-200">
                  СИНТЕЗ УЛИК // ПОВТОРЯЮЩИЕСЯ ПРИЗНАКИ
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] font-mono">
              {[0, 1, 2].map((slot) => (
                <label
                  key={slot}
                  className={`p-2 rounded-xs border flex flex-col gap-1 transition-colors ${
                    deductionConfirmed
                      ? 'border-emerald-500/50 bg-emerald-950/20 text-emerald-300'
                      : 'border-[#1e232d] bg-[#0c0e12] text-zinc-500'
                  }`}
                >
                  <span className="text-[10px] uppercase tracking-wider">Признак {slot + 1}</span>
                  <select
                    value={deductionPicks[slot]}
                    disabled={deductionConfirmed || isFinaleActive}
                    onChange={(e) => {
                      const next = [...deductionPicks];
                      next[slot] = e.target.value;
                      setDeductionPicks(next);
                      setDeductionMessage(null);
                    }}
                    className="w-full bg-[#0b0d11] border border-[#1e232d] text-zinc-200 text-[11px] rounded-xs px-1.5 py-1 focus:outline-none focus:border-[#c5a059] disabled:opacity-70"
                  >
                    <option value="">— выберите материал —</option>
                    {deductionCandidates.map((d) => (
                      <option
                        key={d.id}
                        value={d.id}
                        disabled={deductionPicks.some((id, i) => i !== slot && id === d.id)}
                      >
                        {d.title}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            {/* Состояние готовности дедукции */}
            {isAllThreeCluesFound && !isFinaleActive ? (
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#1e232d] animate-in fade-in">
                <span className="text-[11px] font-mono text-[#c5a059] flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-[#c5a059]" />
                  <span>Связь подтверждена: эти три признака повторяются. Можно сверить их с архивом.</span>
                </span>
                <button
                  type="button"
                  onClick={handleTriggerFinale}
                  className="w-full sm:w-auto px-4 py-2 bg-[#c5a059] hover:bg-[#d4af66] text-[#0e1015] font-mono font-bold text-xs uppercase tracking-wider rounded-xs transition-all shadow-[0_0_15px_rgba(197,160,89,0.3)] active:scale-98 flex items-center justify-center gap-2 shrink-0"
                >
                  <Sparkles className="size-3.5" />
                  <span>СВЕРИТЬ С АРХИВОМ</span>
                </button>
              </div>
            ) : (
              <div className="text-[10px] font-mono text-zinc-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span>
                  {deductionMessage ??
                    'Выберите три материала дела, которые указывают на один и тот же почерк преступника.'}
                </span>
                <button
                  type="button"
                  onClick={handleCheckDeduction}
                  disabled={isFinaleActive}
                  className="px-3 py-1.5 border border-[#c5a059]/50 text-[#c5a059] hover:bg-[#c5a059]/10 uppercase tracking-wider rounded-xs transition-colors shrink-0 disabled:opacity-50"
                >
                  ПРОВЕРИТЬ СВЯЗЬ
                </button>
              </div>
            )}
          </div>

          {/* КОНСОЛЬ РАЗБЛОКИРОВКИ МАТЕРИАЛОВ (ВСТРОЕННАЯ МЕХАНИКА ВВОДА КЛЮЧЕЙ) */}
          <div className="bg-[#101319] border border-[#1e232d] rounded-sm p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#c5a059] uppercase tracking-wider">
              <span className="flex items-center gap-1.5 font-semibold">
                <Terminal className="size-3.5 text-[#c5a059]" />
                <span>КОНСОЛЬ РАЗБЛОКИРОВКИ МАТЕРИАЛОВ ОВР</span>
              </span>
              <span className="text-zinc-500 text-[10px]">
                ОТКРЫТО: {unlockedMaterialsCount} ИЗ {totalMaterialsCount}
              </span>
            </div>

            <form onSubmit={handleUnlockKey} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-zinc-500" />
                <input
                  ref={unlockInputRef}
                  type="text"
                  value={keyInput}
                  onChange={(e) => {
                    setKeyInput(e.target.value);
                    if (unlockFeedback) setUnlockFeedback(null);
                  }}
                  placeholder="ВВЕДИТЕ КЛЮЧ / ТЕГ (например: орлов, зеркало, часы, пайнкрест, 01:00...)"
                  className="w-full bg-[#0b0d11] border border-[#1e232d] pl-8 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 rounded-sm font-mono focus:outline-none focus:border-[#c5a059] uppercase tracking-wide transition-colors"
                />
              </div>
              <button
                type="submit"
                className="bg-[#c5a059] hover:bg-[#d4af66] text-[#0e1015] font-semibold text-xs tracking-wider uppercase px-4 py-1.5 rounded-sm transition-colors shrink-0 shadow-sm flex items-center justify-center gap-1.5 active:scale-98"
              >
                <span>ПРИМЕНИТЬ / РАЗБЛОКИРОВАТЬ</span>
                <ArrowRight className="size-3.5" />
              </button>
            </form>

            {/* Сообщение обратной связи */}
            {unlockFeedback && (
              <div
                className={`p-2.5 text-xs font-mono rounded-sm border flex items-center justify-between gap-2 animate-in fade-in ${
                  unlockFeedback.type === 'success'
                    ? 'border-emerald-500/70 bg-emerald-950/40 text-emerald-300'
                    : unlockFeedback.type === 'info'
                    ? 'border-blue-500/70 bg-blue-950/40 text-blue-300'
                    : 'border-red-500/70 bg-red-950/40 text-red-300'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {unlockFeedback.type === 'success' ? (
                    <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
                  ) : unlockFeedback.type === 'info' ? (
                    <AlertCircle className="size-4 text-blue-400 shrink-0" />
                  ) : (
                    <Lock className="size-4 text-red-400 shrink-0" />
                  )}
                  <span className="truncate">{unlockFeedback.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setUnlockFeedback(null)}
                  className="text-zinc-400 hover:text-white text-xs px-1"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* ЦЕНТРАЛЬНЫЙ ПРОСМОТРЩИК УЛИК */}
          <div className="bg-[#0b0d11] border border-[#1e232d] rounded-sm overflow-hidden flex flex-col">
            {/* Заголовок вьювера */}
            <div className="px-3.5 py-2 border-b border-[#1e232d] bg-[#12151c] flex items-center justify-between text-xs font-mono text-zinc-300">
              <div className="flex items-center gap-2">
                <span className="text-[#c5a059] font-bold">[{currentItem.id}]</span>
                <span>{currentItem.title}</span>
              </div>
              <span className="text-zinc-500 uppercase text-[10px]">
                {currentItem.kind === 'photo' ? 'ФОТОСНИМОК' : currentItem.kind === 'call' ? 'БИЛЛИНГ' : currentItem.kind === 'map' ? 'КАРТА' : 'ДОКУМЕНТ'}
              </span>
            </div>

            {/* Область отображения: ФОТОГРАФИЯ, ДОКУМЕНТ или ЗВОНОК */}
            {currentItem.kind === 'photo' ? (
              <div className="relative w-full aspect-[16/10] min-h-[380px] sm:min-h-[460px] bg-black select-none overflow-hidden">
                <img
                  src={currentItem.mediaUrl || currentItem.image_asset || currentItem.content || '/images/case-001/room_overview.jpg'}
                  alt={currentItem.title}
                  className="w-full h-full object-cover brightness-95"
                />

                {/* Интерактивные точки-метки (если есть у фото) */}
                {currentItem.hotspots?.map((hotspot) => {
                  return (
                    <button
                      key={hotspot.id}
                      type="button"
                      onClick={() => handleHotspotClick(hotspot)}
                      style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 group cursor-pointer flex items-center gap-1.5 z-20 focus:outline-none"
                      title={`Осмотреть: ${hotspot.name}`}
                    >
                      <span className="relative flex size-4 items-center justify-center rounded-full border border-white/60 bg-black/60 shadow-lg group-hover:scale-110 group-hover:border-[#c5a059] transition-transform">
                        <span className="size-1.5 rounded-full bg-white group-hover:bg-[#c5a059]" />
                      </span>
                      <span className="bg-black/85 border border-[#1e232d] group-hover:border-[#c5a059]/80 text-zinc-200 group-hover:text-white text-[11px] px-2 py-0.5 rounded-sm shadow-md backdrop-blur-xs flex items-center gap-1 transition-all">
                        {hotspot.iconType === 'user' && (
                          <User className="size-3 text-zinc-400 group-hover:text-[#c5a059]" />
                        )}
                        <span>{hotspot.name}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : currentItem.kind === 'document' ? (
              <div className="p-4 sm:p-6 bg-[#0e1015] min-h-[380px] sm:min-h-[460px] flex flex-col justify-between">
                {/* Скан документа (если есть) или архивный лист */}
                <div className="space-y-4">
                  {(currentItem.mediaUrl || currentItem.image_asset) && (
                    <div className="max-h-60 overflow-hidden border border-[#1e232d] rounded-sm bg-black/40 flex items-center justify-center">
                      <img
                        src={currentItem.mediaUrl || currentItem.image_asset}
                        alt=""
                        className="max-h-60 w-auto object-contain cursor-pointer hover:scale-102 transition-transform"
                        onClick={() => setIsInspectModalOpen(true)}
                        title="Нажмите для полного осмотра"
                      />
                    </div>
                  )}

                  {/* Текстовое содержимое документа */}
                  <div className="bg-[#12151c] border border-[#1e232d] p-4 rounded-sm font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-[320px] overflow-y-auto">
                    {currentItem.content || currentItem.description || 'Текст документа отсутствует в реестре.'}
                  </div>
                </div>
              </div>
            ) : currentItem.kind === 'call' ? (
              <div className="p-4 sm:p-6 bg-[#0e1015] min-h-[380px] sm:min-h-[460px] flex flex-col justify-between">
                <div className="bg-[#12151c] border border-[#1e232d] p-5 rounded-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-[#1e232d] pb-3">
                    <div className="flex items-center gap-2">
                      <Phone className="size-4 text-[#c5a059]" />
                      <span className="font-mono text-sm font-semibold text-white">
                        {currentItem.title}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400 border border-emerald-500/30 bg-emerald-950/20 px-2 py-0.5 rounded-xs">
                      ЗАПИСЬ КОММУТАТОРА
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div>
                      <span className="text-zinc-500 block">Абонент:</span>
                      <span className="text-zinc-200">{currentItem.caller || 'Не определен'}</span>
                    </div>
                    <div>
                      <span className="text-zinc-500 block">Длительность:</span>
                      <span className="text-zinc-200">{currentItem.duration || '—'}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#0b0d11] border border-[#1e232d] rounded-sm font-mono text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                    {currentItem.content}
                  </div>
                </div>
              </div>
            ) : (
              /* Карта местности */
              <div className="relative w-full aspect-[16/10] min-h-[380px] sm:min-h-[460px] bg-black select-none overflow-hidden">
                <img
                  src={currentItem.content || currentItem.mediaUrl || '/images/case-001/map_belmont_dark.jpg'}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Нижняя панель просмотрщика с кнопками Осмотреть / Сравнить */}
            <div className="border-t border-[#1e232d] bg-[#101319] px-3.5 py-2 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsInspectModalOpen(true)}
                  className="flex items-center gap-1.5 text-zinc-300 hover:text-white px-2.5 py-1 rounded-sm hover:bg-[#181c24] transition-colors"
                >
                  <Search className="size-3.5 text-zinc-400" />
                  <span>Осмотреть</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCompareModalOpen(true)}
                  className="flex items-center gap-1.5 text-zinc-400 hover:text-white px-2.5 py-1 rounded-sm hover:bg-[#181c24] transition-colors"
                >
                  <Columns className="size-3.5 text-zinc-500" />
                  <span>Сравнить</span>
                </button>
              </div>

              {/* Пагинация между открытыми фото */}
              {currentItem.kind === 'photo' && unlockedPhotos.length > 0 && (
                <div className="flex items-center gap-2 text-zinc-500 font-mono text-xs">
                  <button
                    type="button"
                    disabled={currentPhotoIndex <= 0}
                    onClick={() => {
                      if (currentPhotoIndex > 0) {
                        setSelectedItemId(unlockedPhotos[currentPhotoIndex - 1].id);
                      }
                    }}
                    className="hover:text-zinc-300 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="size-3.5" />
                  </button>
                  <span>
                    {Math.max(1, currentPhotoIndex + 1)}/{unlockedPhotos.length}
                  </span>
                  <button
                    type="button"
                    disabled={currentPhotoIndex >= unlockedPhotos.length - 1}
                    onClick={() => {
                      if (currentPhotoIndex < unlockedPhotos.length - 1) {
                        setSelectedItemId(unlockedPhotos[currentPhotoIndex + 1].id);
                      }
                    }}
                    className="hover:text-zinc-300 disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Нижний блок с инфо о текущем материале */}
          <div className="bg-[#101319] border border-[#1e232d] rounded-sm p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {currentItem.mediaUrl || currentItem.image_asset || currentItem.content?.startsWith?.('/images') ? (
                <img
                  src={currentItem.mediaUrl || currentItem.image_asset || currentItem.content}
                  alt=""
                  className="w-16 h-12 object-cover rounded-xs border border-[#1e232d] shrink-0"
                />
              ) : (
                <div className="w-16 h-12 bg-[#0b0d11] border border-[#1e232d] rounded-xs flex items-center justify-center shrink-0">
                  <FileText className="size-5 text-zinc-500" />
                </div>
              )}
              <div className="min-w-0">
                <div className="text-xs font-semibold text-zinc-200 truncate">
                  {currentItem.kind === 'photo' ? 'Фото' : 'Материал'}: {currentItem.title}
                </div>
                <div className="text-[11px] text-zinc-400 mt-0.5 truncate">
                  {currentItem.note || currentItem.description || 'Сделано при первичном осмотре места происшествия.'}
                </div>
                <div className="text-[11px] text-zinc-500 mt-0.5 truncate">
                  {currentItem.subNote || 'Материал зарегистрирован в деле Отдела внутренних расследований.'}
                </div>
              </div>
            </div>

            <div className="text-right sm:text-right shrink-0 font-mono text-[11px] text-zinc-400 space-y-0.5 border-t sm:border-t-0 border-[#1e232d] pt-2 sm:pt-0 w-full sm:w-auto">
              <div>Источник: {currentItem.source || 'Д01 (рапорт патрульного)'}</div>
              <div>Дата: {currentItem.date || '14.05.1998, 08:42'}</div>
              <div>Автор: {currentItem.author || 'Оперуполномоченный Л. Коваль'}</div>
            </div>
          </div>
        </section>

        {/* ====================================================== */}
        {/* ПРАВАЯ ПАНЕЛЬ: ПЕРСОНАЖИ, ДНЕВНИК И ЗАМЕТКИ            */}
        {/* ====================================================== */}
        <aside className="flex flex-col justify-between bg-[#101319] border border-[#1e232d] rounded-sm p-3.5 min-h-[720px]">
          <div className="space-y-3.5">
            {/* Карточка активного профиля вверху */}
            <div className="bg-[#141820] border border-[#1e232d] p-3 rounded-sm flex items-start gap-3">
              {isCharacterUnlocked(activeCharacter) ? (
                <img
                  key={activeCharacter?.id}
                  src={activeCharacter?.avatarUrl || activeCharacter?.image_asset || '/images/characters/clara_vance_01.jpg'}
                  alt={activeCharacter?.name}
                  className="w-[60px] h-[72px] object-cover rounded-xs border border-[#1e232d] grayscale contrast-125 shrink-0"
                />
              ) : (
                <div className="w-[60px] h-[72px] bg-[#0b0d11] border border-[#1e232d] rounded-xs flex items-center justify-center shrink-0">
                  <Lock className="size-5 text-zinc-600" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold uppercase tracking-wider text-white truncate">
                  {isCharacterUnlocked(activeCharacter) ? activeCharacter?.name : '[ФИГУРАНТ НЕ УСТАНОВЛЕН]'}
                </div>
                <div className="text-[10px] font-mono text-[#4ade80] tracking-wider mt-0.5">
                  СТАТУС: {isCharacterUnlocked(activeCharacter) ? activeCharacter?.role.toUpperCase() : 'ЗАСЕКРЕЧЕНО'}
                </div>
                <div className="text-[11px] text-zinc-400 mt-1">
                  Возраст: {isCharacterUnlocked(activeCharacter) ? (activeCharacter?.age || '—') : '—'}
                </div>
                <div className="text-[11px] text-zinc-400 truncate">
                  Профессия: {isCharacterUnlocked(activeCharacter) ? (activeCharacter?.profession || activeCharacter?.role) : '—'}
                </div>
                <div className="text-[11px] text-zinc-400 truncate">
                  Адрес: {isCharacterUnlocked(activeCharacter) ? (activeCharacter?.address || '—') : '—'}
                </div>
              </div>
            </div>

            {/* Краткое описание выбранного человека */}
            <p className="text-[11px] text-zinc-400 leading-relaxed px-1">
              {isCharacterUnlocked(activeCharacter)
                ? activeCharacter?.description || 'Описание пока не добавлено.'
                : 'Личность не установлена. Изучите материалы дела, чтобы узнать, кто это.'}
            </p>

            {/* Вкладки: "Люди", "Орлов", "Дневник" */}
            <div className="flex border-b border-[#1e232d] text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('people')}
                className={`flex items-center gap-1.5 pb-2 px-2 transition-colors ${
                  activeTab === 'people'
                    ? 'border-b-2 border-[#c5a059] text-[#c5a059] font-medium'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <User className="size-3.5" />
                <span>ЛЮДИ</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('orlov')}
                className={`flex items-center gap-1.5 pb-2 px-2 transition-colors ${
                  activeTab === 'orlov'
                    ? 'border-b-2 border-[#c5a059] text-[#c5a059] font-medium'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Shield className="size-3.5" />
                <span>ОРЛОВ</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('diary')}
                className={`flex items-center gap-1.5 pb-2 px-2 transition-colors ${
                  activeTab === 'diary'
                    ? 'border-b-2 border-[#c5a059] text-[#c5a059] font-medium'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <BookOpen className="size-3.5" />
                <span>ДНЕВНИК</span>
              </button>
            </div>

            {/* Список персонажей с аватарками и ролями */}
            {activeTab === 'people' && (
              <div className="space-y-1 max-h-[380px] overflow-y-auto pr-1">
                {allPeople.map((char) => {
                  const unlocked = isCharacterUnlocked(char);
                  const isSelected = selectedCharacterId === char.id;

                  return (
                    <button
                      key={char.id}
                      type="button"
                      onClick={() => {
                        setSelectedCharacterId(char.id);
                        if (!unlocked) {
                          setUnlockFeedback({
                            message: `Личность фигуранта не установлена. Изучите отчеты о звонках и регистрации в Pinecrest.`,
                            type: 'info',
                          });
                        }
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-sm text-left transition-all ${
                        isSelected
                          ? 'bg-[#161a22] border border-[#c5a059]/50 shadow-xs'
                          : unlocked
                          ? 'bg-transparent border border-transparent hover:bg-[#141720] hover:border-[#1e232d]'
                          : 'opacity-60 bg-transparent border border-transparent hover:bg-[#12141a]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {unlocked ? (
                          <img
                            src={char.avatarUrl || char.image_asset || '/images/characters/clara_vance_01.jpg'}
                            alt=""
                            className="size-8 object-cover rounded-xs border border-[#1e232d] shrink-0"
                          />
                        ) : (
                          <div className="size-8 bg-[#0b0d11] border border-[#1e232d] rounded-xs flex items-center justify-center shrink-0">
                            <Lock className="size-3.5 text-zinc-500" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="text-xs font-medium text-zinc-200 truncate">
                            {unlocked ? char.name : '[ЛИЧНОСТЬ НЕ ОПОЗНАНА]'}
                          </div>
                          <div className="text-[10px] text-zinc-500 mt-0.5">
                            {unlocked ? char.role : 'Засекречено 🔒'}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="size-3.5 text-zinc-600 shrink-0" />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Вкладка Орлова */}
            {activeTab === 'orlov' && (
              <div className="p-3 bg-[#141820] border border-[#1e232d] rounded-sm text-xs space-y-2 text-zinc-300">
                <div className="font-semibold text-white uppercase text-[11px] text-[#c5a059]">
                  ЛИЧНОЕ ДЕЛО: МАКСИМ ОРЛОВ
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Старший следователь Отдела внутренних расследований. 11 лет службы. Специализация: закрытые дела, аномалии и преступления с сокрытием улик.
                </p>
                <div className="font-mono text-[10px] text-zinc-500 border-t border-[#1e232d] pt-2">
                  Статус дела: В РАЗРАБОТКЕ
                </div>
              </div>
            )}

            {/* Вкладка Дневника */}
            {activeTab === 'diary' && (
              <div className="p-3 bg-[#141820] border border-[#1e232d] rounded-sm text-xs space-y-2 text-zinc-300 max-h-[380px] overflow-y-auto">
                <div className="font-semibold text-white uppercase text-[11px] text-[#c5a059]">
                  ХРОНИКА СОБЫТИЙ ДЕЛА
                </div>
                <div className="space-y-2 text-[11px] font-mono text-zinc-400">
                  {timelineEntries.length > 0 ? (
                    timelineEntries.map((t: any, idx: number) => (
                      <div key={idx} className="border-b border-[#1e232d]/60 pb-1.5">
                        <div className="text-[#c5a059] text-[10px]">{t.time || t.date}</div>
                        <div className="text-zinc-300 mt-0.5">{t.event || t.text}</div>
                      </div>
                    ))
                  ) : (
                    <>
                      <div>• 21:40 — Звонок Клары подруге Мэгги</div>
                      <div>• 22:15 — Возвращение в гостиницу Pinecrest</div>
                      <div>• 01:00 — Расчетное время смерти (акт вскрытия)</div>
                      <div>• 03:00 — Остановка механизма наручных часов</div>
                      <div>• 08:35 — Прибытие патрульного наряда (D01)</div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Блок "ЗАМЕТКИ" внизу с полем для текста и сохранением в localStorage */}
          <div className="border-t border-[#1e232d] pt-3 mt-3">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-zinc-300 mb-2">
              <div className="flex items-center gap-1.5">
                <BookText className="size-3.5 text-zinc-400" />
                <span>ЗАМЕТКИ</span>
              </div>
              <Edit3 className="size-3.5 text-zinc-500 hover:text-zinc-300 cursor-pointer" />
            </div>
            <textarea
              value={notesText}
              onChange={handleNotesChange}
              placeholder="Здесь можно делать заметки, фиксировать версии и вопросы..."
              className="w-full h-20 bg-[#0e1015] border border-[#1e232d] rounded-sm p-2 text-[11px] text-zinc-300 placeholder:text-zinc-600 resize-none focus:outline-none focus:border-[#c5a059]/60 leading-relaxed font-mono"
            />
          </div>
        </aside>
      </main>

      {/* ======================================================== */}
      {/* КНОПКА "ПОДСКАЗКА" С ЛАМПОЧКОЙ В ПРАВОМ НИЖНЕМ УГЛУ       */}
      {/* ======================================================== */}
      <div className="fixed bottom-4 right-5 z-40">
        <button
          type="button"
          onClick={() => setIsHintModalOpen(true)}
          className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#c5a059] hover:text-[#dfb86c] bg-[#141820]/90 hover:bg-[#161a22] border border-[#c5a059]/40 px-3 py-2 rounded-sm shadow-lg transition-all backdrop-blur-xs group"
        >
          <Lightbulb className="size-4 text-[#c5a059] fill-[#c5a059]/20 group-hover:scale-110 transition-transform" />
          <span>ПОДСКАЗКА</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* МОДАЛЬНЫЕ ОКНА                                           */}
      {/* ======================================================== */}

      {/* 1. Модальное окно осмотра интерактивной точки */}
      {activeHotspotModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#101319] border border-[#c5a059]/60 max-w-md w-full p-5 rounded-sm space-y-3 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#1e232d] pb-2">
              <div className="flex items-center gap-2">
                <Crosshair className="size-4 text-[#c5a059]" />
                <h3 className="font-semibold text-white uppercase text-sm">
                  ОСМОТР: {activeHotspotModal.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveHotspotModal(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
            <p className="text-xs text-zinc-300 leading-relaxed font-sans">
              {activeHotspotModal.description}
            </p>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveHotspotModal(null)}
                className="bg-[#c5a059] hover:bg-[#d4af66] text-[#0e1015] font-semibold text-xs px-4 py-1.5 rounded-sm transition-colors uppercase"
              >
                Принято к сведению
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Модальное окно "Осмотреть" (полный зум) */}
      {isInspectModalOpen && (
        <div className="fixed inset-0 bg-black/95 z-50 flex flex-col p-4 backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-[#1e232d]">
            <div className="text-sm font-mono text-[#c5a059]">
              [{currentItem.id}] {currentItem.title} — РЕЖИМ МАКСИМАЛЬНОГО ОСМОТРА
            </div>
            <button
              type="button"
              onClick={() => setIsInspectModalOpen(false)}
              className="text-zinc-400 hover:text-white p-1"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center overflow-auto p-4">
            <img
              src={currentItem.mediaUrl || currentItem.image_asset || currentItem.content || '/images/case-001/room_overview.jpg'}
              alt={currentItem.title}
              className="max-h-[85vh] max-w-full object-contain border border-[#1e232d] shadow-2xl"
            />
          </div>
        </div>
      )}

      {/* 3. Модальное окно "Подсказка" */}
      {isHintModalOpen && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-[#101319] border border-[#c5a059] max-w-md w-full p-5 rounded-sm space-y-3 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#1e232d] pb-2">
              <div className="flex items-center gap-2 text-[#c5a059]">
                <Lightbulb className="size-4 fill-[#c5a059]/20" />
                <h3 className="font-semibold text-white uppercase text-sm">
                  СЛЕДСТВЕННАЯ НАВОДКА ДЕТЕКТИВА
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsHintModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-2 text-xs text-zinc-300 leading-relaxed">
              <p>
                <strong>1. Изучите Рапорт патрульного (D01):</strong> В тексте отчета упоминаются ключевые слова (например, фамилии, место происшествия). Вводите их в Консоль Разблокировки!
              </p>
              <p>
                <strong>2. Интерактивные точки на фото:</strong> Клик по зеркалу или тумбочке автоматически откроет соответствующие макро-снимки (P02 и P03).
              </p>
              <p>
                <strong>3. Ключевые теги для поиска:</strong> Попробуйте ввести: <code>орлов</code>, <code>зеркало</code>, <code>часы</code>, <code>пайнкрест</code>, <code>01:00</code>.
              </p>
            </div>
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsHintModalOpen(false)}
                className="bg-[#c5a059] hover:bg-[#d4af66] text-[#0e1015] font-semibold text-xs px-4 py-1.5 rounded-sm transition-colors uppercase"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Модальное окно "Сравнить" */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 bg-black/90 z-50 flex flex-col p-4 backdrop-blur-md">
          <div className="flex items-center justify-between pb-3 border-b border-[#1e232d]">
            <div className="text-sm font-mono text-[#c5a059]">
              СРАВНЕНИЕ МАТЕРИАЛОВ: МАКРОСЪЕМКА И ОБЩИЙ ПЛАН
            </div>
            <button
              type="button"
              onClick={() => setIsCompareModalOpen(false)}
              className="text-zinc-400 hover:text-white p-1"
            >
              <X className="size-5" />
            </button>
          </div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 items-center justify-center">
            <div className="space-y-2 text-center">
              <div className="text-xs font-mono text-zinc-400">P01 — ОБЩИЙ ВИД НОМЕРА 12</div>
              <img
                src="/images/case-001/room_overview.jpg"
                alt="P01"
                className="max-h-[70vh] mx-auto border border-[#1e232d] object-cover"
              />
            </div>
            <div className="space-y-2 text-center">
              <div className="text-xs font-mono text-zinc-400">
                {currentItem.id !== 'P01' ? `[${currentItem.id}] ${currentItem.title}` : 'P02 — ЗЕРКАЛО (МАКРО)'}
              </div>
              <img
                src={currentItem.id !== 'P01' ? (currentItem.mediaUrl || currentItem.image_asset || currentItem.content || '/images/case-001/macro_mirror.jpg') : '/images/case-001/macro_mirror.jpg'}
                alt=""
                className="max-h-[70vh] mx-auto border border-[#1e232d] object-cover"
              />
            </div>
          </div>
        </div>
      )}

      {/* 6. Предупреждение об истечении 20-минутного таймера расследования */}
      {isTimerExpired && !isFinaleActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 sm:p-6 backdrop-blur-md animate-in fade-in duration-300">
          <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col border-2 border-red-600/80 bg-[#0e1015] shadow-[0_0_60px_rgba(220,38,38,0.35)] p-6 sm:p-8 text-center space-y-5 rounded-xs">
            <div className="size-16 rounded-full border-2 border-red-500/50 bg-red-950/40 mx-auto flex items-center justify-center animate-pulse">
              <AlertTriangle className="size-8 text-red-500" />
            </div>

            <div className="space-y-2">
              <h2 className="font-mono text-base sm:text-lg font-bold text-red-400 uppercase tracking-wider leading-snug">
                ⚠️ ВНИМАНИЕ: СРОК РАССЛЕДОВАНИЯ ИСТЕК. ДОСТУП К АРХИВУ ЗАБЛОКИРОВАН
              </h2>
              <p className="font-mono text-xs sm:text-sm text-zinc-400 leading-relaxed">
                Лимит времени сессии следственного доступа (20:00) исчерпан. Согласно протоколу безопасности ОВР № 8-Б, материалы дела №001 временно заблокированы.
              </p>
            </div>

            <div className="border border-[#1e232d] bg-[#141820] p-3 text-[11px] font-mono text-zinc-400 text-left space-y-1">
              <div className="text-[#c5a059] font-semibold">СТАТУС СЕССИИ:</div>
              <div>• Таймер: 00:00 / 20:00 [ИСТЕК]</div>
              <div>• Протокол: АВТОМАТИЧЕСКАЯ БЛОКИРОВКА АРХИВА</div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={handleRestartTimer}
                className="flex items-center justify-center gap-2 border border-[#c5a059] bg-[#c5a059] px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-[#0e1015] hover:bg-[#d4af66] transition-colors rounded-xs shadow-md active:scale-98"
              >
                <RotateCcw className="size-4" />
                <span>ПРОДЛИТЬ СЕССИЮ / ПЕРЕЗАПУСК</span>
              </button>
              <Link
                href="/"
                className="flex items-center justify-center gap-2 border border-[#1e232d] bg-[#141820] px-5 py-2.5 text-xs font-mono uppercase tracking-wider text-zinc-300 hover:text-white hover:border-zinc-500 transition-colors rounded-xs"
              >
                <Home className="size-4" />
                <span>ГЛАВНОЕ МЕНЮ</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 7. ФИНАЛЬНАЯ КАТ-СЦЕНА / РЕТРО-ТЕРМИНАЛ (TEXT-05) */}
      {isFinaleActive && (
        <div className="fixed inset-0 z-[100] bg-black text-[#c5a059] flex flex-col items-center justify-center p-6 sm:p-12 select-none overflow-hidden animate-in fade-in duration-1000">
          {/* Ретро-сканлайны и сетка монитора */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.8) 3px, rgba(0, 0, 0, 0.8) 4px)',
            }}
          />
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.85)_100%)]" />

          {/* Контейнер ретро-монитора */}
          <div className="relative z-10 max-w-2xl w-full flex flex-col items-center text-center space-y-8 font-mono">
            {/* Гриф секретности вверху */}
            <div className="border border-[#c5a059]/40 bg-[#c5a059]/10 px-4 py-1 text-[11px] uppercase tracking-[0.2em] font-semibold text-[#c5a059] animate-pulse">
              [ СИСТЕМА ОВР // ОСОБЫЙ СТАТУС ДЕЛА № 99-34 ]
            </div>

            {/* Текст TEXT-05 с эффектом печатной машинки */}
            <div className="min-h-[180px] sm:min-h-[220px] flex items-center justify-center">
              <div className="text-sm sm:text-base md:text-lg leading-relaxed text-[#c5a059] tracking-wide whitespace-pre-wrap drop-shadow-[0_0_12px_rgba(197,160,89,0.5)] font-mono font-medium max-w-xl">
                {FINALE_FULL_TEXT.slice(0, finaleCharIndex)}
                {!isFinaleTypingDone && (
                  <span className="inline-block w-2.5 h-5 bg-[#c5a059] ml-1 animate-pulse align-middle" />
                )}
              </div>
            </div>

            {/* Пропуск печати */}
            {!isFinaleTypingDone && (
              <button
                type="button"
                onClick={handleSkipTyping}
                className="text-[11px] text-zinc-500 hover:text-[#c5a059] transition-colors underline underline-offset-4 tracking-widest uppercase font-mono"
              >
                [ Нажмите для мгновенного вывода ]
              </button>
            )}

            {/* Кнопка "ЗАНОВО / ГЛАВНОЕ МЕНЮ" (появляется после завершения печати) */}
            {isFinaleTypingDone && (
              <div className="pt-6 border-t border-[#c5a059]/30 w-full flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in duration-500">
                <button
                  type="button"
                  onClick={handleReturnToMainMenu}
                  className="w-full sm:w-auto px-8 py-3.5 border-2 border-[#c5a059] bg-[#c5a059] text-black font-bold font-mono text-xs sm:text-sm uppercase tracking-[0.15em] hover:bg-[#d4af66] hover:shadow-[0_0_25px_rgba(197,160,89,0.5)] transition-all active:scale-98"
                >
                  ЗАНОВО / ГЛАВНОЕ МЕНЮ
                </button>
                <button
                  type="button"
                  onClick={handleRestartEntireInvestigation}
                  className="w-full sm:w-auto px-6 py-3.5 border border-[#c5a059]/50 bg-black/80 text-[#c5a059] font-mono text-xs uppercase tracking-wider hover:bg-[#161a22] hover:border-[#c5a059] transition-all"
                >
                  ПЕРЕЗАПУСТИТЬ ДЕЛО ЗАНОВО
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export { CaseInvestigationLayout };
