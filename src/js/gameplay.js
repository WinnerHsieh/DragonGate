/**
 * 龍門遊戲 - 遊玩模擬
 */

// 遊戲狀態
const gameState = {
    // 當前籌碼
    balance: 10000,
    // 當前下注金額
    currentBet: 100,
    // 累計贏得金額
    totalWin: 0,
    // 上一局贏得金額
    lastWin: 0,
    // 遊戲階段：'idle', 'dealing', 'player-turn', 'special-choice', 'result'
    phase: 'idle',
    // 門牌：[左門, 右門]
    dragonGates: [null, null],
    // 玩家牌
    playerCard: null,
    // 選擇的比較（比大/比小）
    comparison: null,
    // 賠率設定
    payouts: {
        hit: 3,     // 中門賠率：贏得 hit 的倍押注
        pillar: -3, // 撞柱賠率：輸掉押注 + 額外輸掉2倍押注，總計輸掉3倍押注
        miss: -1,   // 未中賠率：輸掉押注
        special: 3  // 特殊結算賠率（Joker）：使用和中門相同的賠率
    },
    // 牌組狀態
    deck: {
        total: 106,     // 總牌數：2副牌（共104張）+ 2張Joker
        dealt: 0,       // 已發出的牌數
        cards: [],      // 實際牌組（剩餘可用的牌）
        allCards: []    // 全部牌的狀態，包括已使用的牌
    }
};

// 可用的下注金額選項
const betOptions = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000];

// 創建牌面元素
function createCardElement(card) {
    const cardDiv = document.createElement('div');
    cardDiv.className = 'deck-card';
    
    // 如果牌已經被使用，添加灰色樣式
    if (card.used) {
        cardDiv.classList.add('deck-card-used');
    }
    
    if (card.value === 'joker') {
        cardDiv.classList.add('deck-card-joker');
        cardDiv.textContent = '🤡';
    } else {
        const suit = getSuitSymbol(card.suit);
        if (card.suit === 1 || card.suit === 2) { // ♥, ♦
            cardDiv.classList.add('deck-card-diamond');
        }
        cardDiv.textContent = `${suit}${getCardDisplayValue(card.value)}`;
    }
    
    return cardDiv;
}

// 排序牌組
function sortDeck(cards) {
    return [...cards].sort((a, b) => {
        // 先按數字排序
        if (a.value === 'joker') return 1; // Joker放最後
        if (b.value === 'joker') return -1;
        
        if (a.value !== b.value) {
            return a.value - b.value;
        }
        
        // 數字相同則按花色排序 (♠:0, ♥:1, ♦:2, ♣:3)
        return a.suit - b.suit;
    });
}

// 顯示剩餘牌組
function showRemainingCards() {
    const modal = document.getElementById('deckViewModal');
    const container = document.getElementById('remainingCards');
    
    // 清空容器
    container.innerHTML = '';
    
    // 排序所有牌
    const sortedAllCards = sortDeck(gameState.deck.allCards);
    
    // 添加牌面元素
    sortedAllCards.forEach(card => {
        const cardElement = createCardElement(card);
        container.appendChild(cardElement);
    });
    
    // 顯示模態框
    modal.classList.remove('hidden');
}

// 關閉剩餘牌組顯示
function closeRemainingCards() {
    const modal = document.getElementById('deckViewModal');
    modal.classList.add('hidden');
}

// 初始化牌組
function initDeck() {
    // 清空當前牌組
    gameState.deck.cards = [];
    gameState.deck.allCards = [];
    gameState.deck.dealt = 0;
    
    // 創建完整的牌組
    let allCards = [];
    
    // 添加2組牌（每組13種牌值×4種花色）
    for (let set = 0; set < 2; set++) {
        for (let suit = 0; suit < 4; suit++) {
            for (let value = 1; value <= 13; value++) {
                allCards.push({
                    value: value,
                    suit: suit, // 0: ♠, 1: ♥, 2: ♦, 3: ♣
                    used: false,
                    id: `${value}-${suit}-${set}` // 唯一標識符
                });
            }
        }
    }
    
    // 添加2張Joker
    allCards.push({ value: 'joker', suit: -1, used: false, id: 'joker-1' });
    allCards.push({ value: 'joker', suit: -1, used: false, id: 'joker-2' });
    
    // 儲存所有牌的狀態
    gameState.deck.allCards = allCards;
    
    // 洗牌並設置可用牌組
    shuffleDeck();
    
    // 更新發牌狀況顯示
    updateDeckStatus();
}

