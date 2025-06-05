import * as nodemailer from 'nodemailer';

export class EmailNotifier {
  private readonly transporter: nodemailer.Transporter;
  private readonly fromEmail: string;
  private readonly toEmail: string;

  constructor(config: {
    smtpServer: string;
    port: number;
    username: string;
    password: string;
    fromEmail: string;
    toEmail: string;
  }) {
    this.fromEmail = config.fromEmail;
    this.toEmail = config.toEmail;

    // SMTPトランスポーターを作成
    this.transporter = nodemailer.createTransport({
      host: config.smtpServer,
      port: config.port,
      secure: config.port === 465, // port 465の場合はtrue
      auth: {
        user: config.username,
        pass: config.password,
      },
    });
  }

  /**
   * メール通知を送信する
   * @param subject メールの件名
   * @param message メールの本文
   * @returns 送信が成功したかどうか
   */
  async sendNotification(subject: string, message: string): Promise<boolean> {
    try {
      // 現在の日時をフォーマット
      const dateStr = new Date().toLocaleString('ja-JP');
      
      // メールオプションを設定
      const mailOptions = {
        from: this.fromEmail,
        to: this.toEmail,
        subject: `[国税庁更新] ${subject} (${dateStr})`,
        text: `${message}\n\n---\nこのメールは自動通知システムにより送信されました。`,
      };

      // メールを送信
      const info = await this.transporter.sendMail(mailOptions);
      console.log('メール通知を送信しました:', info.messageId);
      return true;
    } catch (error) {
      console.error('メール送信エラー:', error);
      return false;
    }
  }
}