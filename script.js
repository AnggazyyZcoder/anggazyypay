// DOM Elements
const loadingScreen = document.getElementById('loadingScreen');
const mainContainer = document.getElementById('mainContainer');
const startTransactionBtn = document.getElementById('startTransaction');
const paymentCards = document.querySelectorAll('.payment-card');
const copyButtons = document.querySelectorAll('.copy-btn');
const copyModal = document.getElementById('copyModal');
const modalCloseBtn = document.querySelector('.modal-close-btn');
const menuToggle = document.getElementById('menuToggle');
const nav = document.querySelector('.nav');
const navLinks = document.querySelectorAll('.nav-link');
const qrisCard = document.querySelector('[data-method="qris"]');
const qrisLoading = document.getElementById('qrisLoading');
const qrisInput = document.getElementById('qrisInput');
const qrisResult = document.getElementById('qrisResult');
const generateQRISBtn = document.getElementById('generateQRIS');
const qrisAmountInput = document.getElementById('qrisAmount');
const qrisCanvas = document.getElementById('qrisCanvas');
const qrisNominal = document.getElementById('qrisNominal');
const transactionIdElement = document.getElementById('transactionId');
const copyTrxIdBtn = document.getElementById('copyTrxId');
const expiryInfo = document.getElementById('expiryInfo');
const downloadQRISBtn = document.getElementById('downloadQRIS');
const iHavePaidBtn = document.getElementById('iHavePaid');
const statNumbers = document.querySelectorAll('.stat-number');
const fadeElements = document.querySelectorAll('.fade-in');

// QRIS Configuration
const QRIS_API_URL = 'https://qris.miraipedia.my.id/api/convert';
const QRIS_STATIC_STRING = '00020101021126610014COM.GO-JEK.WWW01189360091438478660180210G8478660180303UMI51440014ID.CO.QRIS.WWW0215ID10254635735230303UMI5204581653033605802ID5912Anggazyy Pay6008MINAHASA61059566162070703A0163041DD9';

// Global Variables
let activePaymentCard = null;
let qrisExpiryTimer = null;
let currentTransactionId = null;
let currentQRISData = null;
let qrCodeInstance = null;

// Initialize the website
function init() {
    console.log('Website Anggazyy Pay dimuat');
    
    // Show loading screen for 3 seconds
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        loadingScreen.style.visibility = 'hidden';
        console.log('Loading screen ditutup');
    }, 3000);
    
    // Initialize event listeners
    setupEventListeners();
    
    // Initialize animations
    initAnimations();
    
    // Initialize stats counter
    initStatsCounter();
    
    // Set current year in footer
    const currentYear = new Date().getFullYear();
    document.querySelector('.footer-bottom p').innerHTML = `&copy; Copyright <span class="heart">❤</span> ${currentYear} Anggazyy Developer. Semua Hak Dilindungi.`;
    
    console.log('Website siap digunakan');
}

