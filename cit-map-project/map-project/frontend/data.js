// data.js — 関東ローカルグルメ旬食材データベース (504件)
// 7都県 × 4季節 × 18件 = 504件
// Copilot生成シードデータをもとに自動構築

(function () {
  'use strict';

  // ── 都道府県・季節の対応 ─────────────────────────────────────────────────
  const PREF_NAMES = {
    ibaraki:  '茨城県',
    tochigi:  '栃木県',
    gunma:    '群馬県',
    saitama:  '埼玉県',
    chiba:    '千葉県',
    tokyo:    '東京都',
    kanagawa: '神奈川県',
  };

  const SEASON_NAMES = { spring: '春', summer: '夏', autumn: '秋', winter: '冬' };

  // ── カテゴリ別プレースホルダー画像カラー ─────────────────────────────────
  // 同カテゴリ内で複数の色を循環させ、視覚的なバリエーションを持たせる
  const CATEGORY_COLORS = {
    '野菜':     ['166534/white', '15803d/white', '4d7c0f/white', '14532d/white', '365314/white', '1a2e05/white'],
    '果物':     ['92400e/white', '854d0e/white', '15803d/white', '7c3aed/white', '9333ea/white', '6d28d9/white'],
    '海鮮':     ['0369a1/white', '0284c7/white', '0e7490/white', '1d4ed8/white', '1e40af/white', '075985/white'],
    '肉':       ['b91c1c/white', '991b1b/white', '7f1d1d/white', 'dc2626/white', 'c2410c/white', '9a3412/white'],
    '郷土料理': ['c2410c/white', 'b45309/white', '92400e/white', 'a16207/white', 'ca8a04/black', '854d0e/white'],
    '加工品':   ['78716c/white', '57534e/white', '44403c/white', '6b7280/white', '374151/white', '1f2937/white'],
    'スイーツ': ['be185d/white', '9d174d/white', '831843/white', 'db2777/white', 'a21caf/white', '86198f/white'],
    'きのこ':   ['78350f/white', '713f12/white', '92400e/white', '451a03/white', '7c2d12/white', '6b21a8/white'],
    '米':       ['854d0e/white', 'ca8a04/black', 'a16207/white', '92400e/white', 'd97706/white', 'b45309/white'],
    '穀物':     ['713f12/white', '78350f/white', '7c2d12/white', '451a03/white', '92400e/white', '6b21a8/white'],
  };
  const DEFAULT_COLORS = ['334155/white'];

  // ── カテゴリ判定 ─────────────────────────────────────────────────────────
  function detectCategory(name) {
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

  // ── 説明文生成 ───────────────────────────────────────────────────────────
  function makeDescription(prefName, seasonName, foodName, category) {
    const t = {
      '野菜':     `${prefName}で親しまれている${seasonName}の野菜。新鮮な地元産が直売所や道の駅などで手に入ります。`,
      '果物':     `${prefName}で味わいたい${seasonName}の果物。旬の時期には観光農園での摘み取り体験も人気です。`,
      '海鮮':     `${prefName}の豊かな海・川の恵み。旬の時期は特に脂が乗り、刺身や焼き物で格別の美味しさです。`,
      '肉':       `${prefName}が誇るブランド食材。きめ細かい肉質と豊かな旨みで、地域を代表する味覚の一つです。`,
      '郷土料理': `${prefName}で代々受け継がれてきた郷土の味。地域の食文化と歴史を感じられる一品です。`,
      '加工品':   `${prefName}の食文化を支える加工品。土産や家庭料理のアクセントとして地元で広く親しまれています。`,
      'スイーツ': `${prefName}で楽しめる${seasonName}のスイーツ。観光スポットや老舗店での食べ歩きにもぴったりです。`,
      'きのこ':   `${prefName}で味わいたい${seasonName}のきのこ。香り豊かで旨みたっぷり、鍋や天ぷらに最適です。`,
      '米':       `${prefName}の食卓を支える${seasonName}の米。地元の風土が育んだ甘みと粘りが自慢の一品です。`,
      '穀物':     `${prefName}で親しまれている穀物系食材。地元ならではの麺料理や郷土食にも活用されます。`,
    };
    return t[category] || `${prefName}で親しまれている${seasonName}の食材・ご当地グルメです。`;
  }

  // ── 郷土料理候補 ─────────────────────────────────────────────────────────
  function makeLocalDish(foodName, category) {
    if (category === '郷土料理') return foodName;
    const m = {
      '野菜':     `${foodName}の炒め物・天ぷら・漬物・汁の具`,
      '果物':     `${foodName}のジュース・ジャム・スイーツ・そのまま`,
      '海鮮':     `${foodName}の刺身・焼き物・汁物・煮付け`,
      '肉':       `${foodName}の焼き物・鍋・すき焼き・炒め物`,
      '加工品':   `そのまま、または料理のアクセントとして`,
      'スイーツ': `季節限定の和スイーツ・デザート`,
      'きのこ':   `${foodName}の天ぷら・炊き込みご飯・鍋の具`,
      '米':       `${foodName}のおにぎり・炊き込みご飯・丼物`,
      '穀物':     `${foodName}を使った麺料理・郷土食`,
    };
    return m[category] || `${foodName}を使った地元料理`;
  }

  // ── マーケット情報 ────────────────────────────────────────────────────────
  const MARKET_INFO = {
    ibaraki:  { base: '茨城県内の農産物直売所・道の駅・ファーマーズマーケット', sea: '那珂湊おさかな市場・大洗港周辺の海鮮店', local: '常陸太田市・笠間市・水戸市の飲食店・市場' },
    tochigi:  { base: '栃木県内の農産物直売所・とちぎファーマーズチャレンジ', sea: '那珂川・鬼怒川流域の川魚料理店', local: '宇都宮駅周辺・日光市内の飲食店・市場' },
    gunma:    { base: '群馬県内の農産物直売所・道の駅（川場、おのこ等）', sea: '利根川・吾妻川流域の川魚料理店', local: '前橋市・高崎市・下仁田町周辺の飲食店' },
    saitama:  { base: '埼玉県内の農産物直売所・ちちぶ農産物直売所', sea: '荒川・入間川流域の飲食店', local: '川越市・秩父市・深谷市の飲食店・市場' },
    chiba:    { base: '千葉県内の農産物直売所・道の駅（保田小学校等）', sea: '銚子漁港・勝浦朝市・千倉の海鮮市場', local: '南房総・九十九里・銚子の飲食店' },
    tokyo:    { base: '東京都内の農産物直売所・青山ファーマーズマーケット', sea: '豊洲市場・江戸前の飲食店', local: '浅草・築地・深川・月島エリアの飲食店' },
    kanagawa: { base: '神奈川県内の農産物直売所・鎌倉野菜マーケット', sea: '三崎港・腰越漁港・江の島の海鮮店', local: '小田原・三浦・湘南エリアの飲食店・市場' },
  };

  function makeMarketInfo(prefCode, category) {
    const m = MARKET_INFO[prefCode] || { base: `${PREF_NAMES[prefCode]}内の直売所・飲食店`, sea: '地元の魚市場・海鮮料理店', local: '地元の飲食店・道の駅' };
    if (category === '海鮮') return m.sea;
    if (category === '郷土料理') return m.local;
    return m.base;
  }

  // ── シードデータ (7都県 × 4季節 × 18件) ─────────────────────────────────
  const FOOD_SEED = {
    ibaraki: {
      spring: [
        '水戸納豆', '春キャベツ', 'しらす', 'たけのこ', '菜の花', 'ハマグリ',
        'いちご', 'わかさぎ', '春レタス', '新玉ねぎ', '山菜', 'セリ',
        'アスパラガス', '春大根', 'イワシ', '鯛', 'よもぎ餅', '梅加工品',
      ],
      summer: [
        'メロン', 'スイカ', 'とうもろこし', '枝豆', 'ピーマン', 'トマト',
        'しじみ', 'アユ', 'ナス', 'きゅうり', 'ズッキーニ', 'ゴーヤ',
        '梨', 'ブルーベリー', 'かぼちゃ', 'オクラ', '冷やし納豆そば', '常陸牛焼肉',
      ],
      autumn: [
        'れんこん', '栗', 'さつまいも', '梨', '新米', '舞茸',
        '常陸秋そば', '柿', 'しいたけ', '里芋', 'ごぼう', 'さんま',
        '秋ナス', '落花生', 'ぶどう', 'きのこ汁', '栗おこわ', '干し芋',
      ],
      winter: [
        'あんこう', 'ほしいも', '白菜', 'ねぎ', '常陸牛', 'ブリ',
        '大根', 'かぼちゃ', '小松菜', 'ほうれん草', 'あんこう鍋', 'けんちん汁',
        '干し大根', 'わかさぎ唐揚げ', '冬キャベツ', '鍋用きのこ', '納豆汁', 'レンコン団子',
      ],
    },

    tochigi: {
      spring: [
        'とちおとめ', 'スカイベリー', '山菜', 'アスパラガス', 'にら', 'たけのこ',
        '鮎', '日光湯葉', '春レタス', '春大根', '菜の花', 'いちごジャム',
        'いちご大福', '日光ゆば刺し', '春キャベツ', 'わらび', 'こごみ', '栃木和牛',
      ],
      summer: [
        'かんぴょう', 'トマト', 'きゅうり', '枝豆', 'とうもろこし', 'ブルーベリー',
        'ヤシオマス', 'なす', '冷やし餃子', '鮎の塩焼き', 'ズッキーニ', 'オクラ',
        'モロヘイヤ', 'かき氷', '冷やしゆば', '夏そば', 'しそ', '日光天然氷',
      ],
      autumn: [
        '梨', 'ぶどう', '舞茸', '栃木和牛', '里芋', '新そば',
        'りんご', '栗', 'しいたけ', 'さつまいも', 'かぼちゃ', '秋なす',
        'きのこ汁', '栗ご飯', '新米', '日光まいたけ', 'そば団子', 'りんごジュース',
      ],
      winter: [
        '宇都宮餃子', '大根', '白菜', 'ねぎ', 'いちご', 'ゆば鍋',
        '鹿肉', 'こんにゃく', 'ほうれん草', '小松菜', 'けんちん汁', 'おでん種',
        '栃木和牛すき焼き', '冬キャベツ', '里芋煮', '味噌田楽', '日光湯豆腐', '鍋用きのこ',
      ],
    },

    gunma: {
      spring: [
        '山菜', 'いちご', '春キャベツ', 'うど', 'わらび', 'アスパラガス',
        '川魚', 'こんにゃく', 'こごみ', '春レタス', '菜の花', 'ふきのとう',
        '梅加工品', '春まいたけ', '上州麦豚', '温泉まんじゅう', '新玉ねぎ', '春大根',
      ],
      summer: [
        '高原レタス', '枝豆', 'とうもろこし', 'トマト', 'きゅうり', '桃',
        '鮎', '水沢うどん', 'ブルーベリー', 'ズッキーニ', 'なす', 'オクラ',
        'モロヘイヤ', '夏キャベツ', '冷やしうどん', '焼きとうもろこし', '高原野菜', 'こんにゃく冷麺',
      ],
      autumn: [
        'まいたけ', 'りんご', '下仁田ねぎ', '焼きまんじゅう', '舞茸鍋', '栗',
        'さつまいも', '梨', 'しいたけ', '新米', '山ぶどう', '秋なす',
        'きのこ汁', 'こんにゃく味噌田楽', '上州牛', '里芋', 'ごぼう', '秋キャベツ',
      ],
      winter: [
        '下仁田ねぎ', 'こんにゃく', 'やまといも', '上州牛', '白菜', 'みそおでん',
        '大根', '鍋料理', 'ほうれん草', '小松菜', 'ねぎ鍋', 'すき焼き',
        'けんちん汁', '冬キャベツ', '上州麦豚鍋', '湯豆腐', 'こんにゃく田楽', '鍋用きのこ',
      ],
    },

    saitama: {
      spring: [
        '狭山茶', 'いちご', '小松菜', 'たけのこ', '菜の花', 'うど',
        '川越太麺焼きそば', '山菜', '春キャベツ', '春大根', '新玉ねぎ', 'アスパラガス',
        '草加せんべい', '狭山新茶', 'いちご大福', '春レタス', 'わらび', '秩父そば',
      ],
      summer: [
        '枝豆', 'きゅうり', 'トマト', 'ブルーベリー', 'とうもろこし', '冷汁うどん',
        'すいか', '梨', 'なす', 'オクラ', 'ズッキーニ', 'モロヘイヤ',
        '冷やし肉汁うどん', '夏野菜カレー', 'かき氷', '秩父天然氷', '焼きとうもろこし', '夏小松菜',
      ],
      autumn: [
        '川越いも', 'さつまいも', '深谷ねぎ', '新米', 'ぶどう', '栗',
        '里芋', '豚みそ丼', '梨', '秋なす', 'しいたけ', 'きのこ汁',
        '芋ようかん', '焼き芋', '秩父きのこ', 'ごぼう', '秋小松菜', '栗ご飯',
      ],
      winter: [
        '深谷ねぎ', '小松菜', '武州和牛', '鍋焼きうどん', '白菜', '大根',
        'ほうれん草', '味噌ポテト', 'ねぎ鍋', 'おっきりこみ', 'けんちん汁', '冬キャベツ',
        '里芋煮', 'すき焼き', '草加せんべい', '煮ぼうとう', '冬小松菜', 'おでん',
      ],
    },

    chiba: {
      spring: [
        '房州びわ', 'たけのこ', '菜の花', 'アジ', 'ハマグリ', 'いちご',
        'しらす', '鯛', '春キャベツ', '春大根', '新玉ねぎ', '海苔',
        'あさり', 'サザエ', 'いわし', '菜花のおひたし', 'びわゼリー', '春レタス',
      ],
      summer: [
        'スイカ', '梨', 'とうもろこし', '枝豆', '伊勢えび', 'トマト',
        'かつお', 'サザエ', 'なす', 'きゅうり', 'オクラ', 'ズッキーニ',
        'ブルーベリー', 'びわ加工品', '冷やしなめろう', '焼きとうもろこし', '夏野菜', 'かき氷',
      ],
      autumn: [
        '落花生', '新米', 'さんま', '栗', 'さつまいも', 'なめろう',
        'いわし', 'きのこ', '梨', '柿', '秋なす', '里芋',
        '落花生味噌', '焼き芋', '栗ご飯', '房総太巻き寿司', '秋サバ', 'ごぼう',
      ],
      winter: [
        'はまぐり', 'ほうれん草', 'ブリ', '大根', '鍋料理', '鯖',
        '海苔', '金目鯛', '白菜', '小松菜', 'いわしつみれ', 'なめろう茶漬け',
        'さんが焼き', 'おでん', '冬キャベツ', 'ねぎ', 'あさり汁', '海鮮鍋',
      ],
    },

    tokyo: {
      spring: [
        '深川めし', '小松菜', 'あさり', '桜鍋', '山菜', '東京うど',
        'いちご', 'くさや', '春キャベツ', '春大根', '新玉ねぎ', '江戸前穴子',
        '東京野菜', '桜餅', 'よもぎ団子', '春の天ぷら', 'あさり汁', '島しょ野菜',
      ],
      summer: [
        'もんじゃ焼き', '江戸前寿司', '穴子', '枝豆', 'トマト', 'ブルーベリー',
        '冷やしそば', '江戸前天丼', 'きゅうり', 'なす', 'オクラ', '島寿司',
        'ところてん', 'かき氷', '冷やし小松菜', '夏野菜', '天ざるそば', '深川冷やし飯',
      ],
      autumn: [
        '柳川鍋', '新そば', 'きのこ', '栗', '和菓子', '東京X',
        'さつまいも', '梨', '秋なす', 'しいたけ', '新米', '江戸前天ぷら',
        '栗ようかん', '芋ようかん', 'きのこそば', '秋刀魚', 'ごぼう', '島しょ焼酎',
      ],
      winter: [
        'おでん', '小松菜', '海苔', 'ちゃんこ鍋', 'ブリ', '大根',
        '甘酒', '江戸前寿司', '深川鍋', 'ねぎ', '白菜', 'ほうれん草',
        '湯豆腐', '冬そば', 'あさり鍋', 'くさや', '東京Xしゃぶしゃぶ', '小松菜鍋',
      ],
    },

    kanagawa: {
      spring: [
        'しらす', '湘南ゴールド', 'わかめ', 'たけのこ', '鯵', 'サザエ',
        '建長汁', '春キャベツ', '生しらす', '春大根', '菜の花', '新玉ねぎ',
        '鎌倉野菜', '小田原かまぼこ', '桜えび風かき揚げ', '湘南しらす丼', 'よもぎ餅', '三浦春野菜',
      ],
      summer: [
        '三崎マグロ', 'トマト', '枝豆', 'きゅうり', 'スイカ', 'しらす丼',
        '生しらす', 'かき氷', 'なす', 'オクラ', 'ズッキーニ', 'サザエ',
        'アジフライ', '冷やし海鮮丼', '湘南野菜', '夏みかん加工品', 'とうもろこし', '三浦夏野菜',
      ],
      autumn: [
        '三浦大根', '梨', 'さつまいも', '牛鍋', 'サンマ', '栗',
        'しめじ', '鎌倉野菜', '秋なす', '新米', 'しいたけ', 'ごぼう',
        '芋ようかん', '栗ご飯', '小田原干物', 'きのこ汁', '湘南ポーク', '秋しらす',
      ],
      winter: [
        'かまぼこ', '鍋料理', 'ブリ', '大根', '湘南しらす', '海鮮丼',
        '厚木シロコロ', '白菜', '三浦大根', '小松菜', 'ほうれん草', '湯豆腐',
        'けんちん汁', '三崎マグロ鍋', 'おでん', '金目鯛', '冬キャベツ', '海鮮鍋',
      ],
    },
  };

  // ── プレースホルダー画像のテキスト (英語 ASCII) ──────────────────────────
  // placehold.co で確実に表示される短い英語ラベルをカテゴリ別に定義
  const CATEGORY_IMG_TEXT = {
    '野菜':     'Veggie',
    '果物':     'Fruit',
    '海鮮':     'Seafood',
    '肉':       'Meat',
    '郷土料理': 'Local',
    '加工品':   'Product',
    'スイーツ': 'Sweets',
    'きのこ':   'Mushroom',
    '米':       'Rice',
    '穀物':     'Grain',
  };

  // ── データベース生成 ─────────────────────────────────────────────────────
    const IMAGE_MAPPING = {
      "ibaraki_水戸納豆": "images/ibaraki_mitonatto.png",
      "ibaraki_しらす": "images/ibaraki_shirasu.png",
      "ibaraki_たけのこ": "images/ibaraki_takenoko.png",
      "ibaraki_菜の花": "images/ibaraki_nanohana.png",
      "ibaraki_ハマグリ": "images/ibaraki_hamaguri.png",
      "ibaraki_いちご": "images/ibaraki_ichigo.png",
      "ibaraki_わかさぎ": "images/ibaraki_wakasagi.png",
      "ibaraki_春レタス": "images/ibaraki_haruretasu.png",
      "ibaraki_新玉ねぎ": "images/ibaraki_shintamanegi.png",
      "ibaraki_山菜": "images/ibaraki_sansai.png",
      "ibaraki_セリ": "images/ibaraki_seri.png",
      "ibaraki_アスパラガス": "images/ibaraki_asuparagasu.png",
      "ibaraki_春大根": "images/ibaraki_harudaikon.png",
      "ibaraki_イワシ": "images/ibaraki_iwashi.png",
      "ibaraki_よもぎ餅": "images/ibaraki_yomogimochi.png",
      "ibaraki_梅加工品": "images/ibaraki_umekakouhin.png",
      "ibaraki_メロン": "images/ibaraki_meron.png",
      "ibaraki_スイカ": "images/ibaraki_suika.png",
      "ibaraki_とうもろこし": "images/ibaraki_toumorokoshi.png",
      "ibaraki_枝豆": "images/ibaraki_edamame.png",
      "ibaraki_ピーマン": "images/ibaraki_piiman.png",
      "ibaraki_トマト": "images/ibaraki_tomato.png",
      "ibaraki_ナス": "images/ibaraki_nasu.png",
      "ibaraki_きゅうり": "images/ibaraki_kyuri.png",
      "ibaraki_ズッキーニ": "images/ibaraki_zukkini.png",
      "ibaraki_ゴーヤ": "images/ibaraki_goya.png",
      "ibaraki_梨": "images/ibaraki_nashi.png",
      "ibaraki_ブルーベリー": "images/ibaraki_buruberi.png",
      "ibaraki_かぼちゃ": "images/ibaraki_kabocha.png",
      "ibaraki_オクラ": "images/ibaraki_okura.png",
      "ibaraki_冷やし納豆そば": "images/ibaraki_hiyashinattosoba.png",
      "ibaraki_常陸牛焼肉": "images/ibaraki_hitachigyuyakiniku.png",
      "ibaraki_れんこん": "images/ibaraki_renkon.png",
      "ibaraki_栗": "images/ibaraki_kuri.png",
      "ibaraki_さつまいも": "images/ibaraki_satsumaimo.png",
      "ibaraki_新米": "images/ibaraki_shinmai.png",
      "ibaraki_舞茸": "images/ibaraki_maitake.png",
      "ibaraki_常陸秋そば": "images/ibaraki_hitachiakisoba.png",
      "ibaraki_柿": "images/ibaraki_kaki.png",
      "ibaraki_しいたけ": "images/ibaraki_shiitake.png",
      "ibaraki_里芋": "images/ibaraki_satoimo.png",
      "ibaraki_ごぼう": "images/ibaraki_gobou.png",
      "ibaraki_さんま": "images/ibaraki_sanma.png",
      "ibaraki_秋ナス": "images/ibaraki_akinasu.png",
      "ibaraki_落花生": "images/ibaraki_rakkasei.png",
      "ibaraki_ぶどう": "images/ibaraki_budou.png",
      "ibaraki_きのこ汁": "images/ibaraki_kinokojiru.png",
      "ibaraki_栗おこわ": "images/ibaraki_kuriokowa.png",
      "ibaraki_干し芋": "images/ibaraki_hoshiimo.png",
      "ibaraki_あんこう": "images/ibaraki_ankou.png",
      "ibaraki_ほしいも": "images/ibaraki_hoshiimo.png",
      "ibaraki_白菜": "images/ibaraki_hakusai.png",
      "ibaraki_ねぎ": "images/ibaraki_negi.png",
      "ibaraki_常陸牛": "images/ibaraki_hitachigyu.png",
      "ibaraki_ブリ": "images/ibaraki_buri.png",
      "ibaraki_大根": "images/ibaraki_daikon.png",
      "ibaraki_小松菜": "images/ibaraki_komatsuna.png",
      "ibaraki_ほうれん草": "images/ibaraki_hourensou.png",
      "ibaraki_あんこう鍋": "images/ibaraki_ankounabe.png",
      "ibaraki_けんちん汁": "images/ibaraki_kenchinjiru.png",
      "ibaraki_干し大根": "images/ibaraki_hoshidaikon.png",
      "ibaraki_わかさぎ唐揚げ": "images/ibaraki_wakasagikaraage.png",
      "ibaraki_冬キャベツ": "images/ibaraki_fuyukyabetsu.png",
      "ibaraki_鍋用きのこ": "images/ibaraki_nabeyoukinoko.png",
      "ibaraki_納豆汁": "images/ibaraki_nattojiru.png",
      "ibaraki_レンコン団子": "images/ibaraki_renkondango.png",
      "tochigi_とちおとめ": "images/tochigi_tochiotome.png",
      "tochigi_スカイベリー": "images/tochigi_skyberry.png",
      "tochigi_山菜": "images/tochigi_sansai.png",
      "tochigi_アスパラガス": "images/tochigi_asuparagasu.png",
      "tochigi_にら": "images/tochigi_nira.png",
      "tochigi_たけのこ": "images/tochigi_takenoko.png",
      "tochigi_鮎": "images/tochigi_ayu.png",
      "tochigi_日光湯葉": "images/tochigi_nikkoyuba.png",
      "tochigi_春レタス": "images/tochigi_haruretasu.png",
      "tochigi_春大根": "images/tochigi_harudaikon.png",
      "tochigi_菜の花": "images/tochigi_nanohana.png",
      "tochigi_いちごジャム": "images/tochigi_ichigojam.png",
      "tochigi_いちご大福": "images/tochigi_ichigodaifuku.png",
      "tochigi_日光ゆば刺し": "images/tochigi_nikkoyubasashi.png",
      "tochigi_春キャベツ": "images/tochigi_harukyabetsu.png",
      "tochigi_わらび": "images/tochigi_warabi.png",
      "tochigi_こごみ": "images/tochigi_kogomi.png",
      "tochigi_栃木和牛": "images/tochigi_tochigiwagyu.png",
      "tochigi_かんぴょう": "images/tochigi_kanpyo.png",
      "tochigi_トマト": "images/tochigi_tomato.png",
      "tochigi_きゅうり": "images/tochigi_kyuri.png",
      "tochigi_枝豆": "images/tochigi_edamame.png",
      "tochigi_とうもろこし": "images/tochigi_toumorokoshi.png",
      "tochigi_ブルーベリー": "images/tochigi_blueberry.png",
      "tochigi_ヤシオマス": "images/tochigi_yashiomasu.png",
      "tochigi_なす": "images/tochigi_nasu.png",
      "tochigi_冷やし餃子": "images/tochigi_hiyashigyoza.png",
      "tochigi_鮎の塩焼き": "images/tochigi_ayushioyaki.png",
      "tochigi_ズッキーニ": "images/tochigi_zucchini.png",
      "tochigi_オクラ": "images/tochigi_okura.png",
      "tochigi_モロヘイヤ": "images/tochigi_moroheiya.png",
      "tochigi_かき氷": "images/tochigi_kakigori.png",
      "tochigi_冷やしゆば": "images/tochigi_hiyashiyuba.png",
      "tochigi_夏そば": "images/tochigi_natsusoba.png",
      "tochigi_しそ": "images/tochigi_shiso.png",
      "tochigi_日光天然氷": "images/tochigi_nikkotennenkori.png",
      "tochigi_梨": "images/tochigi_nashi.png",
      "tochigi_ぶどう": "images/tochigi_budou.png",
      "tochigi_舞茸": "images/tochigi_maitake.png",
      "tochigi_里芋": "images/tochigi_satoimo.png",
      "tochigi_新そば": "images/tochigi_shinsoba.png",
      "tochigi_りんご": "images/tochigi_ringo.png",
      "tochigi_栗": "images/tochigi_kuri.png",
      "tochigi_しいたけ": "images/tochigi_shiitake.png",
      "tochigi_さつまいも": "images/tochigi_satsumaimo.png",
      "tochigi_かぼちゃ": "images/tochigi_kabocha.png",
      "tochigi_秋なす": "images/tochigi_akinasu.png",
      "tochigi_きのこ汁": "images/tochigi_kinokojiru.png",
      "tochigi_栗ご飯": "images/tochigi_kurigohan.png",
      "tochigi_新米": "images/tochigi_shinmai.png",
      "tochigi_日光まいたけ": "images/tochigi_nikkomaitake.png",
      "tochigi_そば団子": "images/tochigi_sobadango.png",
      "tochigi_りんごジュース": "images/tochigi_ringojuice.png",
      "tochigi_宇都宮餃子": "images/tochigi_utsunomiyagyoza.png",
      "tochigi_大根": "images/tochigi_daikon.png",
      "tochigi_白菜": "images/tochigi_hakusai.png",
      "tochigi_ねぎ": "images/tochigi_negi.png",
      "tochigi_いちご": "images/tochigi_ichigo.png",
      "tochigi_ゆば鍋": "images/tochigi_yubanabe.png",
      "tochigi_鹿肉": "images/tochigi_shikaniku.png",
      "tochigi_こんにゃく": "images/tochigi_konnyaku.png",
      "tochigi_ほうれん草": "images/tochigi_hourensou.png",
      "tochigi_小松菜": "images/tochigi_komatsuna.png",
      "tochigi_けんちん汁": "images/tochigi_kenchinjiru.png",
      "tochigi_おでん種": "images/tochigi_odentane.png",
      "tochigi_栃木和牛すき焼き": "images/tochigi_tochigiwagyusukiyaki.png",
      "tochigi_冬キャベツ": "images/tochigi_fuyukyabetsu.png",
      "tochigi_里芋煮": "images/tochigi_satoimoni.png",
      "tochigi_味噌田楽": "images/tochigi_misodengaku.png",
      "tochigi_日光湯豆腐": "images/tochigi_nikkoyudofu.png",
      "tochigi_鍋用きのこ": "images/tochigi_nabeyoukinoko.png",
      "gunma_山菜": "images/gunma_sansai.png",
      "gunma_いちご": "images/gunma_ichigo.png",
      "gunma_春キャベツ": "images/gunma_harukyabetsu.png",
      "gunma_うど": "images/gunma_udo.png",
      "gunma_わらび": "images/gunma_warabi.png",
      "gunma_アスパラガス": "images/gunma_asuparagasu.png",
      "gunma_川魚": "images/gunma_kawazana.png",
      "gunma_こごみ": "images/gunma_kogomi.png",
      "gunma_菜の花": "images/gunma_nanohana.png",
      "gunma_ふきのとう": "images/gunma_fukinotou.png",
      "gunma_梅加工品": "images/gunma_umekakouhin.png",
      "gunma_上州麦豚": "images/gunma_joshumugibuta.png",
      "gunma_温泉まんじゅう": "images/gunma_onsenmanju.png",
      "gunma_新玉ねぎ": "images/gunma_shintamanegi.png",
      "gunma_春大根": "images/gunma_harudaikon.png",
      "gunma_とうもろこし": "images/gunma_toumorokoshi.jpg",
      "gunma_トマト": "images/gunma_tomato.jpg",
      "gunma_きゅうり": "images/gunma_kyuri.jpg",
      "gunma_桃": "images/gunma_momo.jpg",
      "gunma_鮎": "images/gunma_ayu.jpg",
      "gunma_水沢うどん": "images/gunma_mizusawaudon.jpg",
      "gunma_ブルーベリー": "images/gunma_blueberry.jpg",
      "gunma_ズッキーニ": "images/gunma_zucchini.jpg",
      "gunma_なす": "images/gunma_nasu.jpg",
      "gunma_オクラ": "images/gunma_okura.jpg",
      "gunma_モロヘイヤ": "images/gunma_moroheiya.jpg",
      "gunma_夏キャベツ": "images/gunma_natsukyabetsu.jpg",
      "gunma_冷やしうどん": "images/gunma_hiyashiudon.jpg.png",
      "gunma_焼きとうもろこし": "images/gunma_yakitoumorokoshi.jpg",
      "gunma_高原野菜": "images/gunma_kougenyasai.jpg",
      "gunma_こんにゃく冷麺": "images/gunma_konnyakureimen.jpg",
      "gunma_焼きまんじゅう": "images/gunma_yakimanju.jpg",
      "gunma_舞茸鍋": "images/gunma_maitakenabe.jpg",
      "gunma_栗": "images/gunma_kuri.jpg",
      "gunma_さつまいも": "images/gunma_satsumaimo.jpg",
      "gunma_梨": "images/gunma_nashi.jpg",
      "gunma_しいたけ": "images/gunma_shiitake.jpg",
      "gunma_新米": "images/gunma_shinmai.jpg",
      "gunma_山ぶどう": "images/gunma_yamabudou.jpg",
      "gunma_秋なす": "images/gunma_akinasu.jpg",
      "gunma_きのこ汁": "images/gunma_kinokojiru.jpg",
      "gunma_こんにゃく味噌田楽": "images/gunma_konnyakumiso_dengaku.jpg",
      "gunma_里芋": "images/gunma_satoimo.jpg",
      "gunma_ごぼう": "images/gunma_gobou.jpg",
      "gunma_秋キャベツ": "images/gunma_akikyabetsu.jpg",
      "gunma_白菜": "images/gunma_hakusai.jpg.png",
      "gunma_みそおでん": "images/gunma_misooden.jpg.png",
      "gunma_大根": "images/gunma_daikon.jpg.png",
      "gunma_ほうれん草": "images/gunma_hourensou.jpg.png",
      "gunma_小松菜": "images/gunma_komatsuna.jpg.png",
      "gunma_ねぎ鍋": "images/gunma_neginabe.jpg.png",
      "gunma_すき焼き": "images/gunma_sukiyaki.jpg.png",
      "gunma_けんちん汁": "images/gunma_kenchinjiru.jpg.png",
      "gunma_冬キャベツ": "images/gunma_fuyukyabetsu.jpg.png",
      "gunma_上州麦豚鍋": "images/gunma_joshumugibutanabe.jpg.png",
      "gunma_湯豆腐": "images/gunma_yudofu.jpg.png",
      "gunma_こんにゃく田楽": "images/gunma_konnyakudengaku.jpg.png",
      "gunma_鍋用きのこ": "images/gunma_nabeyoukinoko.jpg.png",
      "saitama_たけのこ": "images/saitama_takenoko.jpg.png",
      "saitama_菜の花": "images/saitama_nanohana.jpg.png",
      "saitama_うど": "images/saitama_udo.jpg.png",
      "saitama_川越太麺焼きそば": "images/saitama_kawagoefutomenyakisoba.jpg.png",
      "saitama_山菜": "images/saitama_sansai.jpg.png",
      "saitama_春キャベツ": "images/saitama_harukyabetsu.jpg.png",
      "saitama_春大根": "images/saitama_harudaikon.jpg.png",
      "saitama_新玉ねぎ": "images/saitama_shintamanegi.jpg.png",
      "saitama_アスパラガス": "images/saitama_asuparagasu.jpg.png",
      "saitama_草加せんべい": "images/saitama_sokasendei.jpg.png",
      "saitama_いちご大福": "images/saitama_ichigodaifuku.jpg.png",
      "saitama_春レタス": "images/saitama_haruretasu.jpg.png",
      "saitama_わらび": "images/saitama_warabi.jpg.png",
      "saitama_秩父そば": "images/saitama_chichibusoba.jpg.png",
      "saitama_きゅうり": "images/saitama_kyuri.jpg.png",
      "saitama_トマト": "images/saitama_tomato.jpg.png",
      "saitama_ブルーベリー": "images/saitama_blueberry.jpg.png",
      "saitama_とうもろこし": "images/saitama_toumorokoshi.jpg.png",
      "saitama_冷汁うどん": "images/saitama_hiyashijiruudon.jpg.png",
      "saitama_すいか": "images/saitama_suika.jpg.png",
      "saitama_梨": "images/saitama_nashi.jpg.png",
      "saitama_なす": "images/saitama_nasu.jpg.png",
      "saitama_オクラ": "images/saitama_okura.jpg.png",
      "saitama_ズッキーニ": "images/saitama_zucchini.jpg.png",
      "saitama_モロヘイヤ": "images/saitama_moroheiya.jpg.png",
      "saitama_冷やし肉汁うどん": "images/saitama_hiyashinikujiruudon.jpg.png",
      "saitama_夏野菜カレー": "images/saitama_natsuyasaicurry.jpg (2).png",
      "saitama_かき氷": "images/saitama_kakigori.jpg.png",
      "saitama_秩父天然氷": "images/saitama_chichibutennenkori.jpg.png",
      "saitama_焼きとうもろこし": "images/saitama_yakitoumorokoshi.jpg.png",
      "tokyo_深川めし": "images/tokyo_fukagawameshi.jpg",
      "tokyo_小松菜": "images/tokyo_komatsuna.jpg",
      "tokyo_あさり": "images/tokyo_asari.jpg",
      "tokyo_桜鍋": "images/tokyo_sakuranabe.jpg",
      "tokyo_山菜": "images/tokyo_sansai.jpg",
      "tokyo_東京うど": "images/tokyo_tokyoudo.jpg",
      "tokyo_いちご": "images/tokyo_ichigo.jpg",
      "tokyo_くさや": "images/tokyo_kusaya.jpg",
      "tokyo_春キャベツ": "images/tokyo_harukyabetsu.jpg",
      "tokyo_春大根": "images/tokyo_harudaikon.jpg",
      "tokyo_新玉ねぎ": "images/tokyo_shintamanegi.jpg",
      "tokyo_江戸前穴子": "images/tokyo_edomaeanago.jpg",
      "tokyo_東京野菜": "images/tokyo_tokyoyasai.jpg",
      "tokyo_桜餅": "images/tokyo_sakuramochi.jpg",
      "tokyo_よもぎ団子": "images/tokyo_yomogidango.jpg",
      "tokyo_春の天ぷら": "images/tokyo_harunotenpura.jpg",
      "tokyo_あさり汁": "images/tokyo_asarijiru.jpg",
      "tokyo_島しょ野菜": "images/tokyo_shimashoyasai.jpg",
      "tokyo_もんじゃ焼き": "images/tokyo_monjayaki.jpg",
      "tokyo_穴子": "images/tokyo_anago.jpg",
      "tokyo_枝豆": "images/tokyo_edamame.jpg",
      "tokyo_トマト": "images/tokyo_tomato.jpg",
      "tokyo_ブルーベリー": "images/tokyo_blueberry.jpg",
      "tokyo_冷やしそば": "images/tokyo_hiyashisoba.jpg",
      "tokyo_江戸前天丼": "images/tokyo_edomaetendon.jpg",
      "tokyo_きゅうり": "images/tokyo_kyuri.jpg",
      "tokyo_なす": "images/tokyo_nasu.jpg",
      "tokyo_オクラ": "images/tokyo_okura.jpg",
      "tokyo_島寿司": "images/tokyo_shimazushi.jpg",
      "tokyo_ところてん": "images/tokyo_tokoroten.jpg",
      "tokyo_かき氷": "images/tokyo_kakigori.jpg",
      "tokyo_冷やし小松菜": "images/tokyo_hiyashikomatsuna.jpg",
      "tokyo_夏野菜": "images/tokyo_natsuyasai.jpg",
      "tokyo_天ざるそば": "images/tokyo_tenzarusoba.jpg",
      "tokyo_深川冷やし飯": "images/tokyo_fukagawahiyashimeshi.jpg",
      "tokyo_柳川鍋": "images/tokyo_yanagawanabe.jpg",
      "tokyo_新そば": "images/tokyo_shinsoba.jpg",
      "tokyo_きのこ": "images/tokyo_kinoko.jpg",
      "tokyo_栗": "images/tokyo_kuri.jpg",
      "tokyo_和菓子": "images/tokyo_wagashi.jpg",
      "tokyo_東京X": "images/tokyo_tokyox.jpg",
      "tokyo_さつまいも": "images/tokyo_satsumaimo.jpg",
      "tokyo_梨": "images/tokyo_nashi.jpg",
      "tokyo_秋なす": "images/tokyo_akinasu.jpg",
      "tokyo_しいたけ": "images/tokyo_shiitake.jpg",
      "tokyo_新米": "images/tokyo_shinmai.jpg",
      "tokyo_江戸前天ぷら": "images/tokyo_edomaetenpura.jpg",
      "tokyo_栗ようかん": "images/tokyo_kuriyokan.jpg",
      "tokyo_芋ようかん": "images/tokyo_imoyokan.jpg",
      "tokyo_きのこそば": "images/tokyo_kinokosoba.jpg",
      "tokyo_秋刀魚": "images/tokyo_sanma.jpg",
      "tokyo_ごぼう": "images/tokyo_gobou.jpg",
      "tokyo_島しょ焼酎": "images/tokyo_shimashoshochu.jpg",
      "tokyo_おでん": "images/tokyo_oden.jpg",
      "tokyo_海苔": "images/tokyo_nori.jpg",
      "tokyo_ちゃんこ鍋": "images/tokyo_chankonabe.jpg",
      "tokyo_ブリ": "images/tokyo_buri.jpg",
      "tokyo_大根": "images/tokyo_daikon.jpg.png",
      "tokyo_甘酒": "images/tokyo_amazake.jpg",
      "tokyo_ねぎ": "images/tokyo_negi.jpg",
      "tokyo_白菜": "images/tokyo_hakusai.jpg",
      "tokyo_ほうれん草": "images/tokyo_hourensou.jpg",
      "tokyo_湯豆腐": "images/tokyo_yudofu.jpg",
      "tokyo_冬そば": "images/tokyo_fuyusoba.jpg",
      "tokyo_あさり鍋": "images/tokyo_asarinabe.jpg",
      "tokyo_東京Xしゃぶしゃぶ": "images/tokyo_tokyoxshabushabu.jpg",
      "tokyo_小松菜鍋": "images/tokyo_komatsunanabe.jpg"
  };

  function createDatabase() {
    const db = [];
    let id = 1;

    for (const [prefCode, seasons] of Object.entries(FOOD_SEED)) {
      for (const [seasonCode, foodNames] of Object.entries(seasons)) {
        foodNames.forEach((foodName, idx) => {
          const prefName   = PREF_NAMES[prefCode];
          const seasonName = SEASON_NAMES[seasonCode];
          const category   = detectCategory(foodName);
          const colors     = CATEGORY_COLORS[category] || DEFAULT_COLORS;
          const colorStr   = colors[idx % colors.length];
          const imgText    = encodeURIComponent(CATEGORY_IMG_TEXT[category] || 'Food');

          const mapKey = prefCode + '_' + foodName;
          let finalImageSrc = `https://placehold.co/300x200/${colorStr}?text=${imgText}`;
          if (typeof IMAGE_MAPPING !== 'undefined') {
            if (IMAGE_MAPPING[mapKey]) {
              finalImageSrc = IMAGE_MAPPING[mapKey];
            } else {
              // Fallback: If the specific prefecture's image is missing, 
              // try to find the same food's image from ANY other prefecture.
              const fallbackKey = Object.keys(IMAGE_MAPPING).find(k => k.endsWith('_' + foodName));
              if (fallbackKey) {
                finalImageSrc = IMAGE_MAPPING[fallbackKey];
              }
            }
          }

          db.push({
            id,
            name:        foodName,
            prefecture:  prefCode,
            season:      seasonCode,
            category,
            description: makeDescription(prefName, seasonName, foodName, category),
            localDish:   makeLocalDish(foodName, category),
            marketInfo:  makeMarketInfo(prefCode, category),
            imageSrc:    finalImageSrc,
            mapSearchUrl: `https://www.google.com/maps/search/${encodeURIComponent(prefName + '+' + foodName)}`,
          });

          id++;
        });
      }
    }

    return db;
  }

  // ── グローバルに公開 ─────────────────────────────────────────────────────
  window.specialtyDatabase = createDatabase();
  window.detectCategory = detectCategory;

  if (typeof console !== 'undefined') {
    console.log('[data.js] specialtyDatabase loaded:', window.specialtyDatabase.length, 'items');
  }
})();
