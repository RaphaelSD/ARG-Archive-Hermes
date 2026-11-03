# Заметки по ветке claude/fixes

Эта ветка отходит от `main` (коммит 1ede6ca). Все правки обычные, без привязки к конкретному ИИ-инструменту.

## Что изменено
- `content/cases/case-001`: исправлены ссылки на несуществующие ID.
  - `note_02` разблокируется хотспотом `hotspot_mirror` (раньше `hotspot_black_cloth`).
  - Опровержение `I03 + M03` заменено на `I03 + MAP-01`.
  - `loc_maggie_apt` открывается после `I01` (раньше ссылалось на несуществующий `D06`).
  - Убраны `linkedEvidenceId` `D08` и `D09` (таких документов нет).
- `src/lib/engine/evaluator.ts`: неизвестный тип условия теперь считается невыполненным; `CLUES_COMBINED` сравнивает ключи точно, без подстрок.
- `src/app/api/progress/route.ts`: проверка и ограничение входных массивов, `completedAt` ставится при первом достижении 100%.
- `src/app/api/auth/login/route.ts`: одинаковая ошибка для неверного email и пароля.

## Что осталось без изменений
- `relations.json`: узел `unknown_caller` не описан в `people.json`. Похоже на намеренную заглушку.
- Не запускались `npm install`, `next build` и `tsc` (не было доступа к npm). Перед слиянием выполните `npm run build` и `npm run lint`.

## Идеи на потом
- `backup_ui/` почти дублирует `src/`; `image-to-income-builder` указывает на коммит без `.gitmodules`.
- Дубликаты картинок в `public/` и файл `tsconfig.tsbuildinfo` в репозитории.
- В `loader.ts` преобразование `unlockCondition` повторяется около восьми раз.
- На Railway проверьте, что есть том для SQLite и что выполняется `prisma db push`.