// Set up all event listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
    // Start transaction button
    startTransactionBtn.addEventListener('click', () => {
        console.log('Mulai Bertransaksi diklik');
        document.getElementById('payment').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
        
        // Animate the button
        startTransactionBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            startTransactionBtn.style.transform = 'scale(1)';
        }, 150);
    });
    
    // Payment cards toggle
    paymentCards.forEach(card => {
        const header = card.querySelector('.payment-header');
        const toggle = card.querySelector('.payment-toggle');
        
        header.addEventListener('click', (e) => {
            console.log('Payment card diklik:', card.dataset.method);
            
            // Jika sedang loading QRIS, jangan tutup
            if (card.classList.contains('loading')) {
                console.log('Card sedang loading, tidak bisa ditutup');
                return;
            }
            
            // Jika klik pada tombol copy, jangan tutup card
            if (e.target.closest('.copy-btn') || e.target.closest('.close-details-btn')) {
                return;
            }
            
            // Jika klik card yang sama, tutup
            if (card === activePaymentCard) {
                closePaymentCard(card);
                activePaymentCard = null;
            } else {
                // Tutup card yang terbuka
                if (activePaymentCard) {
                    closePaymentCard(activePaymentCard);
                }
                
                // Buka card yang diklik
                openPaymentCard(card);
                activePaymentCard = card;
                
                // Special handling untuk QRIS
                if (card.dataset.method === 'qris') {
                    handleQRISCardOpen();
                }
            }
        });
        
        // Tombol close details
        const closeBtn = card.querySelector('.close-details-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log('Tombol close diklik');
                closePaymentCard(card);
                if (activePaymentCard === card) {
                    activePaymentCard = null;
                }
            });
        }
    });
    
    // Tombol copy untuk nomor rekening
    copyButtons.forEach(button => {
        if (button.id !== 'copyTrxId') {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const text = button.getAttribute('data-clipboard-text');
                console.log('Copy nomor rekening:', text);
                copyToClipboard(text);
                showCopyModal();
            });
        }
    });
    
    // Tombol copy ID transaksi
    copyTrxIdBtn.addEventListener('click', () => {
        const text = transactionIdElement.textContent;
        console.log('Copy ID transaksi:', text);
        copyToClipboard(text);
        showCopyModal();
    });
    
    // Tombol close modal
    modalCloseBtn.addEventListener('click', () => {
        copyModal.classList.remove('active');
        console.log('Modal ditutup');
    });
    
    // Menu toggle untuk mobile
    menuToggle.addEventListener('click', () => {
        nav.classList.toggle('active');
        menuToggle.innerHTML = nav.classList.contains('active') 
            ? '<i class="fas fa-times"></i>' 
            : '<i class="fas fa-bars"></i>';
        console.log('Menu toggle diklik');
    });
    
    // Nav link clicks
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            console.log('Nav link diklik:', link.getAttribute('href'));
            
            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Tutup mobile menu jika terbuka
            if (nav.classList.contains('active')) {
                nav.classList.remove('active');
                menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
    });
    
    // Tombol Generate QRIS
    generateQRISBtn.addEventListener('click', generateQRIS);
    
    // Tombol Download QRIS
    downloadQRISBtn.addEventListener('click', downloadQRIS);
    
    // Tombol Saya Sudah Bayar
    iHavePaidBtn.addEventListener('click', () => {
        console.log('Saya Sudah Bayar diklik');
        
        // Hentikan timer kedaluwarsa
        if (qrisExpiryTimer) {
            clearTimeout(qrisExpiryTimer);
            qrisExpiryTimer = null;
        }
        
        // Redirect ke WhatsApp
        const whatsappUrl = 'https://wa.me/62882020034316';
        console.log('Membuka WhatsApp:', whatsappUrl);
        window.open(whatsappUrl, '_blank');
        
        // Tutup detail QRIS setelah delay
        setTimeout(() => {
            if (activePaymentCard) {
                closePaymentCard(activePaymentCard);
                activePaymentCard = null;
            }
        }, 1000);
    });
    
    // Tutup modal saat klik di luar
    window.addEventListener('click', (e) => {
        if (e.target === copyModal) {
            copyModal.classList.remove('active');
        }
    });
    
    // Smooth scroll untuk anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                console.log('Scrolling ke:', targetId);
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
    
    console.log('Event listeners berhasil di setup');
}

// Inisialisasi animasi
function initAnimations() {
    console.log('Inisialisasi animasi...');
    
    // Fade in elements on scroll
    const fadeInOnScroll = () => {
        fadeElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < window.innerHeight - elementVisible) {
                element.classList.add('visible');
            }
        });
    };
    
    // Initial check
    fadeInOnScroll();
    
    // Check on scroll
    window.addEventListener('scroll', fadeInOnScroll);
    console.log('Animasi scroll diaktifkan');
}

// Inisialisasi stats counter animation
function initStatsCounter() {
    console.log('Inisialisasi stat counter...');
    
    const observerOptions = {
        threshold: 0.5
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                console.log('Stats section terlihat, mulai animasi counter');
                
                statNumbers.forEach(stat => {
                    const target = parseFloat(stat.getAttribute('data-count'));
                    const duration = 2000; // 2 detik
                    const increment = target / (duration / 16); // 60fps
                    let current = 0;
                    
                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= target) {
                            current = target;
                            clearInterval(timer);
                            console.log('Counter selesai untuk:', stat.parentElement.querySelector('.stat-label').textContent);
                        }
                        
                        // Format angka dengan tanda + jika perlu
                        if (stat.parentElement.querySelector('.stat-label').textContent === 'Total Transaksi' ||
                            stat.parentElement.querySelector('.stat-label').textContent === 'Testimonial' ||
                            stat.parentElement.querySelector('.stat-label').textContent === 'Pengguna Aktif') {
                            stat.textContent = Math.floor(current) + '+';
                        } else {
                            stat.textContent = current.toFixed(1);
                        }
                    }, 16);
                });
                
                // Stop observing setelah animasi dimulai
                observer.disconnect();
            }
        });
    }, observerOptions);
    
    // Observe stats section
    const statsSection = document.getElementById('stats');
    if (statsSection) {
        observer.observe(statsSection);
        console.log('Stats section sedang di observe');
    }
}

