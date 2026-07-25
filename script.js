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
