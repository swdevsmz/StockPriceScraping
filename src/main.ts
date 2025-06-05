import { chromium } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { EmailNotifier } from './email-notifier';

dotenv.config();

const TARGET_URL = 'https://www.nta.go.jp/law/tsutatsu/kobetsu/hyoka/zaisan.htm';
const DATA_FILE = path.join(__dirname, '../data/last_content.txt');

// メール通知用のクライアントを作成
const emailNotifier = new EmailNotifier({
  smtpServer: process.env.EMAIL_SMTP_SERVER ?? 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT ?? '587'),
  username: process.env.EMAIL_USERNAME ?? '',
  password: process.env.EMAIL_PASSWORD ?? '',
  fromEmail: process.env.EMAIL_FROM ?? '',
  toEmail: process.env.EMAIL_TO ?? ''
});


/**
 * 国税庁の財産評価基準書のテーブルをスクレイピングする関数
 * 
 * @returns テーブルの内容
 */
async function scrapeTable() {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    try {
        await page.goto(TARGET_URL);
        
        // 指定されたセレクターを使用してテーブルを取得
        const content = await page.evaluate(() => {
            const table = document.querySelector('table.table-bordered.tbl_kohyo3');
            if (!table) {
                console.log('指定されたセレクターのテーブルが見つかりません');
                return '';
            }

            console.log('テーブルのHTML:', table.outerHTML);
            
            // テーブルの行を取得
            const rows = Array.from(table.querySelectorAll('tr'));
            console.log('行数:', rows.length);
            
            // すべての行の内容を取得
            const result = rows.map(row => {
                const cells = Array.from(row.querySelectorAll('td, th')); // セルを取得
                return cells.map(cell => cell.textContent?.trim() ?? '').join('\t'); // セルの内容をタブ区切りで結合
            });
            return result; // 行の配列を返す
        });
        
        if (!content) {
            throw new Error('テーブルの内容を取得できませんでした');
        }
        
        // OSに適した改行コードで結合
        const normalizedContent = content.join(os.EOL);
        
        return normalizedContent.trim();
    } finally {
        await browser.close();
    }
}

/**
 * メール通知を送信する関数
 * 
 * @param diff 差分の内容
 * @returns 送信が成功したかどうか
 */
async function sendEmailNotification(diff: string) : Promise<boolean> {
    const subject = '国税庁の財産評価基準書に更新がありました';
    const message = `${diff}\n\n詳細はこちら：\n${TARGET_URL}`;
    
    try {
        const success = await emailNotifier.sendNotification(subject, message);
        if (success) {
            console.log('メール通知を送信しました');
        } else {
            console.error('メール通知の送信に失敗しました');
        }
        return success;
    } catch (error) {
        console.error('メール通知の送信中にエラーが発生しました:', error);
        return false;
    }
}

/**
 * 2つのテキストの差分を取得する関数
 * 
 * @param oldContent 前回の内容
 * @param newContent 新しい内容
 * @returns 差分の内容
 */
function getDiff(oldContent: string, newContent: string): string {
    const oldLines = oldContent.split('\n');
    const newLines = newContent.split('\n');
    const diffLines: string[] = [];
    
    // 行ごとに比較
    for (let i = 0; i < Math.max(oldLines.length, newLines.length); i++) {
        const oldLine = oldLines[i] || '';
        const newLine = newLines[i] || '';
        
        if (oldLine !== newLine) {
            diffLines.push(`行 ${i + 1}:`);
            if (oldLine) diffLines.push(`- ${oldLine}`);
            if (newLine) diffLines.push(`+ ${newLine}`);
            diffLines.push(''); // 空行を追加して見やすくする
        }
    }
    
    return diffLines.join('\n');
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
            
            // 差分がある場合はメール通知（LINE通知から変更）
            if (lastContent) {
                const diff = getDiff(lastContent, currentContent);
                console.log('更新があります。メール通知を送信します。');
                await sendEmailNotification(diff);
                
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