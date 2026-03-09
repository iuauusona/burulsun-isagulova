const API_URL = 'http://localhost:9090/api/announcements';

// ─────────────────────────────────────────────────────────────────
//  UTILS
// ─────────────────────────────────────────────────────────────────

/**
 * Показывает всплывающее уведомление внизу экрана
 * @param {string} msg      - текст уведомления
 * @param {number} duration - время отображения в мс
 */
function showToast(msg, duration = 2800) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(() => t.classList.remove('show'), duration);
}

function formatPrice(price) {
    if (!price && price !== 0) return '—';
    const s = String(price).toLowerCase().trim();
    if (s === '0') return '—';
    if (s === 'бесплатно' || s === 'free') return 'Бесплатно';
    if (!isNaN(Number(s))) {
        return Number(s).toLocaleString('ru-RU') + ' сом';
    }
    return price;
}

function isFree(price) {
    const s = String(price).toLowerCase().trim();
    return s === 'бесплатно' || s === 'free';
}

/**
 * Форматирует ISO-дату в читаемый вид: "5 мар. 2026 г."
 */
function formatDate(raw) {
    if (!raw) return '—';
    try {
        const d = new Date(raw);
        if (isNaN(d)) return raw;
        return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
        return raw;
    }
}

// ─────────────────────────────────────────────────────────────────
//  SKELETON LOADER  (показывается пока грузятся данные)
// ─────────────────────────────────────────────────────────────────

/**
 * Заполняет грид скелетонами-заглушками
 * @param {number} n - количество скелетонов
 */
function renderSkeletons(n = 20) {
    const grid = document.getElementById('grid');
    grid.innerHTML = Array.from({ length: n }, () => `
    <div class="skeleton-card">
      <div class="skel skel-img"></div>
      <div class="skel skel-line wide"  style="margin-top:14px"></div>
      <div class="skel skel-line med"   style="margin-top:8px"></div>
      <div class="skel skel-line short" style="margin-top:8px;margin-bottom:16px"></div>
    </div>`).join('');
}

// ─────────────────────────────────────────────────────────────────
//  CARD RENDERER
// ─────────────────────────────────────────────────────────────────

/**
 * Генерирует HTML одной карточки объявления.
 *
 * Поддерживаемые поля объекта ad:
 *   title / name         — название объявления
 *   price                — цена (число или строка)
 *   city / location      — город
 *   date / createdAt / published_at — дата публикации (ISO-строка)
 *   image / imageUrl / photo        — URL фото
 *   url / link           — ссылка на объявление
 *
 * @param {Object} ad  - объект объявления
 * @param {number} idx - индекс для animation-delay
 * @returns {string}   - HTML-строка
 */
function renderCard(ad, idx) {
    const price    = formatPrice(ad.price);
    const free     = isFree(ad.price);
    const city     = ad.city     || ad.location || '—';
    const date = formatDate(ad.date || ad.createdAt || ad.published_at || ad.publishedAt);
    const title    = ad.title    || ad.name     || 'Без названия';
    const imageUrl = ad.image    || ad.imageUrl || ad.photo || '';
    const link     = ad.url      || ad.link     || '#';

    const imgHtml = imageUrl
        ? `<img class="card-img" src="${imageUrl}" alt="${title}" loading="lazy"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
       <div class="card-img-placeholder" style="display:none">🏷️</div>`
        : `<div class="card-img-placeholder">🏷️</div>`;

    return `
    <a class="card" href="${link}" target="_blank" rel="noopener"
       style="text-decoration:none;animation-delay:${Math.min(idx * 30, 600)}ms">
      ${imgHtml}
      <div class="card-body">
        <div class="card-title">${title}</div>
        <div class="card-price ${free ? 'free' : ''}">${price}</div>
        <div class="card-meta">
          <div class="card-meta-row">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            ${city}
          </div>
          <div class="card-meta-row">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8"  y1="2" x2="8"  y2="6"/>
              <line x1="3"  y1="10" x2="21" y2="10"/>
            </svg>
            ${date}
          </div>
        </div>
      </div>
    </a>`;
}

// ─────────────────────────────────────────────────────────────────
//  ERROR STATE
// ─────────────────────────────────────────────────────────────────

/**
 * Показывает сообщение об ошибке в гриде
 * @param {string} msg - HTML-описание ошибки
 */