// 洗牌
function shuffleDeck() {
    // 重置所有牌為未使用狀態
    gameState.deck.allCards.forEach(card => {
        card.used = false;
    });
    
    // 複製所有未使用的牌到可用牌組
    gameState.deck.cards = [...gameState.deck.allCards];
    
    // Fisher-Yates 洗牌算法
    for (let i = gameState.deck.cards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [gameState.deck.cards[i], gameState.deck.cards[j]] = [gameState.deck.cards[j], gameState.deck.cards[i]];
    }
}

// 從牌組抽一張牌
function drawCard() {
    if (gameState.deck.cards.length === 0) {
        // 牌組空了，重新初始化
        initDeck();
    }
    
    // 從牌組頂部抽一張牌
    const card = gameState.deck.cards.pop();
    
    // 標記為已使用
    const matchingCard = gameState.deck.allCards.find(c => c.id === card.id);
    if (matchingCard) {
        matchingCard.used = true;
    }
    
    gameState.deck.dealt++;
    updateDeckStatus();
    
    return card;
}

// 獲取牌的花色符號
function getSuitSymbol(suitIndex) {
    const suits = ['♠', '♥', '♦', '♣'];
    return suits[suitIndex] || '';
}

// 初始化遊戲
function initGame() {
    // 初始化牌組
    initDeck();
    
    // 初始化UI元素
    updateBalanceDisplay();
    updateWinDisplay("0"); // 初始顯示0
    updateBetDisplay();
    
    // 綁定按鈕事件
    document.getElementById('dealBtn').addEventListener('click', startDeal);
    document.getElementById('hitBtn').addEventListener('click', hitCard);
    document.getElementById('standBtn').addEventListener('click', stand);
    document.getElementById('biggerBtn').addEventListener('click', () => chooseComparison('bigger'));
    document.getElementById('smallerBtn').addEventListener('click', () => chooseComparison('smaller'));
    document.getElementById('decreaseBet').addEventListener('click', decreaseBet);
    document.getElementById('increaseBet').addEventListener('click', increaseBet);
    document.getElementById('betValue').addEventListener('click', openBetSelection);
    document.getElementById('cancelBetSelection').addEventListener('click', closeBetSelection);
    document.getElementById('viewDeckBtn').addEventListener('click', showRemainingCards);
    document.getElementById('closeDeckView').addEventListener('click', closeRemainingCards);
    
    // 創建下注選項
    createBetOptions();
}

// 更新餘額顯示
function updateBalanceDisplay() {
    document.getElementById('balanceValue').textContent = gameState.balance;
}

// 更新贏額顯示
function updateWinDisplay(value) {
    document.getElementById('winValue').textContent = value;
}

// 更新下注金額顯示
function updateBetDisplay() {
    document.getElementById('betValue').textContent = gameState.currentBet;
}

// 減少下注金額
function decreaseBet() {
    if (gameState.phase !== 'idle') return;
    
    const currentIndex = betOptions.indexOf(gameState.currentBet);
    if (currentIndex > 0) {
        gameState.currentBet = betOptions[currentIndex - 1];
        updateBetDisplay();
    }
}

// 增加下注金額
function increaseBet() {
    if (gameState.phase !== 'idle') return;
    
    const currentIndex = betOptions.indexOf(gameState.currentBet);
    if (currentIndex < betOptions.length - 1 && betOptions[currentIndex + 1] <= gameState.balance) {
        gameState.currentBet = betOptions[currentIndex + 1];
        updateBetDisplay();
    }
}

// 打開下注選擇模態框
function openBetSelection() {
    if (gameState.phase !== 'idle') return;
    
    // 顯示模態框
    const modal = document.getElementById('betSelectionModal');
    modal.classList.remove('hidden');
    
    // 更新選項狀態
    updateBetOptionsStatus();
}

// 關閉下注選擇模態框
function closeBetSelection() {
    const modal = document.getElementById('betSelectionModal');
    modal.classList.add('hidden');
}

// 創建下注選項
function createBetOptions() {
    const container = document.querySelector('.bet-options');
    
    betOptions.forEach(value => {
        const option = document.createElement('div');
        option.className = 'bet-option';
        option.textContent = value;
        option.dataset.value = value;
        option.addEventListener('click', () => selectBetAmount(value));
        container.appendChild(option);
    });
}

