// 1. 取得頁面上的「Google 登入按鈕」
const loginBtn = document.getElementById('login-btn');

// 2. 為按鈕加上點擊事件監聽器
loginBtn.addEventListener('click', () => {
    auth.signInWithPopup(googleProvider)
        .then((result) => {
            const user = result.user;
            alert(`登入成功！歡迎 ${user.displayName}`);
            console.log('使用者資料：', user);
        })
        .catch((error) => {
            console.error('登入失敗：', error);
            alert('登入失敗，請確認 Firebase 設定或稍後再試！');
        });
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
