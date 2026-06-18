// ============================================================
// auth.js - سیستم احراز هویت کامل با کد امنیتی
// ============================================================

const JSONBIN_API_KEY = '$2a$10$xuP.N/WOhZAUMRqw3JT4LepOUGFnjnIe5YmSVmy9vl0aIbGntjhwu';
const JSONBIN_BIN_ID = '6a326295da38895dfecefc50';

let currentUser = null;
const loginAttempts = {};
const resetCodes = {};

// ============================================================
// ====== تابع هش کردن ======
// ============================================================

function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(8, '0') + 
           (hash >>> 0).toString(16).padStart(8, '0');
}

// ============================================================
// ====== توابع دیتابیس ======
// ============================================================

async function getUsers() {
    try {
        console.log('🔄 دریافت اطلاعات از JSONBin...');
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
            headers: { 'X-Master-Key': JSONBIN_API_KEY }
        });
        if (!response.ok) {
            console.error('❌ وضعیت:', response.status);
            return {};
        }
        const data = await response.json();
        console.log('✅ دریافت شد');
        return data.record.users || {};
    } catch (error) {
        console.error('❌ خطا:', error);
        return {};
    }
}

async function saveUsers(users) {
    try {
        console.log('🔄 ذخیره در JSONBin...');
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify({ users: users })
        });
        if (!response.ok) {
            console.error('❌ وضعیت:', response.status);
            return false;
        }
        console.log('✅ ذخیره شد');
        return true;
    } catch (error) {
        console.error('❌ خطا:', error);
        return false;
    }
}

// ============================================================
// ====== توابع کاربر ======
// ============================================================

function getCurrentUser() {
    const userData = localStorage.getItem('gameface_user_data');
    if (userData) {
        try {
            currentUser = JSON.parse(userData);
            return currentUser;
        } catch {
            return null;
        }
    }
    return null;
}

function setCurrentUser(userData) {
    currentUser = userData;
    localStorage.setItem('gameface_user_data', JSON.stringify(userData));
}

function logoutUser() {
    currentUser = null;
    localStorage.removeItem('gameface_user_data');
    window.location.href = 'index.html';
}

function isLoggedIn() {
    return getCurrentUser() !== null;
}

// ============================================================
// ====== ✅ کد امنیتی تصویری ======
// ============================================================

function generateCaptcha() {
    const num1 = Math.floor(Math.random() * 9) + 1;
    const num2 = Math.floor(Math.random() * 10);
    const num3 = Math.floor(Math.random() * 10);
    const num4 = Math.floor(Math.random() * 10);
    const num5 = Math.floor(Math.random() * 10);
    const num6 = Math.floor(Math.random() * 10);
    
    let code = num1.toString() + num2.toString() + num3.toString() + num4.toString();
    
    if (Math.random() > 0.5) {
        code = code + num5.toString();
    }
    if (Math.random() > 0.7) {
        code = code + num6.toString();
    }
    
    return code;
}