// 更新下注選項狀態
function updateBetOptionsStatus() {
    const options = document.querySelectorAll('.bet-option');
    
    options.forEach(option => {
        const value = parseInt(option.dataset.value);
        option.classList.remove('selected');
        
        // 標記當前選擇的下注金額
        if (value === gameState.currentBet) {
            option.classList.add('selected');
        }
        
        // 禁用超過餘額的選項
        if (value > gameState.balance) {
            option.classList.add('disabled');
        } else {
            option.classList.remove('disabled');
        }
    });
}

// 選擇下注金額
function selectBetAmount(amount) {
    if (amount <= gameState.balance) {
        gameState.currentBet = amount;
        updateBetDisplay();
        closeBetSelection();
    }
}

// 更新發牌狀況顯示
function updateDeckStatus() {
    document.getElementById('deckStatus').textContent = `${gameState.deck.dealt} / ${gameState.deck.total} 張`;
}

// 開始發牌
function startDeal() {
    if (gameState.phase === 'dealing' || gameState.phase === 'player-turn' || gameState.phase === 'special-choice') return;
    
    // 無論當前狀態如何，都重置遊戲狀態
    resetGameState();
    
    // 檢查餘額
    if (gameState.balance < gameState.currentBet) {
        showMessage("餘額不足");
        return;
    }
    
    // 檢查撞柱風險
    const pillarPenalty = gameState.currentBet * Math.abs(gameState.payouts.pillar);
    if (gameState.balance < pillarPenalty) {
        showMessage(`餘額不足以支付撞柱風險 (需要${pillarPenalty})`);
        return;
    }
    
    // 禁用發牌按鈕，防止重複點擊
    document.getElementById('dealBtn').disabled = true;
    
    // 檢查牌組是否需要重新洗牌
    if (gameState.deck.dealt > gameState.deck.total / 2) {
        initDeck();
        showMessage("牌組已重新洗牌");
    }
    
    // 扣除下注金額
    gameState.balance -= gameState.currentBet;
    updateBalanceDisplay();
    
    // 更新贏額顯示為Good Luck
    updateWinDisplay('Good Luck');
    
    // 重置卡片花色映射
    resetCardSuits();
    
    // 重置卡片
    resetCards();
    
    // 發龍門牌
    dealDragonGateCards();
}

// 發龍門牌
function dealDragonGateCards() {
    gameState.phase = 'dealing';
    
    // 確保比大小按鈕可用（防止卡住）
    document.getElementById('biggerBtn').disabled = false;
    document.getElementById('smallerBtn').disabled = false;
    document.getElementById('biggerBtn').classList.remove('selected');
    document.getElementById('smallerBtn').classList.remove('selected');
    
    // 從牌組抽兩張牌，確保不是鬼牌
    let card1 = drawCard();
    let card3 = drawCard();
    
    // 如果抽到鬼牌，放回牌堆隨機位置並重新抽牌
    while (card1.value === 'joker') {
        // 重置鬼牌的使用狀態
        const matchingCard = gameState.deck.allCards.find(c => c.id === card1.id);
        if (matchingCard) {
            matchingCard.used = false;
        }
        
        // 將鬼牌放回牌堆隨機位置
        const randomIndex = Math.floor(Math.random() * gameState.deck.cards.length);
        gameState.deck.cards.splice(randomIndex, 0, card1);
        // 重新抽牌
        card1 = drawCard();
    }
    
    while (card3.value === 'joker') {
        // 重置鬼牌的使用狀態
        const matchingCard = gameState.deck.allCards.find(c => c.id === card3.id);
        if (matchingCard) {
            matchingCard.used = false;
        }
        
        // 將鬼牌放回牌堆隨機位置
        const randomIndex = Math.floor(Math.random() * gameState.deck.cards.length);
        gameState.deck.cards.splice(randomIndex, 0, card3);
        // 重新抽牌
        card3 = drawCard();
    }
    
    // 如果兩張牌不同，需要排序
    if (card1.value !== card3.value) {
        // 先確定是否需要排序，小的在左，大的在右
        const needsSwap = card1.value > card3.value;
        const leftCard = needsSwap ? card3 : card1;
        const rightCard = needsSwap ? card1 : card3;
        
        // 保存排序後的龍門牌
        gameState.dragonGates = [leftCard.value, rightCard.value];
        
        // 顯示左側龍門牌
        const card1Element = document.getElementById('card1');
        revealCard(card1Element, leftCard.value, getSuitSymbol(leftCard.suit));
        
        // 延遲後顯示右側龍門牌
        setTimeout(() => {
            const card3Element = document.getElementById('card3');
            revealCard(card3Element, rightCard.value, getSuitSymbol(rightCard.suit));
            
            // 延遲後進入玩家決策階段
            setTimeout(() => {
                startPlayerTurn();
                // 在所有動畫完成後，啟用發牌按鈕
                document.getElementById('dealBtn').disabled = false;
            }, 800);
        }, 1000);
    } else {
        // 兩張牌相同，不需要排序
        gameState.dragonGates = [card1.value, card3.value];
        
        // 顯示左側龍門牌
        const card1Element = document.getElementById('card1');
        revealCard(card1Element, card1.value, getSuitSymbol(card1.suit));
        
        // 延遲後顯示右側龍門牌
        setTimeout(() => {
            const card3Element = document.getElementById('card3');
            revealCard(card3Element, card3.value, getSuitSymbol(card3.suit));
            
            // 延遲後進入猜大小階段
            setTimeout(() => {
                showMessage("兩張龍門牌相同，請選擇比大或比小");
                startPlayerTurn();
                // 在所有動畫完成後，啟用發牌按鈕
                document.getElementById('dealBtn').disabled = false;
            }, 800);
        }, 1000);
    }
}