// Buka payment card dengan animasi
function openPaymentCard(card) {
    console.log('Membuka payment card:', card.dataset.method);
    card.classList.add('active');
    
    // Tampilkan nomor rekening asli dengan animasi
    const hiddenNumber = card.querySelector('.hidden-number');
    const realNumber = card.querySelector('.real-number');
    
    if (hiddenNumber && realNumber) {
        hiddenNumber.style.opacity = '0';
        setTimeout(() => {
            hiddenNumber.style.display = 'none';
            realNumber.style.display = 'inline';
            realNumber.style.opacity = '0';
            realNumber.style.transform = 'translateY(10px)';
            
            setTimeout(() => {
                realNumber.style.opacity = '1';
                realNumber.style.transform = 'translateY(0)';
                realNumber.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            }, 10);
        }, 300);
    }
}

// Tutup payment card dengan animasi
function closePaymentCard(card) {
    console.log('Menutup payment card:', card.dataset.method);
    card.classList.remove('active');
    
    // Sembunyikan nomor rekening asli dengan animasi
    const hiddenNumber = card.querySelector('.hidden-number');
    const realNumber = card.querySelector('.real-number');
    
    if (hiddenNumber && realNumber && realNumber.style.display !== 'none') {
        realNumber.style.opacity = '0';
        realNumber.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            realNumber.style.display = 'none';
            hiddenNumber.style.display = 'inline';
            hiddenNumber.style.opacity = '0';
            
            setTimeout(() => {
                hiddenNumber.style.opacity = '1';
                hiddenNumber.style.transition = 'opacity 0.5s ease';
            }, 10);
        }, 300);
    }
    
    // Reset state QRIS jika card QRIS ditutup
    if (card.dataset.method === 'qris') {
        resetQRISState();
    }
}

// Handle QRIS card opening
function handleQRISCardOpen() {
    console.log('Membuka card QRIS');
    
    // Reset QRIS state
    qrisLoading.style.display = 'block';
    qrisInput.style.display = 'none';
    qrisResult.style.display = 'none';
    
    // Tampilkan loading selama 3 detik
    setTimeout(() => {
        qrisLoading.style.display = 'none';
        qrisInput.style.display = 'block';
        console.log('QRIS loading selesai, tampilkan input');
        
        // Focus pada input amount
        setTimeout(() => {
            qrisAmountInput.focus();
            qrisAmountInput.select();
        }, 300);
    }, 3000);
}

// Reset QRIS state
function resetQRISState() {
    console.log('Reset QRIS state');
    
    // Hentikan timer kedaluwarsa
    if (qrisExpiryTimer) {
        clearTimeout(qrisExpiryTimer);
        qrisExpiryTimer = null;
    }
    
    // Reset variabel
    currentTransactionId = null;
    currentQRISData = null;
    qrCodeInstance = null;
    
    // Clear canvas
    const ctx = qrisCanvas.getContext('2d');
    ctx.clearRect(0, 0, qrisCanvas.width, qrisCanvas.height);
}

// Generate QRIS
async function generateQRIS() {
    const amount = qrisAmountInput.value;
    
    console.log('Generate QRIS dengan nominal:', amount);
    
    // Validasi amount
    if (!amount || amount < 10000) {
        alert('Masukkan nominal minimal Rp 10.000');
        qrisAmountInput.focus();
        return;
    }
    
    // Tampilkan loading state
    generateQRISBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menggenerate...';
    generateQRISBtn.disabled = true;
    
    try {
        console.log('Mengirim request ke API QRIS...');
        
        // Persiapkan data request
        const requestData = {
            amount: amount.toString(),
            qris: QRIS_STATIC_STRING
        };
        
        console.log('Request data:', requestData);
        
        // Kirim request ke API QRIS dengan timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);
        
        const response = await fetch(QRIS_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        const data = await response.json();
        console.log('Response dari API:', data);
        
        // Simulasi delay 3 detik sesuai requirement
        setTimeout(() => {
            if (data.status === 'success') {
                console.log('QRIS berhasil digenerate');
                handleQRISSuccess(data, amount);
            } else {
                console.error('API Error:', data.message);
                // Fallback ke QRIS lokal jika API error
                handleQRISFallback(amount);
            }
        }, 3000);
        
    } catch (error) {
        console.error('Error generating QRIS:', error);
        
        // Simulasi delay 3 detik
        setTimeout(() => {
            // Fallback ke QRIS lokal
            handleQRISFallback(amount);
        }, 3000);
    }
}

// Handle QRIS success response
function handleQRISSuccess(data, amount) {
    // Generate transaction ID
    currentTransactionId = 'TRX-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    
    // Simpan data QRIS
    currentQRISData = {
        qrisString: data.data.qris_string,
        qrBase64: data.data.qr_base64,
        amount: amount
    };
    
    // Tampilkan QR code dari base64
    displayQRCodeFromBase64(data.data.qr_base64, amount);
    
    // Update UI dengan hasil QRIS
    qrisNominal.textContent = 'Rp ' + parseInt(amount).toLocaleString('id-ID');
    transactionIdElement.textContent = currentTransactionId;
    
    // Hitung waktu kedaluwarsa (5 menit dari sekarang)
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + 5);
    
    // Update info kedaluwarsa
    startExpiryTimer(expiryTime);
    
    // Tampilkan section hasil
    qrisInput.style.display = 'none';
    qrisResult.style.display = 'block';
    
    // Reset tombol
    resetGenerateButton();
}

