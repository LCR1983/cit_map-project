document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    
    // 1. 多言語対応の完全網羅 (Issue 1)
    const translations = {
        jp: {
            title: "関東地方インタラクティブマップ", subtitle: "都道府県にマウスを合わせると情報が変わり、クリックするとHPに移動します。",
            rateTitle: "このツールを評価する", rateDesc: "この食材発見ツールは、あなたの役に立ちましたか？", commentLabel: "ご意見・ご感想", submit: "評価を送信する",
            searchTitle: "旬の特産物検索", season: "季節:", allSeasons: "すべての季節", spring: "春", summer: "夏", autumn: "秋", winter: "冬",
            prefecture: "都県:", allPrefs: "すべての都県", gunma: "群馬県", tochigi: "栃木県", ibaraki: "茨城県", saitama: "埼玉県", chiba: "千葉県", tokyo: "東京都", kanagawa: "神奈川県", search: "検索", searchPrompt: "条件を選択して「検索」ボタンを押してください。",
            featureTitle: "食体験バラエティ (おまけ機能)", event: "イベント情報", gps: "現在地", chart: "旬チャート", weather: "お天気", recipe: "レシピ", quiz: "クイズ", swipe: "直感選別", ai: "AIソムリエ", route: "ルート作成",
            gpsTitle: "現在地から探す", gpsDesc: "位置情報を利用して近くの特産物を表示します。", gpsBtn: "現在地を取得",
            chartTitle: "旬のガントチャート", weatherTitle: "お天気連動レコメンド", weatherDesc: "気温に合わせて食材を提案します。", weatherGet: "天気を取得する", currentWeather: "現在地の天気:",
            recipeTitle: "レシピ連携", recipeSearch: "レシピ検索", quizTitle: "食材クイズ", quizNext: "次の問題へ",
            swipeTitle: "直感スワイプ選別", swipeDesc: "カードをドラッグして直感で選ぼう！", swipeMatched: "マッチングした食材 (クリックで詳細)",
            aiTitle: "AI食材ソムリエ", aiGreeting: "こんにちは！今日はどんな気分ですか？（例: ネギが知りたい、おすすめは？）", chatSend: "送信",
            routeTitle: "自動食い倒れルート生成", routeCreate: "ルート生成",
            calendarBtn: "イベントカレンダーを見る",
            officialLinks: "公式アカウント・関連リンク", officialX: "公式X", officialHP: "大学HP", officialYT: "YouTube",
            localDish: "関連する郷土料理", marketInfo: "直売所・市場情報", infoLink: "情報サイトへ", mapSearch: "📍 近くの直売所をマップで探す",
            lang: "Language", fontSize: "文字サイズ", std: "標準", large: "拡大", bgColor: "背景色", black: "黒", white: "白",
            news1: "2026.05.08 サイトをリニューアルオープンしました！", news2: "各県で春の収穫祭イベントが開催中です。", news3: "旬の食材データベースを56件に拡充しました。"
        },
        en: {
            title: "Kanto Region Interactive Map", subtitle: "Hover over a prefecture to see info, click to visit the official site.",
            rateTitle: "Rate this Tool", rateDesc: "Was this food discovery tool helpful to you?", commentLabel: "Comments", submit: "Submit Rating",
            searchTitle: "Seasonal Food Search", season: "Season:", allSeasons: "All Seasons", spring: "Spring", summer: "Summer", autumn: "Autumn", winter: "Winter",
            prefecture: "Pref:", allPrefs: "All Prefs", gunma: "Gunma", tochigi: "Tochigi", ibaraki: "Ibaraki", saitama: "Saitama", chiba: "Chiba", tokyo: "Tokyo", kanagawa: "Kanagawa", search: "Search", searchPrompt: "Select filters and press Search.",
            featureTitle: "Food Experience Variety", event: "Event Info", gps: "GPS", chart: "Chart", weather: "Weather", recipe: "Recipe", quiz: "Quiz", swipe: "Swipe", ai: "AI Sommelier", route: "Route",
            gpsTitle: "Search by Location", gpsDesc: "Show local specialties based on your GPS.", gpsBtn: "Get Location",
            chartTitle: "Seasonal Gantt Chart", weatherTitle: "Weather Recommend", weatherDesc: "Suggests food based on temperature.", weatherGet: "Get Weather", currentWeather: "Current Weather:",
            recipeTitle: "Recipe Link", recipeSearch: "Search Recipe", quizTitle: "Food Quiz", quizNext: "Next Question",
            swipeTitle: "Intuitive Swipe", swipeDesc: "Drag cards to choose!", swipeMatched: "Matched Ingredients (Click for info)",
            aiTitle: "AI Food Sommelier", aiGreeting: "Hello! What are you in the mood for? (e.g. Leek, Recommendations)", chatSend: "Send",
            routeTitle: "Food Tour Route Generator", routeCreate: "Generate Route",
            calendarBtn: "View Event Calendar",
            officialLinks: "Official Links", officialX: "Official X", officialHP: "CIT HP", officialYT: "YouTube",
            localDish: "Local Dish", marketInfo: "Market Info", infoLink: "Visit Website", mapSearch: "📍 Search nearby markets",
            lang: "Language", fontSize: "Font Size", std: "Std", large: "Large", bgColor: "Color", black: "Dark", white: "Light",
            news1: "2026.05.08 Site renewed and open!", news2: "Spring harvest events are ongoing.", news3: "Database expanded to 56 items."
        }
    };

    document.getElementById('lang-jp').addEventListener('click', (e) => { applyLanguage('jp'); toggleActive(e.target); document.getElementById('recipe-input').placeholder = "食材名 (例: 下仁田ネギ)"; document.getElementById('route-start').placeholder = "出発地 (例: 東京駅)"; });
    document.getElementById('lang-en').addEventListener('click', (e) => { applyLanguage('en'); toggleActive(e.target); document.getElementById('recipe-input').placeholder = "Ingredient (e.g. Leek)"; document.getElementById('route-start').placeholder = "Start (e.g. Tokyo Sta.)"; });
    function applyLanguage(lang) {
        const dict = translations[lang];
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (dict[key]) el.textContent = dict[key];
        });
    }

    document.getElementById('color-dark').addEventListener('click', (e) => { body.classList.remove('light-mode'); toggleActive(e.target); });
    document.getElementById('color-light').addEventListener('click', (e) => { body.classList.add('light-mode'); toggleActive(e.target); });
    document.getElementById('font-std').addEventListener('click', (e) => { body.classList.remove('font-large'); toggleActive(e.target); });
    document.getElementById('font-lg').addEventListener('click', (e) => { body.classList.add('font-large'); toggleActive(e.target); });
    
    function toggleActive(target) {
        const group = target.parentElement.querySelectorAll('.setting-btn');
        group.forEach(btn => { btn.classList.remove('active'); btn.setAttribute('aria-pressed', 'false'); });
        target.classList.add('active'); target.setAttribute('aria-pressed', 'true');
    }
    
    let currentSlide = 0; const sliderWrapper = document.getElementById('slider-wrapper');
    if(sliderWrapper){ const slides = document.querySelectorAll('.slide'); setInterval(() => { currentSlide = (currentSlide + 1) % slides.length; sliderWrapper.style.left = `-${currentSlide * 100}%`; }, 6000); }

    const mapTopics = {
        ibaraki: { title: '茨城県', description: '特産品: メロン、納豆...', imageSrc: 'https://placehold.co/80x80/59a14f/white?text=メロン', homepageURL: 'https://www.pref.ibaraki.jp/' },
        tochigi: { title: '栃木県', description: '特産品: いちご、宇都宮餃子...', imageSrc: 'https://placehold.co/80x80/f28e2b/white?text=いちご', homepageURL: 'https://www.pref.tochigi.lg.jp/' },
        gunma: { title: '群馬県', description: '特産品: こんにゃく、下仁田ネギ...', imageSrc: 'https://placehold.co/80x80/8c564b/white?text=こんにゃく', homepageURL: 'https://www.pref.gunma.jp/' },
        saitama: { title: '埼玉県', description: '特産品: 深谷ネギ、狭山茶...', imageSrc: 'https://placehold.co/80x80/76b7b2/white?text=深谷ネギ', homepageURL: 'https://www.pref.saitama.lg.jp/' },
        chiba: { title: '千葉県', description: '特産品: 落花生、梨...', imageSrc: 'https://placehold.co/80x80/edc949/white?text=落花生', homepageURL: 'https://www.pref.chiba.lg.jp/' },
        tokyo: { title: '東京都', description: '特産品: 江戸前寿司、もんじゃ...', imageSrc: 'https://placehold.co/80x80/4e79a7/white?text=寿司', homepageURL: 'https://www.metro.tokyo.lg.jp/' },
        kanagawa: { title: '神奈川県', description: '特産品: 三崎マグロ、小田原かまぼこ...', imageSrc: 'https://placehold.co/80x80/e15759/white?text=マグロ', homepageURL: 'https://www.pref.kanagawa.jp/' }
    };
    
    document.querySelectorAll('.prefecture-icon').forEach(prefecture => {
        const showTopic = (e) => { const topic = mapTopics[e.target.id]; if (topic) { document.getElementById('topic-title').textContent = topic.title; document.getElementById('topic-description').textContent = topic.description; document.getElementById('topic-image').src = topic.imageSrc; const box = document.getElementById('topic-box'); box.removeAttribute('hidden'); setTimeout(() => box.classList.add('is-visible'), 10); } };
        const hideTopic = () => { const box = document.getElementById('topic-box'); box.classList.remove('is-visible'); setTimeout(() => box.setAttribute('hidden', 'true'), 300); };
        prefecture.addEventListener('mouseover', showTopic); prefecture.addEventListener('focus', showTopic);
        prefecture.addEventListener('mouseout', hideTopic); prefecture.addEventListener('blur', hideTopic);
        prefecture.addEventListener('click', (e) => { const topic = mapTopics[e.target.id]; if (topic && topic.homepageURL) window.open(topic.homepageURL, '_blank'); });
    });

    const specialtyDatabase = [
        { id: 1, name: 'メロン(春)', description: '春のメロン。茨城は生産量日本一', prefecture: 'ibaraki', season: 'spring', imageSrc: 'https://placehold.co/200x200/59a14f/white?text=メロン' },
        { id: 2, name: 'いちご(春)', description: '春の甘いいちご', prefecture: 'tochigi', season: 'spring', imageSrc: 'https://placehold.co/200x200/f28e2b/white?text=いちご' },
        { id: 3, name: 'こんにゃく芋', description: '群馬特産', prefecture: 'gunma', season: 'spring', imageSrc: 'https://placehold.co/200x200/8c564b/white?text=こんにゃく' },
        { id: 4, name: '狭山茶(新茶)', description: '春の香り豊かな新茶', prefecture: 'saitama', season: 'spring', imageSrc: 'https://placehold.co/200x200/76b7b2/white?text=狭山茶' },
        { id: 5, name: '房州びわ', description: '初夏を告げる千葉のフルーツ', prefecture: 'chiba', season: 'spring', imageSrc: 'https://placehold.co/200x200/edc949/white?text=びわ' },
        { id: 6, name: 'あさり', description: '江戸前の春の味覚', prefecture: 'tokyo', season: 'spring', imageSrc: 'https://placehold.co/200x200/4e79a7/white?text=あさり' },
        { id: 7, name: '春キャベツ', description: '三浦半島の柔らかいキャベツ', prefecture: 'kanagawa', season: 'spring', imageSrc: 'https://placehold.co/200x200/e15759/white?text=春キャベツ' },
        { id: 22, name: 'あんこう', description: '冬の鍋の王様', prefecture: 'ibaraki', season: 'winter', imageSrc: 'https://placehold.co/200x200/59a14f/white?text=あんこう' },
        { id: 24, name: '下仁田ネギ', description: 'とろける甘さの冬のネギ', prefecture: 'gunma', season: 'winter', imageSrc: 'https://placehold.co/200x200/8c564b/white?text=下仁田ネギ' },
        { id: 25, name: '深谷ネギ', description: '寒さで甘みが増す', prefecture: 'saitama', season: 'winter', imageSrc: 'https://placehold.co/200x200/76b7b2/white?text=深谷ネギ' },
        { id: 28, name: '金目鯛', description: '冬に脂がのる高級魚', prefecture: 'kanagawa', season: 'winter', imageSrc: 'https://placehold.co/200x200/e15759/white?text=金目鯛' }
    ];

    document.querySelectorAll('.tab-item').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab-item').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
            tab.classList.add('active'); tab.setAttribute('aria-selected', 'true');
            const targetId = tab.dataset.tab;
            document.querySelectorAll('.tab-pane').forEach(pane => { pane.classList.remove('active'); pane.setAttribute('hidden', 'true'); });
            const targetPane = document.getElementById(targetId); targetPane.classList.add('active'); targetPane.removeAttribute('hidden');
            if(targetId === 'tab-gantt') initGantt(); if(targetId === 'tab-quiz') loadQuiz(); if(targetId === 'tab-swipe') initSwipe();
        });
    });

    document.getElementById('search-button').addEventListener('click', () => {
        const season = document.getElementById('season-select').value; const pref = document.getElementById('pref-select').value;
        let results = specialtyDatabase;
        if(season !== 'all') results = results.filter(i => i.season === season);
        if(pref !== 'all') results = results.filter(i => i.prefecture === pref);
        renderCards(results, 'results-container');
    });

    function renderCards(list, containerId) {
        const container = document.getElementById(containerId); container.innerHTML = ''; 
        if(list.length === 0) { container.innerHTML = '<p style="color:var(--text-sec);">該当なし</p>'; return; }
        list.forEach(item => {
            const card = document.createElement('div'); card.className = 'specialty-card'; card.tabIndex = 0;
            card.innerHTML = `<img src="${item.imageSrc}" alt="${item.name}" loading="lazy"><h4>${item.name}</h4>`;
            card.onclick = () => openModal(item);
            container.appendChild(card);
        });
    }

    // 2. イベント修正 (リンク、県名誤字、全県対応) (Issue 2, 3, 12)
    const eventContainer = document.getElementById('event-container');
    if (eventContainer) {
        const evts = [
            { title: '横浜赤レンガ倉庫 クリスマスマーケット', date: '2025.11.22〜12.25', tag: '神奈川・食', img: 'https://placehold.co/300x200/e15759/white?text=Yokohama', url: 'https://www.yokohama-akarenga.jp/christmas/' },
            { title: '下仁田ネギ祭り 2025', date: '2025.12.07', tag: '群馬・収穫祭', img: 'https://placehold.co/300x200/8c564b/white?text=Gunma', url: 'https://www.shimonita-kanko.com/' },
            { title: 'いばらき 収穫感謝祭', date: '2025.11.15', tag: '茨城・マルシェ', img: 'https://placehold.co/300x200/59a14f/white?text=Ibaraki', url: 'https://www.pref.ibaraki.jp/' },
            { title: 'とちぎ いちご祭り', date: '2026.01.15', tag: '栃木・体験', img: 'https://placehold.co/300x200/f28e2b/white?text=Tochigi', url: 'https://www.pref.tochigi.lg.jp/' },
            { title: '深谷ネギまつり', date: '2026.01.26', tag: '埼玉・グルメ', img: 'https://placehold.co/300x200/76b7b2/white?text=Saitama', url: 'https://fukayanegi-matsuri.com/' },
            { title: '千葉 落花生フェア', date: '2025.11.10', tag: '千葉・物販', img: 'https://placehold.co/300x200/edc949/white?text=Chiba', url: 'https://www.pref.chiba.lg.jp/' },
            { title: '豊洲市場 こども感謝デー', date: '2025.11.23', tag: '東京・体験', img: 'https://placehold.co/300x200/4e79a7/white?text=Tokyo', url: 'https://www.shijou.metro.tokyo.lg.jp/' }
        ];
        evts.forEach(evt => {
            const card = document.createElement('a'); card.href = evt.url; card.target = '_blank'; card.className = 'event-card';
            card.innerHTML = `<div class="event-img-wrapper"><img src="${evt.img}" alt="${evt.title}" loading="lazy"><div class="event-title-overlay">${evt.title}</div></div><div class="event-info"><span class="event-tag">${evt.tag}</span><p style="margin:0; font-size:0.9em;">開催: ${evt.date}</p></div>`;
            eventContainer.appendChild(card);
        });
    }

    // 4. カレンダー機能 (Issue 4)
    document.querySelector('.event-calendar-btn').addEventListener('click', () => { alert('イベントカレンダーを読み込んでいます（API連携準備中）。現在は各イベントカードから詳細を確認できます。'); });

    // 5. レシピ検索機能 (Issue 5)
    document.getElementById('recipe-btn').addEventListener('click', () => {
        const query = document.getElementById('recipe-input').value;
        if (query) { window.open(`https://cookpad.com/search/${encodeURIComponent(query)}`, '_blank'); } 
        else { alert(document.getElementById('lang-jp').classList.contains('active') ? '食材名を入力してください。' : 'Please enter an ingredient.'); }
    });

    // --- 1. AIソムリエのXSS対策 ＆ 提案強化 ---
