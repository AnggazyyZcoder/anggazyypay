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
                    setTimeout(() => {
                        const btn = document.getElementById('openQRISModalBtn');
                        if (btn) {
                            btn.addEventListener('click', openQRISModal);
                        }
                    }, 100);
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
let currentQRBase64 = ''; // Simpan base64 untuk download

function initQRIS() {
    // Event listener untuk modal QRIS
    document.getElementById('closeQRISModal').addEventListener('click', closeQRISModal);
    document.getElementById('confirmAmountBtn').addEventListener('click', confirmAmount);
    document.getElementById('downloadQRBtn').addEventListener('click', downloadQR);
    document.getElementById('copyTrxId').addEventListener('click', copyTrxId);
    
    // Tambah event listener untuk tombol buka modal QRIS (jika sudah ada di DOM)
    setTimeout(() => {
        const openBtn = document.getElementById('openQRISModalBtn');
        if (openBtn) {
            openBtn.addEventListener('click', openQRISModal);
        }
    }, 500);
    
    // Update link WhatsApp dengan ID transaksi
    const paidBtn = document.getElementById('paidBtn');
    paidBtn.addEventListener('click', function(e) {
        if (!currentTrxId) {
            e.preventDefault();
            showMessage('ID Transaksi belum digenerate');
            return;
        }
        const message = `Halo saya sudah melakukan pembayaran dengan ID transaksi: ${currentTrxId}`;
        this.href = `https://wa.me/62882020034316?text=${encodeURIComponent(message)}`;
    });
}

// ============================================
// FUNGSI API QRISKU.MY.ID - DENGAN CORS PROXY
// ============================================
async function callQRISkuAPI(qrisStatic, nominal) {
    // Validasi input
    if (!qrisStatic || !nominal) {
        console.error('Parameter tidak lengkap:', { qrisStatic, nominal });
        throw new Error('Parameter QRIS dan nominal diperlukan');
    }
    
    // Payload sesuai dokumentasi API qrisku.my.id
    const payload = {
        amount: nominal.toString(), // Harus string
        qris_statis: qrisStatic
    };
    
    console.log('Mengirim request ke API qrisku.my.id:', payload);
    
    try {
        // COBA 1: Langsung ke API tanpa proxy
        try {
            console.log('Mencoba akses langsung ke API...');
            const directResponse = await fetch('https://qrisku.my.id/api', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Origin': window.location.origin
                },
                mode: 'cors',
                body: JSON.stringify(payload)
            });
            
            if (directResponse.ok) {
                const data = await directResponse.json();
                return processAPIResponse(data);
            }
        } catch (directError) {
            console.warn('Akses langsung gagal:', directError.message);
        }
        
        // COBA 2: Gunakan proxy CORS untuk menghindari blocked by CORS
        console.log('Mencoba dengan CORS proxy...');
        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        const targetUrl = 'https://qrisku.my.id/api';
        
        const response = await fetch(proxyUrl + encodeURIComponent(targetUrl), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            throw new Error(`Proxy API gagal! Status: ${response.status}`);
        }
        
        const data = await response.json();
        return processAPIResponse(data);
        
    } catch(e) {
        console.error('API qrisku.my.id Error:', e.message);
        throw new Error(`Gagal mengakses API: ${e.message}`);
    }
}

function processAPIResponse(data) {
    console.log('Response API diterima:', data);
    
    // Validasi respons API
    if (!data || typeof data !== 'object') {
        throw new Error('Respons API tidak valid');
    }
    
    if (data.status === 'error') {
        throw new Error(data.message || 'Gagal generate QRIS dari API');
    }
    
    if (!data.qris_base64) {
        throw new Error('API tidak mengembalikan gambar QRIS (qris_base64)');
    }
    
    return data;
}

function openQRISModal() {
    const modal = document.getElementById('qrisModal');
    if (!modal) {
        console.error('Modal QRIS tidak ditemukan!');
        return;
    }
    
    modal.style.display = 'flex';
    
    // Reset state
    document.getElementById('qrisLoading').style.display = 'flex';
    document.getElementById('qrisInput').style.display = 'none';
    document.getElementById('qrisResult').style.display = 'none';
    document.getElementById('actionButtons').style.display = 'none';
    document.getElementById('merchantDisplay').style.display = 'none';
    
    // Reset QR container
    const qrContainer = document.getElementById('qrContainer');
    if (qrContainer) {
        qrContainer.innerHTML = `
            <div class="qr-placeholder">
                <i class="fas fa-qrcode"></i>
                <p>QR Code akan muncul di sini</p>
            </div>
        `;
    }
    
    // Reset input
    const amountInput = document.getElementById('amountInput');
    if (amountInput) {
        amountInput.value = '';
    }
    
    // Tampilkan loading selama 3 detik
    setTimeout(() => {
        document.getElementById('qrisLoading').style.display = 'none';
        document.getElementById('qrisInput').style.display = 'block';
        if (amountInput) {
            amountInput.focus();
        }
    }, 3000);
}

