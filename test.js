const http = require('http');
const crypto = require('crypto');

// --- 設定區 ---
const MerchantID = process.env.MY_MERCHANT_ID;
const HashKey = process.env.MY_HASH_KEY;
const HashIV = process.env.MY_HASH_IV;

// 格式化時間函數 (嚴格遵守 YYYY/MM/DD HH:mm:ss)
function getTradeDate() {
    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    return `${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

const server = http.createServer((req, res) => {
    // 允許跨網域存取
    res.setHeader('Access-Control-Allow-Origin', '*');

    // 處理綠界收款 API
    if (req.url.startsWith('/get-atm')) {
        const amount = new URLSearchParams(req.url.split('?')[1]).get('amount') || '100';
        
        const params = {
            ChoosePayment: 'ATM', 
            EncryptType: '1', 
            ItemName: '方向盤款項',
            MerchantID: MerchantID, 
            MerchantTradeDate: getTradeDate(), 
            MerchantTradeNo: 'TT' + Date.now(), 
            PaymentType: 'aio',
            ReturnURL: 'https://www.google.com', 
            TotalAmount: parseInt(amount), 
            TradeDesc: 'ShopOrder'
        };

        // 計算 CheckMacValue
        let rawString = `HashKey=${HashKey}`;
        Object.keys(params).sort().forEach(key => { rawString += `&${key}=${params[key]}`; });
        rawString += `&HashIV=${HashIV}`;
        
        let encoded = encodeURIComponent(rawString)
            .toLowerCase()
            .replace(/%2d/g, '-')
            .replace(/%5f/g, '_')
            .replace(/%2e/g, '.')
            .replace(/%21/g, '!')
            .replace(/%2a/g, '*')
            .replace(/%28/g, '(')
            .replace(/%29/g, ')')
            .replace(/%20/g, '+');

        params.CheckMacValue = crypto.createHash('sha256').update(encoded).digest('hex').toUpperCase();

        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ status: "準備跳轉", params: params }));
    } else {
        res.writeHead(404);
        res.end();
    }
});

const port = process.env.PORT || 10000;
server.listen(port, '0.0.0.0', () => { console.log(`✅ 輕量級收款後端啟動，監聽 Port: ${port}`); });
