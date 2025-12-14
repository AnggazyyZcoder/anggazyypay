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
const historyLink = document.getElementById('historyLink');
const historyBadge = document.getElementById('historyBadge');
const qrisCard = document.querySelector('[data-method="qris"]');
const qrisLoading = document.getElementById('qrisLoading');
const qrisInput = document.getElementById('qrisInput');
const qrisResult = document.getElementById('qrisResult');
const generateQRISBtn = document.getElementById('generateQRIS');
const qrisAmountInput = document.getElementById('qrisAmount');
const displayAmount = document.getElementById('displayAmount');
const feeAmount = document.getElementById('feeAmount');
const totalAmount = document.getElementById('totalAmount');
const qrisCanvas = document.getElementById('qrisCanvas');
const qrisNominal = document.getElementById('qrisNominal');
const qrisTotal = document.getElementById('qrisTotal');
const transactionIdElement = document.getElementById('transactionId');
const copyTrxIdBtn = document.getElementById('copyTrxId');
const expiryInfo = document.getElementById('expiryInfo');
const downloadQRISBtn = document.getElementById('downloadQRIS');
const iHavePaidBtn = document.getElementById('iHavePaid');
const statNumbers = document.querySelectorAll('.stat-number');
const fadeElements = document.querySelectorAll('.fade-in');

// History Elements
const historyList = document.getElementById('historyList');
const totalTransactions = document.getElementById('totalTransactions');
const successTransactions = document.getElementById('successTransactions');
const expiredTransactions = document.getElementById('expiredTransactions');
const pendingTransactions = document.getElementById('pendingTransactions');
const filterButtons = document.querySelectorAll('.filter-btn');
const searchHistory = document.getElementById('searchHistory');
const clearHistoryBtn = document.getElementById('clearHistory');
const exportHistoryBtn = document.getElementById('exportHistory');
const detailModal = document.getElementById('detailModal');
const transactionDetail = document.getElementById('transactionDetail');
const closeDetailModal = document.getElementById('closeDetailModal');
const confirmModal = document.getElementById('confirmModal');
const cancelClear = document.getElementById('cancelClear');
const confirmClear = document.getElementById('confirmClear');

// QRIS Configuration
const QRIS_API_URL = 'https://qris.miraipedia.my.id/api/convert';
const QRIS_STATIC_STRING = '00020101021126610014COM.GO-JEK.WWW01189360091438478660180210G8478660180303UMI51440014ID.CO.QRIS.WWW0215ID10254635735230303UMI5204581653033605802ID5912Anggazyy Pay6008MINAHASA61059566162070703A0163041DD9';

// Global Variables
let activePaymentCard = null;
let qrisExpiryTimer = null;
let currentTransactionId = null;
let currentQRISData = null;
let qrCodeInstance = null;
let transactionHistory = [];
let transactionChart = null;

// Fee Configuration
const FEE_CONFIG = {
    low: { threshold: 10000, feeRate: 0.003 }, // 0.3% untuk 10k - 19,999
    high: { threshold: 20000, feeRate: 0.007 }  // 0.7% untuk 20k ke atas
};

