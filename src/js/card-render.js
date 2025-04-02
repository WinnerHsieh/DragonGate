/**
 * 卡片渲染模組 - 處理卡片的顯示和動畫
 */

// 存儲卡片花色的映射，確保同一數值在一局中使用相同花色
const cardSuitMapping = {};

/**
 * 將數字轉換為卡片顯示值
 * @param {number} cardValue - 卡片數值 (1-13)
 * @returns {string} 卡片顯示值 (A, 2-10, J, Q, K)
 */
function getCardDisplayValue(cardValue) {
    if (cardValue === 1) return 'A';
    if (cardValue === 11) return 'J';
    if (cardValue === 12) return 'Q';
    if (cardValue === 13) return 'K';
    return cardValue.toString();
}

/**
 * 隨機選擇花色
 * @returns {string} 花色符號 (♠, ♥, ♦, ♣)
 */
function getRandomSuit() {
    const suits = ['♠', '♥', '♦', '♣'];
    return suits[Math.floor(Math.random() * suits.length)];
}

/**
 * 獲取花色的CSS類名
 * @param {string} suit - 花色符號
 * @returns {string} CSS類名
 */
function getSuitClass(suit) {
    if (suit === '♥' || suit === '♦') return 'card-diamond';
    if (suit === '♠' || suit === '♣') return 'card-spade';
    return '';
}

/**
 * 重置所有花色映射（開始新一局遊戲時調用）
 */
function resetCardSuits() {
    for (const key in cardSuitMapping) {
        delete cardSuitMapping[key];
    }
}

/**
 * 渲染卡片
 * @param {HTMLElement} cardElement - 卡片DOM元素
 * @param {number|string} value - 卡片數值 (1-13) 或 'joker'
 * @param {string} [suit] - 指定的花色符號
 * @param {boolean} isPlaceholder - 是否為預設佔位
 */
function renderCard(cardElement, value, suit, isPlaceholder = false) {
    // 清除舊的類
    cardElement.className = 'card';
    
    if (isPlaceholder) {
        cardElement.classList.add('card-placeholder');
        cardElement.textContent = '?';
        return;
    }
    
    if (value === 'joker') {
        cardElement.classList.add('card-joker');
        cardElement.textContent = '🤡';
        return;
    }
    
    // 如果沒有指定花色，則使用隨機花色或之前映射的花色
    if (!suit) {
        if (cardSuitMapping[value]) {
            suit = cardSuitMapping[value];
        } else {
            suit = getRandomSuit();
            cardSuitMapping[value] = suit;
        }
    }
    
    cardElement.classList.add(getSuitClass(suit));
    
    // 設置卡片內容（花色+數字）
    cardElement.textContent = `${suit}${getCardDisplayValue(value)}`;
}

/**
 * 顯示卡片（帶動畫）
 * @param {HTMLElement} cardElement - 卡片DOM元素
 * @param {number|string} value - 卡片數值 (1-13) 或 'joker'
 * @param {string} [suit] - 指定的花色符號
 */
function revealCard(cardElement, value, suit) {
    cardElement.classList.remove('hidden');
    
    // 添加顯示動畫
    cardElement.classList.add('reveal');
    
    // 渲染卡片
    renderCard(cardElement, value, suit);
    
    // 動畫結束後移除動畫類
    setTimeout(() => {
        cardElement.classList.remove('reveal');
    }, 500);
}

/**
 * 隱藏卡片
 * @param {HTMLElement} cardElement - 卡片DOM元素
 */
function hideCard(cardElement) {
    cardElement.classList.add('hidden');
}

/**
 * 重置卡片為預設佔位狀態
 * @param {HTMLElement} cardElement - 卡片DOM元素
 */
function resetCard(cardElement) {
    renderCard(cardElement, null, null, true);
} 