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
// 3. 讀取 word.json 資料並顯示主題
fetch('word.josn')
     .then(response => response.json())
     .then(data => { 
         const topicList =doucument.getElementById('topic-list');

         //渲染主題
         data.forEach(topic =>{
             const card = document.createElement('div');
             card.className = 'topic-card';
             card.innerHTML = `
                <h3>${topic.topic-title}</h3>
                <p>${topic.descripttion}</p>
            `;
             //點擊主題時的動作
            card.addEventListener('click', () => {
                alert(`你點擊了主題:${topic.topic-title}`);
            });
            topicList.appendChild(card);
         });
     });
     .catch(error => console.error('抓取資料失敗 : ',error)); ˇ