// Initialize the website
function init() {
    console.log('Website Anggazyy Pay dimuat');
    
    // Load history from localStorage
    loadTransactionHistory();
    
    // Update history badge
    updateHistoryBadge();
    
    // Initialize chart
    initTransactionChart();
    
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
    iHavePaidBtn.addEventListener('click', markAsPaid);
    
    // QRIS amount input change
    qrisAmountInput.addEventListener('input', updateFeeCalculation);
    
    // History filter buttons
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const filter = button.getAttribute('data-filter');
            filterHistory(filter);
        });
    });
    
    // History search
    searchHistory.addEventListener('input', () => {
        searchTransactionHistory();
    });
    
    // Clear history button
    clearHistoryBtn.addEventListener('click', () => {
        confirmModal.classList.add('active');
    });
    
    // Confirm clear history
    confirmClear.addEventListener('click', clearAllHistory);
    
    // Cancel clear history
    cancelClear.addEventListener('click', () => {
        confirmModal.classList.remove('active');
    });
    
    // Export history button
    exportHistoryBtn.addEventListener('click', exportHistory);
    
    // Close detail modal
    closeDetailModal.addEventListener('click', () => {
        detailModal.classList.remove('active');
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === copyModal) {
            copyModal.classList.remove('active');
        }
        if (e.target === detailModal) {
            detailModal.classList.remove('active');
        }
        if (e.target === confirmModal) {
            confirmModal.classList.remove('active');
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

// Calculate fee based on amount
function calculateFee(amount) {
    const amountNum = parseInt(amount);
    let feeRate;
    
    if (amountNum >= FEE_CONFIG.high.threshold) {
        feeRate = FEE_CONFIG.high.feeRate; // 0.7% untuk 20k ke atas
    } else if (amountNum >= FEE_CONFIG.low.threshold) {
        feeRate = FEE_CONFIG.low.feeRate; // 0.3% untuk 10k - 19,999
    } else {
        feeRate = 0; // Tidak ada fee untuk di bawah 10k
    }
    
    const fee = Math.round(amountNum * feeRate);
    const total = amountNum + fee;
    
    return {
        originalAmount: amountNum,
        fee: fee,
        feeRate: feeRate * 100, // dalam persen
        totalAmount: total
    };
}

// Update fee calculation display
function updateFeeCalculation() {
    const amount = qrisAmountInput.value;
    if (!amount || amount < 10000) return;
    
    const calculation = calculateFee(amount);
    
    // Update display
    displayAmount.textContent = calculation.originalAmount.toLocaleString('id-ID');
    feeAmount.textContent = `${calculation.fee.toLocaleString('id-ID')} (${calculation.feeRate}%)`;
    totalAmount.textContent = `Rp ${calculation.totalAmount.toLocaleString('id-ID')}`;
}

// Initialize animations
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

// Initialize stats counter animation
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

// Open payment card with animation
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
    
    // Update fee calculation untuk nilai default
    updateFeeCalculation();
    
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
    
    // Hitung fee
    const feeCalculation = calculateFee(amount);
    
    // Tampilkan loading state
    generateQRISBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menggenerate...';
    generateQRISBtn.disabled = true;
    
    try {
        console.log('Mengirim request ke API QRIS...');
        
        // Gunakan total amount (termasuk fee) untuk API
        const totalAmountForAPI = feeCalculation.totalAmount.toString();
        
        // Persiapkan data request
        const requestData = {
            amount: totalAmountForAPI, // Kirim total amount (termasuk fee)
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
                handleQRISSuccess(data, feeCalculation);
            } else {
                console.error('API Error:', data.message);
                // Fallback ke QRIS lokal jika API error
                handleQRISFallback(feeCalculation);
            }
        }, 3000);
        
    } catch (error) {
        console.error('Error generating QRIS:', error);
        
        // Simulasi delay 3 detik
        setTimeout(() => {
            // Fallback ke QRIS lokal
            handleQRISFallback(feeCalculation);
        }, 3000);
    }
}

// Handle QRIS success response
function handleQRISSuccess(data, feeCalculation) {
    // Generate transaction ID
    currentTransactionId = 'TRX-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    
    // Simpan data QRIS
    currentQRISData = {
        qrisString: data.data.qris_string,
        qrBase64: data.data.qr_base64,
        feeCalculation: feeCalculation,
        timestamp: new Date().toISOString()
    };
    
    // Tampilkan QR code dari base64
    displayQRCodeFromBase64(data.data.qr_base64, feeCalculation.totalAmount);
    
    // Update UI dengan hasil QRIS
    qrisNominal.textContent = 'Rp ' + feeCalculation.originalAmount.toLocaleString('id-ID');
    qrisTotal.textContent = 'Rp ' + feeCalculation.totalAmount.toLocaleString('id-ID');
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
    
    // Simpan transaksi ke history
    saveTransactionToHistory(currentTransactionId, feeCalculation, 'pending', expiryTime);
}