// Handle QRIS fallback jika API error
function handleQRISFallback(amount) {
    console.log('Menggunakan QRIS fallback');
    
    // Generate transaction ID
    currentTransactionId = 'TRX-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    
    // Buat QRIS string dinamis (simulasi)
    const dynamicQRIS = generateDynamicQRISString(amount);
    currentQRISData = {
        qrisString: dynamicQRIS,
        amount: amount
    };
    
    // Generate QR code
    generateQRCode(dynamicQRIS, amount);
    
    // Update UI dengan hasil QRIS
    qrisNominal.textContent = 'Rp ' + parseInt(amount).toLocaleString('id-ID');
    transactionIdElement.textContent = currentTransactionId;
    
    // Hitung waktu kedaluwarsa (5 menit dari sekarang)
    const expiryTime = new Date();
    expiryTime.setMinutes(expiryTime.getMinutes() + 5);
    
    // Update info kedaluwarsa
    startExpiryTimer(expiryTime);
    
    // Tampilkan section hasil
    qrisInput.style.display = 'none';
    qrisResult.style.display = 'block';
    
    // Reset tombol
    resetGenerateButton();
}

// Reset generate button state
function resetGenerateButton() {
    generateQRISBtn.innerHTML = 'Generate QRIS';
    generateQRISBtn.disabled = false;
}

// Generate dynamic QRIS string (simulasi)
function generateDynamicQRISString(amount) {
    // Format: 00020101021226650014ID.CO.QRIS.WWW01189360091100000000000215204082010303UMI51440014ID.CO.QRIS.WWW0215ID10200169230303UMI5204581253033605405[AMOUNT]5802ID5912Anggazyy Pay6008MINAHASA61059566162070703.016304
    const amountStr = amount.toString().padStart(5, '0');
    return `00020101021226650014ID.CO.QRIS.WWW01189360091100000000000215204082010303UMI51440014ID.CO.QRIS.WWW0215ID10200169230303UMI5204581253033605405${amountStr}5802ID5912Anggazyy Pay6008MINAHASA61059566162070703.016304`;
}

