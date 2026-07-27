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
    wordList.innerHTML = '';

    topic.words.forEach(wordObj => {
        const wordCard = document.createElement('div');
        wordCard.className = 'word-card';

        wordCard.innerHTML = `
            <h3>${wordObj.word}</h3>
            <p>${wordObj.definition}</p>
        `;

        wordCard.addEventListener('click', () => {
            showWordDetail(wordObj);
        });

        wordList.appendChild(wordCard);
    });
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
