// Tiny translation layer for the webviews.
//
// The extension host has `vscode.l10n`, but a webview runs in its own browser
// context with no access to it. Rather than shipping every string across in
// postMessage, each webview bundle carries the dictionaries and picks one from
// the display language the host stamps onto `<body data-locale="…">`.
//
// Source strings are English and double as the lookup keys, exactly like
// vscode.l10n — so a missing translation degrades to English instead of to a
// key name. Keep the keys here identical to the ones in l10n/bundle.l10n.ru.json
// where the same wording appears on both sides.

type Dict = Record<string, string>;

const RU: Dict = {
  // ── diagram preview (webview/main.ts) ──────────────────────────────────
  'Rendering…': 'Отрисовка…',
  'Mermaid syntax error': 'Ошибка синтаксиса Mermaid',
  'This diagram type cannot be rasterized — exported SVG instead':
    'Этот тип диаграммы нельзя растеризовать — экспортирован SVG',
  'JPEG has no transparency — background kept':
    'JPEG не поддерживает прозрачность — фон сохранён',
  'This diagram type cannot be rasterized — copied SVG markup instead':
    'Этот тип диаграммы нельзя растеризовать — скопирована разметка SVG',
  'Image copied ({0}x)': 'Изображение скопировано ({0}x)',
  'Exporting {0}/{1}…': 'Экспорт {0}/{1}…',
  'Unlock — follow active editor': 'Снять привязку — следовать за активным редактором',
  'Lock to current file': 'Привязать к текущему файлу',
  'Locked to current file': 'Привязано к текущему файлу',
  'Following the active editor': 'Следую за активным редактором',

  // ── markdown document preview (webview/markdownDocument.ts) ────────────
  Outline: 'Оглавление',
  'No headings': 'Заголовков нет',
  'No results': 'Ничего не найдено',
  Auto: 'Авто',
  Full: 'Вся ширина',
  Reading: 'Для чтения',
  'Content width: {0} — click / press w to cycle':
    'Ширина содержимого: {0} — щёлкните или нажмите w для переключения',
  '(Auto fits the window, Full = 100%, Reading = 920px)':
    '(«Авто» — по размеру окна, «Вся ширина» — 100%, «Для чтения» — 920px)',
  'Canvas 2D context unavailable.': 'Контекст Canvas 2D недоступен.',

  // ── drawing editor (webview/diagramEditor.ts) ──────────────────────────
  '⎯ no arrow': '⎯ без стрелки',
  '▸ arrow': '▸ стрелка',
  '⇁ open': '⇁ открытая',
  '● dot': '● точка',
  '✕ cross': '✕ крест',
  '▷ triangle (inheritance)': '▷ треугольник (наследование)',
  '◇ hollow diamond (aggregation)': '◇ пустой ромб (агрегация)',
  '◆ filled diamond (composition)': '◆ закрашенный ромб (композиция)',
  '⊣ one': '⊣ один',
  '⪛ many': '⪛ многие',
  '＋ more shapes…': '＋ ещё фигуры…',
  'Add a {0} node': 'Добавить узел «{0}»',
  '✓ copied': '✓ скопировано',
  '⧉ copy': '⧉ копировать',
  '✗ unsupported': '✗ не поддерживается',

  // ── node-shape captions (webview/diagramEditor.ts) ─────────────────────
  rectangle: 'прямоугольник',
  rounded: 'скруглённый',
  stadium: 'капсула',
  subroutine: 'подпроцесс',
  circle: 'круг',
  'double circle': 'двойной круг',
  diamond: 'ромб',
  hexagon: 'шестиугольник',
  flag: 'флаг',
  trapezoid: 'трапеция',
  'trapezoid (inverted)': 'трапеция (перевёрнутая)',
  parallelogram: 'параллелограмм',
  'parallelogram (left)': 'параллелограмм (влево)',
  ellipse: 'эллипс',
  state: 'состояние',
  start: 'начало',
  end: 'конец',
  'fork / join': 'ветвление / слияние',
  choice: 'выбор',
  class: 'класс',
  entity: 'сущность',
  actor: 'действующее лицо',
  participant: 'участник',
  note: 'заметка',
  requirement: 'требование',
  element: 'элемент',
  'data point': 'точка данных',
  person: 'человек',
  system: 'система',
  database: 'база данных',
  queue: 'очередь',
  card: 'карточка',
  node: 'узел',
  task: 'задача',
  slice: 'сектор',
  service: 'сервис',
  field: 'поле',
  commit: 'коммит',
  'kept as-is': 'без изменений',
};

const DICTS: Record<string, Dict> = { ru: RU };

let dict: Dict = {};

/** Pick the dictionary for a VS Code display language (e.g. "ru", "pt-br"). */
export function initI18n(locale: string | undefined | null): void {
  const tag = (locale ?? 'en').toLowerCase();
  dict = DICTS[tag] ?? DICTS[tag.split('-')[0]] ?? {};
}

/** Read the locale the host stamped on <body data-locale="…"> and load it. */
export function initI18nFromDocument(): void {
  initI18n(document.body?.dataset.locale);
}

/** Translate `message`, substituting {0}, {1}, … with `args`. */
export function t(message: string, ...args: Array<string | number>): string {
  const text = dict[message] ?? message;
  if (args.length === 0) {
    return text;
  }
  return text.replace(/\{(\d+)\}/g, (whole, i) => {
    const value = args[Number(i)];
    return value === undefined ? whole : String(value);
  });
}