// Display QR code from base64
function displayQRCodeFromBase64(base64String, amount) {
    console.log('Menampilkan QR code dari base64');
    
    // Buat image dari base64
    const img = new Image();
    img.onload = function() {
        const ctx = qrisCanvas.getContext('2d');
        
        // Clear canvas
        ctx.clearRect(0, 0, qrisCanvas.width, qrisCanvas.height);
        
        // Gambar QR code
        ctx.drawImage(img, 0, 0, qrisCanvas.width, qrisCanvas.height);
        
        // Tambahkan teks nominal di bawah QR code
        ctx.fillStyle = '#8a2be2';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Rp ${parseInt(amount).toLocaleString('id-ID')}`, qrisCanvas.width / 2, qrisCanvas.height - 10);
        
        console.log('QR code berhasil ditampilkan');
    };
    
    img.onerror = function() {
        console.error('Gagal memuat gambar QR code dari base64');
        // Fallback ke generate QR code
        generateQRCode(currentQRISData.qrisString, amount);
    };
    
    img.src = `data:image/png;base64,${base64String}`;
}

// Generate QR code menggunakan library
function generateQRCode(qrisString, amount) {
    console.log('Generate QR code untuk string:', qrisString.substring(0, 50) + '...');
    
    try {
        // Clear canvas terlebih dahulu
        const ctx = qrisCanvas.getContext('2d');
        ctx.clearRect(0, 0, qrisCanvas.width, qrisCanvas.height);
        
        // Buat QR code menggunakan library qrcode-generator
        const qr = qrcode(0, 'L');
        qr.addData(qrisString);
        qr.make();
        
        // Dapatkan size QR code
        const cellSize = 5;
        const margin = 10;
        const size = qr.getModuleCount() * cellSize + margin * 2;
        
        // Sesuaikan canvas size
        qrisCanvas.width = size;
        qrisCanvas.height = size + 30; // Tambahan untuk teks
        
        // Isi background putih
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, qrisCanvas.width, qrisCanvas.height);
        
        // Gambar QR code
        for (let row = 0; row < qr.getModuleCount(); row++) {
            for (let col = 0; col < qr.getModuleCount(); col++) {
                ctx.fillStyle = qr.isDark(row, col) ? '#000000' : '#ffffff';
                ctx.fillRect(
                    margin + col * cellSize,
                    margin + row * cellSize,
                    cellSize,
                    cellSize
                );
            }
        }
        
        // Tambahkan teks nominal
        ctx.fillStyle = '#8a2be2';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Rp ${parseInt(amount).toLocaleString('id-ID')}`, qrisCanvas.width / 2, qrisCanvas.height - 10);
        
        // Tambahkan logo kecil di tengah QR code
        const logoSize = 30;
        const centerX = qrisCanvas.width / 2;
        const centerY = qrisCanvas.height / 2 - 15;
        
        // Background bulat untuk logo
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(centerX, centerY, logoSize/2, 0, Math.PI * 2);
        ctx.fill();
        
        // Gambar logo wallet
        ctx.fillStyle = '#8a2be2';
        ctx.font = 'bold 20px "Font Awesome 5 Free"';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('💰', centerX, centerY);
        
        console.log('QR code berhasil digenerate');
        return true;
        
    } catch (error) {
        console.error('Error generating QR code:', error);
        
        // Fallback ke QR code sederhana
        generateSimpleQRCode(amount);
        return false;
    }
}

// Generate simple QR code (fallback)
function generateSimpleQRCode(amount) {
    console.log('Membuat simple QR code fallback');
    
    const ctx = qrisCanvas.getContext('2d');
    const size = 250;
    
    // Set canvas size
    qrisCanvas.width = size;
    qrisCanvas.height = size + 30;
    
    // Background putih
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, qrisCanvas.width, qrisCanvas.height);
    
    // Pattern QR code sederhana
    ctx.fillStyle = '#000000';
    
    // Kotak besar di sudut
    ctx.fillRect(20, 20, 40, 40);
    ctx.fillRect(size - 60, 20, 40, 40);
    ctx.fillRect(20, size - 90, 40, 40);
    
    // Pattern acak di tengah
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            if ((i + j) % 3 === 0 || (i * j) % 5 === 0) {
                ctx.fillRect(60 + i * 16, 60 + j * 16, 10, 10);
            }
        }
    }
    
    // Tambahkan teks
    ctx.fillStyle = '#8a2be2';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('QRIS Anggazyy Pay', size / 2, size - 50);
    ctx.fillText(`Rp ${parseInt(amount).toLocaleString('id-ID')}`, size / 2, size - 20);
}

// Start expiry timer
function startExpiryTimer(expiryTime) {
    console.log('Memulai timer kedaluwarsa:', expiryTime);
    
    // Update display setiap detik
    qrisExpiryTimer = setInterval(() => {
        updateExpiryDisplay(expiryTime);
    }, 1000);
    
    // Update segera
    updateExpiryDisplay(expiryTime);
}

// Update expiry display
function updateExpiryDisplay(expiryTime) {
    const now = new Date();
    const diffMs = expiryTime - now;
    
    if (diffMs <= 0) {
        expiryInfo.textContent = 'QRIS telah kedaluwarsa!';
        expiryInfo.style.color = '#ff4757';
        
        // Hentikan timer
        if (qrisExpiryTimer) {
            clearInterval(qrisExpiryTimer);
            qrisExpiryTimer = null;
        }
        
        // Sembunyikan QRIS setelah 2 detik
        setTimeout(() => {
            if (activePaymentCard && activePaymentCard.dataset.method === 'qris') {
                closePaymentCard(activePaymentCard);
                activePaymentCard = null;
            }
        }, 2000);
        
        return;
    }
    
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    
    // Update warna berdasarkan waktu
    if (diffMins < 1) {
        expiryInfo.style.color = '#ff6b6b';
    } else if (diffMins < 2) {
        expiryInfo.style.color = '#ffa502';
    } else {
        expiryInfo.style.color = '#00ff88';
    }
    
    expiryInfo.textContent = `Kedaluwarsa dalam: ${diffMins}:${diffSecs.toString().padStart(2, '0')} menit`;
}

