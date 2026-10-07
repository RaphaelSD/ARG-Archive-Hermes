'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Bookmark, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

export type PlayerNoteItem = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

export function PlayerNotes({ caseId = '001' }: { caseId?: string }) {
  const storageKey = `arg_player_notes_${caseId}`;
  const [notes, setNotes] = useState<PlayerNoteItem[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setNotes(parsed);
        if (parsed.length > 0) setActiveNoteId(parsed[0].id);
      } else {
        // Initial default player prompt note
        const initialNotes: PlayerNoteItem[] = [
          {
            id: 'pnote-1',
            title: 'Первые соображения',
            content: 'Соколов явно знал того, кто звонил с номера +7 (921) 341-22-10. Он вышел из дома спешно, но без следов взлома. Нужно перепроверить связь между такси «Служба 33» и Заводом «Север».',
            createdAt: new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
          },
        ];
        setNotes(initialNotes);
        setActiveNoteId(initialNotes[0].id);
        localStorage.setItem(storageKey, JSON.stringify(initialNotes));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [storageKey]);

  // Save to localStorage whenever notes change
  const saveNotes = (updated: PlayerNoteItem[]) => {
    setNotes(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // Ignore
    }
  };

  const handleCreateNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newNote: PlayerNoteItem = {
      id: `pnote-${Date.now()}`,
      title: newTitle.trim(),
      content: newContent.trim(),
      createdAt: new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }),
    };

    const updated = [newNote, ...notes];
    saveNotes(updated);
    setActiveNoteId(newNote.id);
    setNewTitle('');
    setNewContent('');
    setIsCreating(false);
  };

  const handleDeleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    saveNotes(updated);
    if (activeNoteId === id) {
      setActiveNoteId(updated[0]?.id ?? null);
    }
  };

  const activeNote = notes.find((n) => n.id === activeNoteId);

  return (
    <div className="space-y-4">
      {/* Notice header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div>
          <span className="label-xs text-primary font-display uppercase tracking-wider block">
            ЛИЧНЫЙ ДНЕВНИК ИССЛЕДОВАТЕЛЯ
          </span>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ваши персональные рабочие гипотезы (сохраняются локально, не синхронизируются с архивом ОВР)
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center gap-1.5 border border-primary/50 bg-primary/10 px-3 py-1.5 label-xs text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          <Plus className="size-3.5" />
          {isCreating ? 'Отмена' : 'Новая запись'}
        </button>
      </div>

      {/* Creation form */}
      {isCreating && (
        <form onSubmit={handleCreateNote} className="paper-card p-4 border border-border/80 space-y-3">
          <span className="label-xs text-ink/70 font-display block uppercase">
            ДОБАВИТЬ ЗАМЕТКУ ПО ДЕЛУ #{caseId}
          </span>
          <input
            type="text"
            placeholder="Заголовок заметки или имя подозреваемого..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full border border-ink/30 bg-white/60 px-3 py-2 text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink"
            autoFocus
          />
          <textarea
            rows={4}
            placeholder="Текст наблюдения, сопоставление звонков, алиби, нестыковки..."
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            className="w-full border border-ink/30 bg-white/60 p-3 font-sans text-sm text-ink placeholder:text-ink/40 focus:outline-none focus:border-ink"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsCreating(false)}
              className="border border-ink/30 px-3 py-1 text-xs text-ink/70 hover:text-ink"
            >
              Отмена
            </button>
            <button
              type="submit"
              className="flex items-center gap-1 bg-ink px-4 py-1 text-xs text-white hover:bg-ink/80 transition-colors"
            >
              <Save className="size-3" />
              Сохранить
            </button>
          </div>
        </form>
      )}

      {/* Notebook Grid */}
      <div className="grid gap-4 sm:grid-cols-[200px_1fr]">
        {/* Notes sidebar */}
        <div className="space-y-1.5">
          {notes.length === 0 && (
            <p className="text-xs text-muted-foreground italic p-2">
              Заметок пока нет. Нажмите «Новая запись», чтобы записать выводы.
            </p>
          )}
          {notes.map((note) => (
            <div
              key={note.id}
              className={cn(
                'group flex items-center justify-between border border-border/60 p-2.5 text-left transition-colors',
                activeNoteId === note.id
                  ? 'border-primary/60 bg-secondary text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/40'
              )}
            >
              <button
                type="button"
                onClick={() => setActiveNoteId(note.id)}
                className="flex-1 text-left min-w-0 pr-2"
              >
                <span className="block truncate text-xs font-medium">{note.title}</span>
                <span className="block text-[10px] text-muted-foreground font-mono mt-0.5">
                  {note.createdAt}
                </span>
              </button>

              <button
                type="button"
                onClick={() => handleDeleteNote(note.id)}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive p-1 transition-opacity"
                title="Удалить заметку"
              >
                <Trash2 className="size-3" />
              </button>
            </div>
          ))}
        </div>

        {/* Selected note view */}
        <div className="paper-card min-h-60 p-5 sm:p-6 relative">
          <div className="absolute right-4 top-4 text-[10px] font-mono text-ink/40 select-none uppercase">
            ЛИСТ ИССЛЕДОВАТЕЛЯ
          </div>

          {activeNote ? (
            <div className="space-y-3">
              <div>
                <span className="label-xs text-ink/60 font-mono">{activeNote.createdAt}</span>
                <h3 className="font-display text-xl uppercase tracking-wide text-ink mt-0.5">
                  {activeNote.title}
                </h3>
              </div>
              <div className="border-t border-ink/15 pt-3">
                <p className="font-sans text-sm text-ink leading-relaxed whitespace-pre-wrap">
                  {activeNote.content || '(Текст отсутствует)'}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center py-12 text-ink/40 text-xs italic">
              Выберите заметку из списка или создайте новую
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
