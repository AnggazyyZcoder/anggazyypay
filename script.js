// Inisialisasi
document.addEventListener('DOMContentLoaded', function() {
    // Simpan QRIS utama di localStorage
    const qrisUtama = '00020101021126610014COM.GO-JEK.WWW01189360091438478660180210G8478660180303UMI51440014ID.CO.QRIS.WWW0215ID10254635735230303UMI5204581653033605802ID5912Anggazyy Pay6008MINAHASA61059566162070703A0163041DD9';
    localStorage.setItem('QRIS_Utama', qrisUtama);

    // Loading Screen
    const loadingScreen = document.getElementById('loadingScreen');
    setTimeout(() => {
        loadingScreen.style.transition = 'opacity 0.8s ease';
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            document.body.style.overflow = 'auto';
            // Animasi fade in untuk konten
            document.querySelectorAll('.animate__animated').forEach(el => {
                el.style.opacity = '1';
            });
        }, 800);
    }, 3000);

    // Initialize components
    initPaymentCards();
    initQRIS();
    initStats();
    initCopyButtons();
    initScrollAnimations();

    // Event listener untuk tombol "Mulai Bertransaksi"
    document.getElementById('startBtn').addEventListener('click', function() {
        document.getElementById('paymentSection').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
        // Tambah efek animasi
        this.classList.add('animate__pulse');
        setTimeout(() => this.classList.remove('animate__pulse'), 1000);
    });
});

// Payment Cards Toggle
function initPaymentCards() {
    const paymentCards = document.querySelectorAll('.payment-card');
    
    paymentCards.forEach(card => {
        const header = card.querySelector('.payment-header');
        const toggleIcon = card.querySelector('.toggle-icon');
        
        header.addEventListener('click', function() {
            const isActive = card.classList.contains('active');
            
            // Tutup semua card lainnya
            paymentCards.forEach(c => {
                if (c !== card) {
                    c.classList.remove('active');
                    c.querySelector('.toggle-icon').style.transform = 'rotate(0deg)';
                }
            });
            
            // Toggle card saat ini
            card.classList.toggle('active');
            
            if (card.classList.contains('active')) {
                toggleIcon.style.transform = 'rotate(180deg)';
                toggleIcon.style.color = '#00FFAA';
                
                // Jika QRIS card dibuka
                if (card.dataset.method === 'qris') {
                    const qrisContainer = card.querySelector('.qris-container');
                    qrisContainer.innerHTML = `
                        <div style="text-align: center; padding: 20px;">
                            <i class="fas fa-qrcode" style="font-size: 3rem; color: #00FFAA; margin-bottom: 15px;"></i>
                            <p style="color: #A0A6D0; margin-bottom: 20px;">Klik tombol di bawah untuk generate QRIS dinamis</p>
                            <button class="btn-qris" id="openQRISModal">
                                <i class="fas fa-bolt"></i>
                                <span>Buka QRIS Generator</span>
                            </button>
                        </div>
                    `;
                    document.getElementById('openQRISModal').addEventListener('click', openQRISModal);
                }
            } else {
                toggleIcon.style.transform = 'rotate(0deg)';
                toggleIcon.style.color = '';
            }
        });
    });
}

// QRIS System
let currentQRData = null;
let payAmount = 0;
let countdownInterval = null;
let currentTrxId = '';

function initQRIS() {
    // Event listener untuk modal QRIS
    document.getElementById('closeQRISModal').addEventListener('click', closeQRISModal);
    document.getElementById('confirmAmountBtn').addEventListener('click', confirmAmount);
    document.getElementById('downloadQRBtn').addEventListener('click', downloadQR);
    document.getElementById('copyTrxId').addEventListener('click', copyTrxId);
    
    // Update link WhatsApp dengan ID transaksi
    const paidBtn = document.getElementById('paidBtn');
    paidBtn.addEventListener('click', function(e) {
        const message = `Halo saya sudah melakukan pembayaran dengan ID transaksi: ${currentTrxId}`;
        this.href = `https://wa.me/62882020034316?text=${encodeURIComponent(message)}`;
    });
}