function closeQRISModal() {
    const modal = document.getElementById('qrisModal');
    if (modal) {
        modal.style.display = 'none';
    }
    
    // Hentikan countdown
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

function confirmAmount() {
    const amountInput = document.getElementById('amountInput');
    if (!amountInput) {
        showMessage('Input nominal tidak ditemukan!');
        return;
    }
    
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
    const trxIdElement = document.getElementById('trxId');
    if (trxIdElement) {
        trxIdElement.textContent = currentTrxId;
    }
    
    // Panggil fungsi generateQRIS setelah 3 detik
    setTimeout(async () => {
        try {
            await generateQRISwithQRISku();
        } catch (error) {
            console.error('Error dalam generateQRIS:', error);
            showMessage('Gagal generate QRIS: ' + error.message);
            
            // Tampilkan fallback
            document.getElementById('qrisLoading').style.display = 'none';
            document.getElementById('qrisResult').style.display = 'block';
        }
    }, 3000);
}

// ============================================
// GENERATE QRIS DENGAN QRISKU.MY.ID
// ============================================
async function generateQRISwithQRISku() {
    const qrisUtama = localStorage.getItem('QRIS_Utama');
    
    if (!qrisUtama) {
        throw new Error('QRIS utama tidak ditemukan di localStorage');
    }
    
    try {
        // 1. Format dan tampilkan jumlah
        const amountDisplay = document.getElementById('amountDisplay');
        if (amountDisplay) {
            amountDisplay.textContent = formatCurrency(payAmount);
        }
        
        // 2. Panggil API qrisku.my.id
        const apiData = await callQRISkuAPI(qrisUtama, payAmount);
        
        // 3. Tampilkan nama merchant
        const merchantDisplay = document.getElementById('merchantDisplay');
        const merchantNameElement = document.getElementById('displayMerchantName');
        if (merchantDisplay && merchantNameElement) {
            merchantNameElement.textContent = 'Anggazyy Pay';
            merchantDisplay.style.display = 'flex';
        }
        
        // 4. TAMPILKAN GAMBAR QRIS DARI BASE64
        const qrContainer = document.getElementById('qrContainer');
        if (!qrContainer) {
            throw new Error('Container QR tidak ditemukan');
        }
        
        qrContainer.innerHTML = ''; // Kosongkan container
        
        // Validasi base64 string
        if (!apiData.qris_base64 || typeof apiData.qris_base64 !== 'string') {
            throw new Error('Data QRIS base64 tidak valid');
        }
        
        // Bersihkan base64 string (hapus awalan data URL jika ada)
        let base64Data = apiData.qris_base64;
        if (base64Data.startsWith('data:image')) {
            // Ekstrak base64 dari data URL
            const matches = base64Data.match(/^data:image\/[a-zA-Z]+;base64,(.+)$/);
            if (matches && matches[1]) {
                base64Data = matches[1];
            }
        }
        
        // Buat elemen gambar dari base64
        const qrImage = document.createElement('img');
        qrImage.src = `data:image/png;base64,${base64Data}`;
        qrImage.alt = 'QRIS Payment Code';
        qrImage.id = 'qrisImage';
        qrImage.style.width = '240px';
        qrImage.style.height = '240px';
        qrImage.style.borderRadius = '10px';
        qrImage.style.boxShadow = '0 5px 20px rgba(0,0,0,0.1)';
        qrImage.style.border = '2px solid var(--secondary)';
        
        // Tambah event untuk handle error gambar
        qrImage.onerror = function() {
            console.error('Gambar QRIS gagal dimuat');
            qrContainer.innerHTML = `
                <div style="text-align: center; padding: 30px; color: var(--danger);">
                    <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 15px;"></i>
                    <p>Gambar QRIS tidak dapat ditampilkan</p>
                    <button onclick="retryGenerateQRIS()" class="btn-generate" style="margin-top: 15px;">
                        <i class="fas fa-redo"></i> Coba Lagi
                    </button>
                </div>
            `;
        };
        
        qrImage.onload = function() {
            console.log('Gambar QRIS berhasil dimuat');
            qrContainer.style.opacity = '0';
            qrContainer.appendChild(qrImage);
            
            // Animasi fade in
            setTimeout(() => {
                qrContainer.style.transition = 'opacity 0.5s ease';
                qrContainer.style.opacity = '1';
            }, 100);
        };
        
        // Simpan data untuk download
        currentQRBase64 = base64Data;
        currentQRData = qrImage.src;
        
        // 5. Tampilkan hasil
        document.getElementById('qrisLoading').style.display = 'none';
        document.getElementById('qrisResult').style.display = 'block';
        document.getElementById('actionButtons').style.display = 'grid';
        
        // 6. Mulai countdown 5 menit
        startCountdown(5 * 60);
        
        showMessage('QRIS berhasil digenerate!');
        
    } catch (error) {
        console.error('Generate QRIS Error:', error);
        
        // ERROR HANDLING: Tampilkan pesan error yang user-friendly
        document.getElementById('qrisLoading').style.display = 'none';
        document.getElementById('qrisResult').innerHTML = `
            <div style="text-align: center; padding: 40px; color: #E2E4FF;">
                <i class="fas fa-exclamation-triangle" style="font-size: 3rem; color: #FFB74D; margin-bottom: 20px;"></i>
                <h4 style="color: #FFB74D; margin-bottom: 15px;">Gagal Generate QR Code</h4>
                <p style="margin: 10px 0; color: #A0A6D0; font-size: 0.9rem;">${error.message}</p>
                <div style="margin-top: 25px; display: flex; gap: 10px; justify-content: center;">
                    <button onclick="retryGenerateQRIS()" class="btn-generate" style="padding: 12px 24px;">
                        <i class="fas fa-redo"></i> Coba Lagi
                    </button>
                    <button onclick="useManualQRGenerator()" class="btn-qris" style="padding: 12px 24px;">
                        <i class="fas fa-wrench"></i> Gunakan Generator Manual
                    </button>
                    <button onclick="closeQRISModal()" class="btn-copy" style="padding: 12px 24px;">
                        <i class="fas fa-times"></i> Tutup
                    </button>
                </div>
            </div>
        `;
        
        showMessage('Error: ' + error.message);
    }
}

// Fungsi bantuan untuk retry
function retryGenerateQRIS() {
    document.getElementById('qrisResult').style.display = 'none';
    document.getElementById('qrisLoading').style.display = 'flex';
    setTimeout(() => {
        generateQRISwithQRISku();
    }, 1000);
}

// Fungsi fallback jika API gagal total
function useManualQRGenerator() {
    // Redirect atau buka generator manual
    window.open('https://qrisku.my.id/', '_blank');
    showMessage('Buka website qrisku.my.id secara manual');
    closeQRISModal();
}

function startCountdown(seconds) {
    const timerElement = document.getElementById('countdownTimer');
    if (!timerElement) return;
    
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
    if (!currentQRBase64) {
        showMessage('Tidak ada QR Code untuk didownload');
        return;
    }
    
    try {
        // Buat link download dari base64
        const link = document.createElement('a');
        link.download = `QRIS-AnggazyyPay-${currentTrxId || Date.now()}.png`;
        link.href = `data:image/png;base64,${currentQRBase64}`;
        
        // Simpan link di DOM, klik, lalu hapus
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
            // Fallback untuk browser lama
            const textArea = document.createElement('textarea');
            textArea.value = currentTrxId;
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                showMessage('ID Transaksi disalin!');
            } catch (e) {
                showMessage('Gagal menyalin ID Transaksi');
            }
            document.body.removeChild(textArea);
        });
}