// 開始玩家回合
function startPlayerTurn() {
    // 隱藏發牌按鈕
    document.getElementById('dealBtn').classList.add('hidden');
    
    // 顯示中間的卡片位置
    document.getElementById('card2').classList.remove('hidden');
    
    const [leftGate, rightGate] = gameState.dragonGates;
    
    // 檢查兩張龍門牌是否相同
    if (leftGate === rightGate) {
        // 相同牌情況，進入特殊選擇階段
        gameState.phase = 'special-choice';
        
        // 顯示比大小選擇按鈕
        document.getElementById('specialButtons').classList.remove('hidden');
        
        // 隱藏補牌和放棄按鈕
        document.getElementById('hitBtn').classList.add('hidden');
        document.getElementById('standBtn').classList.add('hidden');
    } else {
        // 正常情況，進入玩家決策階段
        gameState.phase = 'player-turn';
        
        // 顯示補牌和放棄按鈕
        document.getElementById('hitBtn').classList.remove('hidden');
        document.getElementById('standBtn').classList.remove('hidden');
    }
}

// 玩家選擇補牌
function hitCard() {
    if (gameState.phase !== 'player-turn') return;
    
    gameState.phase = 'dealer-turn';
    
    // 隱藏操作按鈕
    document.getElementById('hitBtn').classList.add('hidden');
    document.getElementById('standBtn').classList.add('hidden');
    
    // 從牌組抽取玩家牌
    const playerCard = drawCard();
    gameState.playerCard = playerCard.value;
    
    // 顯示玩家牌
    const card2Element = document.getElementById('card2');
    if (playerCard.value === 'joker') {
        revealCard(card2Element, 'joker');
    } else {
        revealCard(card2Element, playerCard.value, getSuitSymbol(playerCard.suit));
    }
    
    // 延遲後計算結果
    setTimeout(calculateResult, 1000);
}

// 玩家選擇放棄
function stand() {
    if (gameState.phase !== 'player-turn') return;
    
    gameState.phase = 'result';
    
    // 隱藏操作按鈕
    document.getElementById('hitBtn').classList.add('hidden');
    document.getElementById('standBtn').classList.add('hidden');
    
    // 從牌組抽取一張牌（玩家原本會拿到的牌）
    const wouldBeCard = drawCard();
    
    // 顯示玩家原本會拿到的牌
    const card2Element = document.getElementById('card2');
    if (wouldBeCard.value === 'joker') {
        revealCard(card2Element, 'joker');
    } else {
        revealCard(card2Element, wouldBeCard.value, getSuitSymbol(wouldBeCard.suit));
    }
    
    // 計算這張牌的結果（但不影響實際得分）
    const [leftGate, rightGate] = gameState.dragonGates;
    let resultMessage = "";
    
    // 特殊情況：Joker牌
    if (wouldBeCard.value === 'joker') {
        resultMessage = `玩家放棄補牌，損失下注金額。若補牌會得到Joker，有機會贏得 ${gameState.currentBet * gameState.payouts.special} 籌碼！`;
    }
    // 正常情況：檢查是否中門、撞柱或未中
    else if (wouldBeCard.value > leftGate && wouldBeCard.value < rightGate) {
        // 原本會中門
        resultMessage = `玩家放棄補牌，損失下注金額。若補牌會中門，有機會贏得 ${gameState.currentBet * gameState.payouts.hit} 籌碼！`;
    } else if (wouldBeCard.value === leftGate || wouldBeCard.value === rightGate) {
        // 原本會撞柱
        resultMessage = `玩家放棄補牌，損失下注金額。逃過撞柱懲罰，原本會輸掉 ${gameState.currentBet * Math.abs(gameState.payouts.pillar)} 籌碼！`;
    } else {
        // 原本會未中
        resultMessage = "玩家放棄補牌，損失下注金額。若補牌也會未中，結果相同。";
    }
    
    // 更新贏額顯示和記錄上一局輸掉的金額
    gameState.lastWin = -gameState.currentBet;
    updateWinDisplay('-' + gameState.currentBet);
    
    // 顯示發牌按鈕 (允許開始新一輪)
    document.getElementById('dealBtn').classList.remove('hidden');
    
    // 顯示結果訊息
    showMessage(resultMessage);
    
    // 放棄後，將狀態設為 idle，讓玩家可以調整押注金額
    setTimeout(() => {
        gameState.phase = 'idle';
    }, 500);
}