// Download QRIS image
function downloadQRIS() {
    if (!qrisCanvas) {
        console.error('Canvas QRIS tidak ditemukan');
        alert('QRIS belum digenerate');
        return;
    }
    
    try {
        console.log('Mendownload QRIS...');
        
        // Buat canvas sementara dengan resolusi lebih tinggi
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        const scale = 2; // Scale 2x untuk kualitas lebih baik
        
        tempCanvas.width = qrisCanvas.width * scale;
        tempCanvas.height = qrisCanvas.height * scale;
        
        // Isi background putih
        tempCtx.fillStyle = '#ffffff';
        tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
        
        // Gambar ulang QR code dengan skala
        tempCtx.scale(scale, scale);
        tempCtx.drawImage(qrisCanvas, 0, 0);
        
        // Konversi ke data URL
        const dataURL = tempCanvas.toDataURL('image/png');
        
        // Buat link download
        const link = document.createElement('a');
        const timestamp = new Date().getTime();
        const filename = `qris-anggazyy-${currentTransactionId || timestamp}.png`;
        
        link.href = dataURL;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        console.log('QRIS berhasil didownload:', filename);
        
        // Tampilkan feedback
        showDownloadFeedback();
        
    } catch (error) {
        console.error('Error downloading QRIS:', error);
        alert('Gagal mendownload QRIS. Silakan coba lagi.');
    }
}

// Show download feedback
function showDownloadFeedback() {
    const originalText = downloadQRISBtn.innerHTML;
    downloadQRISBtn.innerHTML = '<i class="fas fa-check"></i> Berhasil!';
    downloadQRISBtn.style.backgroundColor = '#00ff88';
    downloadQRISBtn.style.color = '#000';
    
    setTimeout(() => {
        downloadQRISBtn.innerHTML = originalText;
        downloadQRISBtn.style.backgroundColor = '';
        downloadQRISBtn.style.color = '';
    }, 2000);
}

// Copy text to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        console.log('Text berhasil disalin ke clipboard:', text);
    }).catch(err => {
        console.error('Gagal menyalin text: ', err);
        // Fallback method
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        console.log('Text disalin menggunakan fallback method');
    });
}

// Show copy success modal
function showCopyModal() {
    console.log('Menampilkan modal copy');
    copyModal.classList.add('active');
    
    // Auto close setelah 2 detik
    setTimeout(() => {
        copyModal.classList.remove('active');
        console.log('Modal copy ditutup otomatis');
    }, 2000);
}

// Inisialisasi saat DOM dimuat
document.addEventListener('DOMContentLoaded', init);

// Tambahkan animasi background dinamis
document.addEventListener('DOMContentLoaded', () => {
    console.log('Menambahkan animasi background...');
    
    const heroSection = document.querySelector('.hero-section');
    
    // Buat floating elements untuk background
    for (let i = 0; i < 20; i++) {
        const floatingElement = document.createElement('div');
        floatingElement.className = 'floating-bg-element';
        
        // Random position and size
        const size = Math.random() * 60 + 20;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const delay = Math.random() * 5;
        const duration = Math.random() * 15 + 10;
        
        // Apply styles
        floatingElement.style.width = `${size}px`;
        floatingElement.style.height = `${size}px`;
        floatingElement.style.left = `${posX}%`;
        floatingElement.style.top = `${posY}%`;
        floatingElement.style.animationDelay = `${delay}s`;
        floatingElement.style.animationDuration = `${duration}s`;
        
        // Random color (purple or green)
        floatingElement.style.backgroundColor = Math.random() > 0.5 
            ? 'rgba(138, 43, 226, 0.15)' 
            : 'rgba(0, 255, 136, 0.15)';
        
        floatingElement.style.borderRadius = '50%';
        floatingElement.style.position = 'absolute';
        floatingElement.style.zIndex = '-1';
        floatingElement.style.filter = 'blur(8px)';
        floatingElement.style.animation = 'floatElement 25s infinite ease-in-out';
        
        heroSection.appendChild(floatingElement);
    }
    
    console.log('Animasi background selesai ditambahkan');
});