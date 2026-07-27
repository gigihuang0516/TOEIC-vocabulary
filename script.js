// 1. 取得頁面上的「Google 登入按鈕」
const loginBtn = document.getElementById('login-btn');

// 2. 監聽使用者的登入狀態變化 🔐
auth.onAuthStateChanged((user) => {
    console.log("目前登入狀態：", user);
    if (user) {
        // 已登入狀態：顯示頭像與名字
        loginBtn.innerHTML = `
            <img src="${user.photoURL}" style="width:24px; height:24px; border-radius:50%;">
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
        loginBtn.innerHTML = '使用 Google 帳號登入';

        loginBtn.onclick = () => {
            auth.signInWithPopup(googleProvider);
        };
    }
});

// 3. 讀取 words.json 資料並顯示主題 📚
fetch('words.json')
    .then(response => response.json())
    .then(data => { 
        const topicList = document.getElementById('topic-list');

        data.forEach(topic => {
            const card = document.createElement('div');
            card.className = 'topic-card';
            card.innerHTML = `
                <h3>${topic.topic_title}</h3>
                <p>${topic.description}</p>
            `;

            card.addEventListener('click', () => {
                showWordList(topic);
            });

            topicList.appendChild(card);
        });
    })
    .catch(error => console.error('抓取資料失敗：', error));

// 4. 顯示單字列表頁面 📋
function showWordList(topic) {
    const topicView = document.getElementById('topic-view');
    const wordListView = document.getElementById('word-list-view');

    topicView.style.display = 'none';
    wordListView.style.display = 'block';

    document.getElementById('current_topic_title').innerText = topic.topic_title;

    const wordList = document.getElementById('word-list');
    wordList.innerHTML = ''; // 清空現有清單

    const user = auth.currentUser;

    // 內部渲染函式：拿到收藏資料後，開始產生單字卡片
    const renderCards = (favorites = {}) => {
        topic.words.forEach(wordObj => {
            const wordCard = document.createElement('div');
            wordCard.className = 'word-card';
            
            // 判斷這個單字是否有在收藏名單中
            const isFavorited = favorites[wordObj.word] ? true : false;
            const heartIcon = isFavorited ? '❤️' : '♡';

            // 加上單字、愛心按鈕與解釋 (使用 flex 排版讓愛心靠右)
            wordCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <h3 style="margin: 0;">${wordObj.word}</h3>
                    <span class="list-fav-btn" style="cursor: pointer; font-size: 1.2rem;">${heartIcon}</span>
                </div>
                <p style="margin-top: 8px;">${wordObj.definition}</p>
            `;

            // 🛑 點擊「愛心」時的處理
            const favBtn = wordCard.querySelector('.list-fav-btn');
            favBtn.addEventListener('click', (event) => {
                // 防止點擊愛心時，觸發到下方卡片的點擊事件 (避免打開詳細頁面)
                event.stopPropagation(); 
                
                // 呼叫列表專用的收藏切換功能
                toggleListFavorite(wordObj.word, favBtn);
            });

            // 📄 點擊「單字卡片其他區域」時，開啟單字詳細資料
            wordCard.addEventListener('click', () => {
                showWordDetail(wordObj);
            });

            wordList.appendChild(wordCard);
        });
    };

    // 判斷是否登入：有登入就去抓收藏資料，未登入就直接給空物件 {}
    if (user) {
        database.ref(`users/${user.uid}/favorites`).once('value').then(snapshot => {
            renderCards(snapshot.val() || {});
        });
    } else {
        renderCards({});
    }
}
// 5. 顯示單字詳細頁面 📄
function showWordDetail(wordObj) {
    // 填入單字與例句內容
    document.getElementById('detail-word').innerText = wordObj.word;
    document.getElementById('detail-pos').innerText = wordObj.pos;
    document.getElementById('detail-phonetic').innerText = wordObj.phonetic;
    document.getElementById('detail-def').innerText = wordObj.definition;
    document.getElementById('detail_ex_en').innerText = wordObj.example_en;
    document.getElementById('detail_ex_zh').innerText = wordObj.example_zh;

    // 清空並渲染搭配詞清單
    const colList = document.getElementById('detail-collocations');
    colList.innerHTML = '';

    wordObj.collocations.forEach(item => {
        const li = document.createElement('li');
        li.innerText = item;
        colList.appendChild(li);
    });

    // 🔍 向 Firebase 檢查當前單字的收藏狀態
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

    // 🙈 隱藏單字列表，僅顯示詳細頁面
    document.getElementById('word-list-view').style.display = 'none';
    document.getElementById('word-detail-view').style.display = 'block';
}

