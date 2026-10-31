// 待辦事項儲存鍵值，讓清單在重新整理後仍能保留。
const STORAGE_KEY = 'my-todo-list';

const form = document.getElementById('todo-form');
const input = document.getElementById('todo-input');
const list = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const remainingCount = document.getElementById('remaining-count');
const storageError = document.getElementById('storage-error');
const themeToggle = document.getElementById('theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const themeLabel = document.getElementById('theme-label');
const filterButtons = document.querySelectorAll('.btn-filter');

let todos = loadTodos();
let currentFilter = 'all';

// 從瀏覽器儲存空間讀取並檢查待辦資料。
function loadTodos() {
  try {
    const savedTodos = localStorage.getItem(STORAGE_KEY);
    if (!savedTodos) return [];

    const parsedTodos = JSON.parse(savedTodos);
    if (!Array.isArray(parsedTodos)) {
      throw new TypeError('待辦資料格式不正確。');
    }

    return parsedTodos.filter((todo) =>
      todo &&
      typeof todo.id === 'string' &&
      typeof todo.text === 'string' &&
      typeof todo.completed === 'boolean'
    );
  } catch (error) {
    console.error('讀取待辦事項失敗：', error);
    storageError.hidden = false;
    return [];
  }
}

// 儲存目前的待辦清單；發生錯誤時在畫面上提醒使用者。
function saveTodos() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    storageError.hidden = true;
  } catch (error) {
    console.error('儲存待辦事項失敗：', error);
    storageError.hidden = false;
  }
}

// 依照目前篩選條件取得要顯示的待辦事項。
function getVisibleTodos() {
  if (currentFilter === 'active') {
    return todos.filter((todo) => !todo.completed);
  }
  if (currentFilter === 'completed') {
    return todos.filter((todo) => todo.completed);
  }
  return todos;
}

// 依照清單內容與篩選條件提供相符的空狀態提示。
function getEmptyMessage() {
  if (todos.length === 0) {
    return '還沒有任何待辦事項,新增一個吧!';
  }
  if (currentFilter === 'active') {
    return '太棒了,沒有未完成的事項!';
  }
  if (currentFilter === 'completed') {
    return '目前沒有已完成的事項；這些待辦事項仍保留在清單中，只是被目前的篩選條件過濾掉了。請切換至「全部」或「未完成」查看。';
  }
  return '還沒有任何待辦事項,新增一個吧!';
}

// 依照目前資料及篩選條件更新清單與整體未完成數量。
function renderTodos() {
  list.replaceChildren();

  const visibleTodos = getVisibleTodos();
  visibleTodos.forEach((todo) => {
    const item = document.createElement('li');
    item.className = todo.completed ? 'todo-item completed' : 'todo-item';
    item.dataset.id = todo.id;

    const checkbox = document.createElement('input');
    checkbox.className = 'todo-checkbox';
    checkbox.type = 'checkbox';
    checkbox.checked = todo.completed;
    checkbox.setAttribute('aria-label', `標記「${todo.text}」為完成`);

    const text = document.createElement('span');
    text.className = 'todo-text';
    text.textContent = todo.text;

    const deleteButton = document.createElement('button');
    deleteButton.className = 'btn-delete';
    deleteButton.type = 'button';
    deleteButton.textContent = '×';
    deleteButton.setAttribute('aria-label', `刪除「${todo.text}」`);

    item.append(checkbox, text, deleteButton);
    list.append(item);
  });

  emptyState.hidden = visibleTodos.length > 0;
  emptyState.textContent = getEmptyMessage();
  remainingCount.textContent = `未完成:${todos.filter((todo) => !todo.completed).length} 項`;
}

// 更新主題切換按鈕，並套用所選的色彩模式。
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;

  const isDark = theme === 'dark';
  themeIcon.textContent = isDark ? '☀️' : '🌙';
  themeLabel.textContent = isDark ? '淺色模式' : '深色模式';
  themeToggle.setAttribute('aria-pressed', String(isDark));
}

// 優先採用使用者儲存的選擇，否則跟隨作業系統外觀設定。
function initializeTheme() {
  try {
    const savedTheme = localStorage.getItem('my-todo-theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      applyTheme(savedTheme);
      return;
    }
  } catch (error) {
    console.error('讀取主題設定失敗：', error);
    storageError.hidden = false;
  }

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  applyTheme(prefersDark ? 'dark' : 'light');
}

// 切換篩選條件並同步按鈕的選取狀態。
function setFilter(filter) {
  currentFilter = filter;

  filterButtons.forEach((button) => {
    const isActive = button.dataset.filter === filter;
    button.classList.toggle('is-active', isActive);
    button.setAttribute('aria-pressed', String(isActive));
  });

  renderTodos();
}

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const text = input.value.trim();
  if (!text) return;

  todos.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    text,
    completed: false,
  });

  saveTodos();
  renderTodos();
  form.reset();
  input.focus();
});

list.addEventListener('change', (event) => {
  if (!(event.target instanceof HTMLInputElement) || !event.target.matches('.todo-checkbox')) return;

  const item = event.target.closest('.todo-item');
  if (!item) return;

  todos = todos.map((todo) =>
    todo.id === item.dataset.id ? { ...todo, completed: event.target.checked } : todo
  );
  saveTodos();
  renderTodos();
});

list.addEventListener('click', (event) => {
  if (!(event.target instanceof HTMLButtonElement) || !event.target.matches('.btn-delete')) return;

  const item = event.target.closest('.todo-item');
  if (!item) return;

  todos = todos.filter((todo) => todo.id !== item.dataset.id);
  saveTodos();
  renderTodos();
});

filterButtons.forEach((button) => {
  button.addEventListener('click', () => setFilter(button.dataset.filter));
});

themeToggle.addEventListener('click', () => {
  const nextTheme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  applyTheme(nextTheme);

  try {
    localStorage.setItem('my-todo-theme', nextTheme);
    storageError.hidden = true;
  } catch (error) {
    console.error('儲存主題設定失敗：', error);
    storageError.hidden = false;
  }
});

initializeTheme();
renderTodos();
