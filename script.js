// 📌 紀錄前一個頁面的 ID，預設為主題列表
let previousView = 'topic-view';

// 頁面元素載入完成後再綁定與執行
document.addEventListener('DOMContentLoaded', () => {

    // 1. 取得頁面上的「Google 登入按鈕」
    const loginBtn = document.getElementById('login-btn');

    // 2. 監聽使用者的登入狀態變化 🔐
    auth.onAuthStateChanged((user) => {
        console.log("目前登入狀態：", user);
        if (loginBtn) {
            if (user) {
                // 已登入狀態：顯示頭像與名字
                loginBtn.innerHTML = `
                    <img src="${user.photoURL}" style="width:20px; height:20px; border-radius:50%; vertical-align:middle; margin-right:5px;">
                    ${user.displayName} (登出)
                `;

                loginBtn.onclick = () => {
                    auth.signOut().then(() => {
                        alert("已成功登出！");
                    });
                };

                // 同步使用者資料到 Firebase
                database.ref('users/' + user.uid).update({
                    name: user.displayName,
                    email: user.email,
                    lastLogin: new Date().toISOString()
                });

            } else {
                // 未登入狀態
                loginBtn.innerHTML = '登入google帳號';

                loginBtn.onclick = () => {
                    auth.signInWithPopup(googleProvider);
                };
            }
        }
    });

// 替換原本的 fetch 區塊
    fetch('words.json')
        .then(response => response.text()) // ⚠️ 先轉成純文字，不要直接 .json()
        .then(text => {
            // ✨ 神奇魔法：把所有「隱形特殊空白」強制替換成「正常的空白」
            const cleanText = text.replace(/\u00a0/g, ' ').trim(); 
            const data = JSON.parse(cleanText); // 清理乾淨後再解析成 JSON
            
            console.log("資料抓取成功！", data);
            
            // 🚀 關鍵修正：呼叫函式把主題渲染到畫面上！
            renderTopics(data);
            
        })
        .catch(error => {
            console.error("抓取資料失敗：", error);
        });

    // 4. 首頁按鈕綁定 🚀
    const startBtn = document.getElementById('start-btn');
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            hideAllViews();
            showElement('topic-view');
        });
    }

    const navFavBtn = document.getElementById('nav-fav-btn');
    if (navFavBtn) {
        navFavBtn.addEventListener('click', () => {
            showFavorites();
        });
    }

    // 5. 各頁面返回按鈕（修復切換邏輯！） 🔙
    // 主題頁面的返回 ➔ 回到首頁 (hero-screen)
    const backToHomeBtn = document.getElementById('back-to-home-btn');
    if (backToHomeBtn) {
        backToHomeBtn.addEventListener('click', () => {
            hideAllViews();
            showElement('hero-screen');
        });
    }

    // 收藏頁面的返回 ➔ 回到首頁 (hero-screen)
    const backFromFavBtn = document.getElementById('back-from-fav-btn');
    if (backFromFavBtn) {
        backFromFavBtn.addEventListener('click', () => {
            hideAllViews();
            showElement('hero-screen'); 
        });
    }

    // 單字清單頁面的返回 ➔ 回到主題頁面
    const backToTopicBtn = document.getElementById('back-to-topic-btn');
    if (backToTopicBtn) {
        backToTopicBtn.addEventListener('click', () => {
            hideAllViews();
            showElement('topic-view');
        });
    }

    // 單字詳細頁面的關閉 ➔ 返回上一頁 (來源頁面)
    const closeDetailBtn = document.getElementById('close-detail-btn');
    if (closeDetailBtn) {
        closeDetailBtn.addEventListener('click', () => {
            hideAllViews();
            showElement(previousView);
        });
    }

    // 詳細頁面的收藏愛心按鈕綁定
    const detailFavBtn = document.getElementById('detail-fav-btn');
    if (detailFavBtn) {
        detailFavBtn.onclick = () => {
            const currentWord = document.getElementById('detail-word').innerText;
            toggleFavorite(currentWord);
        };
    }

});

