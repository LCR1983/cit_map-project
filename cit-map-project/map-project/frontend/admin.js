/**
 * 管理者ツール制御スクリプト
 *
 * ── セキュリティ設計 ──
 * ・ログイン時にバックエンドから受け取ったCSRFトークンを、
 *   データ変更（POST/PUT/DELETE）のリクエストヘッダー「X-CSRF-Token」に自動添付します。
 * ・セッショントークン（HttpOnly Cookie）はブラウザが自動で添付するため、
 *   JavaScript側では一切触れません（XSS耐性の担保）。
 */
'use strict';

// ── グローバル状態 ──
let csrfToken = '';           // ログイン時にバックエンドから受け取るCSRFトークン
let allSpecialties = [];      // データベースから取得した全特産品データ
let allRatings = [];          // データベースから取得した全評価データ
let editingId = null;         // 現在編集中のデータID（null = 新規追加モード）
let deleteTargetId = null;    // 削除対象のデータID

// 都県名の日本語マッピング
const prefNames = {
    ibaraki: '茨城県', tochigi: '栃木県', gunma: '群馬県',
    saitama: '埼玉県', chiba: '千葉県', tokyo: '東京都', kanagawa: '神奈川県'
};

// 季節名の日本語マッピング
const seasonNames = {
    spring: '🌸 春', summer: '☀️ 夏', autumn: '🍁 秋', winter: '❄️ 冬'
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// DOM読み込み完了後にすべてを初期化
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
document.addEventListener('DOMContentLoaded', () => {
    const loginScreen = document.getElementById('login-screen');
    const dashboard = document.getElementById('dashboard');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const loginBtn = document.getElementById('login-btn');

    // ── ページ読み込み時: 既にログイン済みかチェック ──
    checkExistingSession();

    /**
     * 既存セッションの確認
     * ページを開いた瞬間に「まだログインしているか？」をバックエンドに問い合わせます。
     */
    async function checkExistingSession() {
        try {
            const res = await fetch('/api/admin/check', { credentials: 'same-origin' });
            if (res.ok) {
                const data = await res.json();
                if (data.authenticated) {
                    csrfToken = data.csrfToken;
                    showDashboard();
                    return;
                }
            }
        } catch (e) {
            // 通信エラー → ログイン画面を表示
        }
        showLoginScreen();
    }

    /**
     * ログインフォーム送信
     */
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value;

        if (!username || !password) return;

        loginBtn.disabled = true;
        loginBtn.textContent = '認証中...';
        loginError.classList.remove('visible');

        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'same-origin',
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (res.ok) {
                csrfToken = data.csrfToken;
                showToast('🎉 ログインに成功しました！', 'success');
                showDashboard();
            } else {
                loginError.textContent = data.error || 'ログインに失敗しました。';
                loginError.classList.add('visible');
            }
        } catch (err) {
            loginError.textContent = 'サーバーへの接続に失敗しました。';
            loginError.classList.add('visible');
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'ログイン';
        }
    });

    /**
     * ログアウト
     */
    document.getElementById('logout-btn').addEventListener('click', async () => {
        try {
            await fetch('/api/admin/logout', {
                method: 'POST',
                credentials: 'same-origin'
            });
        } catch (e) { /* ignore */ }

        csrfToken = '';
        allSpecialties = [];
        showToast('🚪 ログアウトしました', 'info');
        showLoginScreen();
    });

    // ── 画面切り替え ──
    function showLoginScreen() {
        loginScreen.style.display = 'flex';
        dashboard.style.display = 'none';
        document.getElementById('login-username').value = '';
        document.getElementById('login-password').value = '';
        loginError.classList.remove('visible');
    }

    function showDashboard() {
        loginScreen.style.display = 'none';
        dashboard.style.display = 'block';
        loadData();
        loadRatings(); // 評価データも読み込み
    }

    // ── タブ切り替え制御 ──
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            tabContents.forEach(c => c.classList.remove('active'));
            
            btn.classList.add('active');
            const targetId = btn.getAttribute('data-target');
            document.getElementById(targetId).classList.add('active');
            
            if (targetId === 'tab-ratings') {
                loadRatings();
            }
        });
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // データ読み込み・表示
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    /**
     * バックエンドから全データを取得してテーブルに表示
     */
    async function loadData() {
        try {
            const res = await fetch('/api/specialties', { credentials: 'same-origin' });
            if (res.status === 401) {
                showToast('⚠️ セッションが切れました。再ログインしてください。', 'error');
                showLoginScreen();
                return;
            }
            if (!res.ok) throw new Error('API Error');

            allSpecialties = await res.json();
            updateStats();
            renderTable();
        } catch (err) {
            showToast('❌ データの取得に失敗しました。', 'error');
        }
    }

    /**
     * 統計カードの更新
     */
    function updateStats() {
        document.getElementById('stat-total').textContent = allSpecialties.length;
        const prefs = new Set(allSpecialties.map(s => s.prefecture));
        document.getElementById('stat-prefs').textContent = prefs.size;
        const seasons = new Set(allSpecialties.map(s => s.season));
        document.getElementById('stat-seasons').textContent = seasons.size;
    }

    /**
     * データテーブルのレンダリング（フィルター対応）
     */
    function renderTable() {
        const tbody = document.getElementById('data-tbody');
        const searchVal = document.getElementById('search-input').value.toLowerCase();
        const prefFilter = document.getElementById('filter-pref').value;
        const seasonFilter = document.getElementById('filter-season').value;
        const categoryFilter = document.getElementById('filter-category').value;

        // フィルタリング
        let filtered = allSpecialties.filter(item => {
            const matchSearch = !searchVal || item.name.toLowerCase().includes(searchVal);
            const matchPref = prefFilter === 'all' || item.prefecture === prefFilter;
            const matchSeason = seasonFilter === 'all' || item.season === seasonFilter;
            const matchCategory = categoryFilter === 'all' || detectCategory(item.name) === categoryFilter;
            return matchSearch && matchPref && matchSeason && matchCategory;
        });

        if (filtered.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7">
                        <div class="empty-table">
                            <div class="empty-icon">📭</div>
                            <p>該当するデータがありません</p>
                        </div>
                    </td>
                </tr>`;
            return;
        }

        tbody.innerHTML = filtered.map(item => {
            const imgCell = item.imageUrl
                ? `<img src="${escapeHtml(item.imageUrl)}" class="table-img" onerror="this.outerHTML='<div class=\\'table-img-placeholder\\'>🖼️</div>'">`
                : `<div class="table-img-placeholder">🖼️</div>`;

            const categoryLabel = escapeHtml(detectCategory(item.name) || '－');

            return `
                <tr>
                    <td style="color:var(--admin-text-sec);font-size:0.8rem;">${item.id}</td>
                    <td>${imgCell}</td>
                    <td><strong>${escapeHtml(item.name)}</strong></td>
                    <td><span class="badge badge-pref">${prefNames[item.prefecture] || item.prefecture}</span></td>
                    <td><span class="badge badge-season">${seasonNames[item.season] || item.season}</span></td>
                    <td><span class="badge badge-category">${categoryLabel}</span></td>
                    <td>
                        <div class="action-btns">
                            <button class="btn-edit" onclick="openEditModal(${item.id})">✏️ 編集</button>
                            <button class="btn-delete" onclick="openDeleteConfirm(${item.id}, '${escapeHtml(item.name)}')">🗑️</button>
                        </div>
                    </td>
                </tr>`;
        }).join('');
    }

    // 検索・フィルター変更時にテーブルを再描画
    document.getElementById('search-input').addEventListener('input', renderTable);
    document.getElementById('filter-pref').addEventListener('change', renderTable);
    document.getElementById('filter-season').addEventListener('change', renderTable);
    document.getElementById('filter-category').addEventListener('change', renderTable);

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 新規追加 / 編集モーダル
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const editModal = document.getElementById('edit-modal');
    const editForm = document.getElementById('edit-form');

    // 新規追加ボタン
    document.getElementById('btn-add-new').addEventListener('click', () => {
        editingId = null;
        document.getElementById('modal-title').textContent = '📝 新規追加';
        editForm.reset();
        clearImagePreview();
        editModal.classList.add('active');
    });

    // 編集モーダルを開く（グローバル関数）
    window.openEditModal = function (id) {
        const item = allSpecialties.find(s => s.id === id);
        if (!item) return;

        editingId = id;
        document.getElementById('modal-title').textContent = '✏️ データ編集';
        document.getElementById('edit-name').value = item.name || '';
        document.getElementById('edit-prefecture').value = item.prefecture || '';
        document.getElementById('edit-season').value = item.season || '';
        document.getElementById('edit-description').value = item.description || '';
        document.getElementById('edit-localdish').value = item.localDish || '';
        document.getElementById('edit-imageurl').value = item.imageUrl || '';

        // 画像プレビュー
        updateImagePreview(item.imageUrl);

        editModal.classList.add('active');
    };

    // モーダルを閉じる
    function closeEditModal() {
        editModal.classList.remove('active');
        editingId = null;
    }

    document.getElementById('modal-close-btn').addEventListener('click', closeEditModal);
    document.getElementById('modal-cancel-btn').addEventListener('click', closeEditModal);
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) closeEditModal();
    });

    // フォーム送信（新規追加 or 更新）
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const payload = {
            name: document.getElementById('edit-name').value.trim(),
            prefecture: document.getElementById('edit-prefecture').value,
            season: document.getElementById('edit-season').value,
            description: document.getElementById('edit-description').value.trim(),
            localDish: document.getElementById('edit-localdish').value.trim() || null,
            imageUrl: document.getElementById('edit-imageurl').value.trim() || null
        };

        const saveBtn = document.getElementById('modal-save-btn');
        saveBtn.disabled = true;
        saveBtn.textContent = '保存中...';

        try {
            const url = editingId ? `/api/specialties/${editingId}` : '/api/specialties';
            const method = editingId ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': csrfToken     // ★ CSRF防御: ダブルサブミットトークン
                },
                credentials: 'same-origin',
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (res.ok) {
                showToast(editingId ? '✏️ データを更新しました！' : '🎉 新しい特産品を登録しました！', 'success');
                closeEditModal();
                loadData();
            } else if (res.status === 401) {
                showToast('⚠️ セッションが切れました。再ログインしてください。', 'error');
                showLoginScreen();
            } else if (res.status === 403) {
                showToast('🚫 不正なリクエストです（CSRF検証失敗）。', 'error');
            } else if (data.errors) {
                showToast('⚠️ ' + data.errors.join('\n'), 'error');
            } else {
                showToast('❌ ' + (data.error || '保存に失敗しました。'), 'error');
            }
        } catch (err) {
            showToast('❌ サーバーエラーが発生しました。', 'error');
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = '💾 保存する';
        }
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 画像プレビュー機能
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const imageUrlInput = document.getElementById('edit-imageurl');
    const imagePreviewContainer = document.getElementById('image-preview');
    let previewTimeout = null;

    imageUrlInput.addEventListener('input', () => {
        clearTimeout(previewTimeout);
        previewTimeout = setTimeout(() => {
            updateImagePreview(imageUrlInput.value.trim());
        }, 500); // 入力停止0.5秒後にプレビュー更新
    });

    function updateImagePreview(url) {
        if (!url) {
            clearImagePreview();
            return;
        }

        const img = new Image();
        img.onload = () => {
            imagePreviewContainer.innerHTML = '';
            imagePreviewContainer.appendChild(img);
            imagePreviewContainer.classList.add('has-image');
        };
        img.onerror = () => {
            imagePreviewContainer.innerHTML = '<div class="image-preview-placeholder">⚠️ 画像を読み込めませんでした</div>';
            imagePreviewContainer.classList.remove('has-image');
        };
        img.src = url;
    }

    function clearImagePreview() {
        imagePreviewContainer.innerHTML = '<div class="image-preview-placeholder">📷 画像ファイルパスを入力するとプレビューが表示されます</div>';
        imagePreviewContainer.classList.remove('has-image');
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 削除確認ダイアログ
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    const confirmOverlay = document.getElementById('confirm-overlay');

    window.openDeleteConfirm = function (id, name) {
        deleteTargetId = id;
        document.getElementById('confirm-message').textContent =
            `「${name}」を削除します。この操作は取り消せません。`;
        confirmOverlay.classList.add('active');
    };

    document.getElementById('confirm-cancel-btn').addEventListener('click', () => {
        confirmOverlay.classList.remove('active');
        deleteTargetId = null;
    });

    document.getElementById('confirm-delete-btn').addEventListener('click', async () => {
        if (!deleteTargetId) return;

        try {
            const res = await fetch(`/api/specialties/${deleteTargetId}`, {
                method: 'DELETE',
                headers: { 'X-CSRF-Token': csrfToken },  // ★ CSRF防御
                credentials: 'same-origin'
            });

            const data = await res.json();

            if (res.ok) {
                showToast('🗑️ ' + (data.message || 'データを削除しました。'), 'success');
                loadData();
            } else if (res.status === 401) {
                showToast('⚠️ セッションが切れました。', 'error');
                showLoginScreen();
            } else {
                showToast('❌ ' + (data.error || '削除に失敗しました。'), 'error');
            }
        } catch (err) {
            showToast('❌ サーバーエラーが発生しました。', 'error');
        }

        confirmOverlay.classList.remove('active');
        deleteTargetId = null;
    });

    confirmOverlay.addEventListener('click', (e) => {
        if (e.target === confirmOverlay) {
            confirmOverlay.classList.remove('active');
            deleteTargetId = null;
        }
    });

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 評価コメント管理＆グラフ・AI分析
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

    async function loadRatings() {
        try {
            const res = await fetch('/api/ratings', { credentials: 'same-origin' });
            if (res.status === 401) {
                showToast('⚠️ セッションが切れました。再ログインしてください。', 'error');
                showLoginScreen();
                return;
            }
            if (!res.ok) throw new Error('API Error');

            allRatings = await res.json();
            renderRatingsTable();
            renderPieChart();
        } catch (err) {
            showToast('❌ 評価データの取得に失敗しました。', 'error');
        }
    }

    function renderRatingsTable() {
        const tbody = document.getElementById('ratings-tbody');
        if (allRatings.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4"><div class="empty-table"><div class="empty-icon">📭</div><p>評価データがありません</p></div></td></tr>`;
            return;
        }

        tbody.innerHTML = allRatings.map(item => {
            const dateStr = new Date(item.createdAt).toLocaleString();
            const stars = '⭐'.repeat(item.rating) + '・'.repeat(5 - item.rating);
            return `
                <tr>
                    <td style="color:var(--admin-warning); font-size:1rem;">${stars}</td>
                    <td style="font-size:0.9rem;">${escapeHtml(item.comment || '(コメントなし)')}</td>
                    <td style="font-size:0.8rem; color:var(--admin-text-sec);">${dateStr}</td>
                    <td>
                        <button class="btn-delete" onclick="deleteRating(${item.id})">🗑️ 削除</button>
                    </td>
                </tr>`;
        }).join('');
    }

    function renderPieChart() {
        if (allRatings.length === 0) return;

        let counts = [0, 0, 0, 0, 0]; // index 0=★1, ..., 4=★5
        let totalScore = 0;

        allRatings.forEach(r => {
            if (r.rating >= 1 && r.rating <= 5) {
                counts[r.rating - 1]++;
                totalScore += r.rating;
            }
        });

        const avg = (totalScore / allRatings.length).toFixed(1);
        document.getElementById('rating-avg').textContent = avg;

        const colors = [
            '#ef4444', // ★1 Red
            '#f97316', // ★2 Orange
            '#eab308', // ★3 Yellow
            '#22c55e', // ★4 Green
            '#3b82f6'  // ★5 Blue
        ];

        let gradientString = [];
        let currentPercent = 0;
        let legendHTML = '';

        for (let i = 4; i >= 0; i--) { // ★5から順に描画
            const pct = (counts[i] / allRatings.length) * 100;
            if (pct > 0) {
                const start = currentPercent;
                const end = currentPercent + pct;
                gradientString.push(`${colors[i]} ${start}% ${end}%`);
                currentPercent = end;
            }
            
            legendHTML += `
                <div class="legend-item">
                    <span><span class="legend-color" style="background:${colors[i]}"></span> ★${i+1}</span>
                    <span>${counts[i]}件 (${pct.toFixed(1)}%)</span>
                </div>`;
        }

        const pieChart = document.getElementById('rating-pie-chart');
        pieChart.style.background = `conic-gradient(${gradientString.join(', ')})`;
        document.getElementById('rating-legend').innerHTML = legendHTML;
    }

    window.deleteRating = async function(id) {
        if (!confirm('この評価を削除しますか？')) return;

        try {
            const res = await fetch(`/api/ratings/${id}`, {
                method: 'DELETE',
                headers: { 'X-CSRF-Token': csrfToken },
                credentials: 'same-origin'
            });

            if (res.ok) {
                showToast('🗑️ 評価を削除しました。', 'success');
                loadRatings();
            } else {
                showToast('❌ 削除に失敗しました。', 'error');
            }
        } catch (err) {
            showToast('❌ サーバーエラーが発生しました。', 'error');
        }
    };

    // AI分析
    const btnAi = document.getElementById('btn-ai-analyze');
    const aiLoading = document.getElementById('ai-loading');
    const aiReport = document.getElementById('ai-report');

    if (btnAi) {
        btnAi.addEventListener('click', async () => {
            btnAi.style.display = 'none';
            aiReport.style.display = 'none';
            aiLoading.style.display = 'flex';

            try {
                const res = await fetch('/api/admin/ratings/analyze', {
                    method: 'POST',
                    headers: { 'X-CSRF-Token': csrfToken },
                    credentials: 'same-origin'
                });

                const data = await res.json();
                
                if (res.ok) {
                    aiReport.innerHTML = marked.parse ? marked.parse(data.report) : escapeHtml(data.report).replace(/\n/g, '<br>');
                    aiReport.style.display = 'block';
                } else {
                    showToast('❌ AI分析エラー: ' + (data.error || '失敗しました'), 'error');
                    btnAi.style.display = 'block';
                }
            } catch (err) {
                showToast('❌ 通信エラーが発生しました。', 'error');
                btnAi.style.display = 'block';
            } finally {
                aiLoading.style.display = 'none';
                if (aiReport.style.display === 'block') {
                    btnAi.textContent = '🔄 もう一度AIで分析する';
                    btnAi.style.display = 'block';
                    btnAi.style.marginTop = '16px';
                }
            }
        });
    }
});

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ユーティリティ関数
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * 食材名からカテゴリを推定する（data.js の detectCategory と同一ロジック）
 */