function drawCaptchaOnCanvas(canvas, code) {
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = 200;
    const height = 60;
    
    canvas.width = width;
    canvas.height = height;
    
    // پس‌زمینه روشن
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#e8ecf1');
    gradient.addColorStop(0.5, '#f5f7fa');
    gradient.addColorStop(1, '#dce1e8');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // خطوط نویز
    for (let i = 0; i < 12; i++) {
        ctx.beginPath();
        ctx.moveTo(Math.random() * width, Math.random() * height);
        ctx.lineTo(Math.random() * width, Math.random() * height);
        ctx.strokeStyle = `rgba(80, 80, 120, ${0.08 + Math.random() * 0.12})`;
        ctx.lineWidth = 0.5 + Math.random() * 1.5;
        ctx.stroke();
    }
    
    // نقطه‌های نویز
    for (let i = 0; i < 100; i++) {
        ctx.fillStyle = `rgba(40, 40, 80, ${0.05 + Math.random() * 0.15})`;
        ctx.beginPath();
        ctx.arc(Math.random() * width, Math.random() * height, 0.5 + Math.random() * 1.5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // نوشتن اعداد
    const chars = code.split('');
    const totalWidth = chars.length * 34;
    const startX = (width - totalWidth) / 2 + 10;
    
    const colors = ['#1a1a2e', '#16213e', '#0f3460', '#2d1b69', '#4a1a6b', '#1b263b', '#3a0ca3', '#4361ee'];
    
    chars.forEach((char, index) => {
        const x = startX + index * 34 + Math.random() * 6;
        const y = 26 + Math.random() * 22;
        const rotation = (Math.random() - 0.5) * 0.5;
        const fontSize = 26 + Math.random() * 12;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        
        const color = colors[index % colors.length];
        ctx.fillStyle = color;
        ctx.shadowColor = 'rgba(0,0,0,0.08)';
        ctx.shadowBlur = 4;
        
        ctx.font = `bold ${fontSize}px Arial, 'Vazirmatn', Tahoma, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(char, 0, 0);
        
        ctx.shadowBlur = 0;
        ctx.strokeStyle = `rgba(40, 40, 80, 0.1)`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(-12, 8 + Math.random() * 4);
        ctx.lineTo(12, 8 + Math.random() * 4);
        ctx.stroke();
        
        ctx.restore();
    });
    
    // خطوط اعوجاج
    for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        const startX2 = 5 + Math.random() * (width - 10);
        const startY2 = 5 + Math.random() * (height - 10);
        ctx.moveTo(startX2, startY2);
        ctx.quadraticCurveTo(
            startX2 + Math.random() * 60 - 30,
            startY2 + Math.random() * 30 - 15,
            startX2 + Math.random() * 60 - 30,
            startY2 + Math.random() * 30 - 15
        );
        ctx.strokeStyle = `rgba(40, 40, 80, 0.06)`;
        ctx.lineWidth = 0.8 + Math.random() * 1.2;
        ctx.stroke();
    }
    
    // حاشیه
    ctx.strokeStyle = 'rgba(124,92,255,0.15)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(2, 2, width - 4, height - 4);
}

function refreshCaptcha() {
    const code = generateCaptcha();
    const canvas = document.getElementById('captchaCanvas');
    if (canvas) {
        drawCaptchaOnCanvas(canvas, code);
    }
    window.currentCaptcha = code;
    console.log('🔐 کد امنیتی ورود:', code);
    return code;
}

function refreshCaptcha2() {
    const code = generateCaptcha();
    const canvas = document.getElementById('captchaCanvas2');
    if (canvas) {
        drawCaptchaOnCanvas(canvas, code);
    }
    window.currentCaptcha2 = code;
    console.log('🔐 کد امنیتی ثبت‌نام:', code);
    return code;
}

// ============================================================
// ====== ✅ ثبت‌نام با بررسی کد امنیتی ======
// ============================================================

async function registerUser(username, password, captcha) {
    try {
        console.log('📝 ثبت‌نام جدید...');
        console.log('🔐 کد وارد شده:', captcha);
        console.log('🔐 کد صحیح:', window.currentCaptcha2);
        
        // ====== بررسی کد امنیتی ======
        if (!captcha || captcha !== window.currentCaptcha2) {
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
            return { success: false, message: '❌ خطا در ذخیره اطلاعات!' };
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
        
        window.currentCaptcha2 = null;
        
        return { success: true, message: '✅ ثبت‌نام موفق! خوش اومدی 🎮' };
    } catch (error) {
        console.error('❌ Register error:', error);
        return { success: false, message: '❌ خطا در ارتباط با سرور!', refresh: true };
    }
}

// ============================================================
// ====== ✅ ورود با بررسی کد امنیتی ======
// ============================================================

async function loginUser(username, password, captcha) {
    try {
        console.log('🔑 ورود کاربر...');
        console.log('🔐 کد وارد شده:', captcha);
        console.log('🔐 کد صحیح:', window.currentCaptcha);
        
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
        
        window.currentCaptcha = null;
        
        return { success: true, message: '✅ ورود موفق! خوش اومدی 🎮' };
    } catch (error) {
        console.error('❌ Login error:', error);
        return { success: false, message: '❌ خطا در ارتباط با سرور!', refresh: true };
    }
}

// ============================================================
// ====== بقیه توابع ======
// ============================================================

async function changePassword(oldPassword, newPassword) {
    try {
        const user = getCurrentUser();
        if (!user) {
            return { success: false, message: '❌ ابتدا وارد حساب خود شوید!' };
        }
        
        if (!newPassword || newPassword.length < 4) {
            return { success: false, message: '⚠️ رمز جدید حداقل ۴ کاراکتر باشد!' };
        }
        
        const users = await getUsers();
        
        const hashedOld = simpleHash(oldPassword);
        if (users[user.username].password !== hashedOld) {
            return { success: false, message: '❌ رمز عبور فعلی اشتباه است!' };
        }
        
        const hashedNew = simpleHash(newPassword);
        users[user.username].password = hashedNew;
        
        const saved = await saveUsers(users);
        if (!saved) {
            return { success: false, message: 'خطا در تغییر رمز!' };
        }
        
        return { success: true, message: '✅ رمز عبور با موفقیت تغییر کرد!' };
    } catch (error) {
        console.error('Change password error:', error);
        return { success: false, message: '❌ خطا در ارتباط با سرور!' };
    }
}

async function changeUsername(newUsername) {
    try {
        const user = getCurrentUser();
        if (!user) {
            return { success: false, message: '❌ ابتدا وارد حساب خود شوید!' };
        }
        
        if (!newUsername || newUsername.length < 3) {
            return { success: false, message: '⚠️ نام کاربری حداقل ۳ کاراکتر باشد!' };
        }
        
        const safeUser = newUsername.replace(/[^a-zA-Z0-9_\u0600-\u06FF]/g, '');
        if (safeUser !== newUsername) {
            return { success: false, message: '⚠️ نام کاربری فقط شامل حروف و اعداد باشد!' };
        }
        
        const users = await getUsers();
        
        if (users[newUsername] && newUsername !== user.username) {
            return { success: false, message: '⚠️ این نام کاربری قبلاً ثبت شده است!' };
        }
        
        const userData = users[user.username];
        delete users[user.username];
        users[newUsername] = userData;
        
        const saved = await saveUsers(users);
        if (!saved) {
            return { success: false, message: 'خطا در تغییر نام!' };
        }
        
        user.username = newUsername;
        setCurrentUser(user);
        
        return { success: true, message: '✅ نام کاربری با موفقیت تغییر کرد!' };
    } catch (error) {
        console.error('Change username error:', error);
        return { success: false, message: '❌ خطا در ارتباط با سرور!' };
    }
}

// ============================================================
// ====== تصویر پروفایل ======
// ============================================================

function compressImage(dataUrl, quality = 0.7, maxWidth = 300, maxHeight = 300) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = function() {
            let width = img.width;
            let height = img.height;
            
            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }
            if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
            }
            
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
            
            const compressed = canvas.toDataURL('image/jpeg', quality);
            resolve(compressed);
        };
        img.src = dataUrl;
    });
}

async function updateProfileImage(imageData) {
    try {
        const user = getCurrentUser();
        if (!user) {
            return { success: false, message: '❌ ابتدا وارد حساب خود شوید!' };
        }
        
        let finalImage = imageData;
        
        if (imageData && imageData.startsWith('data:image')) {
            try {
                finalImage = await compressImage(imageData, 0.7, 300, 300);
            } catch (compressError) {
                console.warn('Compression failed, using original:', compressError);
                finalImage = imageData;
            }
        }
        
        const users = await getUsers();
        users[user.username].profileImage = finalImage;
        
        const saved = await saveUsers(users);
        if (!saved) {
            return { success: false, message: 'خطا در ذخیره تصویر!' };
        }
        
        user.profileImage = finalImage;
        setCurrentUser(user);
        
        return { success: true, message: '✅ تصویر پروفایل با موفقیت تغییر کرد!' };
    } catch (error) {
        console.error('Update profile error:', error);
        return { success: false, message: '❌ خطا در ارتباط با سرور!' };
    }
}

// ============================================================
// ====== لایک و بازدید ======
// ============================================================

async function toggleLikeVideo(videoId) {
    const user = getCurrentUser();
    if (!user) {
        return { success: false, message: 'برای لایک کردن باید وارد حساب خود شوید!' };
    }
    
    try {
        const users = await getUsers();
        const userData = users[user.username];
        
        if (!userData.likedVideos) userData.likedVideos = [];
        
        const index = userData.likedVideos.indexOf(videoId);
        const isLiked = index !== -1;
        
        if (isLiked) {
            userData.likedVideos.splice(index, 1);
        } else {
            userData.likedVideos.push(videoId);
        }
        
        const saved = await saveUsers(users);
        if (!saved) {
            return { success: false, message: 'خطا در ذخیره!' };
        }
        
        user.likedVideos = userData.likedVideos;
        setCurrentUser(user);
        
        return { success: true, isLiked: !isLiked };
    } catch (error) {
        console.error('Like error:', error);
        return { success: false, message: 'خطا در ارتباط با سرور!' };
    }
}

async function toggleLikeMod(modId) {
    const user = getCurrentUser();
    if (!user) {
        return { success: false, message: 'برای لایک کردن باید وارد حساب خود شوید!' };
    }
    
    try {
        const users = await getUsers();
        const userData = users[user.username];
        
        if (!userData.likedMods) userData.likedMods = [];
        
        const index = userData.likedMods.indexOf(modId);
        const isLiked = index !== -1;
        
        if (isLiked) {
            userData.likedMods.splice(index, 1);
        } else {
            userData.likedMods.push(modId);
        }
        
        const saved = await saveUsers(users);
        if (!saved) {
            return { success: false, message: 'خطا در ذخیره!' };
        }
        
        user.likedMods = userData.likedMods;
        setCurrentUser(user);
        
        return { success: true, isLiked: !isLiked };
    } catch (error) {
        console.error('Like error:', error);
        return { success: false, message: 'خطا در ارتباط با سرور!' };
    }
}

async function watchVideo(videoId) {
    const user = getCurrentUser();
    if (!user) return;
    
    try {
        const users = await getUsers();
        const userData = users[user.username];
        
        if (!userData.watchedVideos) userData.watchedVideos = [];
        
        if (!userData.watchedVideos.includes(videoId)) {
            userData.watchedVideos.push(videoId);
            const saved = await saveUsers(users);
            if (saved) {
                user.watchedVideos = userData.watchedVideos;
                setCurrentUser(user);
            }
        }
    } catch (error) {
        console.error('Watch error:', error);
    }
}

async function downloadVideo(videoId, videoTitle) {
    const user = getCurrentUser();
    if (!user) {
        return { success: false, message: 'برای دانلود باید وارد حساب خود شوید!' };
    }
    
    try {
        const users = await getUsers();
        const userData = users[user.username];
        
        if (!userData.downloadedVideos) userData.downloadedVideos = [];
        
        if (!userData.downloadedVideos.includes(videoId)) {
            userData.downloadedVideos.push(videoId);
            const saved = await saveUsers(users);
            if (saved) {
                user.downloadedVideos = userData.downloadedVideos;
                setCurrentUser(user);
                return { success: true, message: '✅ دانلود ثبت شد!' };
            }
        } else {
            return { success: true, message: '📁 قبلاً دانلود کرده‌اید!' };
        }
        
        return { success: false, message: 'خطا در ثبت دانلود!' };
    } catch (error) {
        console.error('Download error:', error);
        return { success: false, message: 'خطا در ارتباط با سرور!' };
    }
}

// ============================================================
// ====== آمار کاربر ======
// ============================================================

function getUserStats() {
    const user = getCurrentUser();
    if (!user) return null;
    
    return {
        username: user.username,
        created: user.created,
        likedVideos: user.likedVideos || [],
        likedMods: user.likedMods || [],
        watchedVideos: user.watchedVideos || [],
        downloadedVideos: user.downloadedVideos || [],
        profileImage: user.profileImage || '',
        totalLikes: (user.likedVideos?.length || 0) + (user.likedMods?.length || 0),
        totalWatched: user.watchedVideos?.length || 0,
        totalDownloads: user.downloadedVideos?.length || 0
    };
}

// ============================================================
// ====== سیستم بازیابی رمز ======
// ============================================================

function generateResetCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

async function requestPasswordReset(phone) {
    try {
        const users = await getUsers();
        
        let foundUsername = null;
        for (const [username, data] of Object.entries(users)) {
            if (data.phone === phone) {
                foundUsername = username;
                break;
            }
        }
        
        if (!foundUsername) {
            return { success: false, message: '❌ این شماره تلفن در سیستم ثبت نشده است!' };
        }
        
        const code = generateResetCode();
        
        resetCodes[phone] = {
            code: code,
            username: foundUsername,
            expires: Date.now() + 5 * 60 * 1000
        };
        
        console.log(`📱 کد تایید برای ${phone}: ${code}`);
        
        return { 
            success: true, 
            message: '✅ کد تایید ارسال شد!',
            code: code
        };
    } catch (error) {
        console.error('Request reset error:', error);
        return { success: false, message: '❌ خطا در ارسال کد!' };
    }
}

async function verifyResetCode(phone, code) {
    try {
        const resetData = resetCodes[phone];
        
        if (!resetData) {
            return { success: false, message: '❌ کد منقضی شده یا وجود ندارد!' };
        }
        
        if (Date.now() > resetData.expires) {
            delete resetCodes[phone];
            return { success: false, message: '❌ کد منقضی شده است!' };
        }
        
        if (resetData.code !== code) {
            return { success: false, message: '❌ کد وارد شده اشتباه است!' };
        }
        
        return { 
            success: true, 
            message: '✅ کد تایید شد!',
            username: resetData.username
        };
    } catch (error) {
        console.error('Verify code error:', error);
        return { success: false, message: '❌ خطا در تایید کد!' };
    }
}

async function resetPassword(phone, code, newPassword) {
    try {
        const verifyResult = await verifyResetCode(phone, code);
        if (!verifyResult.success) {
            return verifyResult;
        }
        
        const username = verifyResult.username;
        
        if (!newPassword || newPassword.length < 4) {
            return { success: false, message: '⚠️ رمز جدید حداقل ۴ کاراکتر باشد!' };
        }
        
        const users = await getUsers();
        const hashedNew = simpleHash(newPassword);
        users[username].password = hashedNew;
        
        const saved = await saveUsers(users);
        if (!saved) {
            return { success: false, message: 'خطا در تغییر رمز!' };
        }
        
        delete resetCodes[phone];
        
        return { success: true, message: '✅ رمز عبور با موفقیت تغییر کرد!' };
    } catch (error) {
        console.error('Reset password error:', error);
        return { success: false, message: '❌ خطا در تغییر رمز!' };
    }
}

// ============================================================
// ====== هدر ======
// ============================================================

function updateAuthUI() {
    const authLinks = document.getElementById('authLinks');
    if (!authLinks) return;

    const user = getCurrentUser();

    if (user) {
        const avatar = user.profileImage || user.username.charAt(0).toUpperCase();
        const isImage = avatar.startsWith('data:') || avatar.startsWith('http');
        
        authLinks.innerHTML = `
            <div class="user-menu-wrapper">
                <button class="user-menu-toggle" onclick="toggleUserMenu()">
                    ${isImage ? 
                        `<img src="${avatar}" class="user-avatar-img" style="width:36px;height:36px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.1);">` :
                        `<span class="user-avatar" style="width:36px;height:36px;font-size:16px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:linear-gradient(135deg,#7c5cff,#00eaff);color:#fff;">${avatar}</span>`
                    }
                    <span style="color:#fff;font-weight:600;font-size:14px;">${user.username}</span>
                    <span style="font-size:12px;color:rgba(255,255,255,0.3);">▼</span>
                </button>
                <div class="user-menu-dropdown" id="userMenuDropdown">
                    <div class="menu-header">
                        <div class="menu-username">${user.username}</div>
                        <div class="menu-stats">❤️ ${user.likedVideos?.length || 0} لایک | ⬇️ ${user.downloadedVideos?.length || 0} دانلود</div>
                    </div>
                    <a href="profile.html" class="menu-item">
                        <span class="icon">👤</span>
                        حساب کاربری
                    </a>
                    <a href="profile.html" class="menu-item">
                        <span class="icon">🖼️</span>
                        تغییر پروفایل
                    </a>
                    <a href="profile.html" class="menu-item">
                        <span class="icon">✏️</span>
                        تغییر نام کاربری
                    </a>
                    <a href="profile.html" class="menu-item">
                        <span class="icon">🔒</span>
                        تغییر رمز عبور
                    </a>
                    <a href="profile.html" class="menu-item">
                        <span class="icon">❤️</span>
                        ویدیوهای لایک شده
                    </a>
                    <a href="profile.html" class="menu-item">
                        <span class="icon">👁️</span>
                        ویدیوهای دیده شده
                    </a>
                    <a href="profile.html" class="menu-item">
                        <span class="icon">⬇️</span>
                        ویدیوهای دانلود شده
                    </a>
                    <button class="menu-item danger" onclick="logoutUser()">
                        <span class="icon">🚪</span>
                        خروج از حساب
                    </button>
                </div>
            </div>
        `;
    } else {
        authLinks.innerHTML = `<a href="vrood.html" class="auth-link">🔐 ورود / ثبت‌نام</a>`;
    }
}

function toggleUserMenu() {
    const dropdown = document.getElementById('userMenuDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

document.addEventListener('click', function(e) {
    const wrapper = document.querySelector('.user-menu-wrapper');
    if (wrapper && !wrapper.contains(e.target)) {
        const dropdown = document.getElementById('userMenuDropdown');
        if (dropdown) {
            dropdown.classList.remove('active');
        }
    }
});

// ============================================================
// ====== اجرای اولیه ======
// ============================================================

document.addEventListener('DOMContentLoaded', function() {
    updateAuthUI();
    
    // تازه کردن کد امنیتی
    setTimeout(() => {
        if (document.getElementById('captchaCanvas')) {
            refreshCaptcha();
        }
        if (document.getElementById('captchaCanvas2')) {
            refreshCaptcha2();
        }
    }, 300);
});

// ============================================================
// ====== صادر کردن ======
// ============================================================

window.GameFaceAuth = {
    getUsers,
    saveUsers,
    getCurrentUser,
    setCurrentUser,
    isLoggedIn,
    logoutUser,
    registerUser,
    loginUser,
    changePassword,
    changeUsername,
    updateProfileImage,
    compressImage,
    toggleLikeVideo,
    toggleLikeMod,
    watchVideo,
    downloadVideo,
    getUserStats,
    updateAuthUI,
    refreshCaptcha,
    refreshCaptcha2,
    requestPasswordReset,
    verifyResetCode,
    resetPassword,
    generateCaptcha,
    drawCaptchaOnCanvas
};
