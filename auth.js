// ============================================================
// auth.js - اضافه شدن سیستم کد امنیتی تصویری
// ============================================================

// ====== تولید کد امنیتی تصویری ======

function generateCaptcha() {
    // تولید عدد تصادفی ۴ تا ۶ رقمی
    const num1 = Math.floor(Math.random() * 10);
    const num2 = Math.floor(Math.random() * 10);
    const num3 = Math.floor(Math.random() * 10);
    const num4 = Math.floor(Math.random() * 10);
    const num5 = Math.floor(Math.random() * 10);
    
    // ترکیب به صورت رشته
    let code = num1.toString() + num2.toString() + num3.toString() + num4.toString() + num5.toString();
    
    // گاهی ۴ رقمی، گاهی ۵ رقمی، گاهی ۶ رقمی
    if (Math.random() > 0.5) {
        code = code + Math.floor(Math.random() * 10).toString();
    }
    if (Math.random() > 0.7) {
        code = code.substring(0, code.length - 1);
    }
    
    return code;
}

function drawCaptcha(code) {
    const canvas = document.getElementById('captchaCanvas');
    if (!canvas) return null;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width || 180;
    const height = canvas.height || 60;
    
    canvas.width = width;
    canvas.height = height;
    
    // ====== پس‌زمینه ======
    // گرادیانت پس‌زمینه
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0a0c14');
    gradient.addColorStop(0.5, '#1a1c2e');
    gradient.addColorStop(1, '#0a0c14');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // ====== خطوط اعوجاج ======
    for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * width, Math.random() * height);
        ctx.lineTo(Math.random() * width, Math.random() * height);
        ctx.strokeStyle = `hsla(${Math.random() * 360}, 70%, 50%, 0.15)`;
        ctx.lineWidth = 1.5 + Math.random() * 2;
        ctx.stroke();
    }
    
    // ====== نقطه‌های نویز ======
    for (let i = 0; i < 60; i++) {
        ctx.fillStyle = `hsla(${Math.random() * 360}, 60%, 60%, ${0.1 + Math.random() * 0.2})`;
        ctx.beginPath();
        ctx.arc(Math.random() * width, Math.random() * height, 1 + Math.random() * 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // ====== نوشتن کد ======
    const chars = code.split('');
    const totalWidth = chars.length * 30;
    const startX = (width - totalWidth) / 2 + 10;
    
    chars.forEach((char, index) => {
        const x = startX + index * 30 + Math.random() * 8;
        const y = 25 + Math.random() * 25;
        const rotation = (Math.random() - 0.5) * 0.6;
        const fontSize = 26 + Math.random() * 10;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        
        // ====== رنگ‌های متنوع برای هر کاراکتر ======
        const hue = (index * 60 + Math.random() * 40) % 360;
        ctx.fillStyle = `hsl(${hue}, 80%, 55%)`;
        ctx.shadowColor = `hsla(${hue}, 80%, 55%, 0.3)`;
        ctx.shadowBlur = 8;
        
        ctx.font = `bold ${fontSize}px Arial, 'Vazirmatn', Tahoma`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(char, 0, 0);
        
        // ====== خط زیر هر کاراکتر ======
        ctx.shadowBlur = 0;
        ctx.strokeStyle = `hsla(${hue}, 60%, 50%, 0.2)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-12, 8 + Math.random() * 4);
        ctx.lineTo(12, 8 + Math.random() * 4);
        ctx.stroke();
        
        ctx.restore();
    });
    
    // ====== خطوط اضافی روی متن ======
    for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        const startX2 = Math.random() * width;
        const startY2 = Math.random() * height;
        ctx.moveTo(startX2, startY2);
        ctx.lineTo(startX2 + Math.random() * 60 - 30, startY2 + Math.random() * 40 - 20);
        ctx.strokeStyle = `hsla(${Math.random() * 360}, 50%, 50%, 0.1)`;
        ctx.lineWidth = 1 + Math.random() * 2;
        ctx.stroke();
    }
    
    // ====== حاشیه ======
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(124,92,255,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(2, 2, width - 4, height - 4);
    
    return canvas;
}

function refreshCaptcha() {
    const code = generateCaptcha();
    const canvas = drawCaptcha(code);
    
    // ذخیره کد در متغیر سراسری
    window.currentCaptcha = code;
    console.log('🔐 کد امنیتی:', code);
    
    return code;
}

// ============================================================
// ====== تغییر در توابع ثبت‌نام و ورود ======
// ============================================================

async function registerUser(username, password, captcha) {
    try {
        // ====== بررسی کد امنیتی ======
        if (!captcha || captcha !== window.currentCaptcha) {
            return { success: false, message: '⚠️ کد امنیتی اشتباه است!', refresh: true };
        }
        
        if (!username || username.length < 3) {
            return { success: false, message: '⚠️ نام کاربری حداقل ۳ کاراکتر باشد!' };
        }
        
        if (!password || password.length < 4) {
            return { success: false, message: '⚠️ رمز عبور حداقل ۴ کاراکتر باشد!' };
        }
        
        const users = await getUsers();
        
        if (users[username]) {
            return { success: false, message: '⚠️ این نام کاربری قبلاً ثبت شده است!' };
        }
        
        const hashedPassword = simpleHash(password);
        
        users[username] = {
            password: hashedPassword,
            created: new Date().toLocaleString('fa-IR'),
            likedVideos: [],
            likedMods: [],
            watchedVideos: [],
            downloadedVideos: [],
            profileImage: ''
        };
        
        const saved = await saveUsers(users);
        if (!saved) {
            return { success: false, message: '❌ خطا در ثبت‌نام! دوباره تلاش کن.' };
        }
        
        setCurrentUser({
            username: username,
            created: users[username].created,
            likedVideos: [],
            likedMods: [],
            watchedVideos: [],
            downloadedVideos: [],
            profileImage: ''
        });
        
        return { success: true, message: '✅ ثبت‌نام موفق! خوش اومدی 🎮' };
    } catch (error) {
        console.error('Register error:', error);
        return { success: false, message: '❌ خطا در ارتباط با سرور!' };
    }
}

async function loginUser(username, password, captcha) {
    try {
        // ====== بررسی کد امنیتی ======
        if (!captcha || captcha !== window.currentCaptcha) {
            return { success: false, message: '⚠️ کد امنیتی اشتباه است!', refresh: true };
        }
        
        if (!username || !password) {
            return { success: false, message: '⚠️ لطفاً همه فیلدها را پر کنید!' };
        }
        
        const users = await getUsers();
        
        if (!users[username]) {
            return { success: false, message: '❌ نام کاربری یا رمز عبور اشتباه است!' };
        }
        
        const hashedInput = simpleHash(password);
        
        if (users[username].password !== hashedInput) {
            return { success: false, message: '❌ نام کاربری یا رمز عبور اشتباه است!' };
        }
        
        setCurrentUser({
            username: username,
            created: users[username].created,
            likedVideos: users[username].likedVideos || [],
            likedMods: users[username].likedMods || [],
            watchedVideos: users[username].watchedVideos || [],
            downloadedVideos: users[username].downloadedVideos || [],
            profileImage: users[username].profileImage || ''
        });
        
        return { success: true, message: '✅ ورود موفق! خوش اومدی 🎮' };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, message: '❌ خطا در ارتباط با سرور!' };
    }
}

// ====== صادر کردن ======
window.GameFaceAuth = {
    // ... توابع قبلی ...
    registerUser,
    loginUser,
    refreshCaptcha,
    generateCaptcha,
    drawCaptcha
};