// Handle QRIS fallback jika API error
function handleQRISFallback(feeCalculation) {
    console.log('Menggunakan QRIS fallback');
    
    // Generate transaction ID
    currentTransactionId = 'TRX-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    
    // Buat QRIS string dinamis (simulasi)
    const dynamicQRIS = generateDynamicQRISString(feeCalculation.totalAmount);
    currentQRISData = {
        qrisString: dynamicQRIS,
        feeCalculation: feeCalculation,
        timestamp: new Date().toISOString()
    };
    
    // Generate QR code
    generateQRCode(dynamicQRIS, feeCalculation.totalAmount);
    
    // Update UI dengan hasil QRIS
    qrisNominal.textContent = 'Rp ' + feeCalculation.originalAmount.toLocaleString('id-ID');
    qrisTotal.textContent = 'Rp ' + feeCalculation.totalAmount.toLocaleString('id-ID');
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
    
    // Simpan transaksi ke history
    saveTransactionToHistory(currentTransactionId, feeCalculation, 'pending', expiryTime);
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
        
        // Update status transaksi menjadi expired
        if (currentTransactionId) {
            updateTransactionStatus(currentTransactionId, 'expired');
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

// Mark transaction as paid
function markAsPaid() {
    console.log('Saya Sudah Bayar diklik');
    
    if (!currentTransactionId) {
        alert('Tidak ada transaksi aktif');
        return;
    }
    
    // Hentikan timer kedaluwarsa
    if (qrisExpiryTimer) {
        clearTimeout(qrisExpiryTimer);
        qrisExpiryTimer = null;
    }
    
    // Update status transaksi menjadi success
    updateTransactionStatus(currentTransactionId, 'success');
    
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

// ==================== HISTORY TRANSACTION SYSTEM ====================

// Load transaction history from localStorage
function loadTransactionHistory() {
    const savedHistory = localStorage.getItem('anggazyyPayHistory');
    if (savedHistory) {
        transactionHistory = JSON.parse(savedHistory);
        console.log('History loaded:', transactionHistory.length, 'transactions');
    } else {
        transactionHistory = [];
        console.log('No history found, initializing empty array');
    }
    
    // Update display
    renderHistoryList();
    updateHistoryStats();
}

// Save transaction to history
function saveTransactionToHistory(transactionId, feeCalculation, status, expiryTime) {
    const transaction = {
        id: transactionId,
        originalAmount: feeCalculation.originalAmount,
        fee: feeCalculation.fee,
        feeRate: feeCalculation.feeRate,
        totalAmount: feeCalculation.totalAmount,
        status: status, // 'pending', 'success', 'expired'
        createdAt: new Date().toISOString(),
        expiryTime: expiryTime.toISOString(),
        paidAt: status === 'success' ? new Date().toISOString() : null
    };
    
    transactionHistory.unshift(transaction); // Add to beginning
    saveHistoryToStorage();
    
    console.log('Transaction saved to history:', transaction);
    
    // Update UI
    updateHistoryBadge();
    renderHistoryList();
    updateHistoryStats();
    updateTransactionChart();
}

// Update transaction status
function updateTransactionStatus(transactionId, newStatus) {
    const transaction = transactionHistory.find(t => t.id === transactionId);
    if (transaction) {
        transaction.status = newStatus;
        if (newStatus === 'success') {
            transaction.paidAt = new Date().toISOString();
        }
        saveHistoryToStorage();
        
        console.log('Transaction status updated:', transactionId, '->', newStatus);
        
        // Update UI
        renderHistoryList();
        updateHistoryStats();
        updateTransactionChart();
    }
}

// Save history to localStorage
function saveHistoryToStorage() {
    localStorage.setItem('anggazyyPayHistory', JSON.stringify(transactionHistory));
    console.log('History saved to storage');
}

// Update history badge
function updateHistoryBadge() {
    const pendingCount = transactionHistory.filter(t => t.status === 'pending').length;
    historyBadge.textContent = pendingCount > 0 ? pendingCount : '0';
    
    if (pendingCount > 0) {
        historyBadge.style.backgroundColor = '#ffa502';
    } else {
        historyBadge.style.backgroundColor = '#00ff88';
    }
}

// Render history list
function renderHistoryList(filter = 'all', searchQuery = '') {
    if (transactionHistory.length === 0) {
        historyList.innerHTML = `
            <div class="empty-history">
                <i class="fas fa-history"></i>
                <h3>Belum ada riwayat transaksi</h3>
                <p>Transaksi QRIS Anda akan muncul di sini</p>
            </div>
        `;
        return;
    }
    
    // Filter transactions
    let filteredTransactions = transactionHistory;
    
    if (filter !== 'all') {
        filteredTransactions = transactionHistory.filter(t => t.status === filter);
    }
    
    // Search transactions
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredTransactions = filteredTransactions.filter(t => 
            t.id.toLowerCase().includes(query) ||
            t.originalAmount.toString().includes(query) ||
            t.totalAmount.toString().includes(query)
        );
    }
    
    if (filteredTransactions.length === 0) {
        historyList.innerHTML = `
            <div class="empty-history">
                <i class="fas fa-search"></i>
                <h3>Tidak ada transaksi ditemukan</h3>
                <p>Coba dengan kata kunci atau filter yang berbeda</p>
            </div>
        `;
        return;
    }
    
    // Render transactions
    historyList.innerHTML = filteredTransactions.map(transaction => `
        <div class="history-item" data-id="${transaction.id}">
            <div class="history-item-header">
                <div class="history-item-id">${transaction.id}</div>
                <div class="history-item-status ${getStatusClass(transaction.status)}">
                    ${getStatusText(transaction.status)}
                </div>
            </div>
            <div class="history-item-details">
                <div class="history-detail">
                    <span class="detail-label">Nominal</span>
                    <span class="detail-value">Rp ${transaction.originalAmount.toLocaleString('id-ID')}</span>
                </div>
                <div class="history-detail">
                    <span class="detail-label">Total + Fee</span>
                    <span class="detail-value">Rp ${transaction.totalAmount.toLocaleString('id-ID')}</span>
                </div>
                <div class="history-detail">
                    <span class="detail-label">Tanggal</span>
                    <span class="detail-value">${formatDate(transaction.createdAt)}</span>
                </div>
                <div class="history-detail">
                    <span class="detail-label">Waktu</span>
                    <span class="detail-value">${formatTime(transaction.createdAt)}</span>
                </div>
            </div>
            <div class="history-item-actions">
                <button class="action-btn small view-detail" data-id="${transaction.id}">
                    <i class="fas fa-eye"></i> Detail
                </button>
                ${transaction.status === 'pending' ? `
                <button class="action-btn small mark-paid" data-id="${transaction.id}">
                    <i class="fas fa-check"></i> Tandai Sudah Bayar
                </button>
                ` : ''}
            </div>
        </div>
    `).join('');
    
    // Add event listeners to detail buttons
    document.querySelectorAll('.view-detail').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const transactionId = button.getAttribute('data-id');
            showTransactionDetail(transactionId);
        });
    });
    
    // Add event listeners to mark paid buttons
    document.querySelectorAll('.mark-paid').forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const transactionId = button.getAttribute('data-id');
            markTransactionAsPaid(transactionId);
        });
    });
    
    // Add event listeners to history items
    document.querySelectorAll('.history-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.closest('.action-btn')) {
                const transactionId = item.getAttribute('data-id');
                showTransactionDetail(transactionId);
            }
        });
    });
}

