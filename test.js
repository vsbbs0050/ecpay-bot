const http = require('http');
const crypto = require('crypto');

// --- 設定區 ---
const MerchantID = process.env.MY_MERCHANT_ID;
const HashKey = process.env.MY_HASH_KEY;
const HashIV = process.env.MY_HASH_IV;

// 格式化時間函數 (嚴格遵守 YYYY/MM/DD HH:mm:ss)
function getTradeDate() {
    const now = new Date();
    // 強制轉為台灣時間 UTC+8
    const taipeiTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    
    const y = taipeiTime.getUTCFullYear();
    const m = (taipeiTime.getUTCMonth() + 1).toString().padStart(2, '0');
    const d = taipeiTime.getUTCDate().toString().padStart(2, '0');
    const hh = taipeiTime.getUTCHours().toString().padStart(2, '0');
    const mm = taipeiTime.getUTCMinutes().toString().padStart(2, '0');
    const ss = taipeiTime.getUTCSeconds().toString().padStart(2, '0');
    
    // 嚴格拼接成 YYYY/MM/DD HH:mm:ss
    return `${y}/${m}/${d} ${hh}:${mm}:${ss}`;
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
