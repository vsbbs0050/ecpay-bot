const http = require('http');
const crypto = require('crypto');
const line = require('@line/bot-sdk');

// --- 你的綠界與 LINE 設定 ---
const MerchantID = '3504191';
const HashKey = 'iXuAcQDXeoeXgW00';
const HashIV = 'oNxKnJgKY1E435LS';

const config = {
    channelAccessToken: 'RXPli5RxJTUq1BbRFIP1VVRGn1vhXPvQTcBRDXtzAVCzkanwsnXo5ybO9HzIdkzcZ2WPd4XAl18azCTkhYOaDY+V4TGeLyZzWGWR3X9vd0gOvh7uD/pKgfVSUhRSDG3Jnmw99A7kYNHusVp3GskwVwdB04t89/1O/w1cDnyilFU=', // 記得換成你的
    channelSecret: 'cd186bd82322898ccae679a591ca2408'             // 記得換成你的
};
const client = new line.Client(config);

const server = http.createServer(async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');

    // 1. 處理綠界收款 API
    if (req.url.startsWith('/get-atm')) {
        const amount = new URLSearchParams(req.url.split('?')[1]).get('amount') || '100';
        const params = {
            ChoosePayment: 'ATM', EncryptType: '1', ItemName: 'LeatherItem',
            MerchantID: MerchantID, MerchantTradeDate: '2026/06/17 01:20:00',
            MerchantTradeNo: 'Test' + new Date().getTime(), PaymentType: 'aio',
            ReturnURL: 'https://www.google.com', TotalAmount: parseInt(amount), TradeDesc: 'ShopOrder'
        };

        let rawString = `HashKey=${HashKey}`;
        Object.keys(params).sort().forEach(key => { rawString += `&${key}=${params[key]}`; });
        rawString += `&HashIV=${HashIV}`;
        let encoded = encodeURIComponent(rawString).toLowerCase().replace(/%2d/g, '-').replace(/%5f/g, '_').replace(/%2e/g, '.').replace(/%21/g, '!').replace(/%2a/g, '*').replace(/%28/g, '(').replace(/%29/g, ')').replace(/%20/g, '+');
        params.CheckMacValue = crypto.createHash('sha256').update(encoded).digest('hex').toUpperCase();

        res.writeHead(200, {'Content-Type': 'application/json'});
        res.end(JSON.stringify({ status: "準備跳轉", params: params }));
    } 
    // 2. 處理 LINE Bot Webhook
    else if (req.url === '/webhook' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk);
        req.on('end', async () => {
            const events = JSON.parse(body).events;
            await Promise.all(events.map(async (event) => {
                if (event.type === 'message' && event.message.text === '收款') {
                    await client.replyMessage(event.replyToken, {
                        type: 'text',
                        text: '請點擊下方連結進行 ATM 付款：https://vsbbs0050.github.io/ecpay-bot/'
                    });
                }
            }));
            res.end('OK');
        });
    }
});

const port = process.env.PORT || 10000;
server.listen(port, '0.0.0.0', () => { console.log(`✅ 伺服器啟動，監聽 Port: ${port}`); });
