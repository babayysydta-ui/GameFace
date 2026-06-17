// ============================================================
// loader.js - لودینگ فقط برای صفحه اصلی (رفع دابل لودینگ)
// ============================================================

(function() {
    'use strict';

    // ====== تنظیمات ======
    const CONFIG = {
        minLoadTime: 400,
        maxLoadTime: 1200,
        fadeOutTime: 300,
        barSpeed: 25,
        intervalSpeed: 50,
    };

    // ====== تشخیص صفحه اصلی ======
    function isHomePage() {
        const path = window.location.pathname;
        const fileName = path.split('/').pop() || 'index.html';
        return fileName === '' || fileName === 'index.html' || fileName === '/';
    }

    // ====== ایجاد المنت‌های لودینگ ======
    function createLoadingScreen() {
        if (document.getElementById('globalLoader')) return;

        const loaderHTML = `
            <div id="globalLoader" style="
                position: fixed;
                inset: 0;
                background: #070910;
                display: none;
                align-items: center;
                justify-content: center;
                z-index: 999999;
                flex-direction: column;
                gap: 20px;
                transition: opacity ${CONFIG.fadeOutTime}ms ease;
                font-family: 'Tahoma', sans-serif;
            ">
                <div style="
                    font-size: 36px;
                    font-weight: 900;
                    background: linear-gradient(45deg, #7c5cff, #00eaff, #ff3d81);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    animation: loaderPulse 1s ease-in-out infinite;
                ">GameFace</div>
                
                <div style="
                    width: 180px;
                    height: 3px;
                    background: rgba(255,255,255,0.06);
                    border-radius: 3px;
                    overflow: hidden;
                ">
                    <div id="globalLoaderBar" style="
                        width: 0%;
                        height: 100%;
                        background: linear-gradient(90deg, #7c5cff, #00eaff);
                        border-radius: 3px;
                        transition: width 0.08s ease;
                    "></div>
                </div>
                
                <div id="globalLoaderPercent" style="
                    color: rgba(255,255,255,0.15);
                    font-size: 12px;
                    font-family: monospace;
                    letter-spacing: 2px;
                ">0%</div>
            </div>
            
            <style>
                @keyframes loaderPulse {
                    0%, 100% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.7; }
                }
            </style>
        `;

        document.body.insertAdjacentHTML('beforeend', loaderHTML);
    }

    // ====== نمایش لودینگ ======
    function showLoader() {
        const loader = document.getElementById('globalLoader');
        if (loader) {
            loader.style.display = 'flex';
            loader.style.opacity = '1';
        }
    }

    // ====== مخفی کردن لودینگ ======
    function hideLoader() {
        const loader = document.getElementById('globalLoader');
        if (loader) {
            loader.style.opacity = '0';
            setTimeout(() => {
                loader.style.display = 'none';
            }, CONFIG.fadeOutTime);
        }
    }

    // ====== اجرای لودینگ ======
    function runLoader() {
        return new Promise((resolve) => {
            // اگر لودینگ از قبل نمایش داده نشده، ایجاد کن
            createLoadingScreen();
            
            // اگر صفحه اصلی نیست، لودینگ نشون نده
            if (!isHomePage()) {
                resolve();
                return;
            }

            showLoader();

            const bar = document.getElementById('globalLoaderBar');
            const percent = document.getElementById('globalLoaderPercent');
            
            let progress = 0;
            const startTime = Date.now();

            const interval = setInterval(() => {
                progress += CONFIG.barSpeed;
                if (progress > 100) progress = 100;
                
                bar.style.width = progress + '%';
                percent.textContent = Math.floor(progress) + '%';

                if (progress >= 100) {
                    clearInterval(interval);
                    
                    const elapsed = Date.now() - startTime;
                    const remaining = CONFIG.minLoadTime - elapsed;
                    
                    if (remaining > 0) {
                        setTimeout(() => {
                            hideLoader();
                            resolve();
                        }, remaining);
                    } else {
                        hideLoader();
                        resolve();
                    }
                }
            }, CONFIG.intervalSpeed);

            // ضمانت حداکثر زمان
            setTimeout(() => {
                if (progress < 100) {
                    clearInterval(interval);
                    bar.style.width = '100%';
                    percent.textContent = '100%';
                    
                    setTimeout(() => {
                        hideLoader();
                        resolve();
                    }, 200);
                }
            }, CONFIG.maxLoadTime);
        });
    }

    // ====== متغیر برای جلوگیری از لودینگ دوبار ======
    let isNavigating = false;

    // ====== رفتن به صفحه با لودینگ ======
    async function navigateWithLoader(url) {
        // اگر در حال ناوبری هستیم، جلوگیری کن
        if (isNavigating) return;
        
        const isTargetHome = url === 'index.html' || url === '/' || url === '' || 
                            url.includes('index.html') || url === window.location.pathname;

        // اگر مقصد صفحه فعلی هست، کاری نکن
        if (url === window.location.pathname || url === '') {
            return;
        }

        isNavigating = true;

        try {
            // فقط اگر مقصد خانه باشه و صفحه فعلی خانه نباشه، لودینگ نشون بده
            if (isTargetHome && !isHomePage()) {
                await runLoader();
            }
            // رفتن به صفحه مقصد
            window.location.href = url;
        } catch (error) {
            window.location.href = url;
        } finally {
            // بعد از 500 میلی‌ثانیه قفل رو بردار (برای جلوگیری از کلیک‌های متوالی)
            setTimeout(() => {
                isNavigating = false;
            }, 500);
        }
    }

    // ====== تنظیم لینک‌ها ======
    function setupLinks() {
        document.addEventListener('click', function(e) {
            const link = e.target.closest('a');
            if (!link) return;

            const href = link.getAttribute('href');
            if (!href) return;
            
            // لینک‌های خارجی و خاص
            if (href.startsWith('http') && !href.includes(window.location.hostname)) return;
            if (href.startsWith('#')) return;
            if (href.startsWith('javascript:')) return;
            if (href.startsWith('mailto:')) return;
            if (href.startsWith('tel:')) return;
            if (href.startsWith('https://rubika.ir')) return;
            if (href.startsWith('https://www.aparat.com')) return;

            e.preventDefault();
            
            // جلوگیری از ناوبری دوبار
            if (isNavigating) return;
            
            navigateWithLoader(href);
        });
    }

    // ====== لودینگ اولیه صفحه ======
    async function init() {
        createLoadingScreen();
        
        // فقط اگر صفحه اصلی باشه و از جای دیگه نیومده باشه، لودینگ نمایش بده
        // (از طریق sessionStorage تشخیص می‌دیم که از کجا اومده)
        const cameFromOtherPage = sessionStorage.getItem('cameFromOtherPage');
        
        if (isHomePage() && cameFromOtherPage === 'true') {
            // از صفحه دیگه به خونه اومده - لودینگ نشون بده
            sessionStorage.removeItem('cameFromOtherPage');
            await runLoader();
        } else if (isHomePage()) {
            // ورود اولیه به سایت - لودینگ نشون بده
            await runLoader();
        }
        
        // تنظیم لینک‌ها
        setupLinks();
        
        // وقتی از صفحه خارج میشیم، علامت بزن که از این صفحه خارج شدیم
        window.addEventListener('beforeunload', function() {
            if (!isHomePage()) {
                sessionStorage.setItem('cameFromOtherPage', 'true');
            }
        });
    }

    // ====== استارت ======
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ====== API برای استفاده ======
    window.GameFaceLoader = {
        show: showLoader,
        hide: hideLoader,
        run: runLoader,
        navigate: navigateWithLoader,
        isHome: isHomePage,
        config: CONFIG,
    };

})();




