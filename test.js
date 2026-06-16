const http = require('http');
const crypto = require('crypto');

// --- 你的綠界測試金鑰 ---
const MerchantID = '2000132';
const HashKey = '5294y06JbISpM5x9';
const HashIV = 'v77hoKGq4kWxNNIS';

const server = http.createServer((req, res) => {
    // 讓前端網頁可以連線
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Content-Type', 'application/json; charset=utf-8');

    if (req.url.startsWith('/get-atm')) {
        const amount = new URLSearchParams(req.url.split('?')[1]).get('amount') || '100';

        // 綠界規定參數 A-Z 排序
        const params = {
            ChoosePayment: 'ATM',
            EncryptType: '1',
            ItemName: 'LeatherItem',
            MerchantID: MerchantID,
            MerchantTradeDate: '2026/06/17 01:20:00',
            MerchantTradeNo: 'Test' + new Date().getTime(),
            PaymentType: 'aio',
            ReturnURL: 'https://www.google.com',
            TotalAmount: parseInt(amount),
            TradeDesc: 'ShopOrder'
        };

        // 計算 CheckMacValue
        let rawString = `HashKey=${HashKey}`;
        Object.keys(params).sort().forEach(key => {
            rawString += `&${key}=${params[key]}`;
        });
        rawString += `&HashIV=${HashIV}`;

        // 綠界特規編碼 (關鍵)
        let encoded = encodeURIComponent(rawString).toLowerCase()
            .replace(/%2d/g, '-').replace(/%5f/g, '_').replace(/%2e/g, '.')
            .replace(/%21/g, '!').replace(/%2a/g, '*').replace(/%28/g, '(')
            .replace(/%29/g, ')').replace(/%20/g, '+');

        params.CheckMacValue = crypto.createHash('sha256').update(encoded).digest('hex').toUpperCase();

        // 直接回傳參數給前端，讓前端網頁自動送出表單
        res.end(JSON.stringify({ status: "準備跳轉", params: params }));
    }
});

server.listen(3000, () => console.log('✅ 伺服器已就緒，請開啟 index.html 測試'));