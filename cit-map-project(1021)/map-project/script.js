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
    const specialtyDatabase = window.specialtyDatabase;

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

    // --- Header Settings Toggle (Mobile) ---
    const settingsToggleBtn = document.getElementById('settings-toggle-btn');
    const settingsPanel = document.getElementById('settings-panel');
    if (settingsToggleBtn && settingsPanel) {
        settingsToggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsPanel.classList.toggle('is-open');
            const isOpen = settingsPanel.classList.contains('is-open');
            settingsToggleBtn.setAttribute('aria-expanded', isOpen);
        });
        // パネル外クリックで閉じる
        document.addEventListener('click', (e) => {
            if (settingsPanel.classList.contains('is-open') && !settingsPanel.contains(e.target) && e.target !== settingsToggleBtn) {
                settingsPanel.classList.remove('is-open');
                settingsToggleBtn.setAttribute('aria-expanded', 'false');
            }
        });
    }

    // --- Header Settings (Lang, Font, Color) ---
    const translations = {
        "title": "Kanto Local Food Map", "subtitle": "Find seasonal local specialties!", "gpsTitle": "Find specialties near you", "gpsBtn": "Get Location", "event": "📅 Events", "weatherTitle": "Weather Recommend", "weatherGet": "Get Weather", "quizTitle": "Local Food Quiz", "swipeTitle": "Intuitive Matching", "swipeDesc": "Drag cards or use buttons!", "swipeMatched": "Matched Foods", "aiTitle": "AI Sommelier", "aiGreeting": "Do you have any plans? (e.g., Seafood with partner)", "chatSend": "Send", "routeTitle": "Tour Planner", "routeCreate": "Generate Plan", "officialX": "Official X", "officialHP": "University HP"
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
    let isTouchDevice = false;
    window.addEventListener('touchstart', () => { isTouchDevice = true; }, { passive: true });

    const showPopupForPref = (prefId) => {
        if (kantoSvg) kantoSvg.classList.add('has-hover');
        document.querySelectorAll('.pref-img.is-hovered').forEach(el => el.classList.remove('is-hovered'));
        const imgEl = document.getElementById(prefId);
        if (imgEl) imgEl.classList.add('is-hovered');

        const items = specialtyDatabase.filter(i => i.prefecture === prefId);
        if (items.length > 0) {
            const item = items[Math.floor(Math.random() * items.length)];
            if (topicBadge) topicBadge.textContent = prefNames[prefId];
            if (topicTitle) topicTitle.textContent = item.name;
            if (topicDesc) topicDesc.textContent = item.description;
            if (topicImg) {
                topicImg.src = item.imageSrc;
                topicImg.style.display = 'block';
            }
            if (topicBox) {
                topicBox.classList.add('is-visible');
                topicBox.dataset.targetPref = prefId;
            }
        }
    };

    const hidePopupForPref = (prefId) => {
        if (kantoSvg) kantoSvg.classList.remove('has-hover');
        const imgEl = document.getElementById(prefId);
        if (imgEl) imgEl.classList.remove('is-hovered');
        if (topicBox) topicBox.classList.remove('is-visible');
    };

    if (topicBox) {
        topicBox.style.cursor = 'pointer';
        topicBox.addEventListener('click', () => {
            const prefId = topicBox.dataset.targetPref;
            if (prefId) window.location.href = `prefecture.html?pref=${prefId}`;
        });
    }

    prefHits.forEach(hit => {
        hit.addEventListener('mouseenter', (e) => {
            if (isTouchDevice) return;
            showPopupForPref(e.target.dataset.target);
        });
        hit.addEventListener('mouseleave', (e) => {
            if (isTouchDevice) return;
            hidePopupForPref(e.target.dataset.target);
        });
        hit.addEventListener('touchstart', (e) => {
            // スマホでのタップ時の挙動: ポップアップを表示し、クリックによる遷移を防ぐ
            e.preventDefault(); 
            showPopupForPref(e.target.dataset.target);
        }, { passive: false });
        hit.addEventListener('click', (e) => {
            if (isTouchDevice) return;
            const prefId = e.target.dataset.target;
            window.location.href = `prefecture.html?pref=${prefId}`;
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
        img.src = item.imageSrc;
        img.alt = item.name;
        img.loading = 'lazy';
        img.onerror = () => { img.onerror = null; img.src = 'https://placehold.co/200x200/334155/white?text=No+Image'; };

        const h4 = document.createElement('h4'); h4.textContent = item.name;

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
        const pref   = prefSelect   ? prefSelect.value   : 'all';
        const cat    = categorySelect ? categorySelect.value : 'all';
        const kw     = keywordInput ? keywordInput.value.trim() : '';

        let filtered = specialtyDatabase;
        if (season !== 'all') filtered = filtered.filter(i => i.season === season);
        if (pref   !== 'all') filtered = filtered.filter(i => i.prefecture === pref);
        if (cat    !== 'all') filtered = filtered.filter(i => i.category === cat);
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
    if (seasonSelect)   seasonSelect.addEventListener('change', doSearch);
    if (prefSelect)     prefSelect.addEventListener('change', doSearch);
    if (categorySelect) categorySelect.addEventListener('change', doSearch);

    // Render initial 24 items
    renderCards(specialtyDatabase, 'results-container');


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
            // Trigger tab-specific init
            if (tab.dataset.tab === 'tab-gantt') renderGanttChart();
            if (tab.dataset.tab === 'tab-quiz') window.loadQuiz && window.loadQuiz();
            if (tab.dataset.tab === 'tab-swipe') initSwipe();
            if (tab.dataset.tab === 'tab-gps') {
                if (window.leafletMap) window.leafletMap.invalidateSize();
            }
        });
    });

    // --- Gantt Chart ---
    const renderGanttChart = () => {
        const area = document.getElementById('gantt-chart-area');
        if (!area || area.dataset.initialized) return;
        area.dataset.initialized = 'true';
        area.textContent = ''; // clear
        const seasonColorMap = { spring: '#fb923c', summer: '#22d3ee', autumn: '#f87171', winter: '#818cf8' };
        specialtyDatabase.forEach((item, idx) => {
            const start = item.season === 'spring' ? 10 : (item.season === 'summer' ? 40 : (item.season === 'autumn' ? 70 : 85));
            const width = 15;

            const row = document.createElement('div'); row.className = 'gantt-row'; row.style.animation = `fadeIn 0.5s ${idx * 0.05}s both`;
            const label = document.createElement('div'); label.className = 'gantt-label'; label.textContent = item.name;
            const container = document.createElement('div'); container.className = 'gantt-bar-container';
            const bar = document.createElement('div'); bar.className = 'gantt-bar';
            bar.style.cssText = `left:${start}%;width:${width}%;background:${seasonColorMap[item.season] || '#94a3b8'};`;
            bar.title = `${item.name} (${item.season})`;

            container.appendChild(bar); row.appendChild(label); row.appendChild(container); area.appendChild(row);
        });
    };

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
        if (swipeImg) swipeImg.src = item.imageSrc;
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
        div.innerHTML = `<img src="${item.imageSrc}" style="width:100%;height:100px;object-fit:cover;"><h4>${item.name}</h4>`;
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

    // --- Touch swipe implementation ---
    const swipeCardUI = document.getElementById('swipe-card');
    let startX = 0;
    let currentX = 0;
    let isDragging = false;
    
    if (swipeCardUI) {
        swipeCardUI.addEventListener('touchstart', (e) => {
            if (appState.swipeIndex >= appState.swipeDeck.length) return;
            startX = e.touches[0].clientX;
            isDragging = true;
            swipeCardUI.style.transition = 'none';
        }, {passive: true});

        swipeCardUI.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            currentX = e.touches[0].clientX - startX;
            const rotate = currentX * 0.05;
            swipeCardUI.style.transform = `translateX(${currentX}px) rotate(${rotate}deg)`;
            
            const likeStatus = swipeCardUI.querySelector('.swipe-status.like');
            const nopeStatus = swipeCardUI.querySelector('.swipe-status.nope');
            
            if (currentX > 50 && likeStatus) {
                likeStatus.style.opacity = Math.min(1, (currentX - 50) / 50);
            } else if (likeStatus) {
                likeStatus.style.opacity = 0;
            }
            
            if (currentX < -50 && nopeStatus) {
                nopeStatus.style.opacity = Math.min(1, Math.abs(currentX + 50) / 50);
            } else if (nopeStatus) {
                nopeStatus.style.opacity = 0;
            }
        }, {passive: true});

        swipeCardUI.addEventListener('touchend', (e) => {
            if (!isDragging) return;
            isDragging = false;
            swipeCardUI.style.transition = 'transform 0.4s ease, opacity 0.4s ease';
            
            const likeStatus = swipeCardUI.querySelector('.swipe-status.like');
            const nopeStatus = swipeCardUI.querySelector('.swipe-status.nope');
            if(likeStatus) likeStatus.style.opacity = 0;
            if(nopeStatus) nopeStatus.style.opacity = 0;

            if (currentX > 100) {
                if(swipeLike) swipeLike.click();
            } else if (currentX < -100) {
                if(swipePass) swipePass.click();
            } else {
                swipeCardUI.style.transform = `translateX(0) rotate(0)`;
            }
            currentX = 0;
        });
    }

    // --- AI Sommelier Chat ---
    const chatInput = document.getElementById('chat-input');
    const chatSendBtn = document.getElementById('chat-send');
    if (chatSendBtn && chatInput) {
        const doChat = async () => {
            const text = chatInput.value.trim(); if (!text) return;
            await sendChatMessage(text);
        };
        chatSendBtn.addEventListener('click', doChat);
        chatInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); doChat(); } });
    }
    const sendChatMessage = async (text) => {
        const chatWindow = document.getElementById('chat-window');
        const userMsg = document.createElement('div'); userMsg.className = 'chat-msg user'; userMsg.textContent = text; chatWindow.appendChild(userMsg);
        chatInput.value = ''; chatWindow.scrollTop = chatWindow.scrollHeight;

        const botMsg = document.createElement('div'); botMsg.className = 'chat-msg bot';
        const loadSpan = document.createElement('span'); loadSpan.style.color = 'var(--text-sec)'; loadSpan.textContent = '💭 考え中...';
        botMsg.appendChild(loadSpan); chatWindow.appendChild(botMsg);
        chatWindow.scrollTop = chatWindow.scrollHeight;

        await new Promise(resolve => setTimeout(resolve, 800));
        const chatPatterns = [
            { re: /ネギ|葱/, res: '群馬の「下仁田ネギ」（冬）や埼玉の「深谷ネギ」（冬）がおすすめです！加熱するとトロトロになって甘みが増しますよ。寒い季節の鍋料理に最高です！' },
            { re: /海鮮|魚|寿司|刺身|マグロ|鮪/, res: '海鮮なら神奈川の「三崎マグロ」（冬が絶品）か、東京の「江戸前あさり」（春）がおすすめです！茨城の「あんこう鍋」も冬の名物です。' },
            { re: /デート|恋人|カップル|二人/, res: 'デートなら川越（埼玉）でレトロな街歩き＆芋スイーツ巡りはいかがでしょう？神奈川の湘南エリアでは生しらす丼もロマンチックですよ！' },
            { re: /肉|焼肉|ステーキ|豚/, res: 'お肉なら栃木の「宇都宮餃子」でスタミナをつけるのはいかがですか？薄皮パリパリで絶品です！' },
            { re: /フルーツ|果物|甘い|スイーツ/, res: '甘いものなら茨城の「メロン」（夏・日本一）や千葉の「房州びわ」（春）が最高！栃木の「とちおとめイチゴ」（春）は生産量日本一で人気ですよ。' },
            { re: /野菜|ヘルシー|ダイエット/, res: '野菜なら群馬の「高原レタス」（夏）、茨城の「れんこん」（秋・日本一）、東京の「小松菜」（冬）が栄養満点でおすすめです！' },
            { re: /子供|家族|キッズ|子どもと/, res: '家族でお出かけなら栃木の「いちご狩り」（春・1〜5月）や千葉の「落花生収穫体験」（秋）が大人気！子供も大喜びの体験型農業をぜひ。' },
            { re: /安い|コスパ|節約|リーズナブル/, res: 'コスパ重視なら地元の農産物直売所がおすすめ！茨城の「ほしいも」や群馬の「こんにゃく」は価格も手頃で栄養満点です。' },
            { re: /秋|紅葉/, res: '秋なら茨城の「れんこん」「笠間の栗」、群馬の「まいたけ」「こんにゃく芋」、千葉の「落花生」「伊勢えび」が旬です！紅葉狩りと合わせてどうぞ。' },
            { re: /夏|暑/, res: '夏なら千葉の「すいか」「梨」、群馬の「高原レタス」、茨城の「メロン」、埼玉の「ブルーベリー」が旬です！農園の摘み取り体験もおすすめです。' },
            { re: /春|春休み/, res: '春なら栃木の「いちご」、東京の「うど・あさり」、千葉の「房州びわ」、神奈川の「湘南しらす」「湘南ゴールド」が旬です！' },
            { re: /冬|寒|鍋/, res: '冬なら茨城の「あんこう鍋」「ほしいも」、群馬の「下仁田ネギ」、神奈川の「三崎マグロ」「三浦大根」が旬です。温かい鍋料理で体を温めましょう！' },
            { re: /茨城|いばらき/, res: '茨城はメロン（夏・日本一）、れんこん（秋・日本一）、あんこう鍋（冬）、ほしいも（冬・日本一）、笠間の栗（秋）が有名です！' },
            { re: /栃木|とちぎ|宇都宮/, res: '栃木はいちご（春・日本一）、宇都宮餃子（通年）、かんぴょう（夏・日本一）、日光湯葉が有名です！' },
            { re: /群馬|ぐんま/, res: '群馬はこんにゃく（秋・全国90%）、下仁田ネギ（冬）、高原レタス（夏）、まいたけ（秋）が有名です！' },
            { re: /埼玉|さいたま/, res: '埼玉は狭山茶（春・三大銘茶）、川越芋（秋）、深谷ネギ（冬）、ブルーベリー（夏）が有名です！' },
            { re: /千葉|ちば/, res: '千葉は落花生（秋・日本一）、梨（夏・日本一）、房州びわ（春）、すいか（夏）、伊勢えび（秋）が有名です！' },
            { re: /東京|とうきょう|江戸/, res: '東京は江戸前あさり（春）、東京うど（春）、くさや（伊豆諸島・夏）、小松菜（冬）など個性的な食材があります！' },
            { re: /神奈川|かながわ|横浜|鎌倉|湘南/, res: '神奈川は三崎マグロ（冬）、湘南しらす（春）、三浦大根（冬）、湘南ゴールド（春）、小田原かまぼこ（冬）が有名です！' },
            { re: /おすすめ|何が|教えて|どれ/, res: '今の季節のおすすめは「旬のローカルグルメ検索」でチェックしてみてください！地図の県をクリックするとその県の食材一覧も見られますよ。' },
        ];
        let res = '';
        for (const { re, res: r } of chatPatterns) { if (re.test(text)) { res = r; break; } }
        if (!res) res = 'ご質問ありがとうございます！関東各地には素晴らしい食材がたくさんあります。県名や季節、食べたいものを教えてください！';
        botMsg.textContent = '';
        let i = 0;
        const typeInterval = setInterval(() => { botMsg.textContent += res[i]; i++; chatWindow.scrollTop = chatWindow.scrollHeight; if (i >= res.length) clearInterval(typeInterval); }, 30);
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

    // --- Route Maker ---
    const routeBtn = document.getElementById('route-btn');
    if (routeBtn) {
        const routes = [
            { title: '🌸 春の関東グルメ旅', spots: '① 栃木・宇都宮でいちご狩り → ② 埼玉・狭山で新茶体験 → ③ 神奈川・湘南で生しらす丼' },
            { title: '☀️ 夏の収穫体験ルート', spots: '① 茨城・ひたちなかでメロン直売 → ② 群馬・嬬恋で高原レタス → ③ 千葉・富里でスイカ狩り' },
            { title: '🍂 秋の味覚巡りルート', spots: '① 笠間（茨城）で栗スイーツ → ② 川越（埼玉）で焼き芋 → ③ 千葉・八街で落花生収穫祭' },
            { title: '❄️ 冬の鍋&海鮮ルート', spots: '① 茨城・大洗であんこう鍋 → ② 三崎港（神奈川）でマグロ尽くし → ③ 下仁田（群馬）で下仁田ネギすき焼き' },
        ];
        let latestRoute = null;
        routeBtn.addEventListener('click', () => {
            latestRoute = routes[Math.floor(Math.random() * routes.length)];
            const resultArea = document.getElementById('route-result');
            resultArea.textContent = '';
            const wrapper = document.createElement('div');
            wrapper.style.cssText = "padding:20px; background:var(--card-bg); border-left:4px solid var(--accent); border-radius:var(--radius-md); box-shadow:0 10px 20px var(--shadow-color);";

            const titleEl = document.createElement('strong');
            titleEl.style.cssText = "color:var(--accent); font-size:1.1rem; display:block; margin-bottom:15px;";
            titleEl.textContent = latestRoute.title;

            const spotsEl = document.createElement('div');
            spotsEl.style.cssText = "font-size:0.95rem; line-height:1.8;";
            spotsEl.textContent = latestRoute.spots;

            const shareBtn = document.createElement('button');
            shareBtn.id = 'route-share-btn'; shareBtn.className = 'neon-button';
            shareBtn.style.cssText = "margin-top:15px;font-size:0.8rem;padding:5px 15px;";
            shareBtn.textContent = '📤 シェア';

            wrapper.appendChild(titleEl); wrapper.appendChild(spotsEl); wrapper.appendChild(shareBtn);
            resultArea.appendChild(wrapper);
            document.getElementById('route-share-btn').addEventListener('click', async () => {
                const shareText = `${latestRoute.title}\n${latestRoute.spots}\n\n#関東食の旅 #旬食材マップ`;
                if (navigator.share) {
                    try { await navigator.share({ title: latestRoute.title, text: shareText }); } catch (e) { /* user cancelled */ }
                } else {
                    await navigator.clipboard.writeText(shareText).then(() => showToast('クリップボードにコピーしました！')).catch(() => showToast('コピーに失敗しました'));
                }
            });
        });
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

    // --- Modal ---
    const modalOverlay = document.getElementById('modal-overlay');
    window.openModal = function (item) {
        if (!modalOverlay) return;
        document.getElementById('modal-image').src = item.imageSrc;
        document.getElementById('modal-title').textContent = item.name;
        document.getElementById('modal-description').textContent = item.description;
        document.getElementById('modal-dish').textContent = item.localDish || '-';
        document.getElementById('modal-market').textContent = item.marketInfo || '-';
        const mapLink = document.getElementById('modal-map-link');
        if (mapLink) mapLink.href = item.mapSearchUrl || `https://www.google.com/maps/search/${encodeURIComponent(item.name + ' 直売所')}`;
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
        ratingSubmitBtn.addEventListener('click', () => {
            if (currentRating === 0) { showToast('評価を選択してください'); return; }
            const thanks = document.getElementById('rating-thanks');
            if (thanks) thanks.removeAttribute('hidden');
            setTimeout(() => {
                if (thanks) thanks.setAttribute('hidden', 'true');
                currentRating = 0; stars.forEach(s => s.classList.remove('selected'));
                const textarea = document.getElementById('comment-textarea');
                if (textarea) textarea.value = '';
            }, 4000);
        });
    }

    // --- Event Tab ---
    const eventData = [
        { name: '水戸梅まつり', prefecture: 'ibaraki', month: '2〜3月', description: '日本三名園・偕楽園で約3,000本の梅が開花。売店では梅干し・梅酒の販売も', emoji: '🌸', season: 'spring' },
        { name: 'いちご狩りシーズン', prefecture: 'tochigi', month: '1〜5月', description: '栃木県内のいちご農園で「とちおとめ」「スカイベリー」の摘み取り体験', emoji: '🍓', season: 'spring' },
        { name: '嬬恋高原レタス収穫', prefecture: 'gunma', month: '7〜9月', description: '嬬恋村の高原で涼しい夏に育ったレタスの収穫体験。農家直売も実施', emoji: '🥬', season: 'summer' },
        { name: 'こんにゃく祭', prefecture: 'gunma', month: '10月', description: '下仁田町でこんにゃく製品が大集合。試食・販売・こんにゃく料理体験', emoji: '🌿', season: 'autumn' },
        { name: '狭山茶新茶まつり', prefecture: 'saitama', month: '5月', description: '狭山市で新茶の初摘み体験や茶農家との交流イベントが開催', emoji: '🍵', season: 'spring' },
        { name: '川越芋フェスタ', prefecture: 'saitama', month: '10〜11月', description: '川越市でさつまいも料理・スイーツ・焼き芋の大試食会', emoji: '🍠', season: 'autumn' },
        { name: '千葉落花生収穫祭', prefecture: 'chiba', month: '9月', description: '八街市で落花生の収穫体験・農家直売・茹で落花生の試食', emoji: '🥜', season: 'autumn' },
        { name: '九十九里しらす祭り', prefecture: 'chiba', month: '5月', description: '九十九里浜の浜焼きフェスで取れたて生しらすの試食・販売会', emoji: '🐟', season: 'spring' },
        { name: '深川江戸まつり', prefecture: 'tokyo', month: '8月', description: '深川地区で江戸前グルメ（あさり・深川めし）を楽しめる夏の伝統祭り', emoji: '🏺', season: 'summer' },
        { name: '三崎まぐろ祭り', prefecture: 'kanagawa', month: '2月', description: '三崎港でとれたての本マグロを堪能。解体ショーや即売会も', emoji: '🐟', season: 'winter' },
        { name: '湘南しらす解禁', prefecture: 'kanagawa', month: '3月', description: '禁漁期明け・春の生しらす解禁。江の島や茅ヶ崎の飲食店で新鮮しらす丼が登場', emoji: '🌊', season: 'spring' },
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
            const desc = document.createElement('p'); desc.style.cssText = 'font-size:0.9rem;color:var(--text-sec);line-height:1.5;'; desc.textContent = event.description;
            bodyDiv.appendChild(tagRow); bodyDiv.appendChild(title); bodyDiv.appendChild(desc);
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

});