// 6. 按鈕監聽事件（返回與收藏） 🖱️
const backBtn = document.getElementById('close-detail-btn');
if (backBtn) {
    backBtn.addEventListener('click', () => {
        document.getElementById('word-detail-view').style.display = 'none';
        document.getElementById('word-list-view').style.display = 'block';
    });
}

const backToTopicBtn = document.getElementById('back-to-topic-btn');
if (backToTopicBtn) {
    backToTopicBtn.addEventListener('click', () => {
        document.getElementById('word-list-view').style.display = 'none';
        document.getElementById('topic-view').style.display = 'block';
    });
}

const detailFavBtn = document.getElementById('detail-fav-btn');
if (detailFavBtn) {
    detailFavBtn.onclick = () => {
        const currentWord = document.getElementById('detail-word').innerText;
        toggleFavorite(currentWord);
    };
}

// 7. 切換單字收藏狀態 🗂️
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
// 8. 單字列表專用的收藏切換狀態 🗂️
function toggleListFavorite(word, btnElement) {
    const user = auth.currentUser;

    if (!user) {
        alert("請先登入 Google 帳號才能使用收藏功能喔！");
        return;
    }

    const favRef = database.ref(`users/${user.uid}/favorites/${word}`);

    favRef.once('value').then((snapshot) => {
        if (snapshot.exists()) {
            // 已存在 -> 移除並變成空心
            favRef.remove().then(() => {
                btnElement.innerText = '♡';
            });
        } else {
            // 不存在 -> 新增並變成實心
            favRef.set(true).then(() => {
                btnElement.innerText = '❤️';
            });
        }
    });
}
// 顯示「我的收藏」頁面 📂
function showFavorites() {
    // 1. 隱藏其他所有視圖
    document.getElementById('topic-view').style.display = 'none';
    document.getElementById('word-list-view').style.display = 'none';
    document.getElementById('word-detail-view').style.display = 'none';

    // 2. 顯示我的收藏頁面
    document.getElementById('favorites-view').style.display = 'block';

    // 3. 載入收藏的單字資料
    loadFavoriteWords();
}
// 載入並顯示收藏單字的詳細內容 📚
function loadFavoriteWords() {
    const user = auth.currentUser;
    const favListContainer = document.getElementById('favorites-list');
    favListContainer.innerHTML = ''; // 清空舊內容

    if (!user) return;

    // 1. 先向 Firebase 取得收藏清單
    database.ref(`users/${user.uid}/favorites`).once('value').then(snapshot => {
        const favData = snapshot.val() || {};
        const favWordNames = Object.keys(favData); // 取得所有收藏的單字名稱陣列

        if (favWordNames.length === 0) {
            favListContainer.innerHTML = '<p>目前還沒有收藏任何單字喔！</p>';
            return;
        }

        // 2. 讀取 words.json 進行比對
        fetch('words.json')
            .then(res => res.json())
            .then(data => {
                // 收集所有主題裡符合收藏名稱的單字
                const matchedWords = [];
                data.forEach(topic => {
                    topic.words.forEach(wordObj => {
                        if (favWordNames.includes(wordObj.word)) {
                            matchedWords.push(wordObj);
                        }
                    });
                });

                // 3. 將比對到的單字渲染到頁面上
                matchedWords.forEach(wordObj => {
                    const card = document.createElement('div');
                    card.className = 'word-card';
                    card.innerHTML = `
                        <h3>${wordObj.word}</h3>
                        <p>${wordObj.definition}</p>
                    `;
                    // 點擊可以開啟詳細頁面
                    card.addEventListener('click', () => {
                        showWordDetail(wordObj);
                    });
                    favListContainer.appendChild(card);
                });
            });
    });
}
// 「我的收藏」按鈕點擊事件
document.getElementById('nav-fav-btn').addEventListener('click', () => {
    showFavorites();
});

// 「從收藏頁返回」按鈕點擊事件
document.getElementById('back-from-fav-btn').addEventListener('click', () => {
    document.getElementById('favorites-view').style.display = 'none';
    document.getElementById('topic-view').style.display = 'block';
});