function renderError(msg) {
    document.getElementById('grid').innerHTML = `
    <div class="error-wrap">
      <div class="emoji">🔌</div>
      <h2>Нет данных</h2>
      <p>${msg}</p>
      <div class="error-note">
        Ожидается JSON-ответ от бэкенда на адресе:<br>
        <code>${API_URL}</code><br><br>
        Формат массива объявлений:<br>
        <code>[{ title, price, city, date, image, url }, ...]</code><br><br>
        Поддерживаемые псевдонимы полей:<br>
        • image → <code>imageUrl</code>, <code>photo</code><br>
        • city  → <code>location</code><br>
        • date  → <code>createdAt</code>, <code>published_at</code><br>
        • url   → <code>link</code>
      </div>
    </div>`;
}

// ─────────────────────────────────────────────────────────────────
//  MAIN LOADER  (вызывается кнопкой «Обновить»)
// ─────────────────────────────────────────────────────────────────

/**
 * Запрашивает данные с бэкенда и рендерит карточки.
 * Вызывается кнопкой «Обновить» и при инициализации страницы.
 */
async function loadAds() {
    const btn = document.getElementById('btnRefresh');
    btn.classList.add('loading');
    btn.disabled = true;

    document.getElementById('countBadge').style.display = 'none';
    renderSkeletons(20);

    try {
        const res = await fetch(API_URL, {
            headers: { 'Accept': 'application/json' }
        });

        if (!res.ok) throw new Error(`HTTP ${res.status} — ${res.statusText}`);

        const json = await res.json();

        // Поддержка разных форматов ответа: массив или объект-обёртка
        let ads = Array.isArray(json)
            ? json
            : (json.data || json.items || json.results || json.ads || []);

        if (!Array.isArray(ads) || ads.length === 0) {
            renderError('Бэкенд вернул пустой массив. Проверь парсер.');
            showToast('⚠️ Пустой ответ от сервера');
            return;
        }

        ads = ads.slice(0, 100);

        document.getElementById('grid').innerHTML = ads.map(renderCard).join('');

        const n = ads.length;
        document.getElementById('countText').textContent =
            `${n} объявлени${n === 1 ? 'е' : n < 5 ? 'я' : 'й'}`;
        document.getElementById('live-count').textContent = n;
        document.getElementById('countBadge').style.display = 'inline-flex';

        showToast(`✅ Загружено ${n} объявлений`);

    } catch (err) {
        console.error('[lalafо loader]', err);
        renderError(`<b>${err.message}</b><br>Убедись, что бэкенд запущен и доступен.`);
        showToast('❌ Ошибка подключения к серверу');
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
}
// ─────────────────────────────────────────────────────────────────
//  INIT  — запускается автоматически при загрузке страницы
// ─────────────────────────────────────────────────────────────────
(async () => {
    const btn = document.getElementById('btnRefresh');
    btn.classList.add('loading');
    btn.disabled = true;
    renderSkeletons(20);

    try {
        // Пробуем бэкенд с таймаутом 4 секунды
        const ctrl  = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 4000);
        const res   = await fetch(API_URL, { signal: ctrl.signal, headers: { Accept: 'application/json' } });
        clearTimeout(timer);

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        let ads = Array.isArray(json) ? json : (json.data || json.items || json.results || json.ads || []);
        ads = ads.slice(0, 100);

        document.getElementById('grid').innerHTML = ads.map(renderCard).join('');

        const n = ads.length;
        document.getElementById('countText').textContent =
            `${n} объявлени${n === 1 ? 'е' : n < 5 ? 'я' : 'й'}`;
        document.getElementById('live-count').textContent = n;
        document.getElementById('countBadge').style.display = 'inline-flex';
        showToast(`✅ Загружено ${n} объявлений с сервера`);

    } catch (err) {
        console.warn('[lalafо loader] backend unavailable, loading demo data:', err.message);
        const ads = await loadDemo();
        document.getElementById('grid').innerHTML = ads.map(renderCard).join('');
        document.getElementById('countText').textContent = '100 объявлений (демо)';
        document.getElementById('live-count').textContent = '100 (демо)';
        document.getElementById('countBadge').style.display = 'inline-flex';
        showToast('📦 Бэкенд недоступен — показываются демо-данные', 4000);
    } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
    }
})();