// 選擇比較（比大/比小）
function chooseComparison(choice) {
    if (gameState.phase !== 'special-choice') return;
    
    gameState.comparison = choice;
    
    // 標記選擇的按鈕
    document.getElementById('biggerBtn').classList.remove('selected');
    document.getElementById('smallerBtn').classList.remove('selected');
    
    if (choice === 'bigger') {
        document.getElementById('biggerBtn').classList.add('selected');
    } else {
        document.getElementById('smallerBtn').classList.add('selected');
    }
    
    // 禁用按鈕防止重複選擇
    document.getElementById('biggerBtn').disabled = true;
    document.getElementById('smallerBtn').disabled = true;
    
    // 延遲後發玩家牌
    setTimeout(() => {
        // 從牌組抽取玩家牌
        const playerCard = drawCard();
        gameState.playerCard = playerCard.value;
        
        // 顯示玩家牌
        const card2Element = document.getElementById('card2');
        if (playerCard.value === 'joker') {
            revealCard(card2Element, 'joker');
        } else {
            revealCard(card2Element, playerCard.value, getSuitSymbol(playerCard.suit));
        }
        
        // 延遲後計算結果
        setTimeout(() => {
            // 隱藏比較按鈕
            document.getElementById('specialButtons').classList.add('hidden');
            calculateResult();
        }, 1000);
    }, 500);
}

// 計算結果
function calculateResult() {
    // 先設為結果狀態以顯示結果
    gameState.phase = 'result';
    
    const [leftGate, rightGate] = gameState.dragonGates;
    const playerCard = gameState.playerCard;
    
    let payout = 0; // 賠率乘數
    let resultText = "";
    
    // 特殊情況：Joker牌
    if (playerCard === 'joker') {
        payout = gameState.payouts.special;
        resultText = `Joker牌，恭喜您無條件獲勝！贏得 ${gameState.currentBet * payout} 籌碼`;
    }
    // 特殊情況：兩張龍門牌相同（實際不會發生，但保留邏輯）
    else if (leftGate === rightGate) {
        const isSmaller = playerCard < leftGate;
        const isBigger = playerCard > leftGate;
        
        if ((gameState.comparison === 'smaller' && isSmaller) || 
            (gameState.comparison === 'bigger' && isBigger)) {
            payout = gameState.payouts.hit;
            resultText = `猜對了！贏得 ${gameState.currentBet * payout} 籌碼`;
        } else if (playerCard === leftGate) {
            payout = gameState.payouts.pillar;
            resultText = `撞柱！輸掉 ${gameState.currentBet * Math.abs(payout)} 籌碼`;
        } else {
            payout = gameState.payouts.miss;
            resultText = `猜錯了，損失下注金額`;
        }
    }
    // 正常情況：檢查是否中門、撞柱或未中
    else {
        if (playerCard > leftGate && playerCard < rightGate) {
            // 中門
            payout = gameState.payouts.hit;
            resultText = `中門！贏得 ${gameState.currentBet * payout} 籌碼`;
        } else if (playerCard === leftGate || playerCard === rightGate) {
            // 撞柱
            payout = gameState.payouts.pillar; // 負數
            resultText = `撞柱！輸掉 ${gameState.currentBet * Math.abs(payout)} 籌碼`;
        } else {
            // 未中
            payout = gameState.payouts.miss; // 負數
            resultText = `未中，損失下注金額`;
        }
    }
    
    // 計算實際贏輸金額
    let winAmount = gameState.currentBet * payout;
    
    // 對於負賠率，需要額外處理
    if (payout > 0) {
        // 贏錢：返還原本下注金額 + 獎勵金額
        gameState.balance += gameState.currentBet + winAmount;
    } else {
        // 輸錢：已扣除原本下注金額，再扣除額外懲罰金額（如果有）
        gameState.balance -= Math.abs(winAmount) - gameState.currentBet;
    }
    
    // 更新餘額
    updateBalanceDisplay();
    
    // 記錄本局贏輸情況
    gameState.lastWin = winAmount;
    
    // 更新贏額顯示
    if (payout > 0) {
        updateWinDisplay("+" + winAmount);
    } else {
        updateWinDisplay("-" + Math.abs(winAmount));
    }
    
    // 顯示結果訊息
    showMessage(resultText);
    
    // 顯示發牌按鈕 (允許開始新一輪)
    document.getElementById('dealBtn').classList.remove('hidden');
    
    // 檢查餘額是否歸零
    if (gameState.balance === 0) {
        setTimeout(() => {
            showMessage("餘額已歸零，請重新整理頁面");
        }, 2000);
    }
    
    // 結算完成後，將狀態設為 idle，讓玩家可以調整押注金額
    setTimeout(() => {
        gameState.phase = 'idle';
    }, 500);
}