document.getElementById('chat-send').addEventListener('click', () => {
    const inputEl = document.getElementById('chat-input'); 
    const text = inputEl.value; 
    if(!text) return;
    
    const chatWindow = document.getElementById('chat-window');
    
    // 【セキュリティ修正】innerHTMLを使わず、textContentで安全にDOM要素を追加（XSS対策）
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-msg user';
    userMsg.textContent = text;
    chatWindow.appendChild(userMsg);
    
    inputEl.value = '';

    setTimeout(() => {
        let res = "魅力的なご相談ですね！関東には素敵な場所がたくさんありますよ。";
        // ペルソナを意識した対話ロジック
        if(text.includes("カフェ") || text.includes("友達")) res = "お友達とのカフェ巡りなら、埼玉県の『川越』でレトロな食べ歩きや、千葉県の海沿いカフェドライブが写真映えして最高ですよ！";
        else if(text.includes("恋人") || text.includes("海鮮")) res = "恋人とのご旅行ですね！神奈川県の『三崎マグロ』を堪能して、鎌倉でお散歩するルートがおしゃれでおすすめです。";
        else if(text.includes("ネギ")) res = "今の季節なら群馬の下仁田ネギがとろけて絶品です。温泉宿ですき焼きなんていかがですか？";
        
        const botMsg = document.createElement('div');
        botMsg.className = 'chat-msg bot';
        botMsg.textContent = res;
        chatWindow.appendChild(botMsg);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }, 800);
});

