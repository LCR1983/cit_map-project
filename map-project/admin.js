document.addEventListener('DOMContentLoaded', () => {
    const loginView = document.getElementById('login-view');
    const dashboardView = document.getElementById('dashboard-view');
    const headerActions = document.getElementById('header-actions');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const loginSubmitBtn = document.getElementById('login-submit');
    const logoutBtn = document.getElementById('logout-btn');

    let csrfToken = '';

    // URL to API (Assumes backend is running locally on 8080)
    const API_BASE = 'http://localhost:8080/api';
    const ADMIN_API_BASE = 'http://localhost:8080/api/admin';

    // --- State Management ---
    const showDashboard = (token) => {
        csrfToken = token || '';
        loginView.style.display = 'none';
        dashboardView.style.display = 'block';
        headerActions.style.display = 'block';
        
        // Fetch initial data or stats if necessary
        fetchStats();
    };

    const showLogin = () => {
        csrfToken = '';
        loginView.style.display = 'block';
        dashboardView.style.display = 'none';
        headerActions.style.display = 'none';
        
        // Reset form
        loginForm.reset();
        loginError.textContent = '';
    };

    const setLoading = (isLoading) => {
        if (isLoading) {
            loginSubmitBtn.classList.add('is-loading');
            loginSubmitBtn.disabled = true;
        } else {
            loginSubmitBtn.classList.remove('is-loading');
            loginSubmitBtn.disabled = false;
        }
    };

    // --- API Calls ---

    // 1. Session Check (Called on load)
    const checkSession = async () => {
        try {
            // Using credentials: 'include' to send the HttpOnly cookie
            const response = await fetch(`${ADMIN_API_BASE}/check`, {
                method: 'GET',
                headers: { 'Accept': 'application/json' },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                if (data.authenticated) {
                    showDashboard(data.csrfToken);
                } else {
                    showLogin();
                }
            } else {
                showLogin();
            }
        } catch (error) {
            console.error('Session check failed:', error);
            showLogin(); // Fallback to login if network error
        }
    };

    // 2. Login
    const handleLogin = async () => {
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value.trim();

        if (!username || !password) {
            loginError.textContent = 'ユーザー名とパスワードを入力してください。';
            return;
        }

        loginError.textContent = '';
        setLoading(true);

        try {
            const response = await fetch(`${ADMIN_API_BASE}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
            });

            const data = await response.json();

            if (response.ok) {
                // Success
                showDashboard(data.csrfToken);
            } else {
                // Failure
                loginError.textContent = data.error || 'ログインに失敗しました。';
            }
        } catch (error) {
            console.error('Login error:', error);
            loginError.textContent = 'サーバーとの通信に失敗しました。';
        } finally {
            setLoading(false);
        }
    };

    // 3. Logout
    const handleLogout = async () => {
        try {
            await fetch(`${ADMIN_API_BASE}/logout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken // Sending CSRF token for logout protection
                },
                credentials: 'include'
            });
            // Regardless of server response, revert to login view on client
            showLogin();
        } catch (error) {
            console.error('Logout error:', error);
            showLogin();
        }
    };

    // 4. Fetch Stats & Data
    const fetchStats = async () => {
        fetchSpecialties();
        fetchRatings();
    };

    const fetchSpecialties = async () => {
        try {
            const response = await fetch(`${API_BASE}/specialties`, {
                method: 'GET',
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                renderSpecialties(data);
            }
        } catch (error) {
            console.error('Failed to fetch specialties:', error);
        }
    };

    const fetchRatings = async () => {
        try {
            const response = await fetch(`${API_BASE}/ratings`, {
                method: 'GET',
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                renderRatings(data);
                const reviewsStat = document.getElementById('stat-reviews');
                if (reviewsStat) reviewsStat.textContent = data.length;
            }
        } catch (error) {
            console.error('Failed to fetch ratings:', error);
        }
    };

    const renderSpecialties = (data) => {
        const tbody = document.getElementById('data-table-body');
        if (!tbody) return;
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="padding:10px; text-align:center;">データがありません</td></tr>';
            return;
        }
        tbody.innerHTML = data.map(item => `
            <tr style="border-bottom:1px solid var(--border-color);">
                <td style="padding:10px;">${item.id}</td>
                <td style="padding:10px;">${item.name}</td>
                <td style="padding:10px;">${item.prefecture}</td>
                <td style="padding:10px;">${item.season}</td>
                <td style="padding:10px;">
                    <button class="logout-btn" style="padding:4px 10px; font-size:0.8rem; border-color:var(--border-color); color:var(--text-sec);" disabled>編集(モック)</button>
                </td>
            </tr>
        `).join('');
    };

    const renderRatings = (data) => {
        const tbody = document.getElementById('review-table-body');
        if (!tbody) return;
        if (data.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="padding:10px; text-align:center;">評価がありません</td></tr>';
            return;
        }
        tbody.innerHTML = data.map(item => {
            const date = item.createdAt ? new Date(item.createdAt).toLocaleString('ja-JP') : '不明';
            return `
            <tr style="border-bottom:1px solid var(--border-color);">
                <td style="padding:10px; color:gold;">${'★'.repeat(item.rating)}${'☆'.repeat(5 - item.rating)}</td>
                <td style="padding:10px;">${item.comment || '<span style="color:var(--text-sec);">コメントなし</span>'}</td>
                <td style="padding:10px; font-size:0.85rem;">${date}</td>
                <td style="padding:10px;">
                    <button class="logout-btn" style="padding:4px 10px; font-size:0.8rem;" onclick="deleteRating(${item.id})">削除</button>
                </td>
            </tr>
        `}).join('');
    };

    window.deleteRating = async (id) => {
        if (!confirm('この評価を削除してよろしいですか？')) return;
        try {
            const response = await fetch(`${API_BASE}/ratings/${id}`, {
                method: 'DELETE',
                headers: { 'X-CSRF-TOKEN': csrfToken },
                credentials: 'include'
            });
            if (response.ok) {
                alert('削除しました');
                fetchRatings();
            } else {
                alert('削除に失敗しました');
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('通信エラー');
        }
    };

    const analyzeRatings = async () => {
        const reportContainer = document.getElementById('ai-report-container');
        const btn = document.getElementById('analyze-reviews-btn');
        reportContainer.style.display = 'block';
        reportContainer.textContent = '🤖 AIがレビューを分析中...\n（Ollamaの起動状況によっては数十秒かかる場合があります）';
        btn.disabled = true;

        try {
            const response = await fetch(`${ADMIN_API_BASE}/ratings/analyze`, {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': csrfToken },
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                reportContainer.textContent = data.report || '分析結果がありません。';
            } else {
                reportContainer.textContent = '⚠️ 分析に失敗しました。Ollamaサーバーが起動していない可能性があります。';
            }
        } catch (error) {
            console.error('AI analysis error:', error);
            reportContainer.textContent = '⚠️ 通信エラーが発生しました。';
        } finally {
            btn.disabled = false;
        }
    };

    // --- UI Toggles ---
    const dataSection = document.getElementById('data-section');
    const reviewSection = document.getElementById('review-section');

    const openDataBtn = document.getElementById('open-data-btn');
    if (openDataBtn) openDataBtn.addEventListener('click', () => {
        dataSection.style.display = 'block';
        reviewSection.style.display = 'none';
        fetchSpecialties();
    });

    const closeDataBtn = document.getElementById('close-data-btn');
    if (closeDataBtn) closeDataBtn.addEventListener('click', () => {
        dataSection.style.display = 'none';
    });

    const openReviewBtn = document.getElementById('open-review-btn');
    if (openReviewBtn) openReviewBtn.addEventListener('click', () => {
        reviewSection.style.display = 'block';
        dataSection.style.display = 'none';
        fetchRatings();
    });

    const closeReviewBtn = document.getElementById('close-review-btn');
    if (closeReviewBtn) closeReviewBtn.addEventListener('click', () => {
        reviewSection.style.display = 'none';
    });

    const analyzeBtn = document.getElementById('analyze-reviews-btn');
    if (analyzeBtn) analyzeBtn.addEventListener('click', analyzeRatings);

    // --- Event Listeners ---
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleLogin();
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Initialize
    checkSession();
});