function detectCategory(name) {
    if (!name) return '野菜';
    if (/メロン|スイカ|梨|栗|いちご|びわ|ゴールド|ぶどう|柿|桃|ブルーベリー|りんご|夏みかん/.test(name)) return '果物';
    if (/魚|鮎|アユ|しらす|ブリ|鯛|アジ|鯵|伊勢えび|サザエ|あさり|ハマグリ|はまぐり|しじみ|さんま|サンマ|鯖|サバ|かつお|金目鯛|マグロ|わかさぎ|穴子|海苔|いわし|アジフライ|干物|わかめ|海老|さくら海老/.test(name)) return '海鮮';
    if (/牛|豚|鹿|東京X|シロコロ|麦豚|和牛/.test(name)) return '肉';
    if (/鍋|汁|丼|うどん|そば|寿司|餃子|おでん|焼きそば|天丼|天ぷら|田楽|すき焼き|しゃぶしゃぶ|めし|深川|柳川|もんじゃ|ちゃんこ|なめろう|さんが焼き|建長|おっきりこみ|煮ぼうとう|焼き肉|塩焼き|揚げ|かき揚げ|カレー|冷やし|冷汁/.test(name)) return '郷土料理';
    if (/納豆|ほしいも|干し|ジャム|ジュース|かまぼこ|くさや|せんべい|天然氷|湯葉|ゆば|こんにゃく|加工品|焼酎|ところてん|みそ味噌|佃煮/.test(name)) return '加工品';
    if (/餅|大福|まんじゅう|ようかん|団子|かき氷|甘酒|ゼリー|スイーツ|和菓子/.test(name)) return 'スイーツ';
    if (/舞茸|まいたけ|しいたけ|きのこ|しめじ/.test(name)) return 'きのこ';
    if (/新米|おこわ|ご飯/.test(name)) return '米';
    if (/そば麦|麦/.test(name)) return '穀物';
    return '野菜';
}

/**
 * トースト通知を表示（4秒後に自動消滅）
 */
function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    container.appendChild(toast);

    // 4秒後に自動削除
    setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 4000);
}

/**
 * HTMLエスケープ（XSS防御）
 * ユーザーの入力値をHTMLに表示する際、スクリプト注入を100%防ぎます。
 */
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