// ==============================
// 🛠️ 通用工具函式 (切換頁面防呆)
// ==============================
function hideAllViews() {
    const views = ['hero-screen', 'topic-view', 'word-list-view', 'favorites-view', 'word-detail-view'];
    views.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

function showElement(id) {
    const el = document.getElementById(id);
    if (!el) return;
    
    // ✨ 關鍵修復：如果是首頁，強制恢復為 flex 排版！其他頁面用 block
    if (id === 'hero-screen') {
        el.style.display = 'flex';
    } else {
        el.style.display = 'block';
    }
}

// ==============================
// 📋 頁面渲染邏輯
// ==============================

// 顯示單字列表頁面 📋
function showWordList(topic) {
    hideAllViews();
    showElement('word-list-view');

    const titleEl = document.getElementById('current_topic_title');
    if (titleEl) titleEl.innerText = topic.topic_title;

    const wordList = document.getElementById('word-list');
    if (!wordList) return;
    wordList.innerHTML = ''; 

    const user = auth.currentUser;

    const renderCards = (favorites = {}) => {
        topic.words.forEach(wordObj => {
            const wordCard = document.createElement('div');
            wordCard.className = 'word-card';
            
            const isFavorited = favorites[wordObj.word] ? true : false;
            const heartIcon = isFavorited ? '❤️' : '♡';

           // 渲染單字卡片
            wordCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                   <h3 style="margin: 0; font-size: 1.4rem; color: #1a1a1a;">${wordObj.word}</h3>
                   <span class="list-fav-btn" style="cursor: pointer; font-size: 1.4rem;">${heartIcon}</span>
                </div>
                <p style="margin: 6px 0 0 0; color: #555555; font-size: 0.95rem;">${wordObj.definition}</p>
            `;

            const favBtn = wordCard.querySelector('.list-fav-btn');
            favBtn.addEventListener('click', (event) => {
                event.stopPropagation();
                toggleListFavorite(wordObj.word, favBtn);
            });

            wordCard.addEventListener('click', () => {
                previousView = 'word-list-view';
                showWordDetail(wordObj);
            });

            wordList.appendChild(wordCard);
        });
    };

    if (user) {
        database.ref(`users/${user.uid}/favorites`).once('value').then(snapshot => {
            renderCards(snapshot.val() || {});
        });
    } else {
        renderCards({});
    }
}

// 顯示單字詳細頁面 📄
function showWordDetail(wordObj) {
    document.getElementById('detail-word').innerText = wordObj.word;
    document.getElementById('detail-pos').innerText = wordObj.pos;
    document.getElementById('detail-phonetic').innerText = wordObj.phonetic;
    document.getElementById('detail-def').innerText = wordObj.definition;
    document.getElementById('detail_ex_en').innerText = wordObj.example_en;
    document.getElementById('detail_ex_zh').innerText = wordObj.example_zh;

    const colList = document.getElementById('detail-collocations');
    if (colList) {
        colList.innerHTML = '';
        if (wordObj.collocations) {
            wordObj.collocations.forEach(item => {
                const li = document.createElement('li');
                li.innerText = item;
                colList.appendChild(li);
            });
        }
    }

    const user = auth.currentUser;
    const detailFavBtn = document.getElementById('detail-fav-btn');

    if (user && detailFavBtn) {
        const favRef = database.ref(`users/${user.uid}/favorites/${wordObj.word}`);
        favRef.once('value').then((snapshot) => {
            detailFavBtn.innerText = snapshot.exists() ? '❤️' : '♡';
        });
    } else if (detailFavBtn) {
        detailFavBtn.innerText = '♡';
    }

    hideAllViews();
    showElement('word-detail-view');
}

// 顯示「我的收藏」頁面 📂
function showFavorites() {
    hideAllViews();
    
    // ✨ 關鍵修復：這裡要用 display = 'flex'，不能用 'block'！
    const favEl = document.getElementById('favorites-view');
    if (favEl) favEl.style.display = 'flex';
    
    loadFavoriteWords();
}

// 載入並顯示收藏單字 📚
function loadFavoriteWords() {
    const user = auth.currentUser;
    const favListContainer = document.getElementById('favorites-list');
    if (!favListContainer) return;
    favListContainer.innerHTML = '';

    if (!user) {
        favListContainer.innerHTML = '<p style="text-align:center; padding: 20px; color:#ffffff;">請先登入帳號以查看收藏喔！</p>';
        return;
    }

    database.ref(`users/${user.uid}/favorites`).once('value').then(snapshot => {
        const favData = snapshot.val() || {};
        const favWordNames = Object.keys(favData);

        if (favWordNames.length === 0) {
            favListContainer.innerHTML = '<p style="text-align:center; padding: 20px; color:#ffffff;">目前還沒有收藏任何單字喔！</p>';
            return;
        }

        fetch('words.json')
            .then(res => res.json())
            .then(data => {
                const matchedWords = [];
                data.forEach(topic => {
                    topic.words.forEach(wordObj => {
                        if (favWordNames.includes(wordObj.word)) {
                            matchedWords.push(wordObj);
                        }
                    });
                });

                matchedWords.forEach(wordObj => {
                    const card = document.createElement('div');
                    card.className = 'word-card';
                    card.innerHTML = `
                        <h3>${wordObj.word}</h3>
                        <p>${wordObj.definition}</p>
                    `;
                    
                    card.addEventListener('click', () => {
                        previousView = 'favorites-view';
                        showWordDetail(wordObj);
                    });

                    favListContainer.appendChild(card);
                });
            });
    });
}

// 切換單字詳細頁面的收藏狀態
function toggleFavorite(word) {
    const user = auth.currentUser;
    if (!user) {
        alert("請先登入 Google 帳號才能使用收藏功能喔！");
        return;
    }

    const favRef = database.ref(`users/${user.uid}/favorites/${word}`);
    const detailFavBtn = document.getElementById('detail-fav-btn');

    favRef.once('value').then((snapshot) => {
        if (snapshot.exists()) {
            favRef.remove().then(() => {
                if (detailFavBtn) detailFavBtn.innerText = '♡';
            });
        } else {
            favRef.set(true).then(() => {
                if (detailFavBtn) detailFavBtn.innerText = '❤️';
            });
        }
    });
}

// 切換單字列表頁面的收藏狀態
function toggleListFavorite(word, btnElement) {
    const user = auth.currentUser;
    if (!user) {
        alert("請先登入 Google 帳號才能使用收藏功能喔！");
        return;
    }

    const favRef = database.ref(`users/${user.uid}/favorites/${word}`);
    favRef.once('value').then((snapshot) => {
        if (snapshot.exists()) {
            favRef.remove().then(() => {
                btnElement.innerText = '♡';
            });
        } else {
            favRef.set(true).then(() => {
                btnElement.innerText = '❤️';
            });
        }
    });
}
