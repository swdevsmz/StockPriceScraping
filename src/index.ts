import { chromium } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const TARGET_URL = 'https://www.nta.go.jp/law/tsutatsu/kobetsu/hyoka/zaisan.htm';
const DATA_FILE = path.join(__dirname, '../data/last_content.txt');
const LINE_API_URL = 'https://api.line.me/v2/bot/message/broadcast';
const MAX_MESSAGE_LENGTH = 4000; // 余裕を持って4000文字に制限

async function scrapeTable() {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
        await page.goto(TARGET_URL);
        const content = await page.evaluate(() => {
            const table = document.querySelector('table');
            if (!table) {
                console.log('テーブルが見つかりません');
                return '';
            }

            console.log('テーブルのHTML:', table.outerHTML);
            
            // テーブルの行を取得
            const rows = Array.from(table.querySelectorAll('tr'));
            console.log('行数:', rows.length);
            
            // すべての行の内容を取得
            const result = rows.map(row => row.textContent?.trim() || '');
            return result.join('\n');
        });
        
        if (!content) {
            throw new Error('テーブルの内容を取得できませんでした');
        }
        
        return content.trim();
    } finally {
        await browser.close();
    }
}

function splitMessage(text: string): string[] {
    const messages: string[] = [];
    let currentMessage = '';
    
    // テキストを行ごとに分割
    const lines = text.split('\n');
    
    for (const line of lines) {
        // 現在のメッセージに新しい行を追加した場合の長さを計算
        const newLength = currentMessage.length + line.length + 1; // +1 for newline
        
        if (newLength > MAX_MESSAGE_LENGTH) {
            // 現在のメッセージが制限を超える場合は、新しいメッセージを開始
            if (currentMessage) {
                messages.push(currentMessage);
            }
            currentMessage = line;
        } else {
            // 現在のメッセージに追加
            if (currentMessage) {
                currentMessage += '\n';
            }
            currentMessage += line;
        }
    }
    
    // 最後のメッセージを追加
    if (currentMessage) {
        messages.push(currentMessage);
    }
    
    return messages;
}

async function sendLineNotification(diff: string) {
    if (!process.env.LINE_ACCESS_TOKEN) {
        throw new Error('LINE_ACCESS_TOKENが設定されていません');
    }

    // メッセージを分割
    const messageTexts = splitMessage(`国税庁の財産評価基準書に更新がありました\n\n${diff}\n\n詳細はこちら：\n${TARGET_URL}`);
    
    try {
        for (const text of messageTexts) {
            const message = {
                messages: [
                    {
                        type: 'text',
                        text: text
                    }
                ]
            };

            console.log('送信するメッセージ:', JSON.stringify(message, null, 2));
            console.log('メッセージの長さ:', text.length);
            
            const response = await axios.post(LINE_API_URL, message, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.LINE_ACCESS_TOKEN}`
                }
            });
            
            console.log('LINE通知を送信しました:', response.status);
        }
    } catch (error) {
        if (axios.isAxiosError(error) && error.response) {
            console.error('LINE通知の送信に失敗しました:', {
                status: error.response.status,
                data: error.response.data,
                headers: error.response.headers
            });
            
            if (error.response.status === 400) {
                console.error('リクエストの形式が正しくありません');
            } else if (error.response.status === 401) {
                console.error('認証に失敗しました。トークンを確認してください');
            } else if (error.response.status === 403) {
                console.error('権限がありません。ブロードキャスト機能が有効になっているか確認してください');
            }
        } else {
            console.error('LINE通知の送信に失敗しました:', error);
        }
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
                const diff = `国税庁の財産評価基準書に更新がありました\n\n前回の内容：\n${lastContent}\n\n現在の内容：\n${currentContent}`;
                console.log('更新があります。LINE通知を送信します。');
                await sendLineNotification(diff);
            }
        } else {
            console.log('変更はありませんでした。');
        }
    } catch (error) {
        console.error('エラーが発生しました:', error);
        process.exit(1);
    }
}

main(); 