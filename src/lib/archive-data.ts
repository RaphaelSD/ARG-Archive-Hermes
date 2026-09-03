export type CaseStatus = 'closed' | 'open' | 'locked';

export type CaseDocument = {
  id: string;
  title: string;
  kind: 'document' | 'photo' | 'audio' | 'note' | 'map';
  meta?: string;
};

export type CaseNote = {
  id: string;
  title: string;
  locked?: boolean;
  body: string[];
};

export type TimelineEntry = {
  time: string;
  text: string;
};

export type CaseFile = {
  id: string;
  number: string;
  title: string;
  status: CaseStatus;
  cover?: string;
  summary: string;
  documents: CaseDocument[];
  notes: CaseNote[];
  timeline: TimelineEntry[];
  callLog?: {
    subject: string;
    rows: { date: string; time: string; number: string; duration: string; type: string; flagged?: boolean }[];
    pin?: string;
  };
};

export const cases: CaseFile[] = [
  {
    id: '001',
    number: 'Дело №001',
    title: 'Последний звонок',
    status: 'closed',
    cover: '/images/case-001.jpg',
    summary: 'Андрей Соколов вышел из квартиры в 21:40 и не вернулся. Телефон остался на кухонном столе. Соседи ничего не слышали.',
    documents: [
      { id: 'd1', title: 'Протокол осмотра квартиры', kind: 'document', meta: '4 стр.' },
      { id: 'd2', title: 'Детализация звонков', kind: 'document', meta: '1 стр.' },
      { id: 'd3', title: 'Показания соседей', kind: 'document', meta: '3 стр.' },
      { id: 'd4', title: 'Статья из газеты (архив)', kind: 'document', meta: 'вырезка' },
      { id: 'd5', title: 'Справка из больницы', kind: 'document', meta: '1 стр.' },
      { id: 'd6', title: 'Чек из такси', kind: 'photo', meta: 'фото' },
      { id: 'd7', title: 'Запись с автоответчика', kind: 'audio', meta: '00:47' },
      { id: 'd8', title: 'Карта района', kind: 'map', meta: 'схема' },
      { id: 'd9', title: 'Запрос в архив администрации', kind: 'document', meta: '2 стр.' },
      { id: 'd10', title: 'Личное дело (фрагмент)', kind: 'document', meta: 'фрагмент' },
    ],
    notes: [
      {
        id: 'n1',
        title: 'Заметка #1',
        body: ['Квартира не тронута. Ни следов борьбы, ни пропавших вещей.', 'Уходил ненадолго. Или думал, что ненадолго.'],
      },
      {
        id: 'n2',
        title: 'Заметка #2',
        body: ['Слишком чистая картина.', 'Соседи ничего не слышали:', '— Почему не взял с собой телефон?', '— Куда мог пойти в 21:40?', 'Нужно проверить архив администрации. И поговорить с владельцем такси лично.'],
      },
      {
        id: 'n3',
        title: 'Заметка #3',
        body: ['Номер +7 (921) 341-22-10 всплывает шесть раз за двое суток.', 'Оформлен на фирму, которой не существует с 2011 года.'],
      },
      { id: 'n4', title: 'Заметка #4', locked: true, body: ['Доступ откроется по мере продвижения расследования.'] },
    ],
    timeline: [
      { time: '12.05, 18:33', text: 'Последний входящий звонок с неизвестного номера.' },
      { time: '12.05, 21:40', text: 'Соколов выходит из квартиры. Телефон остаётся дома.' },
      { time: '13.05, 08:15', text: 'Заявление о пропаже принято дежурной частью.' },
      { time: '15.05, 11:00', text: 'Дело передано в отдел внутренних расследований.' },
    ],
    callLog: {
      subject: 'Детализация звонков А. Соколова',
      pin: 'Этот номер встречается несколько раз. Кому он принадлежит?',
      rows: [
        { date: '12.05', time: '09:12', number: '+7 (921) 341-22-10', duration: '01:12', type: 'Исходящий', flagged: true },
        { date: '12.05', time: '10:03', number: '+7 (812) 555-08-41', duration: '00:48', type: 'Исходящий' },
        { date: '12.05', time: '14:47', number: '+7 (921) 341-22-10', duration: '02:11', type: 'Исходящий', flagged: true },
        { date: '12.05', time: '16:05', number: '+7 (921) 700-13-02', duration: '00:09', type: 'Входящий' },
        { date: '12.05', time: '18:33', number: '+7 (921) 341-22-10', duration: '00:58', type: 'Входящий', flagged: true },
        { date: '12.05', time: '19:22', number: '+7 (812) 341-22-10', duration: '00:31', type: 'Входящий' },
        { date: '12.05', time: '20:18', number: '+7 (921) 341-22-10', duration: '00:53', type: 'Входящий', flagged: true },
        { date: '12.05', time: '21:38', number: 'Неизвестный', duration: '00:04', type: 'Входящий' },
      ],
    },
  },
  {
    id: '002',
    number: 'Дело №002',
    title: 'Смерть на складе',
    status: 'closed',
    cover: '/images/case-002.jpg',
    summary: 'Ночной сторож найден мёртвым в цехе заброшенного склада «Север». Официальная версия — несчастный случай.',
    documents: [
      { id: 'd1', title: 'Заключение эксперта', kind: 'document', meta: '6 стр.' },
      { id: 'd2', title: 'Схема помещения', kind: 'map', meta: 'схема' },
      { id: 'd3', title: 'Фото с места', kind: 'photo', meta: '12 кадров' },
      { id: 'd4', title: 'Журнал дежурств', kind: 'document', meta: 'выписка' },
    ],
    notes: [
      { id: 'n1', title: 'Заметка #1', body: ['Свет в цехе горел. Сторож обходил склад с фонарём — зачем?', 'Кто-то был там до него.'] },
      { id: 'n2', title: 'Заметка #2', locked: true, body: ['Материал закрыт.'] },
    ],
    timeline: [
      { time: '03.09, 23:10', text: 'Начало смены.' },
      { time: '04.09, 01:40', text: 'Обрыв записи камеры у ворот.' },
      { time: '04.09, 06:20', text: 'Тело обнаружено сменщиком.' },
    ],
  },
  {
    id: '003',
    number: 'Дело №003',
    title: 'Пепел и бумаги',
    status: 'open',
    cover: '/images/case-003.jpg',
    summary: 'Пожар в архиве городской администрации уничтожил документы за 1998–2004 годы. Ровно те, что запрашивал Орлов.',
    documents: [
      { id: 'd1', title: 'Акт о пожаре', kind: 'document', meta: '3 стр.' },
      { id: 'd2', title: 'Список утраченных дел', kind: 'document', meta: '9 стр.' },
      { id: 'd3', title: 'Фото пепелища', kind: 'photo', meta: '7 кадров' },
    ],
    notes: [
      { id: 'n1', title: 'Заметка #1', body: ['Сгорело именно то, что я запрашивал за неделю до пожара.', 'Совпадений такого размера не бывает.'] },
    ],
    timeline: [
      { time: '21.11', text: 'Запрос Орлова в архив администрации.' },
      { time: '28.11, 04:12', text: 'Возгорание в правом крыле.' },
      { time: '29.11', text: 'Комиссия признаёт причиной неисправную проводку.' },
    ],
  },
  {
    id: '004',
    number: 'Дело №004',
    title: 'Тихая улица',
    status: 'locked',
    summary: 'Материалы засекречены.',
    documents: [],
    notes: [],
    timeline: [],
  },
  {
    id: '005',
    number: 'Дело №005',
    title: 'Тихая вода',
    status: 'locked',
    summary: 'Материалы засекречены.',
    documents: [],
    notes: [],
    timeline: [],
  },
];

