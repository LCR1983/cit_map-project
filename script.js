document.addEventListener('DOMContentLoaded', () => {

    const body = document.body;
    
    // 言語辞書
    const translations = {
        jp: {
            title: "関東地方インタラクティブマップ", subtitle: "都道府県にマウスを合わせると情報が変わり、クリックするとHPに移動します。",
            rateTitle: "このツールを評価する", rateDesc: "この食材発見ツールは、あなたの役に立ちましたか？", commentLabel: "ご意見・ご感想", submit: "評価を送信する",
            searchTitle: "旬の特産物検索", season: "季節:", allSeasons: "すべての季節", spring: "春", summer: "夏", autumn: "秋", winter: "冬",
            prefecture: "都県:", allPrefs: "すべての都県", gunma: "群馬県", tochigi: "栃木県", ibaraki: "茨城県", saitama: "埼玉県", chiba: "千葉県", tokyo: "東京都", kanagawa: "神奈川県",
            search: "検索", officialLinks: "公式アカウント・関連リンク", localDish: "関連する郷土料理", marketInfo: "直売所・市場情報", infoLink: "情報サイトへ",
            lang: "Language", fontSize: "文字サイズ", std: "標準", large: "拡大", bgColor: "背景色", black: "黒", white: "白",
            featureTitle: "食体験バラエティ (おまけ機能)", event: "イベント情報", gps: "現在地", chart: "旬チャート", weather: "お天気", recipe: "レシピ", quiz: "クイズ", swipe: "直感選別", ai: "AIソムリエ", route: "ルート作成"
        },
        en: {
            title: "Kanto Region Interactive Map", subtitle: "Hover over a prefecture to see info, click to visit the official site.",
            rateTitle: "Rate this Tool", rateDesc: "Was this food discovery tool helpful to you?", commentLabel: "Comments & Feedback", submit: "Submit Rating",
            searchTitle: "Seasonal Food Search", season: "Season:", allSeasons: "All Seasons", spring: "Spring", summer: "Summer", autumn: "Autumn", winter: "Winter",
            prefecture: "Pref:", allPrefs: "All Prefectures", gunma: "Gunma", tochigi: "Tochigi", ibaraki: "Ibaraki", saitama: "Saitama", chiba: "Chiba", tokyo: "Tokyo", kanagawa: "Kanagawa",
            search: "Search", officialLinks: "Official Links", localDish: "Local Dishes", marketInfo: "Market Info", infoLink: "Visit Website",
            lang: "Language", fontSize: "Font Size", std: "Std", large: "Lg", bgColor: "Color", black: "Dark", white: "Light",
            featureTitle: "Food Experience Variety", event: "Events", gps: "GPS", chart: "Chart", weather: "Weather", recipe: "Recipe", quiz: "Quiz", swipe: "Swipe", ai: "AI Sommelier", route: "Route"
        }
    };

    document.getElementById('lang-jp').addEventListener('click', (e) => { applyLanguage('jp'); toggleActive(e.target); });
    document.getElementById('lang-en').addEventListener('click', (e) => { applyLanguage('en'); toggleActive(e.target); });
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
    
    let currentSlide = 0;
    const sliderWrapper = document.getElementById('slider-wrapper');
    if(sliderWrapper){
        const slides = document.querySelectorAll('.slide');
        setInterval(() => { currentSlide = (currentSlide + 1) % slides.length; sliderWrapper.style.left = `-${currentSlide * 100}%`; }, 6000);
    }

    const mapTopics = {
        ibaraki: { title: '茨城県', description: '特産品: メロン、納豆、常陸牛...', imageSrc: 'https://placehold.co/80x80/59a14f/white?text=メロン', homepageURL: 'https://www.pref.ibaraki.jp/' },
        tochigi: { title: '栃木県', description: '特産品: いちご（とちおとめ）、宇都宮餃子...', imageSrc: 'https://placehold.co/80x80/f28e2b/white?text=いちご', homepageURL: 'https://www.pref.tochigi.lg.jp/' },
        gunma: { title: '群馬県', description: '特産品: こんにゃく、下仁田ネギ...', imageSrc: 'https://placehold.co/80x80/8c564b/white?text=こんにゃく', homepageURL: 'https://www.pref.gunma.jp/' },
        saitama: { title: '埼玉県', description: '特産品: 深谷ネギ、狭山茶...', imageSrc: 'https://placehold.co/80x80/76b7b2/white?text=深谷ネギ', homepageURL: 'https://www.pref.saitama.lg.jp/' },
        chiba: { title: '千葉県', description: '特産品: 落花生、梨、びわ...', imageSrc: 'https://placehold.co/80x80/edc949/white?text=落花生', homepageURL: 'https://www.pref.chiba.lg.jp/' },
        tokyo: { title: '東京都', description: '特産品: 江戸前寿司、もんじゃ焼き...', imageSrc: 'https://placehold.co/80x80/4e79a7/white?text=寿司', homepageURL: 'https://www.metro.tokyo.lg.jp/' },
        kanagawa: { title: '神奈川県', description: '特産品: 三崎のマグロ、小田原かまぼこ...', imageSrc: 'https://placehold.co/80x80/e15759/white?text=マグロ', homepageURL: 'https://www.pref.kanagawa.jp/' }
    };
    
    const prefectures = document.querySelectorAll('.prefecture-icon');
    const topicBox = document.getElementById('topic-box');
    const topicTitle = document.getElementById('topic-title');
    const topicDescription = document.getElementById('topic-description');
    const topicImage = document.getElementById('topic-image'); 
    
    prefectures.forEach(prefecture => {
        const showTopic = (event) => {
            const topic = mapTopics[event.target.id];
            if (topic) {
                topicTitle.textContent = topic.title; topicDescription.textContent = topic.description;
                topicImage.src = topic.imageSrc; topicImage.alt = topic.title + "の特産物";
                topicBox.removeAttribute('hidden'); setTimeout(() => topicBox.classList.add('is-visible'), 10);
            }
        };
        const hideTopic = () => { topicBox.classList.remove('is-visible'); setTimeout(() => topicBox.setAttribute('hidden', 'true'), 300); };
        
        prefecture.addEventListener('mouseover', showTopic); prefecture.addEventListener('focus', showTopic);
        prefecture.addEventListener('mouseout', hideTopic); prefecture.addEventListener('blur', hideTopic);
        prefecture.addEventListener('click', (e) => { const topic = mapTopics[e.target.id]; if (topic && topic.homepageURL) window.open(topic.homepageURL, '_blank', 'noopener,noreferrer'); });
        prefecture.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const topic = mapTopics[e.target.id]; if (topic) window.open(topic.homepageURL, '_blank', 'noopener,noreferrer'); } });
    });

    // 検索ヒット率向上のため、全県×春夏秋冬のダミーデータを28件に拡充
    const specialtyDatabase = [
        // 春
        { id: 1, name: 'メロン(春)', description: '春のメロン。茨城は生産量日本一', prefecture: 'ibaraki', season: 'spring', imageSrc: 'https://placehold.co/200x200/59a14f/white?text=メロン' },
        { id: 2, name: 'いちご(春)', description: '春の甘いいちご', prefecture: 'tochigi', season: 'spring', imageSrc: 'https://placehold.co/200x200/f28e2b/white?text=いちご' },
        { id: 3, name: 'こんにゃく芋', description: '群馬特産', prefecture: 'gunma', season: 'spring', imageSrc: 'https://placehold.co/200x200/8c564b/white?text=こんにゃく' },
        { id: 4, name: '狭山茶(新茶)', description: '春の香り豊かな新茶', prefecture: 'saitama', season: 'spring', imageSrc: 'https://placehold.co/200x200/76b7b2/white?text=狭山茶' },
        { id: 5, name: '房州びわ', description: '初夏を告げる千葉のフルーツ', prefecture: 'chiba', season: 'spring', imageSrc: 'https://placehold.co/200x200/edc949/white?text=びわ' },
        { id: 6, name: 'あさり', description: '江戸前の春の味覚', prefecture: 'tokyo', season: 'spring', imageSrc: 'https://placehold.co/200x200/4e79a7/white?text=あさり' },
        { id: 7, name: '春キャベツ', description: '三浦半島の柔らかいキャベツ', prefecture: 'kanagawa', season: 'spring', imageSrc: 'https://placehold.co/200x200/e15759/white?text=春キャベツ' },
        // 夏
        { id: 8, name: 'メロン(夏)', description: '夏のアンデスメロン', prefecture: 'ibaraki', season: 'summer', imageSrc: 'https://placehold.co/200x200/59a14f/white?text=メロン' },
        { id: 9, name: 'アユ', description: '那珂川などの清流で育つ', prefecture: 'tochigi', season: 'summer', imageSrc: 'https://placehold.co/200x200/f28e2b/white?text=アユ' },
        { id: 10, name: '枝豆', description: '夏のビールのお供に', prefecture: 'gunma', season: 'summer', imageSrc: 'https://placehold.co/200x200/8c564b/white?text=枝豆' },
        { id: 11, name: 'トマト', description: '太陽を浴びた夏野菜', prefecture: 'saitama', season: 'summer', imageSrc: 'https://placehold.co/200x200/76b7b2/white?text=トマト' },
        { id: 12, name: 'スイカ', description: '富里の甘いスイカ', prefecture: 'chiba', season: 'summer', imageSrc: 'https://placehold.co/200x200/edc949/white?text=スイカ' },
        { id: 13, name: '江戸前アナゴ', description: '天ぷらや白焼きで', prefecture: 'tokyo', season: 'summer', imageSrc: 'https://placehold.co/200x200/4e79a7/white?text=アナゴ' },
        { id: 14, name: '湘南しらす', description: '夏の相模湾の恵み', prefecture: 'kanagawa', season: 'summer', imageSrc: 'https://placehold.co/200x200/e15759/white?text=しらす' },
        // 秋
        { id: 15, name: 'さつまいも', description: '干し芋に最適な秋の味覚', prefecture: 'ibaraki', season: 'autumn', imageSrc: 'https://placehold.co/200x200/59a14f/white?text=さつまいも' },
        { id: 16, name: '梨', description: 'みずみずしい秋の果物', prefecture: 'tochigi', season: 'autumn', imageSrc: 'https://placehold.co/200x200/f28e2b/white?text=梨' },
        { id: 17, name: '上州ネギ', description: '秋から美味しくなる', prefecture: 'gunma', season: 'autumn', imageSrc: 'https://placehold.co/200x200/8c564b/white?text=ネギ' },
        { id: 18, name: 'さといも', description: '秋の煮物にぴったり', prefecture: 'saitama', season: 'autumn', imageSrc: 'https://placehold.co/200x200/76b7b2/white?text=さといも' },
        { id: 19, name: '落花生', description: '秋に収穫される新豆', prefecture: 'chiba', season: 'autumn', imageSrc: 'https://placehold.co/200x200/edc949/white?text=落花生' },
        { id: 20, name: '小松菜', description: '江戸川区発祥の野菜', prefecture: 'tokyo', season: 'autumn', imageSrc: 'https://placehold.co/200x200/4e79a7/white?text=小松菜' },
        { id: 21, name: '三崎のマグロ', description: '脂がのった秋のマグロ', prefecture: 'kanagawa', season: 'autumn', imageSrc: 'https://placehold.co/200x200/e15759/white?text=マグロ' },
        // 冬
        { id: 22, name: 'あんこう', description: '冬の鍋の王様', prefecture: 'ibaraki', season: 'winter', imageSrc: 'https://placehold.co/200x200/59a14f/white?text=あんこう' },
        { id: 23, name: 'いちご(冬)', description: '冬に一番甘くなる', prefecture: 'tochigi', season: 'winter', imageSrc: 'https://placehold.co/200x200/f28e2b/white?text=いちご' },
        { id: 24, name: '下仁田ネギ', description: 'とろける甘さの冬のネギ', prefecture: 'gunma', season: 'winter', imageSrc: 'https://placehold.co/200x200/8c564b/white?text=下仁田ネギ' },
        { id: 25, name: '深谷ネギ', description: '寒さで甘みが増す', prefecture: 'saitama', season: 'winter', imageSrc: 'https://placehold.co/200x200/76b7b2/white?text=深谷ネギ' },
        { id: 26, name: '大根', description: '冬のおでんに欠かせない', prefecture: 'chiba', season: 'winter', imageSrc: 'https://placehold.co/200x200/edc949/white?text=大根' },
        { id: 27, name: '東京湾の海苔', description: '冬に採れる香りの良い海苔', prefecture: 'tokyo', season: 'winter', imageSrc: 'https://placehold.co/200x200/4e79a7/white?text=のり' },
        { id: 28, name: '金目鯛', description: '冬に脂がのる高級魚', prefecture: 'kanagawa', season: 'winter', imageSrc: 'https://placehold.co/200x200/e15759/white?text=金目鯛' }
    ];

    document.querySelectorAll('.tab-item').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('.tab-item').forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); t.setAttribute('tabindex', '-1'); });
            tab.classList.add('active'); tab.setAttribute('aria-selected', 'true'); tab.setAttribute('tabindex', '0');
            
            const targetId = tab.dataset.tab;
            document.querySelectorAll('.tab-pane').forEach(pane => { pane.classList.remove('active'); pane.setAttribute('hidden', 'true'); });
            const targetPane = document.getElementById(targetId);
            targetPane.classList.add('active'); targetPane.removeAttribute('hidden');
            
            if(targetId === 'tab-gantt') initGantt();
            if(targetId === 'tab-quiz') loadQuiz();
            if(targetId === 'tab-swipe') initSwipe();
        });
        tab.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tab.click(); } });
    });

    document.getElementById('search-button').addEventListener('click', () => {
        const season = document.getElementById('season-select').value;
        const pref = document.getElementById('pref-select').value;
        let results = specialtyDatabase;
        if(season !== 'all') results = results.filter(i => i.season === season);
        if(pref !== 'all') results = results.filter(i => i.prefecture === pref);
        renderCards(results, 'results-container');
    });

    function renderCards(list, containerId) {
        const container = document.getElementById(containerId); container.innerHTML = ''; 
        if(list.length === 0) { const p = document.createElement('p'); p.textContent = '該当なし'; container.appendChild(p); return; }
        
        list.forEach(item => {
            const card = document.createElement('div'); card.className = 'specialty-card'; card.tabIndex = 0; card.role = 'button';
            const img = document.createElement('img'); img.src = item.imageSrc; img.alt = item.name; img.loading = 'lazy';
            const h4 = document.createElement('h4'); h4.textContent = item.name;
            card.appendChild(img); card.appendChild(h4);
            card.addEventListener('click', () => openModal(item));
            card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(item); } });
            container.appendChild(card);
        });
    }

    const eventContainer = document.getElementById('event-container');
    if (eventContainer) {
        const events = [
            { title: '横浜赤レンガ倉庫 クリスマスマーケット', date: '2025.11.22(金)〜12.25(水)', tag: '神奈川・食', img: 'https://placehold.co/300x200/e15759/white?text=赤レンガ', url: 'https://www.yokohama-akarenga.jp/christmas/' },
            { title: '下仁田ネギ祭り 2025', date: '2025.12.07(日)', tag: '群生・収穫祭', img: 'https://placehold.co/300x200/8c564b/white?text=ネギ祭り', url: 'https://www.shimonita-kanko.com/' }
        ];
        events.forEach(evt => {
            const card = document.createElement('a'); card.href = evt.url; card.target = '_blank'; card.rel = 'noopener noreferrer'; card.className = 'event-card';
            const wrapper = document.createElement('div'); wrapper.className = 'event-img-wrapper';
            const img = document.createElement('img'); img.src = evt.img; img.alt = evt.title; img.loading = 'lazy';
            const overlay = document.createElement('div'); overlay.className = 'event-title-overlay'; overlay.textContent = evt.title;
            wrapper.append(img, overlay);
            const info = document.createElement('div'); info.className = 'event-info';
            const tag = document.createElement('span'); tag.className = 'event-tag'; tag.textContent = evt.tag;
            const date = document.createElement('p'); date.className = 'event-date'; date.textContent = evt.date;
            info.append(tag, date); card.append(wrapper, info); eventContainer.appendChild(card);
        });
    }

    document.getElementById('gps-btn').addEventListener('click', () => {
        const msg = document.getElementById('gps-status-msg'); const resultContainer = document.getElementById('gps-result-container');
        msg.textContent = '現在地を取得中...'; resultContainer.innerHTML = '';
        if (!navigator.geolocation) { msg.innerHTML = '<span style="color: #ff6b6b;">お使いのブラウザは対応していません。</span>'; return; }
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const lat = position.coords.latitude; const lon = position.coords.longitude; msg.textContent = `判定中...`;
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=10&addressdetails=1`, { headers: { 'Accept-Language': 'ja' } });
                    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                    const data = await response.json(); const prefNameJa = data.address.province || data.address.state || data.address.region || '';
                    const prefDict = { '茨城県': 'ibaraki', '栃木県': 'tochigi', '群馬県': 'gunma', '埼玉県': 'saitama', '千葉県': 'chiba', '東京都': 'tokyo', '神奈川県': 'kanagawa' };
                    const prefCode = prefDict[prefNameJa];
                    if (prefCode) { msg.innerHTML = `<strong>現在地: ${prefNameJa}</strong>`; renderCards(specialtyDatabase.filter(i => i.prefecture === prefCode), 'gps-result-container'); } 
                    else { msg.innerHTML = `<strong>現在地: ${prefNameJa || '判定不能'}</strong><br><span style="color: #ff6b6b;">※関東地方外です。</span>`; }
                } catch (error) { msg.innerHTML = '<span style="color: #ff6b6b;">通信失敗</span>'; }
            },
            (error) => { msg.innerHTML = `<span style="color: #ff6b6b;">位置情報取得失敗</span>`; },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    });

    // お天気API連携機能（完全実装）
    document.getElementById('weather-btn').addEventListener('click', () => {
        const status = document.getElementById('weather-status');
        const comment = document.getElementById('weather-comment');

        if (!navigator.geolocation) {
            status.textContent = '取得不可';
            comment.textContent = 'お使いのブラウザは位置情報に対応していません。';
            return;
        }

        status.textContent = '現在地を取得中...';
        comment.innerHTML = '少しお待ちください。';

        navigator.geolocation.getCurrentPosition(async (pos) => {
            const lat = pos.coords.latitude;
            const lon = pos.coords.longitude;
            try {
                // Open-Meteo APIを呼び出して天気を取得
                const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
                if (!res.ok) throw new Error('Weather API Error');
                const data = await res.json();
                
                const temp = data.current_weather.temperature;
                const code = data.current_weather.weathercode;
                
                // WMO Weather interpretation codes を日本語に簡易変換
                let weatherStr = '晴れ ☀️';
                if(code >= 1 && code <= 3) weatherStr = '曇り ☁️';
                if(code >= 45 && code <= 67) weatherStr = '雨 ☔️';
                if(code >= 71) weatherStr = '雪 ⛄️';

                status.textContent = `${weatherStr} (${temp}℃)`;
                
                // 気温に応じたAIレコメンド
                if (temp >= 25) {
                    comment.innerHTML = '暑いですね！さっぱりした<b>「千葉県のスイカ」</b>や、涼しげな<b>「神奈川県の湘南しらす」</b>がおすすめです！<br><br>水分補給を忘れずに！';
                } else if (temp <= 15) {
                    comment.innerHTML = '肌寒いですね。体が温まる<b>「埼玉県の深谷ネギ」</b>を使った鍋や、<b>「茨城県のあんこう鍋」</b>はいかがですか？';
                } else {
                    comment.innerHTML = '過ごしやすい気温ですね！お出かけ日和には<b>「千葉県の落花生」</b>をつまみながらの観光がおすすめです。';
                }
            } catch(e) {
                status.textContent = '取得エラー';
                comment.textContent = '天気情報の取得に失敗しました。時間をおいて再度お試しください。';
            }
        }, () => {
            status.textContent = '取得エラー';
            comment.textContent = '位置情報が許可されていません。ブラウザの設定をご確認ください。';
        });
    });

    function initGantt() {
        const area = document.getElementById('gantt-chart-area'); area.innerHTML = '';
        const targets = [...specialtyDatabase].sort(() => 0.5 - Math.random()).slice(0, 10);
        targets.forEach(item => {
            const row = document.createElement('div'); row.className = 'gantt-row';
            let left=0, width=25, color='#fab';
            if(item.season==='spring') { left=0; color='#fab'; } else if(item.season==='summer') { left=25; color='#4ecdc4'; } else if(item.season==='autumn') { left=50; color='#ff6b6b'; } else if(item.season==='winter') { left=75; color='#ccc'; }
            row.innerHTML = `<div class="gantt-label"></div><div class="gantt-bar-container"><div class="gantt-bar" style="left:${left}%; width:${width}%; background:${color};"></div></div>`;
            row.querySelector('.gantt-label').textContent = item.name; area.appendChild(row);
        });
    }

    const quizData = [ { q: '生産量日本一の「メロン」の産地は？', a: ['茨城県', '北海道', '静岡県'], c: 0, exp: '茨城県はメロンの生産量日本一を誇ります。' }, { q: '群馬県の「下仁田ネギ」の特徴は？', a: ['細くて長い', '太くて甘い', '辛味が強い'], c: 1, exp: '加熱するととろけるような甘さになる太いネギです。' } ];
    let qIdx = 0;
    function loadQuiz() {
        const container = document.getElementById('quiz-container');
        if(qIdx >= quizData.length) { 
            container.innerHTML = '<h3>全問終了！</h3><button id="quiz-restart" class="neon-button">最初から</button>';
            document.getElementById('quiz-restart').addEventListener('click', () => { qIdx = 0; container.innerHTML = `<div class="quiz-header"><span id="quiz-count">第1問</span></div><p id="quiz-question" class="quiz-question"></p><div id="quiz-options" class="quiz-options"></div><div id="quiz-feedback" class="quiz-feedback" hidden><p id="quiz-result-msg" class="quiz-result-msg"></p><p id="quiz-explanation" class="quiz-explanation"></p><button id="quiz-next-btn" class="neon-button">次の問題へ</button></div>`; document.getElementById('quiz-next-btn').addEventListener('click', () => { qIdx++; loadQuiz(); }); loadQuiz(); });
            return; 
        }
        const q = quizData[qIdx]; document.getElementById('quiz-count').textContent = `第${qIdx+1}問`; document.getElementById('quiz-question').textContent = q.q; document.getElementById('quiz-feedback').setAttribute('hidden', 'true');
        const opts = document.getElementById('quiz-options'); opts.innerHTML = '';
        q.a.forEach((ans, i) => { const btn = document.createElement('button'); btn.className = 'neon-button'; btn.textContent = ans; btn.onclick = () => checkAnswer(i, q); opts.appendChild(btn); });
    }
    function checkAnswer(choice, q) {
        document.getElementById('quiz-feedback').removeAttribute('hidden'); const msgEl = document.getElementById('quiz-result-msg');
        if(choice === q.c) { msgEl.textContent = '正解！⭕️'; msgEl.className = 'quiz-result-msg correct'; } else { msgEl.textContent = '残念...❌'; msgEl.className = 'quiz-result-msg wrong'; }
        document.getElementById('quiz-explanation').textContent = q.exp; document.querySelectorAll('#quiz-options button').forEach(b => b.disabled = true);
    }
    const nextBtn = document.getElementById('quiz-next-btn'); if(nextBtn) nextBtn.addEventListener('click', () => { qIdx++; loadQuiz(); });

    let swipeDeck = []; const cardUI = document.getElementById('swipe-card'); const likeBadge = document.querySelector('.swipe-status.like'); const nopeBadge = document.querySelector('.swipe-status.nope');
    function initSwipe() { swipeDeck = [...specialtyDatabase].sort(() => 0.5 - Math.random()); loadNextSwipeCard(); }
    function loadNextSwipeCard() {
        if(swipeDeck.length === 0) { cardUI.style.display = 'none'; return; }
        const item = swipeDeck[0]; document.getElementById('swipe-img').src = item.imageSrc; document.getElementById('swipe-name').textContent = item.name; document.getElementById('swipe-desc').textContent = item.description;
        cardUI.style.transform = ''; likeBadge.style.opacity = 0; nopeBadge.style.opacity = 0;
    }
    let isDragging = false, startX = 0;
    function startDrag(e) { isDragging = true; startX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX; cardUI.style.transition = 'none'; document.addEventListener('mousemove', moveDrag); document.addEventListener('touchmove', moveDrag, {passive: false}); document.addEventListener('mouseup', endDrag); document.addEventListener('touchend', endDrag); }
    function moveDrag(e) {
        if(!isDragging) return; const diff = (e.type.includes('mouse') ? e.clientX : e.touches[0].clientX) - startX; cardUI.style.transform = `translateX(${diff}px) rotate(${diff * 0.1}deg)`;
        if(diff > 0) { likeBadge.style.opacity = Math.min(diff / 100, 1); nopeBadge.style.opacity = 0; } else { nopeBadge.style.opacity = Math.min(Math.abs(diff) / 100, 1); likeBadge.style.opacity = 0; }
    }
    function endDrag(e) {
        if(!isDragging) return; isDragging = false; document.removeEventListener('mousemove', moveDrag); document.removeEventListener('touchmove', moveDrag); document.removeEventListener('mouseup', endDrag); document.removeEventListener('touchend', endDrag);
        const match = cardUI.style.transform.match(/translateX\((.*?)px\)/); const diff = match ? parseFloat(match[1]) : 0; cardUI.style.transition = 'transform 0.3s ease-out';
        if(diff > 100) { cardUI.style.transform = `translateX(500px) rotate(30deg)`; handleSwipeResult(true); } else if (diff < -100) { cardUI.style.transform = `translateX(-500px) rotate(-30deg)`; handleSwipeResult(false); } else { cardUI.style.transform = ''; likeBadge.style.opacity = 0; nopeBadge.style.opacity = 0; }
    }
    if(cardUI) { cardUI.addEventListener('mousedown', startDrag); cardUI.addEventListener('touchstart', startDrag, {passive: true}); }
    function handleSwipeResult(isLike) {
        const item = swipeDeck.shift();
        if(isLike) { const container = document.getElementById('swipe-results'); const card = document.createElement('div'); card.className = 'specialty-card'; card.tabIndex = 0; const img = document.createElement('img'); img.src = item.imageSrc; const h4 = document.createElement('h4'); h4.textContent = item.name; card.append(img, h4); card.onclick = () => openModal(item); container.appendChild(card); }
        setTimeout(() => loadNextSwipeCard(), 300);
    }
    document.getElementById('swipe-yes').addEventListener('click', () => { cardUI.style.transition = 'transform 0.3s ease-out'; cardUI.style.transform = `translateX(500px) rotate(30deg)`; handleSwipeResult(true); });
    document.getElementById('swipe-no').addEventListener('click', () => { cardUI.style.transition = 'transform 0.3s ease-out'; cardUI.style.transform = `translateX(-500px) rotate(-30deg)`; handleSwipeResult(false); });

    const chatInput = document.getElementById('chat-input'); const chatWindow = document.getElementById('chat-window'); const chatSendBtn = document.getElementById('chat-send'); const voiceBtn = document.getElementById('voice-btn');
    if(chatSendBtn) {
        chatSendBtn.addEventListener('click', () => {
            const text = chatInput.value; if(!text) return;
            const userMsg = document.createElement('div'); userMsg.className = 'chat-msg user'; userMsg.textContent = text; chatWindow.appendChild(userMsg); chatInput.value = '';
            setTimeout(() => { const botMsg = document.createElement('div'); botMsg.className = 'chat-msg bot'; botMsg.textContent = ['さっぱりなら「梨」がおすすめですよ！', '「深谷ネギ」を使った鍋はどうですか？', '今の時期は「いちご」が最高です！'][Math.floor(Math.random() * 3)]; chatWindow.appendChild(botMsg); chatWindow.scrollTop = chatWindow.scrollHeight; }, 1000);
        });
    }
    if (voiceBtn) {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)(); recognition.lang = 'ja-JP'; recognition.interimResults = false;
            voiceBtn.addEventListener('click', () => { recognition.start(); voiceBtn.textContent = '🔴'; chatInput.placeholder = 'お話しください...'; });
            recognition.onresult = (event) => { chatInput.value = event.results[0][0].transcript; voiceBtn.textContent = '🎤'; chatInput.placeholder = 'メッセージを入力...'; chatSendBtn.click(); };
            recognition.onerror = () => { voiceBtn.textContent = '🎤'; chatInput.placeholder = 'エラーが発生しました'; };
            recognition.onend = () => { voiceBtn.textContent = '🎤'; };
        } else { voiceBtn.style.display = 'none'; }
    }

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
    document.getElementById('modal-close').addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => { if(e.target === modalOverlay) closeModal(); });
    document.addEventListener('keydown', (e) => { if(e.key === 'Escape' && modalOverlay.classList.contains('is-open')) { closeModal(); } });
    
    const stars = document.querySelectorAll('.rating-stars .star'); const ratingContainer = document.querySelector('.rating-stars'); const commentText = document.getElementById('comment-textarea'); let currentRating = 0; 
    stars.forEach(star => {
        const setRating = (e) => { currentRating = parseInt(e.target.dataset.value, 10); ratingContainer.dataset.rating = currentRating; stars.forEach(s => { s.classList.remove('selected'); s.setAttribute('aria-checked', 'false'); }); for (let i = 0; i < currentRating; i++) { stars[i].classList.add('selected'); stars[i].setAttribute('aria-checked', 'true'); } };
        star.addEventListener('click', setRating); star.addEventListener('keydown', (e) => { if(e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setRating(e); } });
    });
    document.getElementById('rating-submit-button').addEventListener('click', () => {
        if (currentRating === 0) { alert('評価（星）を選択してください。'); return; }
        alert(`評価が送信されました！(デモ)\n評価: ★ ${currentRating}\nコメント: ${commentText.value}`);
        currentRating = 0; ratingContainer.dataset.rating = 0; stars.forEach(s => { s.classList.remove('selected'); s.setAttribute('aria-checked', 'false'); }); commentText.value = '';
    });
});