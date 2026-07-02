document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;

    // --- PWA Service Worker Registration ---
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js').catch(console.error);
    }

    // --- Fix Leaflet Marker Icon Path ---
    if (window.L) {
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
    }

    // --- State & Storage ---
    const appState = {
        favorites: JSON.parse(localStorage.getItem('favorites') || '[]').map(id => parseInt(id, 10)),
        quizLevel: parseInt(localStorage.getItem('quizLevel')) || 1,
        quizScore: parseInt(localStorage.getItem('quizScore')) || 0,
        privacyConsent: localStorage.getItem('privacyConsent') === 'true',
        onboardingComplete: localStorage.getItem('onboardingComplete') === 'true',
        swipeIndex: 0,
        swipeDeck: [],
    };

    // --- Database (Full – all prefs / all seasons) ---
    let specialtyDatabase = [];

    // --- Utility / Toast ---
    const showToast = (msg) => {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const t = document.createElement('div');
        t.className = 'toast';
        t.textContent = msg;
        t.style.cssText = 'background:var(--card-bg); color:var(--text-main); padding:12px 20px; border-radius:var(--radius-md); box-shadow:0 10px 20px var(--shadow-color); border-left:4px solid var(--accent); font-weight:bold; margin-top:10px; opacity:0; transform:translateY(-20px); transition:all 0.3s ease;';
        container.appendChild(t);
        // Animate in
        requestAnimationFrame(() => {
            t.style.opacity = '1';
            t.style.transform = 'translateY(0)';
        });
        // Remove after 3 seconds
        setTimeout(() => {
            t.style.opacity = '0';
            setTimeout(() => t.remove(), 300);
        }, 3000);
    };

    // --- Privacy Consent ---
    if (appState.privacyConsent) {
        const bannerEl = document.getElementById('privacy-consent');
        if (bannerEl) bannerEl.setAttribute('hidden', 'true');
    } else {
        const bannerEl = document.getElementById('privacy-consent');
        if (bannerEl) bannerEl.removeAttribute('hidden');
    }
    const acceptBtn = document.getElementById('privacy-accept');
    if (acceptBtn) {
        acceptBtn.addEventListener('click', () => {
            appState.privacyConsent = true;
            localStorage.setItem('privacyConsent', 'true');
            const bannerEl = document.getElementById('privacy-consent');
            if (bannerEl) bannerEl.setAttribute('hidden', 'true');
        });
    }
    const denyBtn = document.getElementById('privacy-deny');
    if (denyBtn) {
        denyBtn.addEventListener('click', () => {
            appState.privacyConsent = false;
            const bannerEl = document.getElementById('privacy-consent');
            if (bannerEl) bannerEl.setAttribute('hidden', 'true');
        });
    }

    // --- Onboarding ---
    const onboarding = document.getElementById('onboarding');
    const obNext = document.getElementById('ob-next');
    const obSkip = document.getElementById('ob-skip');
    const obSteps = document.querySelectorAll('.onboarding-step');
    const obDots = document.querySelectorAll('.ob-dot');
    let currentObStep = 0;

    if (!appState.onboardingComplete && onboarding) {
        onboarding.removeAttribute('hidden');
    }
    const updateOnboarding = () => {
        obSteps.forEach((s, idx) => s.classList.toggle('active', idx === currentObStep));
        obDots.forEach((d, idx) => d.classList.toggle('active', idx === currentObStep));
        if (currentObStep >= obSteps.length - 1) {
            if (obNext) obNext.textContent = 'はじめる';
        } else {
            if (obNext) obNext.textContent = '次へ →';
        }
    };
    if (obNext) {
        obNext.addEventListener('click', () => {
            if (currentObStep >= obSteps.length - 1) {
                appState.onboardingComplete = true;
                localStorage.setItem('onboardingComplete', 'true');
                if (onboarding) onboarding.setAttribute('hidden', 'true');
            } else {
                currentObStep++;
                updateOnboarding();
            }
        });
    }
    if (obSkip) {
        obSkip.addEventListener('click', () => {
            appState.onboardingComplete = true;
            localStorage.setItem('onboardingComplete', 'true');
            if (onboarding) onboarding.setAttribute('hidden', 'true');
        });
    }
    obDots.forEach((dot, idx) => {
        dot.addEventListener('click', () => {
            currentObStep = idx;
            updateOnboarding();
        });
    });

    // --- Header Settings (Lang, Font, Color) & Mobile Toggle ---
    const settingsToggleBtn = document.getElementById('mobile-settings-toggle');
    const settingsDropdown = document.getElementById('settings-dropdown');
    if (settingsToggleBtn && settingsDropdown) {
        settingsToggleBtn.addEventListener('click', () => {
            const isExpanded = settingsToggleBtn.getAttribute('aria-expanded') === 'true';
            settingsToggleBtn.setAttribute('aria-expanded', !isExpanded);
            settingsDropdown.classList.toggle('show');
        });
        
        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!settingsToggleBtn.contains(e.target) && !settingsDropdown.contains(e.target)) {
                settingsToggleBtn.setAttribute('aria-expanded', 'false');
                settingsDropdown.classList.remove('show');
            }
        });
    }

    const translations = {
        "title": "Kanto Local Food Map", "subtitle": "Find seasonal local specialties!", "gpsTitle": "Find specialties near you", "gpsBtn": "Get Location", "event": "📅 Events", "weatherTitle": "Weather Recommend", "weatherGet": "Get Weather", "quizTitle": "Local Food Quiz", "swipeTitle": "Intuitive Matching", "swipeDesc": "Drag cards or use buttons!", "swipeMatched": "Matched Foods", "aiTitle": "AI Sommelier", "aiGreeting": "Do you have any plans? (e.g., Seafood with partner)", "chatSend": "Send", "routeTitle": "Tour Planner", "routeCreate": "Generate Plan", "officialX": "Official X", "officialHP": "University HP",
        "lang": "Language", "fontSize": "Font Size", "std": "Standard", "large": "Large", "bgColor": "Background", "black": "Dark", "white": "Light",
        "news1": "Recommended for weekend trips! Kanto spring gourmet feature", "news2": "Local harvest festivals being held in each prefecture", "news3": "Specialty data with photos and ratings increased to 56 items!",
        "rateTitle": "Rate this tool", "rateDesc": "Did it help you find new food experiences?", "commentLabel": "Feedback & Comments", "submit": "Submit Rating",
        "searchTitle": "Seasonal Local Food Search", "seasonLabel": "🌸 Season:", "seasonAll": "All Seasons", "seasonSpring": "Spring", "seasonSummer": "Summer", "seasonAutumn": "Autumn", "seasonWinter": "Winter",
        "prefLabel": "🗾 Area:", "prefAll": "All Areas", "prefIbaraki": "Ibaraki", "prefTochigi": "Tochigi", "prefGunma": "Gunma", "prefSaitama": "Saitama", "prefChiba": "Chiba", "prefTokyo": "Tokyo", "prefKanagawa": "Kanagawa",
        "catLabel": "🏷 Category:", "catAll": "All Categories", "catVeg": "🥬 Vegetables", "catFruit": "🍑 Fruits", "catSeafood": "🐟 Seafood", "catMeat": "🥩 Meat", "catLocal": "🍱 Local Dish", "catProcessed": "🏪 Processed", "catSweets": "🍡 Sweets", "catMushroom": "🍄 Mushroom", "catRice": "🌾 Rice", "catGrain": "🌾 Grain",
        "kwLabel": "🔍 Keyword:", "kwPlaceholder": "e.g. strawberry, tuna...", "searchBtn": "Discover Food",
        "featureTitle": "Food & Tourism Experience Tools", "gps": "🗺️ Location", "weather": "⛅ Weather", "quiz": "🧩 Quiz", "swipe": "👆 Swipe Match", "ai": "🤖 AI Sommelier", "recipeTab": "🍳 AI Recipe",
        "localDish": "🍴 Related Local Dish", "marketInfo": "🛒 Where to enjoy?", "mapSearch": "📍 Search on Google Maps",
        "privacyNotice": "* Location information used in this service will not be provided to third parties.", "privacyLink": "About Privacy",
        "aiImageNotice": "* All images featured on this site are illustrative images generated by AI.",
        "obWelcomeTitle": "Welcome!", "obWelcomeDesc": "A map to experience seasonal gourmet foods and sightseeing spots in 7 Kanto prefectures.",
        "obMapTitle": "Search by Map", "obMapDesc": "Hover over icons to see specialties. Click to automatically filter the search results!",
        "obAiTitle": "AI Sommelier & Multi-lang", "obAiDesc": "Ask for travel advice naturally, and use the top-right button to switch to English (English)!",
        "obFavTitle": "Save Favorites", "obFavDesc": "Bookmark your favorite ingredients. Check out the local dishes too!",
        "obSkip": "Skip", "obNext": "Next →"
    };
    const toggleLanguage = (lang) => {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            if (lang === 'en' && translations[key]) {
                el.dataset.ja = el.dataset.ja || el.textContent;
                el.textContent = translations[key];
            } else if (lang === 'jp' && el.dataset.ja) {
                el.textContent = el.dataset.ja;
            }
        });
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.dataset.i18nPlaceholder;
            if (lang === 'en' && translations[key]) {
                el.dataset.jaPlaceholder = el.dataset.jaPlaceholder || el.placeholder;
                el.placeholder = translations[key];
            } else if (lang === 'jp' && el.dataset.jaPlaceholder) {
                el.placeholder = el.dataset.jaPlaceholder;
            }
        });
        document.querySelectorAll('[data-i18n-id]').forEach(el => {
            const id = el.dataset.i18nId;
            const type = el.dataset.i18nType;
            if (lang === 'en' && typeof foodTranslations !== 'undefined' && foodTranslations[id]) {
                el.dataset.jaText = el.dataset.jaText || el.textContent;
                el.textContent = foodTranslations[id][type] || el.textContent;
            } else if (lang === 'jp' && el.dataset.jaText) {
                el.textContent = el.dataset.jaText;
            }
        });
    };
    const langJp = document.getElementById('lang-jp');
    const langEn = document.getElementById('lang-en');
    if (langJp && langEn) {
        langJp.addEventListener('click', () => {
            langJp.classList.add('active'); langEn.classList.remove('active');
            toggleLanguage('jp');
            showToast('日本語に切り替えました');
        });
        langEn.addEventListener('click', () => {
            langEn.classList.add('active'); langJp.classList.remove('active');
            toggleLanguage('en');
            showToast('Switched to English');
        });
    }

    const fontStd = document.getElementById('font-std');
    const fontLg = document.getElementById('font-lg');
    if (fontStd && fontLg) {
        fontStd.addEventListener('click', () => {
            fontStd.classList.add('active'); fontLg.classList.remove('active');
            document.documentElement.style.fontSize = '16px';
        });
        fontLg.addEventListener('click', () => {
            fontLg.classList.add('active'); fontStd.classList.remove('active');
            document.documentElement.style.fontSize = '18px';
        });
    }

    const colorDark = document.getElementById('color-dark');
    const colorLight = document.getElementById('color-light');
    if (colorDark && colorLight) {
        colorDark.addEventListener('click', () => {
            colorDark.classList.add('active'); colorLight.classList.remove('active');
            body.classList.remove('light-mode'); // Assuming default is dark mode
        });
        colorLight.addEventListener('click', () => {
            colorLight.classList.add('active'); colorDark.classList.remove('active');
            body.classList.add('light-mode');
        });
    }

    // --- Favorites Logic ---
    const favCount = document.getElementById('fav-count');
    const updateFavBadge = () => {
        if (favCount) {
            if (appState.favorites.length > 0) {
                favCount.removeAttribute('hidden');
                favCount.textContent = appState.favorites.length;
            } else {
                favCount.setAttribute('hidden', 'true');
            }
        }
    };
    updateFavBadge();

    const toggleFav = (id, btn) => {
        const numId = parseInt(id, 10);
        const idx = appState.favorites.indexOf(numId);
        if (idx === -1) {
            appState.favorites.push(numId);
            if (btn) btn.classList.add('active');
            showToast('お気に入りに追加しました ❤');
        } else {
            appState.favorites.splice(idx, 1);
            if (btn) btn.classList.remove('active');
            showToast('お気に入りから削除しました');
        }
        localStorage.setItem('favorites', JSON.stringify(appState.favorites));
        updateFavBadge();
        // Render favorites if drawer is open
        if (favDrawer && !favDrawer.hasAttribute('hidden')) {
            renderFavorites();
        }
    };

    // --- Favorites Drawer ---
    const favOpenBtn = document.getElementById('fav-open-btn');
    const favCloseBtn = document.getElementById('fav-close');
    const favBackdrop = document.getElementById('fav-backdrop');
    const favDrawer = document.getElementById('fav-drawer');
    const favList = document.getElementById('fav-list');
    const favEmpty = document.getElementById('fav-empty');
    const favShareBtn = document.getElementById('fav-share-btn');

    const openFavDrawer = () => {
        if (favDrawer && favBackdrop) {
            favDrawer.removeAttribute('hidden');
            favBackdrop.removeAttribute('hidden');
            // Trigger reflow to guarantee CSS transition runs properly
            void favDrawer.offsetWidth;
            favDrawer.classList.add('is-open');
            renderFavorites();
        }
    };
    const closeFavDrawer = () => {
        if (favDrawer && favBackdrop) {
            favDrawer.classList.remove('is-open');
            // Hide elements after transition completes (400ms)
            setTimeout(() => {
                favDrawer.setAttribute('hidden', 'true');
                favBackdrop.setAttribute('hidden', 'true');
            }, 400);
        }
    };
    if (favOpenBtn) favOpenBtn.addEventListener('click', openFavDrawer);
    if (favCloseBtn) favCloseBtn.addEventListener('click', closeFavDrawer);
    if (favBackdrop) favBackdrop.addEventListener('click', closeFavDrawer);

    const renderFavorites = () => {
        if (!favList) return;
        const favs = specialtyDatabase.filter(i => appState.favorites.includes(parseInt(i.id, 10)));
        if (favs.length > 0) {
            if (favEmpty) favEmpty.setAttribute('hidden', 'true');
            if (favShareBtn) favShareBtn.removeAttribute('hidden');
            renderCards(favs, 'fav-list');
        } else {
            if (favEmpty) favEmpty.removeAttribute('hidden');
            if (favShareBtn) favShareBtn.setAttribute('hidden', 'true');
            favList.textContent = '';
        }
    };

    if (favShareBtn) {
        favShareBtn.addEventListener('click', async () => {
            const favNames = specialtyDatabase.filter(i => appState.favorites.includes(parseInt(i.id, 10))).map(i => i.name).join(', ');
            const shareText = `私のお気に入りご当地グルメは: ${favNames} です！\n#関東食の旅 #旬食材マップ`;
            if (navigator.share) {
                try { await navigator.share({ title: '私のお気に入りグルメ', text: shareText }); } catch (e) { /* ignored */ }
            } else {
                await navigator.clipboard.writeText(shareText).then(() => showToast('クリップボードにコピーしました！')).catch(() => showToast('コピーに失敗しました'));
            }
        });
    }

    // --- Scroll to Top ---
    const scrollTopBtn = document.getElementById('scroll-to-top');
    if (scrollTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) scrollTopBtn.removeAttribute('hidden');
            else scrollTopBtn.setAttribute('hidden', 'true');
        });
        scrollTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // --- Intersection Observer for animations ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) { e.target.style.opacity = 1; e.target.style.transform = 'translateY(0)'; } });
    }, { threshold: 0.1 });
    document.querySelectorAll('.animate-on-scroll').forEach(el => { el.style.opacity = 0; el.style.transform = 'translateY(20px)'; el.style.transition = 'all 0.6s ease-out'; observer.observe(el); });

    // --- Sliders ---
    let currentSlide = 0;
    const sliderWrapper = document.getElementById('slider-wrapper');
    const sliderDots = document.querySelectorAll('.slider-dot');
    if (sliderWrapper) {
        const slides = document.querySelectorAll('.slide');
        setInterval(() => {
            currentSlide = (currentSlide + 1) % slides.length;
            sliderWrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
            sliderDots.forEach((d, idx) => d.classList.toggle('active', idx === currentSlide));
        }, 5000);
    }
    if (sliderDots) {
        sliderDots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                currentSlide = parseInt(e.target.dataset.slide);
                sliderWrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
                sliderDots.forEach((d, idx) => d.classList.toggle('active', idx === currentSlide));
            });
        });
    }

    // --- Map Hover & Click Processing ---
    const prefHits = document.querySelectorAll('.pref-hit');
    const topicBox = document.getElementById('topic-box');
    const topicTitle = document.getElementById('topic-title');
    const topicDesc = document.getElementById('topic-description');
    const topicImg = document.getElementById('topic-image');
    const topicBadge = document.getElementById('topic-pref-badge');

    const prefNames = {
        gunma: '群馬県', tochigi: '栃木県', ibaraki: '茨城県',
        saitama: '埼玉県', chiba: '千葉県', tokyo: '東京都', kanagawa: '神奈川県'
    };

    const kantoSvg = document.getElementById('kanto-svg');

    prefHits.forEach(hit => {
        hit.addEventListener('mouseenter', (e) => {
            const prefId = e.target.dataset.target;

            // 1. マップ画像の強調処理
            if (kantoSvg) kantoSvg.classList.add('has-hover');
            const imgEl = document.getElementById(prefId);
            if (imgEl) imgEl.classList.add('is-hovered');

            const items = specialtyDatabase.filter(i => i.prefecture === prefId);
            if (items.length > 0) {
                // Show a random item from this prefecture
                const item = items[Math.floor(Math.random() * items.length)];
                if (topicBadge) topicBadge.textContent = prefNames[prefId];
                if (topicTitle) topicTitle.textContent = item.name;
                if (topicDesc) topicDesc.textContent = item.description;
                if (topicImg) {
                    topicImg.src = item.imageSrc;
                    topicImg.style.display = 'block';
                }
                // 2. トピックボックスの表示
                if (topicBox) topicBox.classList.add('is-visible');
            }
        });
        hit.addEventListener('mouseleave', (e) => {
            const prefId = e.target.dataset.target;
            if (kantoSvg) kantoSvg.classList.remove('has-hover');
            const imgEl = document.getElementById(prefId);
            if (imgEl) imgEl.classList.remove('is-hovered');

            // 3. トピックボックスの非表示
            if (topicBox) topicBox.classList.remove('is-visible');
        });
        hit.addEventListener('click', (e) => {
            const prefId = e.target.dataset.target;
            
            // 検索セクションのドロップダウンを選択
            const prefSelect = document.getElementById('pref-select');
            if (prefSelect) {
                prefSelect.value = prefId;
                
                // changeイベントを発火させて doSearch() を自動実行
                prefSelect.dispatchEvent(new Event('change'));
                
                // 検索エリアまでスムーズにスクロール
                const searchSection = document.getElementById('search-form');
                if (searchSection) {
                    searchSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
    });

    // --- Render Cards Core (with pagination support) ---
    const PAGE_SIZE = 24; // 504件を24件ずつ表示

    const makeCard = (item) => {
        const card = document.createElement('div');
        card.className = 'specialty-card';
        card.tabIndex = 0;
        const isFav = appState.favorites.includes(item.id);

        const img = document.createElement('img');
        img.src = item.imageSrc || item.imageUrl;
        img.alt = item.name;
        img.loading = 'lazy';
        img.onerror = () => { img.onerror = null; img.src = 'https://placehold.co/200x200/334155/white?text=No+Image'; };

        const h4 = document.createElement('h4');
        h4.dataset.i18nId = item.id;
        h4.dataset.i18nType = "name";
        const currentLang = document.getElementById('lang-en') && document.getElementById('lang-en').classList.contains('active') ? 'en' : 'jp';
        if (currentLang === 'en' && typeof foodTranslations !== 'undefined' && foodTranslations[item.id]) {
            h4.dataset.jaText = item.name;
            h4.textContent = foodTranslations[item.id].name;
        } else {
            h4.textContent = item.name;
        }

        // カテゴリバッジ
        const catBadge = document.createElement('span');
        catBadge.style.cssText = 'display:block;font-size:0.7rem;color:var(--text-sec);text-align:center;margin: -8px 16px 8px;opacity:0.8;';
        catBadge.textContent = item.category || '';

        const btn = document.createElement('button');
        btn.className = `fav-icon-btn ${isFav ? 'active' : ''}`;
        btn.setAttribute('aria-label', 'お気に入り');
        btn.textContent = '❤';

        card.appendChild(img); card.appendChild(h4); card.appendChild(catBadge); card.appendChild(btn);
        btn.addEventListener('click', (e) => { e.stopPropagation(); toggleFav(item.id, btn); });
        card.onclick = () => openModal(item);
        return card;
    };

    const renderCards = (list, containerId, opts = {}) => {
        const container = document.getElementById(containerId);
        if (!container) return;
        if (!opts.append) container.textContent = '';

        // For small lists (favorites / GPS), render all at once
        if (list.length <= PAGE_SIZE || opts.append) {
            if (list.length === 0 && !opts.append) {
                const p = document.createElement('p');
                p.style.cssText = 'grid-column:1/-1; color:var(--text-sec); padding:40px; text-align:center;';
                p.textContent = '条件に一致するグルメは見つかりませんでした。';
                container.appendChild(p);
            } else {
                list.forEach(item => container.appendChild(makeCard(item)));
            }
            return;
        }

        // Paginated render for large lists (results-container)
        let page = 0;
        const renderPage = () => {
            const start = page * PAGE_SIZE;
            const chunk = list.slice(start, start + PAGE_SIZE);
            chunk.forEach(item => container.appendChild(makeCard(item)));
            page++;

            // Remove existing load-more button
            const old = container.parentElement.querySelector('.load-more-btn');
            if (old) old.remove();

            if (page * PAGE_SIZE < list.length) {
                const remaining = list.length - page * PAGE_SIZE;
                const moreBtn = document.createElement('button');
                moreBtn.className = 'load-more-btn neon-button';
                moreBtn.style.cssText = 'margin: 24px auto; display:block; background: var(--bg-sec); border:2px solid var(--accent); color:var(--accent); box-shadow:none;';
                moreBtn.textContent = `さらに表示 (残り${remaining}件)`;
                moreBtn.addEventListener('click', () => {
                    moreBtn.remove();
                    renderPage();
                });
                container.parentElement.appendChild(moreBtn);
            } else {
                // Count label
                const countEl = container.parentElement.querySelector('.results-count');
                if (countEl) countEl.textContent = `全${list.length}件表示中`;
            }
        };
        renderPage();
    };

    // --- Search & Filter (with category) ---
    const searchForm = document.getElementById('search-form');
    const seasonSelect = document.getElementById('season-select');
    const prefSelect = document.getElementById('pref-select');
    const categorySelect = document.getElementById('category-select');
    const keywordInput = document.getElementById('keyword-input');

    const doSearch = () => {
        const season = seasonSelect ? seasonSelect.value : 'all';
        const pref = prefSelect ? prefSelect.value : 'all';
        const cat = categorySelect ? categorySelect.value : 'all';
        const kw = keywordInput ? keywordInput.value.trim() : '';

        let filtered = specialtyDatabase;
        if (season !== 'all') filtered = filtered.filter(i => i.season === season);
        if (pref !== 'all') filtered = filtered.filter(i => i.prefecture === pref);
        if (cat !== 'all') filtered = filtered.filter(i => detectCategory(i.name) === cat);
        if (kw) filtered = filtered.filter(i => i.name.includes(kw) || (i.description && i.description.includes(kw)));

        // Update count label
        const countEl = document.querySelector('.results-count');
        if (countEl) countEl.textContent = `検索結果: ${filtered.length}件`;

        renderCards(filtered, 'results-container');
        const rc = document.getElementById('results-container');
        if (rc) rc.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    if (searchForm) searchForm.addEventListener('submit', (e) => { e.preventDefault(); doSearch(); });
    // Live filter on select change
    if (seasonSelect) seasonSelect.addEventListener('change', doSearch);
    if (prefSelect) prefSelect.addEventListener('change', doSearch);
    if (categorySelect) categorySelect.addEventListener('change', doSearch);

    // --- Load Database from Backend ---
    const initDatabaseFromBackend = async () => {
        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ season: 'all', prefecture: 'all' })
            });
            if (!response.ok) throw new Error('API Error');
            specialtyDatabase = await response.json();
            console.log('Database successfully loaded from backend. Count:', specialtyDatabase.length);
        } catch (e) {
            console.error('Failed to load database from backend, using fallback data.js:', e);
            specialtyDatabase = window.specialtyDatabase || [];
        }

        // ロード後に初期化するべき表示まわり
        renderCards(specialtyDatabase, 'results-container');
        updateFavBadge();
    };

    // 起動！
    initDatabaseFromBackend();



    // --- Tab Switching ---
    const tabItems = document.querySelectorAll('.tab-item');
    const tabPanes = document.querySelectorAll('.tab-pane');
    tabItems.forEach(tab => {
        tab.addEventListener('click', () => {
            tabItems.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); t.setAttribute('tabindex', '-1'); });
            tabPanes.forEach(p => { p.classList.remove('active'); p.setAttribute('hidden', 'true'); });

            tab.classList.add('active');
            tab.setAttribute('aria-selected', 'true'); tab.setAttribute('tabindex', '0');

            const target = document.getElementById(tab.dataset.tab);
            if (target) {
                target.classList.add('active');
                target.removeAttribute('hidden');
            }
            if (tab.dataset.tab === 'tab-quiz') window.loadQuiz && window.loadQuiz();
            if (tab.dataset.tab === 'tab-swipe') initSwipe();
            if (tab.dataset.tab === 'tab-gps') {
                if (window.leafletMap) window.leafletMap.invalidateSize();
            }
        });
    });



    // --- Swipe Feature ---
    const swipeImg = document.getElementById('swipe-img');
    const swipeName = document.getElementById('swipe-name');
    const swipeDesc = document.getElementById('swipe-desc');
    const initSwipe = () => {
        if (appState.swipeDeck.length === 0) {
            appState.swipeDeck = [...specialtyDatabase].sort(() => Math.random() - 0.5);
            appState.swipeIndex = 0;
            document.getElementById('swipe-results').textContent = '';
        }
        renderSwipeCard();
    };
    const renderSwipeCard = () => {
        const card = document.getElementById('swipe-card');
        if (!card) return;
        if (appState.swipeIndex >= appState.swipeDeck.length) {
            if (swipeImg) swipeImg.style.display = 'none';
            if (swipeName) swipeName.textContent = '🎉 全カード完了！';
            if (swipeDesc) {
                swipeDesc.textContent = '';
                const btn = document.createElement('button'); btn.className = 'neon-button'; btn.textContent = '🔄 もう一度シャッフル';
                btn.onclick = () => { appState.swipeDeck = []; initSwipe(); swipeImg.style.display = 'block'; };
                swipeDesc.appendChild(btn);
            }
            return;
        }
        const item = appState.swipeDeck[appState.swipeIndex];
        if (swipeImg) swipeImg.src = item.imageSrc || item.imageUrl;
        if (swipeName) swipeName.textContent = item.name;
        if (swipeDesc) swipeDesc.textContent = item.description;
    };

    const swipeLike = document.getElementById('swipe-yes');
    const swipePass = document.getElementById('swipe-no');

    const appendMatched = (item) => {
        const resContainer = document.getElementById('swipe-results');
        if (!resContainer) return;
        const div = document.createElement('div');
        div.className = 'specialty-card'; div.style.cursor = 'pointer';
        div.innerHTML = `<img src="${item.imageSrc || item.imageUrl}" style="width:100%;height:100px;object-fit:cover;"><h4>${item.name}</h4>`;
        div.onclick = () => openModal(item);
        resContainer.appendChild(div);
    };

    if (swipeLike) swipeLike.addEventListener('click', () => {
        if (appState.swipeIndex >= appState.swipeDeck.length) return;
        const item = appState.swipeDeck[appState.swipeIndex];
        // Animate
        const card = document.getElementById('swipe-card');
        card.style.transform = 'translateX(100px) rotate(15deg)';
        card.style.opacity = '0';

        if (!appState.favorites.includes(item.id)) { toggleFav(item.id); }
        appendMatched(item);

        setTimeout(() => {
            appState.swipeIndex++;
            card.style.transition = 'none';
            card.style.transform = 'translateX(0) rotate(0)';
            card.style.opacity = '1';
            renderSwipeCard();
            setTimeout(() => card.style.transition = 'transform 0.4s ease, opacity 0.4s ease', 50);
        }, 400);
    });
    if (swipePass) swipePass.addEventListener('click', () => {
        if (appState.swipeIndex >= appState.swipeDeck.length) return;
        // Animate
        const card = document.getElementById('swipe-card');
        card.style.transform = 'translateX(-100px) rotate(-15deg)';
        card.style.opacity = '0';

        setTimeout(() => {
            appState.swipeIndex++;
            card.style.transition = 'none';
            card.style.transform = 'translateX(0) rotate(0)';
            card.style.opacity = '1';
            renderSwipeCard();
            setTimeout(() => card.style.transition = 'transform 0.4s ease, opacity 0.4s ease', 50);
        }, 400);
    });

    // --- AI Sommelier Chat (Backend API + fallback) ---
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send');
    let chatHistory = [];

    // textarea: auto-resize
    if (chatInput) {
        chatInput.addEventListener('input', () => {
            chatInput.style.height = 'auto';
            chatInput.style.height = Math.min(chatInput.scrollHeight, 120) + 'px';
        });
    }

    if (chatSendBtn && chatInput) {
        const doChat = async () => {
            const text = chatInput.value.trim(); if (!text) return;
            chatInput.value = '';
            chatInput.style.height = 'auto';
            await sendChatMessage(text);
        };
        chatSendBtn.addEventListener('click', doChat);
        chatInput.addEventListener('keydown', e => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doChat(); }
        });
    }

    const sendChatMessage = async (text) => {
        const chatWindow = document.getElementById('chat-window');
        const userMsg = document.createElement('div'); userMsg.className = 'chat-msg user'; userMsg.textContent = text; chatWindow.appendChild(userMsg);
        chatWindow.scrollTop = chatWindow.scrollHeight;

        const botMsg = document.createElement('div'); botMsg.className = 'chat-msg bot';
        botMsg.textContent = '💭 考え中...';
        chatWindow.appendChild(botMsg);
        chatWindow.scrollTop = chatWindow.scrollHeight;

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: text, history: chatHistory })
            });
            if (!response.ok) throw new Error('API Error');
            const data = await response.json();
            botMsg.innerHTML = window.marked ? marked.parse(data.reply) : data.reply;
            chatHistory.push({ role: 'user', content: text });
            chatHistory.push({ role: 'assistant', content: data.reply });
        } catch (e) {
            // フォールバック: パターンマッチ（Ollamaが動いていません）
            console.warn('（Ollamaが動いていません）', e);
            const chatPatterns = [
                { re: /ネギ|葱/, res: '群馬の「下仁田ネギ」（冬）や埼玉の「深谷ネギ」（冬）がおすすめです！' },
                { re: /海鮮|魚|マグロ/, res: '神奈川の「三崎マグロ」や茨城の「あんこう鍋」がおすすめです！' },
                { re: /フルーツ|果物|甘い/, res: '茨城の「メロン」（夏）や栃木の「とちおとめ」（春）が最高です！' },
                { re: /野菜/, res: '群馬の「高原レタス」（夏）、茨城の「れんこん」（秋・日本一）がおすすめです！' },
                { re: /秋|紅葉/, res: '秋なら茨城の「れんこん」「笠間の栗」、群馬の「まいたけ」が旬です！' },
                { re: /夏|暑/, res: '夏なら茨城の「メロン」や千葉の「梨」「すいか」が旬です！' },
                { re: /春/, res: '春なら栃木の「いちご」や神奈川の「湘南しらす」が旬です！' },
                { re: /冬|鍋/, res: '冬なら茨城の「あんこう鍋」や群馬の「下仁田ネギ」で温まりましょう！' },
                { re: /茨城|いばらき/, res: '茨城はメロン（夏・日本一）、れんこん（秋・日本一）、あんこう鍋（冬）が有名です！' },
                { re: /栃木|とちぎ/, res: '栃木はいちご（春・日本一）、宇都宮餃子が有名です！' },
                { re: /群馬|ぐんま/, res: '群馬はこんにゃく（秋・全国90%）、下仁田ネギ（冬）が有名です！' },
                { re: /埼玉|さいたま/, res: '埼玉は狭山茶（春）、川越芋（秋）、深谷ネギ（冬）が有名です！' },
                { re: /千葉|ちば/, res: '千葉は落花生（秋・日本一）、梨（夏・日本一）が有名です！' },
                { re: /東京|とうきょう/, res: '東京は江戸前あさり（春）、東京うど（春）、小松菜（冬）があります！' },
                { re: /神奈川|横浜|湘南/, res: '神奈川は三崎マグロ（冬）、湘南しらす（春）、三浦大根（冬）が有名です！' },
            ];
            let res = '';
            for (const { re, res: r } of chatPatterns) { if (re.test(text)) { res = r; break; } }
            if (!res) res = '（Ollamaが動いていません）県名や季節を指定して質問してください！';
            botMsg.textContent = '';
            let i = 0;
            const typeInterval = setInterval(() => { botMsg.textContent += res[i]; i++; chatWindow.scrollTop = chatWindow.scrollHeight; if (i >= res.length) clearInterval(typeInterval); }, 30);
        }
        chatWindow.scrollTop = chatWindow.scrollHeight;
    };

    // --- Voice Input (AI Sommelier) ---
    const voiceBtn = document.getElementById('voice-btn');
    if (voiceBtn && chatInput) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            voiceBtn.style.display = 'none'; // Hide if not supported
        } else {
            const recognition = new SpeechRecognition();
            recognition.lang = 'ja-JP';
            recognition.interimResults = false;
            recognition.maxAlternatives = 1;

            let isRecording = false;

            recognition.onstart = () => {
                isRecording = true;
                voiceBtn.classList.add('recording');
                voiceBtn.textContent = '🛑';
                chatInput.placeholder = '音声入力中... 話しかけてください';
                showToast('音声入力受付中 🎤');
            };

            recognition.onend = () => {
                isRecording = false;
                voiceBtn.classList.remove('recording');
                voiceBtn.textContent = '🎤';
                chatInput.placeholder = 'メッセージを入力...';
            };

            recognition.onerror = (event) => {
                console.warn('Speech recognition error:', event.error);
                if (event.error === 'not-allowed') {
                    showToast('マイクの使用を許可してください');
                } else if (event.error !== 'no-speech') {
                    showToast('音声認識エラーが発生しました');
                }
            };

            recognition.onresult = (event) => {
                const resultText = event.results[0][0].transcript;
                chatInput.value = resultText;
            };

            voiceBtn.addEventListener('click', () => {
                if (isRecording) {
                    recognition.stop();
                } else {
                    recognition.start();
                }
            });
        }
    }


    // --- GPS Feature ---
    function executeGPS(lat, lon, label) {
        const mapEl = document.getElementById('gps-map');
        if (mapEl) mapEl.style.display = 'block';
        if (window.L) {
            if (!window.leafletMap) {
                window.leafletMap = L.map('gps-map').setView([lat, lon], 13);
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '© OpenStreetMap' }).addTo(window.leafletMap);
            } else { window.leafletMap.setView([lat, lon], 13); }
            if (window.gpsMarker) window.gpsMarker.remove();
            window.gpsMarker = L.marker([lat, lon]).addTo(window.leafletMap).bindPopup(label).openPopup();
        }
        fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`, { headers: { 'Accept-Language': 'ja' } }).then(res => res.json()).then(data => {
            const pref = data.address.province || data.address.state || data.address.region || '東京'; let prefId = 'tokyo';
            if (pref.includes('茨城')) prefId = 'ibaraki'; else if (pref.includes('栃木')) prefId = 'tochigi'; else if (pref.includes('群馬')) prefId = 'gunma'; else if (pref.includes('埼玉')) prefId = 'saitama'; else if (pref.includes('千葉')) prefId = 'chiba'; else if (pref.includes('神奈川')) prefId = 'kanagawa';
            const localFoods = specialtyDatabase.filter(i => i.prefecture === prefId);

            // XSS対策: 外部APIからのデータをエスケープ
            const safeLabel = String(label).replace(/[&<>"']/g, match => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[match]);
            const safePref = String(pref).replace(/[&<>"']/g, match => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[match]);

            const resultContainer = document.getElementById('gps-result-container');
            resultContainer.textContent = '';
            const p1 = document.createElement('p');
            p1.style.cssText = 'color:var(--success);font-weight:bold;font-size:1.1rem;grid-column:1/-1;';
            p1.textContent = `📍 ${safeLabel} (${safePref}) のおすすめ`;
            resultContainer.appendChild(p1);

            if (localFoods.length > 0) renderCards(localFoods, 'gps-result-container', { append: true });
            else {
                const p2 = document.createElement('p'); p2.style.cssText = 'grid-column:1/-1;'; p2.textContent = '周辺の特産品データはありません。'; resultContainer.appendChild(p2);
            }
        }).catch(() => {
            const resultContainer = document.getElementById('gps-result-container');
            resultContainer.textContent = '';
            const pErr = document.createElement('p'); pErr.style.cssText = 'color:var(--danger);grid-column:1/-1;'; pErr.textContent = '地名変換APIが制限されています。'; resultContainer.appendChild(pErr);
        });
    }
    const gpsBtn = document.getElementById('gps-btn');
    if (gpsBtn) {
        gpsBtn.addEventListener('click', () => {
            if (!appState.privacyConsent) { document.getElementById('privacy-consent').removeAttribute('hidden'); return; }
            const resultContainer = document.getElementById('gps-result-container');
            resultContainer.textContent = ''; const pLoading = document.createElement('p'); pLoading.textContent = '位置情報を取得中...'; pLoading.style.gridColumn = '1/-1'; resultContainer.appendChild(pLoading);
            navigator.geolocation.getCurrentPosition(
                pos => executeGPS(pos.coords.latitude, pos.coords.longitude, "現在地"),
                (err) => {
                    console.warn('GPS Error:', err);
                    resultContainer.textContent = ''; const pErr = document.createElement('p'); pErr.style.cssText = 'color:var(--warning);grid-column:1/-1;'; pErr.textContent = '位置情報がブロックされました。代わりに「東京駅」の情報を表示します。'; resultContainer.appendChild(pErr);
                    setTimeout(() => executeGPS(35.6812, 139.7671, "東京駅 (代替)"), 1000);
                },
                { timeout: 10000 }
            );
        });
    }
    const gpsManualBtn = document.getElementById('gps-manual-btn');
    if (gpsManualBtn) {
        gpsManualBtn.addEventListener('click', async () => {
            const query = document.getElementById('gps-manual-input').value; if (!query) return;
            const resultContainer = document.getElementById('gps-result-container');
            resultContainer.textContent = ''; const pLoading = document.createElement('p'); pLoading.textContent = '検索中...'; pLoading.style.gridColumn = '1/-1'; resultContainer.appendChild(pLoading);
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`); const data = await res.json();
                if (data.length > 0) executeGPS(data[0].lat, data[0].lon, data[0].display_name.split(',')[0]);
                else { resultContainer.textContent = ''; const pNF = document.createElement('p'); pNF.textContent = '見つかりませんでした。'; pNF.style.gridColumn = '1/-1'; resultContainer.appendChild(pNF); }
            } catch (e) { resultContainer.textContent = ''; const pErr = document.createElement('p'); pErr.textContent = '検索エラー'; pErr.style.gridColumn = '1/-1'; resultContainer.appendChild(pErr); }
        });
    }

    // --- Weather Feature ---
    const weatherBtn = document.getElementById('weather-btn');
    if (weatherBtn) {
        weatherBtn.addEventListener('click', () => {
            if (!appState.privacyConsent) { document.getElementById('privacy-consent').removeAttribute('hidden'); return; }
            const ws = document.getElementById('weather-status'); const wc = document.getElementById('weather-comment'); ws.textContent = '取得中...';
            navigator.geolocation.getCurrentPosition(async (pos) => {
                try {
                    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&current_weather=true`);
                    const data = await res.json(); const temp = data.current_weather.temperature; const code = data.current_weather.weathercode;
                    let condition = '晴れ'; if (code >= 1 && code <= 3) condition = '曇り'; else if (code >= 51 && code <= 67) condition = '雨'; else if (code >= 71) condition = '雪';

                    let rec = '';
                    if (temp >= 25) rec = '暑いですね！さっぱりした「あさり」や千葉の「梨」がおすすめです！';
                    else if (temp <= 12) rec = '寒いですね。群馬の「下仁田ネギ」や茨城の「あんこう鍋」で温まりましょう！';
                    else rec = 'お出かけ日和ですね！栃木の「いちご」狩りなどいかがですか？';

                    ws.textContent = `${condition} / ${temp}℃`;
                    wc.textContent = '';
                    const wcWrap = document.createElement('div'); wcWrap.style.cssText = 'display:flex;align-items:center;gap:10px;';
                    const wcIcon = document.createElement('span'); wcIcon.style.fontSize = '2rem'; wcIcon.textContent = condition === '晴れ' ? '☀️' : (condition === '雨' ? '☔' : '☁️');
                    const wcText = document.createElement('span'); wcText.textContent = `気温${temp}℃ですね。`;
                    wcText.appendChild(document.createElement('br')); wcText.appendChild(document.createTextNode(rec));
                    wcWrap.appendChild(wcIcon); wcWrap.appendChild(wcText); wc.appendChild(wcWrap);
                } catch (e) { ws.textContent = 'エラー'; wc.textContent = '天気の取得に失敗しました。'; }
            },
                (err) => { console.warn('Weather GPS Error:', err); ws.textContent = '位置情報なし'; wc.textContent = '位置情報を取得できませんでした。ブラウザの設定をご確認ください。'; },
                { timeout: 10000 }
            );
        });
    }

    // --- Gamified Quiz Logic ---
    window.loadQuiz = function () {
        appState.quizLevel = parseInt(localStorage.getItem('quizLevel')) || 1;
        appState.quizScore = parseInt(localStorage.getItem('quizScore')) || 0;

        // 8 questions total. Difficulty increases as user progresses.
        const fullQuizPool = [
            { q: "【問1】栃木県で生産量日本一のフルーツは？", opts: ["みかん", "いちご", "ぶどう"], ans: 1, exp: "「とちおとめ」など、栃木はいちご王国として有名です！" },
            { q: "【問2】群馬県の「下仁田ネギ」の最も美味しい食べ方は？", opts: ["生でサラダ", "すき焼き", "天日干し"], ans: 1, exp: "加熱することでトロトロになり甘みが出ます。" },
            { q: "【問3】埼玉県草加市の名物として有名なのは？", opts: ["草加せんべい", "草加うどん", "草加まんじゅう"], ans: 0, exp: "硬めの食感と醤油の香ばしさが特徴です。" },
            { q: "【問4】茨城県が生産量日本一を誇る冬の味覚は？", opts: ["みかん", "あんこう", "りんご"], ans: 1, exp: "「あんこう鍋」は冬の代表的なご当地グルメです。" },
            { q: "【問5】神奈川県・三崎港で特に有名な海産物は？", opts: ["カニ", "マグロ", "ウニ"], ans: 1, exp: "三崎のマグロは全国的にも有数の水揚げ量を誇ります。" },
            { q: "【問6】千葉県の特産品で初夏を告げるフルーツは？", opts: ["房州びわ", "マンゴー", "さくらんぼ"], ans: 0, exp: "房州びわは肉厚でジューシーな初夏の味覚です。" },
            { q: "【問7(難問)】東京都の伊豆諸島特産で、独特の匂いがある魚の干物は？", opts: ["くさや", "へしこ", "なれずし"], ans: 0, exp: "新鮮な魚を「くさや液」に漬け込んで干した保存食です。" },
            { q: "【問8(ボス)】群馬県の「焼きまんじゅう」の中身は通常何が入っている？", opts: ["つぶあん", "カスタード", "何も入っていない"], ans: 2, exp: "具はなく、甘じょっぱい味噌ダレを塗って焼くのが最大の特徴です！" }
        ];

        const levelDisp = document.getElementById('quiz-level-display');
        if (levelDisp) levelDisp.textContent = `Lv.${appState.quizLevel} (スコア: ${appState.quizScore})`;
        const qEl = document.getElementById('quiz-question');
        const countEl = document.getElementById('quiz-count');
        const optsEl = document.getElementById('quiz-options');
        const feedbackEl = document.getElementById('quiz-feedback');
        const nextBtn = document.getElementById('quiz-next-btn');

        window.quizState = window.quizState || { current: 0, initialized: false };
        if (!window.quizState.initialized && nextBtn) {
            window.quizState.initialized = true;
            nextBtn.addEventListener('click', () => {
                window.quizState.current++;
                if (window.quizState.current < fullQuizPool.length) renderQuestion();
                else {
                    appState.quizLevel++; localStorage.setItem('quizLevel', appState.quizLevel);
                    if (levelDisp) levelDisp.textContent = `Lv.${appState.quizLevel} (スコア: ${appState.quizScore})`;
                    qEl.textContent = '';
                    const qSpan = document.createElement('span'); qSpan.style.cssText = 'font-size:2rem;color:var(--accent);'; qSpan.textContent = '🎉 全問クリア！';
                    qEl.appendChild(qSpan); qEl.appendChild(document.createElement('br')); qEl.appendChild(document.createElement('br'));
                    qEl.appendChild(document.createTextNode(`難易度マシマシで次のレベル（Lv.${appState.quizLevel}）へ進みました！`));
                    optsEl.textContent = '';
                    if (feedbackEl) feedbackEl.setAttribute('hidden', 'true');
                    if (countEl) countEl.textContent = '結果';
                    const retryBtn = document.createElement('button'); retryBtn.className = 'neon-button'; retryBtn.textContent = 'もう一度挑戦する'; retryBtn.onclick = () => { window.quizState.current = 0; renderQuestion(); }; optsEl.appendChild(retryBtn);
                }
            });
        }

        // Tab切替時にも現在の問題を再描画
        if (window.quizState.current < fullQuizPool.length) renderQuestion();

        function renderQuestion() {
            if (!qEl || !optsEl) return;
            if (feedbackEl) feedbackEl.setAttribute('hidden', 'true');
            if (countEl) countEl.textContent = `第${window.quizState.current + 1}問 / 全8問`;
            qEl.textContent = fullQuizPool[window.quizState.current].q;
            optsEl.textContent = '';
            fullQuizPool[window.quizState.current].opts.forEach((opt, idx) => {
                const btn = document.createElement('button'); btn.className = 'neon-button'; btn.style.marginRight = '10px'; btn.style.marginBottom = '10px'; btn.textContent = opt;
                btn.onclick = () => {
                    const isCorrect = (idx === fullQuizPool[window.quizState.current].ans);
                    if (feedbackEl) feedbackEl.removeAttribute('hidden');

                    const resMsg = document.getElementById('quiz-result-msg');
                    if (isCorrect) {
                        const pts = 10 + (window.quizState.current * 5) + (appState.quizLevel * 5);
                        appState.quizScore += pts; localStorage.setItem('quizScore', appState.quizScore);
                        if (levelDisp) levelDisp.textContent = `Lv.${appState.quizLevel} (スコア: ${appState.quizScore})`;
                        if (resMsg) {
                            resMsg.textContent = `🎉 正解！(+${pts}pt)`;
                            resMsg.style.color = 'var(--success)';
                        }
                    } else {
                        if (resMsg) {
                            resMsg.textContent = '❌ 残念！';
                            resMsg.style.color = 'var(--danger)';
                        }
                    }
                    const expl = document.getElementById('quiz-explanation');
                    if (expl) expl.textContent = fullQuizPool[window.quizState.current].exp;
                    Array.from(optsEl.children).forEach(b => b.disabled = true);
                };
                optsEl.appendChild(btn);
            });
        }
    };

    // --- Modal (AI Recipe integrated) ---
    const modalOverlay = document.getElementById('modal-overlay');
    window.openModal = function (item) {
        if (!modalOverlay) return;
        document.getElementById('modal-image').src = item.imageSrc || item.imageUrl;
        const mTitle = document.getElementById('modal-title');
        mTitle.dataset.i18nId = item.id;
        mTitle.dataset.i18nType = "name";
        const mDesc = document.getElementById('modal-description');
        mDesc.dataset.i18nId = item.id;
        mDesc.dataset.i18nType = "description";
        
        const currentLang = document.getElementById('lang-en') && document.getElementById('lang-en').classList.contains('active') ? 'en' : 'jp';
        if (currentLang === 'en' && typeof foodTranslations !== 'undefined' && foodTranslations[item.id]) {
            mTitle.dataset.jaText = item.name;
            mTitle.textContent = foodTranslations[item.id].name;
            mDesc.dataset.jaText = item.description;
            mDesc.textContent = foodTranslations[item.id].description;
        } else {
            mTitle.textContent = item.name;
            mDesc.textContent = item.description;
        }

        const catBadge = document.getElementById('modal-category-badge');
        if (catBadge) {
            const cat = detectCategory(item.name);
            if (cat) {
                catBadge.textContent = '🏷 ' + cat;
                catBadge.style.display = 'inline-block';
            } else {
                catBadge.style.display = 'none';
            }
        }
        document.getElementById('modal-dish').textContent = item.localDish || '-';
        document.getElementById('modal-market').textContent = item.marketInfo || '-';
        const mapLink = document.getElementById('modal-map-link');
        if (mapLink) mapLink.href = item.mapSearchUrl || `https://www.google.com/maps/search/${encodeURIComponent(item.name + ' 直売所')}`;

        // AIレシピエリア初期化
        const recipeArea = document.getElementById('modal-recipe-area');
        const recipeContent = document.getElementById('modal-recipe-content');
        const modalChatInput = document.getElementById('modal-recipe-chat-input');
        const modalChatResponseBox = document.getElementById('modal-recipe-chat-response-box');
        const modalChatResponse = document.getElementById('modal-recipe-chat-response');
        if (recipeArea) recipeArea.style.display = 'none';
        if (recipeContent) recipeContent.innerHTML = '';
        if (modalChatInput) modalChatInput.value = '';
        if (modalChatResponseBox) modalChatResponseBox.style.display = 'none';
        if (modalChatResponse) modalChatResponse.innerHTML = '';

        const recipeBtn = document.getElementById('modal-recipe-btn');
        if (recipeBtn) {
            recipeBtn.onclick = async () => {
                if (!recipeArea || !recipeContent) return;
                recipeArea.style.display = 'block';
                recipeContent.textContent = 'AI がこの食材を使ったレシピを考案しています... 🍳';
                if (modalChatResponseBox) modalChatResponseBox.style.display = 'none';
                try {
                    const res = await fetch('/api/recipe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ name: item.name })
                    });
                    if (!res.ok) throw new Error('Recipe API Error');
                    const data = await res.json();
                    recipeContent.innerHTML = window.marked ? marked.parse(data.recipe) : data.recipe;

                    // その場チャット
                    const modalChatSendBtn = document.getElementById('modal-recipe-chat-send');
                    if (modalChatSendBtn && modalChatInput && modalChatResponseBox && modalChatResponse) {
                        modalChatSendBtn.onclick = async () => {
                            const q = modalChatInput.value.trim();
                            if (!q) return;
                            
                            // ユーザーの質問を表示
                            const userMsgDiv = document.getElementById('modal-recipe-chat-user-msg');
                            if (userMsgDiv) userMsgDiv.textContent = q;

                            modalChatResponseBox.style.display = 'block';
                            modalChatResponse.textContent = '🍳 シェフが考えています...';
                            modalChatInput.value = '';
                            try {
                                const cr = await fetch('/api/recipe/chat', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ recipe: data.recipe, question: q })
                                });
                                if (!cr.ok) throw new Error('Chat Error');
                                const cd = await cr.json();
                                modalChatResponse.innerHTML = window.marked ? marked.parse(cd.reply) : cd.reply;
                            } catch (e) {
                                modalChatResponse.textContent = '（Ollamaが動いていません）';
                            }
                        };
                        modalChatInput.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); modalChatSendBtn.click(); } };
                    }
                } catch (e) {
                    recipeContent.textContent = '（Ollamaが動いていません）レシピの生成に失敗しました。';
                }
            };
        }

        modalOverlay.removeAttribute('hidden'); requestAnimationFrame(() => modalOverlay.classList.add('is-open'));
    };
    const closeModal = () => {
        if (!modalOverlay) return;
        modalOverlay.classList.remove('is-open');
        setTimeout(() => modalOverlay.setAttribute('hidden', 'true'), 300);
    };
    const modalCloseBtn = document.getElementById('modal-close');
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeModal);
    if (modalOverlay) modalOverlay.addEventListener('click', e => { if (e.target === modalOverlay) closeModal(); });

    // --- Ratings ---
    const stars = document.querySelectorAll('.rating-stars .star'); let currentRating = 0;
    stars.forEach(star => {
        const setRating = (e) => {
            currentRating = parseInt(e.target.dataset.value);
            stars.forEach(s => s.classList.remove('selected'));
            for (let i = 0; i < currentRating; i++) stars[i].classList.add('selected');
        };
        star.addEventListener('click', setRating); star.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') setRating(e); });
    });
    const ratingSubmitBtn = document.getElementById('rating-submit-button');
    if (ratingSubmitBtn) {
        ratingSubmitBtn.addEventListener('click', async () => {
            if (currentRating === 0) { showToast('評価を選択してください'); return; }
            
            const textarea = document.getElementById('comment-textarea');
            const comment = textarea ? textarea.value.trim() : '';

            // 評価送信APIを呼び出す
            try {
                const ratingSubmitBtnOriginalText = ratingSubmitBtn.textContent;
                ratingSubmitBtn.textContent = '送信中...';
                ratingSubmitBtn.disabled = true;

                const response = await fetch('/api/ratings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rating: currentRating, comment: comment })
                });

                if (response.ok) {
                    const thanks = document.getElementById('rating-thanks');
                    if (thanks) thanks.removeAttribute('hidden');
                    
                    // 完了後リセット
                    setTimeout(() => {
                        if (thanks) thanks.setAttribute('hidden', 'true');
                        currentRating = 0; stars.forEach(s => s.classList.remove('selected'));
                        if (textarea) textarea.value = '';
                    }, 4000);
                } else {
                    const errorData = await response.json();
                    showToast('エラー: ' + (errorData.error || '送信に失敗しました'));
                }
            } catch (error) {
                console.error('Error submitting rating:', error);
                showToast('通信エラーが発生しました');
            } finally {
                ratingSubmitBtn.textContent = '評価を送信する';
                ratingSubmitBtn.disabled = false;
            }
        });
    }

    // --- Event Tab ---
    const eventData = [
        { name: '待乳山聖天大根まつり', prefecture: 'tokyo', month: '1月', description: '浅草・待乳山聖天で毎年1月7日に開催。参拝者に大根が振る舞われる新春の風物詩です。', emoji: '🥕', season: 'winter', url: 'http://www.matsuchiyama.jp/daikon.html' },
        { name: '栃木いちご狩り', prefecture: 'tochigi', month: '1〜5月', description: '栃木県内のいちご農園で「とちおとめ」「スカイベリー」の摘み取り体験が楽しめます。', emoji: '🍓', season: 'spring', url: 'https://www.tochigiji.or.jp/features/strawberry-picking' },
        { name: '三崎まぐろ祭り', prefecture: 'kanagawa', month: '2月', description: '三崎港でとれたての本マグロを堪能。解体ショーや即売会も開催される冬の一大イベント。', emoji: '🐟', season: 'winter', url: 'https://www.city.miura.kanagawa.jp/soshiki/kankoshokoka/kankoshokoka_kanko/chiikikankougyouji/10333.html' },
        { name: '水戸梅祭り', prefecture: 'ibaraki', month: '2〜3月', description: '日本三名園・偕楽園で約3,000本の梅が開花。売店では梅干し・梅酒の販売も楽しめます。', emoji: '🌸', season: 'spring', url: 'https://mitokoumon.com/ume/' },
        { name: '狭山新茶祭り', prefecture: 'saitama', month: '5月', description: '狭山市で新茶の初摘み体験や茶農家との交流イベントが開催。香り豊かな狭山茶を味わえます。', emoji: '🍵', season: 'spring', url: 'https://www.sayama-kanko.jp/april-event/sayama-new-tea/' },
        { name: '笠間栗祭り', prefecture: 'ibaraki', month: '9〜10月', description: '栗の産地・笠間市で開催。栗ご飯や栗スイーツ、農家による直売会など秋の味覚が勢揃い。', emoji: '🌰', season: 'autumn', url: 'https://www.city.kasama.lg.jp/page/page002902.html' },
        { name: 'こんにゃく祭り', prefecture: 'gunma', month: '10月', description: '下仁田町でこんにゃく製品が大集合。試食・販売・こんにゃく料理体験など盛りだくさんです。', emoji: '🌿', season: 'autumn', url: 'https://www.shimonita.jp/info/2698/' },
        { name: '川越芋フェスタ', prefecture: 'saitama', month: '10〜11月', description: '川越市でさつまいも料理・スイーツ・焼き芋の大試食会。小江戸の雰囲気の中で秋を満喫！', emoji: '🍠', season: 'autumn', url: 'https://coedo-imopark.com/' },
        { name: '大洗あんこう祭り', prefecture: 'ibaraki', month: '11月', description: '茨城県大洗町で冬の味覚・あんこうをメインに据えた人気の祭り。吊るし切りの実演も必見！', emoji: '🐟', season: 'winter', url: 'https://www.oarai-camp.jp/page/page000352.html' },
        { name: '下仁田ネギ祭り', prefecture: 'gunma', month: '11〜12月', description: '下仁田町で特産のブランドネギ「下仁田ネギ」を使った料理や販売が楽しめる祭りです。', emoji: '🧅', season: 'winter', url: 'https://www.shimonita.jp/info/2150/' },
    ];
    const seasonColorMap = { spring: '#fb923c', summer: '#22d3ee', autumn: '#f87171', winter: '#818cf8' };
    window.initEventTab = function () {
        const container = document.getElementById('event-container');
        if (!container || container.dataset.initialized) return;
        container.dataset.initialized = 'true';
        container.textContent = '';
        eventData.forEach((event, idx) => {
            const card = document.createElement('div'); card.className = 'specialty-card';
            card.style.animation = `fadeIn 0.4s ${idx * 0.07}s both`;
            const emojiEl = document.createElement('div');
            emojiEl.style.cssText = 'font-size:2.5rem;text-align:center;padding:16px 0 8px;'; emojiEl.textContent = event.emoji;
            const bodyDiv = document.createElement('div'); bodyDiv.style.cssText = 'padding:0 16px 16px;';
            const tagRow = document.createElement('div'); tagRow.style.marginBottom = '8px';
            const prefTag = document.createElement('span');
            prefTag.style.cssText = 'font-size:0.7rem;font-weight:700;padding:2px 8px;border-radius:12px;background:rgba(244,63,94,0.15);color:var(--accent);display:inline-block;margin-right:4px;';
            prefTag.textContent = prefNames[event.prefecture] || event.prefecture;
            const sc = seasonColorMap[event.season] || '#94a3b8';
            const monthTag = document.createElement('span');
            monthTag.style.cssText = `font-size:0.7rem;font-weight:700;padding:2px 8px;border-radius:12px;background:${sc}22;color:${sc};display:inline-block;`;
            monthTag.textContent = event.month;
            tagRow.appendChild(prefTag); tagRow.appendChild(monthTag);
            const title = document.createElement('h4'); title.textContent = event.name; title.style.marginBottom = '6px';
            const desc = document.createElement('p'); desc.style.cssText = 'font-size:0.9rem;color:var(--text-sec);line-height:1.5;margin-bottom:10px;'; desc.textContent = event.description;
            bodyDiv.appendChild(tagRow); bodyDiv.appendChild(title); bodyDiv.appendChild(desc);
            if (event.url) {
                const link = document.createElement('a');
                link.href = event.url;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.textContent = '🔗 詳細ページを見る';
                link.style.cssText = 'font-size:0.8rem;color:var(--accent);text-decoration:none;border:1px solid var(--accent);padding:3px 10px;border-radius:20px;display:inline-block;transition:background 0.2s;';
                link.addEventListener('mouseover', () => { link.style.background = 'rgba(244,63,94,0.15)'; });
                link.addEventListener('mouseout', () => { link.style.background = 'transparent'; });
                bodyDiv.appendChild(link);
            }
            card.appendChild(emojiEl); card.appendChild(bodyDiv);
            container.appendChild(card);
        });
    };
    // Initialize independent event tab immediately
    window.initEventTab();

    // Application Reset
    const resetBtn = document.getElementById('reset-app-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (confirm('すべてのデータ（お気に入り、設定、クイズのスコアなど）を初期化します。よろしいですか？')) {
                localStorage.clear();
                window.location.reload();
            }
        });
    }

    // --- 🍳 レシピ連携タブ ---
    const tabRecipeBtn = document.getElementById('recipe-btn');
    const tabRecipeInput = document.getElementById('recipe-input');
    const tabRecipeResultArea = document.getElementById('tab-recipe-result-area');
    const tabRecipeResultContent = document.getElementById('tab-recipe-result-content');

    if (tabRecipeBtn && tabRecipeInput) {
        tabRecipeBtn.addEventListener('click', async () => {
            const name = tabRecipeInput.value.trim();
            if (!name) { alert('食材名を入力してください。'); return; }
            tabRecipeResultArea.style.display = 'block';
            tabRecipeResultContent.textContent = 'AIがレシピを考案しています... 🍳';
            const tabChatInput = document.getElementById('tab-recipe-chat-input');
            const tabChatResponseBox = document.getElementById('tab-recipe-chat-response-box');
            const tabChatResponse = document.getElementById('tab-recipe-chat-response');
            if (tabChatInput) tabChatInput.value = '';
            if (tabChatResponseBox) tabChatResponseBox.style.display = 'none';
            if (tabChatResponse) tabChatResponse.innerHTML = '';

            try {
                const res = await fetch('/api/recipe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name })
                });
                if (!res.ok) throw new Error('Recipe Error');
                const data = await res.json();
                tabRecipeResultContent.innerHTML = window.marked ? marked.parse(data.recipe) : data.recipe;

                const tabChatSendBtn = document.getElementById('tab-recipe-chat-send');
                if (tabChatSendBtn && tabChatInput && tabChatResponseBox && tabChatResponse) {
                    tabChatSendBtn.onclick = async () => {
                        const q = tabChatInput.value.trim();
                        if (!q) return;

                        // ユーザーの質問を表示
                        const userMsgDiv = document.getElementById('tab-recipe-chat-user-msg');
                        if (userMsgDiv) userMsgDiv.textContent = q;

                        tabChatResponseBox.style.display = 'block';
                        tabChatResponse.textContent = '🍳 シェフが考えています...';
                        tabChatInput.value = '';
                        try {
                            const cr = await fetch('/api/recipe/chat', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ recipe: data.recipe, question: q })
                            });
                            if (!cr.ok) throw new Error();
                            const cd = await cr.json();
                            tabChatResponse.innerHTML = window.marked ? marked.parse(cd.reply) : cd.reply;
                        } catch (e) {
                            tabChatResponse.textContent = '（Ollamaが動いていません）';
                        }
                    };
                    tabChatInput.onkeydown = (e) => { if (e.key === 'Enter') { e.preventDefault(); tabChatSendBtn.click(); } };
                }
            } catch (e) {
                tabRecipeResultContent.textContent = '（Ollamaが動いていません）レシピの生成に失敗しました。';
            }
        });
    }

    // --- 🚗 ルート作成（ツアープラン）連携タブ ---
    const routeBtn = document.getElementById('route-btn');
    const routeStartInput = document.getElementById('route-start');
    const routeStyleSelect = document.getElementById('route-style');
    const routeResultArea = document.getElementById('route-result');

    if (routeBtn && routeStartInput && routeStyleSelect && routeResultArea) {
        routeBtn.addEventListener('click', async () => {
            const startLocation = routeStartInput.value.trim();
            const theme = routeStyleSelect.value;
            
            if (!startLocation) {
                alert('出発地を入力してください。');
                return;
            }

            routeResultArea.innerHTML = '<div style="text-align:center; color:#ffc107; padding:20px;">🚗 AIがあなたのためのツアープランを練っています... (10〜20秒ほどお待ちください)</div>';
            routeResultArea.style.display = 'block';
            routeBtn.disabled = true;
            routeBtn.textContent = '生成中...';
            
            try {
                const res = await fetch('/api/route/suggest', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ startLocation, theme })
                });
                
                if (!res.ok) throw new Error('Route API Error');
                
                const data = await res.json();
                
                if (data.error) {
                    routeResultArea.innerHTML = `<div style="color:#ef4444; padding:10px;">エラー: ${data.error}</div>`;
                } else if (data.report) {
                    const parsedHtml = window.marked ? marked.parse(data.report) : data.report;
                    routeResultArea.innerHTML = `<div style="color:#e0e0f0; line-height:1.6; font-size:0.95em; padding:15px;">${parsedHtml}</div>`;
                }
            } catch (e) {
                console.error(e);
                routeResultArea.innerHTML = '<div style="color:#ef4444; padding:10px;">（Ollamaが動いていないか、通信エラーです）プランの生成に失敗しました。</div>';
            } finally {
                routeBtn.disabled = false;
                routeBtn.textContent = 'ツアープランを生成';
            }
        });
    }

    // --- UI Tuner V2 Integration ---
    window.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'UPDATE_UI_V2') {
            const data = event.data.data;
            
            // 1. Basic properties
            if (data.zoom) document.body.style.zoom = data.zoom;
            if (data.fontSize) document.documentElement.style.fontSize = data.fontSize;
            
            // 2. CSS Variables
            for (const key in data) {
                if (key.startsWith('--')) {
                    document.documentElement.style.setProperty(key, data[key]);
                }
            }

            // 3. Dynamic Layout Overrides (inject <style> tag)
            let styleTag = document.getElementById('tuner-overrides');
            if (!styleTag) {
                styleTag = document.createElement('style');
                styleTag.id = 'tuner-overrides';
                document.head.appendChild(styleTag);
            }
            
            // Generate CSS Rules
            let layoutCSS = `
                .filter-container {
                    flex-direction: ${data.device === 'mobile' ? 'column' : data.layoutDir} !important;
                    justify-content: ${data.layoutJustify} !important;
                    gap: ${data['--spacing-gap']} !important;
                }
                .main-feature-section, .feature-hub {
                    padding: ${data['--spacing-padding']} !important;
                }
            `;
            styleTag.innerHTML = layoutCSS;
        }
    });

});