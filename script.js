// 1. 取得頁面上的「Google 登入按鈕」
const loginBtn = document.getElementById('login-btn');

// 2.監聽使用者的登入狀態變化
auth.onAuthStateChanged((user) => {
    console.log("目前登入狀態：", user);
    if (user) {
        // 已登入狀態
        // 1. 更新按鈕顯示內容（顯示名字與頭像）
        loginBtn.innerHTML = `
            <img src="${user.photoURL}" style="width:24px; height:24px; border-radius:50%;">
            ${user.displayName} (登出)
        `;

        // 2. 點擊按鈕改為執行「登出」
        loginBtn.onclick = () => {
            auth.signOut().then(() => {
                alert("已成功登出！");
            });
        };

        // 3. 順便同步/更新 Realtime Database 資料
        database.ref('users/' + user.uid).update({
            name: user.displayName,
            email: user.email,
            lastLogin: new Date().toISOString()
        });

    } else {
        //  未登入狀態
        // 1. 恢復按鈕原本的文字
        loginBtn.innerHTML = ' 使用 Google 帳號登入';

        // 2. 點擊按鈕執行「登入」
        loginBtn.onclick = () => {
            auth.signInWithPopup(googleProvider);
        };
    }
});

// 3. 讀取 words.json 資料並顯示主題
fetch('words.json')
    .then(response => response.json())
    .then(data => { 
        const topicList = document.getElementById('topic-list');

        // 渲染主題卡片
        data.forEach(topic => {
            const card = document.createElement('div');
            card.className = 'topic-card';
            card.innerHTML = `
                <h3>${topic.topic_title}</h3>
                <p>${topic.description}</p>
            `;

            // 點擊主題時，切換到該主題的單字列表
            card.addEventListener('click', () => {
                showWordList(topic);
            });

            topicList.appendChild(card);
        });
    })
    .catch(error => console.error('抓取資料失敗：', error));

// 4. 顯示單字列表頁面的函式
function showWordList(topic) {
    const topicView = document.getElementById('topic-view');
    const wordListView = document.getElementById('word-list-view');

    // 切換顯示狀態
    topicView.style.display = 'none';
    wordListView.style.display = 'block';

    // 更新主題標題
    document.getElementById('current_topic_title').innerText = topic.topic_title;

    // 清空並渲染單字清單
    const wordList = document.getElementById('word-list');
    wordList.innerHTML = '';

    topic.words.forEach(wordObj => {
        const wordCard = document.createElement('div');
        wordCard.className = 'word-card';

        wordCard.innerHTML = `
            <h3>${wordObj.word}</h3>
            <p>${wordObj.definition}</p>
        `;

        // 點擊單字卡片時，開啟單字詳細資料
        wordCard.addEventListener('click', () => {
            showWordDetail(wordObj);
            document.getElementById('word-list-view').style.display = 'none';
            document.getElementById('word-detail-view').style.display = 'block';
        });

        wordList.appendChild(wordCard);
    });
}

// 5. 顯示單字詳細資料頁面的函式
function showWordDetail(wordObj) {
    // 填入文字資料
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

    // 顯示詳細頁面
    document.getElementById('word-detail-view').style.display = 'block';
}
// 取得返回按鈕（使用正確的 ID：close-detail-btn）
const backBtn = document.getElementById('close-detail-btn');

// 加上點擊事件監聽器 🖱️
backBtn.addEventListener('click', () => {
    document.getElementById('word-detail-view').style.display = 'none';
    document.getElementById('word-list-view').style.display = 'block';
});
// 取得返回主題列表按鈕
const backToTopicBtn = document.getElementById('back-to-topic-btn');

// 加上點擊事件監聽器 🖱️
backToTopicBtn.addEventListener('click', () => {
    document.getElementById('word-list-view').style.display = 'none';
    document.getElementById('topic-view').style.display = 'block';
});
// 1. 取得詳細頁面的收藏按鈕
const detailFavBtn = document.getElementById('detail-fav-btn');

// 2. 綁定點擊事件
detailFavBtn.onclick = () => {
    // 取得目前詳細頁面顯示的英文單字
    const currentWord = document.getElementById('detail-word').innerText;
    
    // 呼叫切換收藏狀態的函式
    toggleFavorite(currentWord);
};
// 🗂️ 切換單字收藏狀態
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
            // ❌ 取消收藏：從資料庫移除，按鈕切換為「黑線空心 ♡」
            favRef.remove().then(() => {
                if (detailFavBtn) detailFavBtn.innerText = '♡';
            });
        } else {
            // ❤️ 新增收藏：寫入資料庫，按鈕切換為「紅色實心 ❤️」
            favRef.set(true).then(() => {
                if (detailFavBtn) detailFavBtn.innerText = '❤️';
            });
        }
    });
}
