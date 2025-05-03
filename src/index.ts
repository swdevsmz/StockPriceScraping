import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const TARGET_URL = 'https://www.nta.go.jp/law/tsutatsu/kobetsu/hyoka/zaisan.htm';
const DATA_FILE = path.join(__dirname, '../data/last_content.txt');
const LINE_API_URL = 'https://api.line.me/v2/bot/message/broadcast';

async function scrapeTable() {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
        await page.goto(TARGET_URL);
        const tableContent = await page.evaluate(() => {
            const table = document.querySelector('table');
            return table ? table.textContent : '';
        });
        
        if (!tableContent) {
            throw new Error('テーブルが見つかりませんでした');
        }
        
        return tableContent.trim();
    } finally {
        await browser.close();
    }
}

async function sendLineNotification(diff: string) {
    if (!process.env.LINE_ACCESS_TOKEN) {
        throw new Error('LINE_ACCESS_TOKENが設定されていません');
    }

    const message = {
        messages: [{
            type: 'text',
            text: `国税庁の財産評価基準書に更新がありました\n\n${diff}\n\n詳細はこちら：\n${TARGET_URL}`
        }]
    };

    try {
        await axios.post(LINE_API_URL, message, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${process.env.LINE_ACCESS_TOKEN}`
            }
        });
        console.log('LINE通知を送信しました');
    } catch (error) {
        console.error('LINE通知の送信に失敗しました:', error);
        throw error;
    }
}

async function main() {
    try {
        // データディレクトリの作成
        const dataDir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        // 現在の内容を取得
        const currentContent = await scrapeTable();
        
        // 前回の内容を読み込み
        let lastContent = '';
        if (fs.existsSync(DATA_FILE)) {
            lastContent = fs.readFileSync(DATA_FILE, 'utf-8');
        }

        // 内容が異なる場合
        if (currentContent !== lastContent) {
            // 新しい内容を保存
            fs.writeFileSync(DATA_FILE, currentContent);
            
            // 差分がある場合はLINE通知
            if (lastContent) {
                const diff = `前回の内容：\n${lastContent}\n\n現在の内容：\n${currentContent}`;
                console.log('差分があります。LINE通知を送信します。');
                await sendLineNotification(diff);
            }
        }
    } catch (error) {
        console.error('エラーが発生しました:', error);
        process.exit(1);
    }
}

main(); 