// Get status class
function getStatusClass(status) {
    switch(status) {
        case 'success': return 'status-success';
        case 'expired': return 'status-expired';
        case 'pending': return 'status-pending';
        default: return '';
    }
}

// Get status text
function getStatusText(status) {
    switch(status) {
        case 'success': return 'Berhasil';
        case 'expired': return 'Expired';
        case 'pending': return 'Pending';
        default: return status;
    }
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

// Format time
function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Update history stats
function updateHistoryStats() {
    const total = transactionHistory.length;
    const success = transactionHistory.filter(t => t.status === 'success').length;
    const expired = transactionHistory.filter(t => t.status === 'expired').length;
    const pending = transactionHistory.filter(t => t.status === 'pending').length;
    
    totalTransactions.textContent = total;
    successTransactions.textContent = success;
    expiredTransactions.textContent = expired;
    pendingTransactions.textContent = pending;
}

// Filter history
function filterHistory(filter) {
    renderHistoryList(filter, searchHistory.value);
}

// Search transaction history
function searchTransactionHistory() {
    const query = searchHistory.value;
    const activeFilter = document.querySelector('.filter-btn.active').getAttribute('data-filter');
    renderHistoryList(activeFilter, query);
}

// Show transaction detail
function showTransactionDetail(transactionId) {
    const transaction = transactionHistory.find(t => t.id === transactionId);
    if (!transaction) return;
    
    const expiryDate = new Date(transaction.expiryTime);
    const now = new Date();
    const isExpired = now > expiryDate && transaction.status === 'pending';
    
    // Update status if expired
    if (isExpired) {
        transaction.status = 'expired';
        saveHistoryToStorage();
        updateHistoryStats();
        updateTransactionChart();
    }
    
    transactionDetail.innerHTML = `
        <div class="detail-row">
            <span class="detail-label">ID Transaksi</span>
            <span class="detail-value">${transaction.id}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Status</span>
            <span class="detail-value ${getStatusClass(transaction.status)}">${getStatusText(transaction.status)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Nominal Awal</span>
            <span class="detail-value">Rp ${transaction.originalAmount.toLocaleString('id-ID')}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Biaya (${transaction.feeRate}%)</span>
            <span class="detail-value">Rp ${transaction.fee.toLocaleString('id-ID')}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Total Tagihan</span>
            <span class="detail-value">Rp ${transaction.totalAmount.toLocaleString('id-ID')}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Tanggal Transaksi</span>
            <span class="detail-value">${formatDate(transaction.createdAt)}</span>
        </div>
        <div class="detail-row">
            <span class="detail-label">Waktu Transaksi</span>
            <span class="detail-value">${formatTime(transaction.createdAt)}</span>
        </div>
        ${transaction.paidAt ? `
        <div class="detail-row">
            <span class="detail-label">Dibayar Pada</span>
            <span class="detail-value">${formatDate(transaction.paidAt)} ${formatTime(transaction.paidAt)}</span>
        </div>
        ` : ''}
        <div class="detail-row">
            <span class="detail-label">Kedaluwarsa</span>
            <span class="detail-value">${formatDate(transaction.expiryTime)} ${formatTime(transaction.expiryTime)}</span>
        </div>
    `;
    
    detailModal.classList.add('active');
}

// Mark transaction as paid
function markTransactionAsPaid(transactionId) {
    updateTransactionStatus(transactionId, 'success');
    alert('Transaksi berhasil ditandai sebagai sudah dibayar!');
}

// Clear all history
function clearAllHistory() {
    transactionHistory = [];
    saveHistoryToStorage();
    confirmModal.classList.remove('active');
    
    // Update UI
    updateHistoryBadge();
    renderHistoryList();
    updateHistoryStats();
    updateTransactionChart();
    
    alert('Semua riwayat transaksi telah dihapus!');
}

// Export history
function exportHistory() {
    if (transactionHistory.length === 0) {
        alert('Tidak ada riwayat transaksi untuk diexport');
        return;
    }
    
    // Convert to CSV
    const headers = ['ID Transaksi', 'Status', 'Nominal Awal', 'Biaya', 'Total Tagihan', 'Tanggal', 'Waktu', 'Dibayar Pada'];
    const csvRows = [
        headers.join(','),
        ...transactionHistory.map(t => [
            t.id,
            getStatusText(t.status),
            t.originalAmount,
            t.fee,
            t.totalAmount,
            formatDate(t.createdAt),
            formatTime(t.createdAt),
            t.paidAt ? `${formatDate(t.paidAt)} ${formatTime(t.paidAt)}` : ''
        ].join(','))
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    
    // Create download link
    const link = document.createElement('a');
    const timestamp = new Date().getTime();
    link.href = url;
    link.download = `anggazyy-pay-history-${timestamp}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    console.log('History exported');
}

// Initialize transaction chart
function initTransactionChart() {
    const ctx = document.getElementById('transactionChart').getContext('2d');
    
    // Get data for chart
    const last7Days = getLast7Days();
    const chartData = getChartData(last7Days);
    
    transactionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: last7Days.map(day => formatChartDate(day)),
            datasets: [
                {
                    label: 'Transaksi Berhasil',
                    data: chartData.success,
                    backgroundColor: '#00ff88',
                    borderColor: '#00cc6a',
                    borderWidth: 1
                },
                {
                    label: 'Transaksi Expired',
                    data: chartData.expired,
                    backgroundColor: '#ff6b6b',
                    borderColor: '#ff4757',
                    borderWidth: 1
                },
                {
                    label: 'Transaksi Pending',
                    data: chartData.pending,
                    backgroundColor: '#ffa502',
                    borderColor: '#ff8c00',
                    borderWidth: 1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        color: '#fff'
                    }
                }
            }
        }
    });
}

// Get last 7 days
function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        days.push(date);
    }
    return days;
}

// Get chart data
function getChartData(days) {
    const success = [];
    const expired = [];
    const pending = [];
    
    days.forEach(day => {
        const dayStart = new Date(day);
        dayStart.setHours(0, 0, 0, 0);
        
        const dayEnd = new Date(day);
        dayEnd.setHours(23, 59, 59, 999);
        
        const dayTransactions = transactionHistory.filter(t => {
            const transactionDate = new Date(t.createdAt);
            return transactionDate >= dayStart && transactionDate <= dayEnd;
        });
        
        success.push(dayTransactions.filter(t => t.status === 'success').length);
        expired.push(dayTransactions.filter(t => t.status === 'expired').length);
        pending.push(dayTransactions.filter(t => t.status === 'pending').length);
    });
    
    return { success, expired, pending };
}

// Format chart date
function formatChartDate(date) {
    return date.toLocaleDateString('id-ID', { weekday: 'short' });
}

// Update transaction chart
function updateTransactionChart() {
    if (!transactionChart) return;
    
    const last7Days = getLast7Days();
    const chartData = getChartData(last7Days);
    
    transactionChart.data.labels = last7Days.map(day => formatChartDate(day));
    transactionChart.data.datasets[0].data = chartData.success;
    transactionChart.data.datasets[1].data = chartData.expired;
    transactionChart.data.datasets[2].data = chartData.pending;
    
    transactionChart.update();
}

// Inisialisasi saat DOM dimuat
document.addEventListener('DOMContentLoaded', init);

// Tambahkan animasi background dinamis
document.addEventListener('DOMContentLoaded', () => {
    console.log('Menambahkan animasi background...');
    
    const heroSection = document.querySelector('.hero-section');
    
    // Buat floating elements untuk background
    for (let i = 0; i < 15; i++) {
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