// --- 2. 目的別ルート作成（健太・美咲ペルソナ対応） ---
document.getElementById('route-btn').addEventListener('click', () => {
    const start = document.getElementById('route-start').value || '東京駅';
    const style = document.getElementById('route-style').value;
    const resultArea = document.getElementById('route-result');
    
    const routes = {
        'couple': [ // 健太さん（28歳・恋人と観光＆食）向け
            '【美食＆絶景コース】<br>神奈川県・三崎マグロ贅沢ランチ → 鎌倉散策＆古民家ディナー',
            '【温泉＆ご当地グルメコース】<br>群馬県・伊香保温泉街歩き → 下仁田ネギの本格すき焼き堪能'
        ],
        'friends': [ // 美咲さん（21歳・友達とSNS映え・カフェ）向け
            '【SNS映え♪レトロ食べ歩き】<br>埼玉県・川越・時の鐘周辺でスイーツ巡り → 深谷ネギの古民家うどん',
            '【海辺のカフェドライブ】<br>千葉県・房総半島オーシャンビューカフェ → 地元野菜のジェラート'
        ],
        'family': [
            '【体験＆満腹コース】<br>栃木県・いちご（スカイベリー）狩り体験 → 宇都宮餃子食べ比べ',
            '【自然満喫ドライブ】<br>茨城県・ひたち海浜公園 → 那珂湊おさかな市場で新鮮海鮮丼'
        ]
    };
    
    const selectedRoute = routes[style][Math.floor(Math.random() * 2)];
    
    // XSS対策としてinnerHTMLに入れる文字を制御（ユーザー入力のstartはエスケープするか安全な場所に配置）
    resultArea.innerHTML = `
        <div style="padding:15px; background:var(--bg-sec); border-left:4px solid var(--accent); margin-top:15px;">
            <strong style="color:var(--accent);">✨ あなたへの提案プラン</strong><br>
            <span style="font-size:0.9em;">📍出発: <span id="route-start-display"></span></span><br><br>
            ${selectedRoute}<br>
            <div style="margin-top:10px; font-size:0.8em; color:var(--text-sec);">※各スポットの詳細はマップから検索できます。</div>
        </div>`;
    
    // ユーザー入力部分はtextContentで安全に注入
    document.getElementById('route-start-display').textContent = start;
});

    // 8. ルート作成機能 (Issue 8)
    document.getElementById('route-btn').addEventListener('click', () => {
        const start = document.getElementById('route-start').value || '東京駅';
        const budget = document.getElementById('route-budget').value;
        const routes = {
            '3000': ['千葉県・落花生直売所コース', '埼玉県・深谷ネギうどん食べ歩き'],
            '5000': ['群馬県・下仁田ネギすき焼きツアー', '茨城県・メロンパフェ堪能コース'],
            '10000': ['神奈川県・三崎マグロ三昧贅沢ルート', '栃木県・スカイベリー狩り＆温泉コース']
        };
        const selected = routes[budget][Math.floor(Math.random() * 2)];
        document.getElementById('route-result').innerHTML = `<div style="padding:15px; background:var(--bg-sec); border-left:4px solid var(--accent); margin-top:15px;"><strong>【提案ルート】</strong><br>${start} 出発 → ${selected}<br><small style="color:var(--text-sec);">※所要時間や詳細は交通状況によります。</small></div>`;
    });

    // 6. 直感選別 (Swipe) マッチング詳細 (Issue 6)
    let swipeDeck = []; const cardUI = document.getElementById('swipe-card');
    function initSwipe() { swipeDeck = [...specialtyDatabase].sort(() => 0.5 - Math.random()); loadNextSwipeCard(); }
    function loadNextSwipeCard() {
        if(swipeDeck.length === 0) { cardUI.style.display = 'none'; return; }
        const item = swipeDeck[0]; document.getElementById('swipe-img').src = item.imageSrc; document.getElementById('swipe-name').textContent = item.name; document.getElementById('swipe-desc').textContent = item.description;
        cardUI.style.transform = ''; document.querySelector('.swipe-status.like').style.opacity = 0; document.querySelector('.swipe-status.nope').style.opacity = 0;
    }
    function handleSwipeResult(isLike) {
        const item = swipeDeck.shift();
        if(isLike) {
            const container = document.getElementById('swipe-results');
            const card = document.createElement('div'); card.className = 'specialty-card'; card.tabIndex = 0;
            card.innerHTML = `<img src="${item.imageSrc}" alt="${item.name}"><h4>${item.name}</h4>`;
            card.onclick = () => openModal(item); // クリックでモーダルが開くように修正
            container.appendChild(card);
        }
        setTimeout(() => loadNextSwipeCard(), 300);
    }
    document.getElementById('swipe-yes').addEventListener('click', () => { cardUI.style.transition = 'transform 0.3s ease-out'; cardUI.style.transform = `translateX(500px) rotate(30deg)`; handleSwipeResult(true); });
    document.getElementById('swipe-no').addEventListener('click', () => { cardUI.style.transition = 'transform 0.3s ease-out'; cardUI.style.transform = `translateX(-500px) rotate(-30deg)`; handleSwipeResult(false); });

    // モーダルとその他の機能群
    const modalOverlay = document.getElementById('modal-overlay');
    function openModal(item) {
        document.getElementById('modal-image').src = item.imageSrc; document.getElementById('modal-title').textContent = item.name; document.getElementById('modal-description').textContent = item.description;
        document.getElementById('modal-dish').textContent = item.localDish || '-'; document.getElementById('modal-market').textContent = item.marketInfo || '-';
        const modalLink = document.getElementById('modal-link'); if (item.marketLink) { modalLink.href = item.marketLink; modalLink.style.display = 'inline-block'; } else { modalLink.style.display = 'none'; }
        const prefNameJa = { 'ibaraki': '茨城県', 'tochigi': '栃木県', 'gunma': '群馬県', 'saitama': '埼玉県', 'chiba': '千葉県', 'tokyo': '東京都', 'kanagawa': '神奈川県' }[item.prefecture] || '';
        document.getElementById('modal-map-link').href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(prefNameJa + ' ' + item.name + ' 直売所')}`;
        modalOverlay.removeAttribute('hidden'); requestAnimationFrame(() => { modalOverlay.classList.add('is-open'); });
    }
    function closeModal() { modalOverlay.classList.remove('is-open'); setTimeout(() => { modalOverlay.setAttribute('hidden', 'true'); }, 300); }
    document.getElementById('modal-close').addEventListener('click', closeModal); modalOverlay.addEventListener('click', (e) => { if(e.target === modalOverlay) closeModal(); });

    const stars = document.querySelectorAll('.rating-stars .star'); const ratingContainer = document.querySelector('.rating-stars'); let currentRating = 0; 
    stars.forEach(star => {
        const setRating = (e) => { currentRating = parseInt(e.target.dataset.value, 10); ratingContainer.dataset.rating = currentRating; stars.forEach(s => { s.classList.remove('selected'); s.setAttribute('aria-checked', 'false'); }); for (let i = 0; i < currentRating; i++) { stars[i].classList.add('selected'); stars[i].setAttribute('aria-checked', 'true'); } };
        star.addEventListener('click', setRating);
    });
    document.getElementById('rating-submit-button').addEventListener('click', () => {
        if (currentRating === 0) { alert('評価（星）を選択してください。'); return; }
        alert(`評価が送信されました！\n評価: ★ ${currentRating}`);
        currentRating = 0; ratingContainer.dataset.rating = 0; stars.forEach(s => s.classList.remove('selected')); document.getElementById('comment-textarea').value = '';
    });
});