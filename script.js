// 1. 取得頁面上的「Google 登入按鈕」
const loginBtn = document.getElementById('login-btn');

// 2. 為按鈕加上點擊事件監聽器（Event Listener）
loginBtn.addEventListener('click', () => {
    // 呼叫 Firebase 的 Google 彈出視窗登入功能
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

        // 渲染主題
        data.forEach(topic => {
            const card = document.createElement('div');
            card.className = 'topic-card';
            card.innerHTML = `
                <h3>${topic.topic_title}</h3>
                <p>${topic.description}</p>
            `;

            // 點擊主題時的動作
               card.addEventListener('click', () => {
                  showWordList(topic);
               });

            topicList.appendChild(card);
        });
    })
    .catch(error => console.error('抓取資料失敗：', error));
function showWordList(topic) {
    const topicView = document.getElementById('topic-view');
    const wordListView = document.getElemetById('word-list-view');

// 1. 切換顯示狀態
    topicView.style.display = 'none';
    wordListView.style.display = 'block';
// 2. 更新標題
    document.getElementById('current_topic_title').innerText = 
topic.topic_title;
// 3. 渲染單字清單
    const wordList = document.getElementById('word-list');
    wordList.innerHTML = '';

    topic.words.forEach(wordObj => {
        const wordCard = document.createElement('div');
        wordCard.className = 'word-card';

        wordCard.innerHTML = `
           <h3>${wordObj.word}</h3>
           <p>${wordObj.definition}</p>
        `;
        wordList.appendChild(wordCard);
    });
}