function openQRISModal() {
    const modal = document.getElementById('qrisModal');
    modal.style.display = 'flex';
    
    // Reset state
    document.getElementById('qrisLoading').style.display = 'flex';
    document.getElementById('qrisInput').style.display = 'none';
    document.getElementById('qrisResult').style.display = 'none';
    document.getElementById('actionButtons').style.display = 'none';
    document.getElementById('merchantDisplay').style.display = 'none';
    
    // Tampilkan loading selama 3 detik
    setTimeout(() => {
        document.getElementById('qrisLoading').style.display = 'none';
        document.getElementById('qrisInput').style.display = 'block';
    }, 3000);
}

function closeQRISModal() {
    const modal = document.getElementById('qrisModal');
    modal.style.display = 'none';
    
    // Hentikan countdown
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

function confirmAmount() {
    const amountInput = document.getElementById('amountInput');
    const amount = parseInt(amountInput.value);
    
    if (isNaN(amount) || amount < 10000) {
        showMessage('Minimal nominal adalah Rp 10.000');
        amountInput.focus();
        return;
    }
    
    payAmount = amount;
    
    // Tampilkan loading
    document.getElementById('qrisInput').style.display = 'none';
    document.getElementById('qrisLoading').style.display = 'flex';
    document.getElementById('qrisLoading').querySelector('.loading-text').textContent = 'Mengirim permintaan ke API...';
    
    // Generate ID transaksi
    currentTrxId = 'TRX-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    document.getElementById('trxId').textContent = currentTrxId;
    
    // Simulasi API call selama 3 detik
    setTimeout(async () => {
        try {
            await generateQRIS();
        } catch (error) {
            showMessage('Gagal generate QRIS: ' + error.message);
        }
    }, 3000);
}

// QRIS API Function
async function qris(id, harga) {
    try {
        const response = await fetch(`https://api-mininxd.vercel.app/qris?qris=${encodeURIComponent(id)}&nominal=${harga}`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch(e) {
        console.error('API Error:', e);
        return { 
            qr: 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=' + encodeURIComponent(id),
            merchant: 'Anggazyy Pay'
        };
    }
}

// Generate QRIS
async function generateQRIS() {
    const qrisUtama = localStorage.getItem('QRIS_Utama');
    
    try {
        // Format currency
        document.getElementById('amountDisplay').textContent = formatCurrency(payAmount);
        
        // Panggil API QRIS
        const data = await qris(qrisUtama, payAmount);
        
        if (!data) {
            throw new Error('Tidak ada data dari API');
        }
        
        // Ambil string QR dari respons API
        const qrString = data.QR || data.qr || data.qris || qrisUtama;
        currentQRData = qrString;
        
        // Tampilkan nama merchant jika ada
        if (data.merchant) {
            document.getElementById('displayMerchantName').textContent = data.merchant;
            document.getElementById('merchantDisplay').style.display = 'flex';
        }
        
        // Render QR Code menggunakan library QRCode
        const qrContainer = document.getElementById('qrContainer');
        qrContainer.innerHTML = '';
        
        QRCode.toCanvas(qrContainer, qrString, {
            width: 240,
            margin: 2,
            color: {
                dark: '#1A1D3D',
                light: '#FFFFFF'
            },
            errorCorrectionLevel: 'H'
        }, function(error) {
            if (error) {
                console.error('QR Code Error:', error);
                qrContainer.innerHTML = `
                    <div style="text-align: center; padding: 40px;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #FF6B8B;"></i>
                        <p style="color: #A0A6D0; margin-top: 15px;">Gagal membuat QR Code</p>
                    </div>
                `;
            }
        });
        
        // Tampilkan hasil
        document.getElementById('qrisLoading').style.display = 'none';
        document.getElementById('qrisResult').style.display = 'block';
        document.getElementById('actionButtons').style.display = 'grid';
        
        // Mulai countdown 5 menit
        startCountdown(5 * 60); // 5 menit dalam detik
        
    } catch (error) {
        console.error('Generate QRIS Error:', error);
        document.getElementById('qrisLoading').style.display = 'none';
        document.getElementById('qrisResult').innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <i class="fas fa-exclamation-circle" style="font-size: 3rem; color: #FF6B8B; margin-bottom: 20px;"></i>
                <p style="color: #A0A6D0; margin-bottom: 15px;">Gagal membuat QR Code</p>
                <p style="color: #FF6B8B; font-size: 0.9rem;">${error.message}</p>
                <button onclick="confirmAmount()" class="btn-generate" style="margin-top: 20px;">
                    <i class="fas fa-redo"></i>
                    <span>Coba Lagi</span>
                </button>
            </div>
        `;
        showMessage('Terjadi kesalahan: ' + error.message);
    }
}

function startCountdown(seconds) {
    const timerElement = document.getElementById('countdownTimer');
    let remaining = seconds;
    
    if (countdownInterval) clearInterval(countdownInterval);
    
    countdownInterval = setInterval(() => {
        const minutes = Math.floor(remaining / 60);
        const secs = remaining % 60;
        
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        
        if (remaining <= 0) {
            clearInterval(countdownInterval);
            showMessage('QRIS telah kedaluwarsa!');
            closeQRISModal();
        }
        
        remaining--;
    }, 1000);
}

function downloadQR() {
    if (!currentQRData) {
        showMessage('Tidak ada QR Code untuk didownload');
        return;
    }
    
    const canvas = document.querySelector('#qrContainer canvas');
    if (!canvas) {
        showMessage('Canvas QR Code tidak ditemukan');
        return;
    }
    
    const link = document.createElement('a');
    link.download = `QRIS-AnggazyyPay-${currentTrxId}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showMessage('QRIS berhasil didownload!');
}

function copyTrxId() {
    navigator.clipboard.writeText(currentTrxId)
        .then(() => showMessage('ID Transaksi disalin ke clipboard!'))
        .catch(() => showMessage('Gagal menyalin ID Transaksi'));
}

// Stats Animation
function initStats() {
    // Animasikan angka total transaksi
    const totalTransactions = document.getElementById('totalTransactions');
    const totalTestimonials = document.getElementById('totalTestimonials');
    
    animateValue(totalTransactions, 0, 400, 2000);
    animateValue(totalTestimonials, 0, 500, 2000);
}

function animateValue(element, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        const value = Math.floor(progress * (end - start) + start);
        element.textContent = value + (element.id === 'totalTransactions' ? '+' : '+');
        
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Copy Buttons
function initCopyButtons() {
    // Salin nomor rekening
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('btn-copy') || e.target.closest('.btn-copy')) {
            const button = e.target.classList.contains('btn-copy') ? e.target : e.target.closest('.btn-copy');
            const text = button.dataset.clipboardText;
            
            navigator.clipboard.writeText(text)
                .then(() => showMessage('Nomor rekening disalin ke clipboard!'))
                .catch(() => showMessage('Gagal menyalin nomor rekening'));
        }
    });
}

// Scroll Animations
function initScrollAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate__fadeInUp');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);
    
    // Amati semua card
    document.querySelectorAll('.payment-card, .stat-card, .supported-item').forEach(el => {
        observer.observe(el);
    });
}

// Helper Functions
function formatCurrency(amount) {
    return 'Rp ' + amount.toLocaleString('id-ID');
}

function showMessage(text) {
    const notification = document.getElementById('notification');
    const notificationText = document.getElementById('notificationText');
    
    notificationText.textContent = text;
    notification.style.display = 'flex';
    
    // Reset animation
    notification.style.animation = 'none';
    void notification.offsetWidth; // Trigger reflow
    notification.style.animation = 'slideInRight 0.3s ease, fadeOut 0.3s ease 2.7s forwards';
    
    setTimeout(() => {
        notification.style.display = 'none';
    }, 3000);
}

// Close modal ketika klik di luar
window.addEventListener('click', function(e) {
    const modal = document.getElementById('qrisModal');
    if (e.target === modal) {
        closeQRISModal();
    }
});

// Smooth scroll untuk semua anchor link
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});