export type Location = {
  id: string;
  name: string;
  x: number;
  y: number;
  current?: boolean;
  explored: boolean;
  description: string;
};

export const locations: Location[] = [
  { id: 'police', name: 'Полицейский участок', x: 28, y: 34, explored: true, description: 'Отдел внутренних расследований, третий этаж.' },
  { id: 'hospital', name: 'Городская больница', x: 62, y: 26, explored: true, description: 'Приёмный покой, где оформляли справку Соколова.' },
  { id: 'port', name: 'Старый порт', x: 18, y: 68, explored: true, description: 'Краны стоят с 2009 года. Ночью здесь никого.' },
  { id: 'plant', name: 'Завод «Север»', x: 74, y: 58, explored: true, description: 'Цеха частично сданы под склады.' },
  { id: 'hotel', name: 'Отель «Волга»', x: 46, y: 48, explored: true, description: 'Единственная гостиница в центре.' },
  { id: 'archive', name: 'Архив города Н.', x: 52, y: 70, explored: true, current: true, description: 'Вы здесь. Хранилище дел отдела.' },
  { id: 'warehouse', name: 'Заброшенный склад', x: 84, y: 78, explored: true, description: 'Место происшествия по делу №002.' },
  { id: 'unknown', name: 'Ещё не исследовано', x: 36, y: 84, explored: false, description: 'Локация откроется позже.' },
];

export type NewsItem = {
  id: string;
  date: string;
  tag: string;
  title: string;
  excerpt: string;
};

export const news: NewsItem[] = [
  { id: 'n1', date: '28.08', tag: 'Обновление архива', title: 'Открыто дело №003 «Пепел и бумаги»', excerpt: 'Добавлены акт о пожаре, список утраченных дел и семь фотографий с места.' },
  { id: 'n2', date: '14.08', tag: 'Материалы', title: 'В дело №001 добавлена аудиозапись с автоответчика', excerpt: '47 секунд шума и один голос, который эксперты не смогли идентифицировать.' },
  { id: 'n3', date: '02.08', tag: 'Город', title: 'На карте появились две новые локации', excerpt: 'Старый порт и отель «Волга» доступны для изучения.' },
  { id: 'n4', date: '19.07', tag: 'Система', title: 'Заметки Орлова теперь открываются постепенно', excerpt: 'Часть записей заблокирована до продвижения по материалам дела.' },
];

export const detective = {
  name: 'Максим Орлов',
  role: 'Старший следователь',
  department: 'Отдел внутренних расследований',
  experience: '12 лет',
  specialization: 'Скрытые схемы, финансовые следы, пропавшие люди',
  bio: 'Старший следователь по особо важным делам. В работе опирается на перепроверку любой версии и на собственную память о людях, которые лгут слишком уверенно.',
  quote: 'Если дело выглядит чистым — значит, кто-то уже стер следы.',
  extra: [
    'Проверяет не только факты, но и интервал между ними.',
    'Люди, которые знают слишком много, обычно не хотят, чтобы это было доказано.',
    'В архиве нельзя доверять ни одному файлу целиком — только связке уликов.',
  ],
};

export function getCase(id: string) {
  return cases.find((item) => item.id === id);
}
