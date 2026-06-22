const API = 'https://gourmet-api.onrender.com';

// 評価を投稿する関数
async function postRating(itemId, stars, comment) {
    await fetch(`${API}/api/ratings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ item_id: itemId, stars, comment })
    });
}

// 評価一覧を取得する関数
async function getRatings(itemId) {
    const res = await fetch(`${API}/api/ratings?item_id=${itemId}`);
    return await res.json();
}

// 推薦用：平均評価サマリー取得
async function getRatingSummary() {
    const res = await fetch(`${API}/api/ratings/summary`);
    return await res.json();
}