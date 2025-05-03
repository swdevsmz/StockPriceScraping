document.addEventListener('DOMContentLoaded', () => {
    const contactForm = document.getElementById('contact-form');
    
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = new FormData(contactForm);
        const data = Object.fromEntries(formData.entries());
        
        try {
            // ここに実際のフォーム送信処理を実装
            console.log('フォームデータ:', data);
            alert('お問い合わせありがとうございます。\n担当者より折り返しご連絡させていただきます。');
            contactForm.reset();
        } catch (error) {
            console.error('エラーが発生しました:', error);
            alert('申し訳ありません。エラーが発生しました。\nしばらく経ってから再度お試しください。');
        }
    });

    // スムーズスクロール
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
}); 