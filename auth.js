// ============================================================
// auth.js - سیستم احراز هویت کامل با بازیابی رمز
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
// ====== ثبت‌نام با شماره تلفن ======
// ============================================================

async function registerUser(username, password, phone) {
    try {
        if (!username || username.length < 3) {
            return { success: false, message: '⚠️ نام کاربری حداقل ۳ کاراکتر باشد!' };
        }
        
        if (!password || password.length < 4) {
            return { success: false, message: '⚠️ رمز عبور حداقل ۴ کاراکتر باشد!' };
        }
        
        if (!phone || !/^09[0-9]{9}$/.test(phone)) {
            return { success: false, message: '⚠️ شماره تلفن معتبر نیست! (مثال: 09123456789)' };
        }
        
        const users = await getUsers();
        
        if (users[username]) {
            return { success: false, message: '⚠️ این نام کاربری قبلاً ثبت شده است!' };
        }
        
        // بررسی شماره تلفن تکراری
        for (const [key, value] of Object.entries(users)) {
            if (value.phone === phone) {
                return { success: false, message: '⚠️ این شماره تلفن قبلاً ثبت شده است!' };
            }
        }
        
        const hashedPassword = simpleHash(password);
        
        users[username] = {
            password: hashedPassword,
            phone: phone,
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
            phone: phone,
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

// ============================================================
// ====== ورود ======
// ============================================================

async function loginUser(username, password) {
    try {
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
            phone: users[username].phone || '',
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

// ============================================================
// ====== تغییر رمز ======
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

// ============================================================
// ====== تغییر نام کاربری ======
// ============================================================

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
        phone: user.phone || '',
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
                    <a href="forgot-password.html" class="menu-item">
                        <span class="icon">🔑</span>
                        بازیابی رمز
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
    requestPasswordReset,
    verifyResetCode,
    resetPassword
};