// Stats Animation
function initStats() {
    // Animasikan angka total transaksi
    const totalTransactions = document.getElementById('totalTransactions');
    const totalTestimonials = document.getElementById('totalTestimonials');
    
    if (totalTransactions) animateValue(totalTransactions, 0, 400, 2000);
    if (totalTestimonials) animateValue(totalTestimonials, 0, 500, 2000);
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
        if (copyBtn && copyBtn.dataset.clipboardText) {
            const text = copyBtn.dataset.clipboardText;
            
            navigator.clipboard.writeText(text)
                .then(() => showMessage('Nomor rekening disalin ke clipboard!'))
                .catch((err) => {
                    console.error('Copy error:', err);
                    // Fallback untuk browser lama
                    const textArea = document.createElement('textarea');
                    textArea.value = text;
                    document.body.appendChild(textArea);
                    textArea.select();
                    try {
                        document.execCommand('copy');
                        showMessage('Nomor rekening disalin!');
                    } catch (e) {
                        showMessage('Gagal menyalin nomor rekening');
                    }
                    document.body.removeChild(textArea);
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
    
    if (!notification || !notificationText) {
        console.log('Notification:', text);
        return;
    }
    
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

// Debug info
console.log('Anggazyy Pay Script Loaded');
console.log('QRIS Utama tersimpan:', localStorage.getItem('QRIS_Utama') ? 'Ya' : 'Tidak');

// Fallback untuk browser yang tidak support IntersectionObserver
if (!('IntersectionObserver' in window)) {
    console.warn('IntersectionObserver tidak didukung, menggunakan fallback animation');
    setTimeout(() => {
        document.querySelectorAll('.payment-card, .stat-card, .supported-item').forEach(el => {
            el.classList.add('animate__fadeInUp');
        });
    }, 500);
}