// 重置遊戲狀態
function resetGameState() {
    // 重置遊戲狀態
    gameState.phase = 'idle';
    gameState.dragonGates = [null, null];
    gameState.playerCard = null;
    gameState.comparison = null;
    
    // 重置卡片花色映射
    resetCardSuits();
    
    // 重置按鈕狀態
    document.getElementById('biggerBtn').disabled = false;
    document.getElementById('smallerBtn').disabled = false;
    document.getElementById('specialButtons').classList.add('hidden');
    document.getElementById('biggerBtn').classList.remove('selected');
    document.getElementById('smallerBtn').classList.remove('selected');
}

// 重置卡片
function resetCards() {
    const card1 = document.getElementById('card1');
    const card2 = document.getElementById('card2');
    const card3 = document.getElementById('card3');
    
    resetCard(card1);
    resetCard(card2);
    resetCard(card3);
    
    card2.classList.add('hidden');
}

// 顯示訊息
function showMessage(message) {
    const messageArea = document.getElementById('messageArea');
    messageArea.textContent = message;
    messageArea.classList.add('show-message');
    
    setTimeout(() => {
        messageArea.classList.remove('show-message');
    }, 4000);
}

/* 測試牌組中的鬼牌 - 暫時註釋，需要時可以取消註釋
function testJokersInDeck() {
    // 找出當前牌組中的所有鬼牌
    const jokersInDeck = gameState.deck.cards.filter(card => card.value === 'joker');
    
    // 找出所有牌中的鬼牌(包括已使用的)
    const allJokers = gameState.deck.allCards.filter(card => card.value === 'joker');
    
    console.log(`當前牌組中的鬼牌數量：${jokersInDeck.length}`);
    if (jokersInDeck.length > 0) {
        console.log('鬼牌在牌組中的位置：');
        jokersInDeck.forEach((joker, index) => {
            const position = gameState.deck.cards.indexOf(joker);
            const cardsLeft = gameState.deck.cards.length;
            console.log(`鬼牌 ${index + 1}: 距離牌堆頂部還有 ${cardsLeft - position - 1} 張牌`);
        });
    }
    
    console.log(`所有鬼牌(包括已使用的)：${allJokers.length}`);
    allJokers.forEach((joker, index) => {
        console.log(`鬼牌 ${index + 1} (${joker.id})：${joker.used ? '已使用' : '未使用'}`);
    });
    
    // 添加測試按鈕到頁面（僅開發時使用）
    const testBtn = document.createElement('button');
    testBtn.textContent = '測試鬼牌';
    testBtn.style.position = 'fixed';
    testBtn.style.bottom = '10px';
    testBtn.style.right = '10px';
    testBtn.style.zIndex = '1000';
    testBtn.onclick = function() {
        testJokersInDeck();
    };
    document.body.appendChild(testBtn);
    
    return {
        total: allJokers.length,
        inDeck: jokersInDeck.length,
        used: allJokers.filter(j => j.used).length
    };
}
*/

// 頁面載入時初始化遊戲
document.addEventListener('DOMContentLoaded', function() {
    initGame();
    
    // 添加測試按鈕 - 暫時註釋，需要時可以取消註釋
    // setTimeout(testJokersInDeck, 1000);
}); 