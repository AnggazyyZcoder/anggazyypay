// Inisialisasi
document.addEventListener('DOMContentLoaded', function() {
    // Simpan QRIS utama di localStorage
    const qrisUtama = '00020101021126610014COM.GO-JEK.WWW01189360091438478660180210G8478660180303UMI51440014ID.CO.QRIS.WWW0215ID10254635735230303UMI5204581653033605802ID5912Anggazyy Pay6008MINAHASA61059566162070703A0163041DD9';
    localStorage.setItem('QRIS_Utama', qrisUtama);

    // Loading Screen
    const loadingScreen = document.getElementById('loadingScreen');
    const loadingProgress = document.querySelector('.loading-progress');
    
    // Animate loading bar
    loadingProgress.style.width = '100%';
    
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

    // Event listener untuk menu toggle
    document.getElementById('menuToggle').addEventListener('click', function() {
        const paymentSection = document.getElementById('paymentSection');
        if (paymentSection.style.display === 'none') {
            paymentSection.style.display = 'block';
        }
        paymentSection.scrollIntoView({ behavior: 'smooth' });
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
                    const icon = c.querySelector('.toggle-icon');
                    icon.style.transform = 'rotate(0deg)';
                    icon.style.color = '';
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
                            <button class="btn-qris" id="openQRISModalBtn">
                                <i class="fas fa-bolt"></i>
                                <span>Buka QRIS Generator</span>
                            </button>
                        </div>
                    `;
                    
                    // Tambah event listener untuk tombol QRIS
                    document.getElementById('openQRISModalBtn').addEventListener('click', openQRISModal);
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
    
    // Tambah event listener untuk tombol buka modal QRIS
    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'openQRISModalBtn') {
            openQRISModal();
        }
    });
    
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
    
    // Reset input
    document.getElementById('amountInput').value = '';
    
    // Tampilkan loading selama 3 detik
    setTimeout(() => {
        document.getElementById('qrisLoading').style.display = 'none';
        document.getElementById('qrisInput').style.display = 'block';
        document.getElementById('amountInput').focus();
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
        amountInput.style.borderColor = '#FF6B8B';
        setTimeout(() => {
            amountInput.style.borderColor = '#8A2BE2';
        }, 2000);
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
            // Tampilkan fallback
            document.getElementById('qrisLoading').style.display = 'none';
            document.getElementById('qrisResult').style.display = 'block';
        }
    }, 3000);
}

// QRIS API Function
async function qris(id, harga) {
    try {
        console.log('Mengirim request ke API QRIS...');
        const response = await fetch(`https://api-mininxd.vercel.app/qris?qris=${encodeURIComponent(id)}&nominal=${harga}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Response API:', data);
        
        // Jika API error, gunakan fallback
        if (data.error || data.messages) {
            console.warn('API mengembalikan error, menggunakan fallback...');
            return getFallbackQRData(id, harga);
        }
        
        return data;
    } catch(e) {
        console.error('API Error:', e);
        return getFallbackQRData(id, harga);
    }
}

// Fallback QR Data jika API gagal
function getFallbackQRData(id, harga) {
    return { 
        qr: id, // Gunakan QRIS utama sebagai fallback
        merchant: 'Anggazyy Pay',
        amount: harga
    };
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
        
        console.log('QR String untuk generate:', qrString.substring(0, 50) + '...');
        
        // Tampilkan nama merchant jika ada
        if (data.merchant) {
            document.getElementById('displayMerchantName').textContent = data.merchant;
            document.getElementById('merchantDisplay').style.display = 'flex';
        }
        
        // Render QR Code
        const qrContainer = document.getElementById('qrContainer');
        qrContainer.innerHTML = '';
        
        // Cek jika QRCode library tersedia
        if (typeof QRCode === 'undefined') {
            console.warn('QRCode library tidak terload! Menggunakan fallback...');
            // Fallback: Gunakan Google Charts API
            const qrImageUrl = `https://chart.googleapis.com/chart?cht=qr&chs=240x240&chl=${encodeURIComponent(qrString)}&choe=UTF-8&chld=H|0`;
            qrContainer.innerHTML = `<img src="${qrImageUrl}" alt="QR Code" style="width:240px;height:240px;border-radius:10px;">`;
        } else {
            try {
                // Gunakan library QRCode
                await QRCode.toCanvas(qrContainer, qrString, {
                    width: 240,
                    margin: 2,
                    color: {
                        dark: '#1A1D3D',
                        light: '#FFFFFF'
                    },
                    errorCorrectionLevel: 'H'
                });
                
                console.log('QR Code berhasil digenerate');
            } catch (qrError) {
                console.error('QR Code generation error:', qrError);
                // Fallback ke Google Charts
                const qrImageUrl = `https://chart.googleapis.com/chart?cht=qr&chs=240x240&chl=${encodeURIComponent(qrString)}&choe=UTF-8&chld=H|0`;
                qrContainer.innerHTML = `<img src="${qrImageUrl}" alt="QR Code" style="width:240px;height:240px;border-radius:10px;">`;
            }
        }
        
        // Tampilkan hasil
        document.getElementById('qrisLoading').style.display = 'none';
        document.getElementById('qrisResult').style.display = 'block';
        document.getElementById('actionButtons').style.display = 'grid';
        
        // Mulai countdown 5 menit
        startCountdown(5 * 60); // 5 menit dalam detik
        
        showMessage('QRIS berhasil digenerate!');
        
    } catch (error) {
        console.error('Generate QRIS Error:', error);
        
        // Fallback: Tampilkan QRIS dengan Google Charts
        const qrContainer = document.getElementById('qrContainer');
        const qrString = qrisUtama || 'https://chart.googleapis.com/chart?cht=qr&chs=240x240&chl=QRIS_FALLBACK&choe=UTF-8';
        qrContainer.innerHTML = `<img src="https://chart.googleapis.com/chart?cht=qr&chs=240x240&chl=${encodeURIComponent(qrString)}&choe=UTF-8&chld=H|0" alt="QR Code" style="width:240px;height:240px;border-radius:10px;">`;
        
        document.getElementById('qrisLoading').style.display = 'none';
        document.getElementById('qrisResult').style.display = 'block';
        document.getElementById('actionButtons').style.display = 'grid';
        
        startCountdown(5 * 60);
        
        showMessage('Menggunakan fallback QR generator');
    }
}

function startCountdown(seconds) {
    const timerElement = document.getElementById('countdownTimer');
    let remaining = seconds;
    
    if (countdownInterval) clearInterval(countdownInterval);
    
    // Update segera
    updateTimerDisplay(timerElement, remaining);
    
    countdownInterval = setInterval(() => {
        remaining--;
        updateTimerDisplay(timerElement, remaining);
        
        if (remaining <= 0) {
            clearInterval(countdownInterval);
            showMessage('QRIS telah kedaluwarsa!');
            closeQRISModal();
        }
    }, 1000);
}

function updateTimerDisplay(element, seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    element.textContent = `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
    // Ubah warna saat mendekati habis
    if (seconds < 60) {
        element.style.color = '#FF6B8B';
    } else if (seconds < 120) {
        element.style.color = '#FFB74D';
    } else {
        element.style.color = '#00FFAA';
    }
}

function downloadQR() {
    if (!currentQRData) {
        showMessage('Tidak ada QR Code untuk didownload');
        return;
    }
    
    try {
        const canvas = document.querySelector('#qrContainer canvas');
        let imageUrl;
        
        if (canvas) {
            // Download dari canvas
            imageUrl = canvas.toDataURL('image/png');
        } else {
            // Download dari img tag (fallback)
            const img = document.querySelector('#qrContainer img');
            if (img) {
                imageUrl = img.src;
            } else {
                throw new Error('Tidak ditemukan elemen QR Code');
            }
        }
        
        const link = document.createElement('a');
        link.download = `QRIS-AnggazyyPay-${currentTrxId}.png`;
        link.href = imageUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showMessage('QRIS berhasil didownload!');
    } catch (error) {
        console.error('Download error:', error);
        showMessage('Gagal mendownload QRIS: ' + error.message);
    }
}

function copyTrxId() {
    if (!currentTrxId) {
        showMessage('ID Transaksi belum digenerate');
        return;
    }
    
    navigator.clipboard.writeText(currentTrxId)
        .then(() => showMessage('ID Transaksi disalin ke clipboard!'))
        .catch((err) => {
            console.error('Copy error:', err);
            showMessage('Gagal menyalin ID Transaksi');
        });
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
        const copyBtn = e.target.closest('.btn-copy');
        if (copyBtn) {
            const text = copyBtn.dataset.clipboardText;
            
            navigator.clipboard.writeText(text)
                .then(() => showMessage('Nomor rekening disalin ke clipboard!'))
                .catch((err) => {
                    console.error('Copy error:', err);
                    showMessage('Gagal menyalin nomor rekening');
                });
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
        const targetId = this.getAttribute('href');
        if (targetId === '#' || !targetId) return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            e.preventDefault();
            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Handle keyboard events
document.addEventListener('keydown', function(e) {
    // ESC untuk close modal
    if (e.key === 'Escape') {
        closeQRISModal();
    }
    
    // Enter pada input amount
    if (e.key === 'Enter' && document.getElementById('amountInput') === document.activeElement) {
        confirmAmount();
    }
});