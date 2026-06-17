// ============================================================
// auth.js - سیستم احراز هویت کامل با پروفایل
// ============================================================

// ====== تنظیمات JSONBin ======
const JSONBIN_API_KEY = '$2a$10$xuP.N/WOhZAUMRqw3JT4LepOUGFnjnIe5YmSVmy9vl0aIbGntjhwu';
const JSONBIN_BIN_ID = '6a326295da38895dfecefc50';

// ====== کاربر فعلی ======
let currentUser = null;

// ====== گرفتن لیست کاربران ======
async function getUsers() {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
            headers: { 'X-Master-Key': JSONBIN_API_KEY }
        });
        if (!response.ok) throw new Error('خطا در دریافت اطلاعات');
        const data = await response.json();
        return data.record.users || {};
    } catch (error) {
        console.error('Error getting users:', error);
        return {};
    }
}

// ====== ذخیره کاربران ======
async function saveUsers(users) {
    try {
        const response = await fetch(`https://api.jsonbin.io/v3/b/${JSONBIN_BIN_ID}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            },
            body: JSON.stringify({ users: users })
        });
        if (!response.ok) throw new Error('خطا در ذخیره اطلاعات');
        return true;
    } catch (error) {
        console.error('Error saving users:', error);
        return false;
    }
}

// ====== دریافت اطلاعات کاربر فعلی ======
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

// ====== ذخیره اطلاعات کاربر فعلی ======
function setCurrentUser(userData) {
    currentUser = userData;
    localStorage.setItem('gameface_user_data', JSON.stringify(userData));
}

// ====== خروج از حساب ======
function logoutUser() {
    currentUser = null;
    localStorage.removeItem('gameface_user_data');
    window.location.href = 'index.html';
}

// ====== بررسی لاگین بودن ======
function isLoggedIn() {
    return getCurrentUser() !== null;
}

// ====== به‌روزرسانی هدر با اطلاعات کاربر ======
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

// ====== منوی کاربری ======
function toggleUserMenu() {
    const dropdown = document.getElementById('userMenuDropdown');
    if (dropdown) {
        dropdown.classList.toggle('active');
    }
}

// ====== بستن منو با کلیک خارج ======
document.addEventListener('click', function(e) {
    const wrapper = document.querySelector('.user-menu-wrapper');
    if (wrapper && !wrapper.contains(e.target)) {
        const dropdown = document.getElementById('userMenuDropdown');
        if (dropdown) {
            dropdown.classList.remove('active');
        }
    }
});

// ====== ثبت‌نام کاربر جدید ======
async function registerUser(username, password) {
    try {
        const users = await getUsers();
        
        if (users[username]) {
            return { success: false, message: 'این نام کاربری قبلاً ثبت شده است!' };
        }
        
        if (username.length < 3) {
            return { success: false, message: 'نام کاربری حداقل ۳ کاراکتر باشد!' };
        }
        
        if (password.length < 4) {
            return { success: false, message: 'رمز عبور حداقل ۴ کاراکتر باشد!' };
        }
        
        users[username] = {
            password: password,
            created: new Date().toLocaleString('fa-IR'),
            likedVideos: [],
            likedMods: [],
            watchedVideos: [],
            downloadedVideos: [],
            profileImage: ''
        };
        
        const saved = await saveUsers(users);
        if (!saved) {
            return { success: false, message: 'خطا در ثبت‌نام! دوباره تلاش کن.' };
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

// ====== ورود کاربر ======
async function loginUser(username, password) {
    try {
        const users = await getUsers();
        
        if (!users[username]) {
            return { success: false, message: '❌ این نام کاربری وجود ندارد!' };
        }
        
        if (users[username].password !== password) {
            return { success: false, message: '❌ رمز عبور اشتباه است!' };
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

// ====== تغییر رمز عبور ======
async function changePassword(oldPassword, newPassword) {
    try {
        const user = getCurrentUser();
        if (!user) {
            return { success: false, message: '❌ ابتدا وارد حساب خود شوید!' };
        }
        
        const users = await getUsers();
        
        if (users[user.username].password !== oldPassword) {
            return { success: false, message: '❌ رمز عبور فعلی اشتباه است!' };
        }
        
        if (newPassword.length < 4) {
            return { success: false, message: 'رمز عبور جدید حداقل ۴ کاراکتر باشد!' };
        }
        
        users[user.username].password = newPassword;
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
// ====== 💥 تغییر تصویر پروفایل (با کمپرس) ======
// ============================================================

// تابع فشرده‌سازی تصویر
function compressImage(dataUrl, quality = 0.7, maxWidth = 300, maxHeight = 300) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = function() {
            let width = img.width;
            let height = img.height;
            
            // حفظ نسبت ابعاد
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
            
            // خروجی با کیفیت ۷۰٪ (تعادل بین کیفیت و حجم)
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
        
        // اگر تصویر جدیدی ارسال شده، آن را بهینه کن
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

// ====== لایک کردن ویدیو ======
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

// ====== لایک کردن مود ======
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

// ====== ثبت مشاهده ویدیو ======
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

// ====== ثبت دانلود ویدیو ======
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

// ====== دریافت آمار کاربر ======
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

// ====== اجرا در تمام صفحات ======
document.addEventListener('DOMContentLoaded', function() {
    updateAuthUI();
});

// ====== صادر کردن توابع برای استفاده ======
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
    updateProfileImage,
    compressImage,
    toggleLikeVideo,
    toggleLikeMod,
    watchVideo,
    downloadVideo,
    getUserStats,
    updateAuthUI
};