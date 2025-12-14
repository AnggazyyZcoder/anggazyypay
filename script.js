// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Loading screen functionality
    const loadingScreen = document.getElementById('loading-screen');
    
    // Hide loading screen after 3 seconds
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        loadingScreen.style.visibility = 'hidden';
    }, 3000);

    // Initialize all components
    initSmoothScroll();
    initStatsCounter();
    initPaymentToggles();
    initCopyButtons();
    initQRISFunctionality();
    initNavigation();
    initDarkModeToggle();
    initToastNotifications();
    
    // Start transaction button
    document.getElementById('start-transaction').addEventListener('click', function() {
        document.getElementById('payment').scrollIntoView({ behavior: 'smooth' });
        
        // Open first payment method
        const firstPayment = document.querySelector('.payment-header');
        if (firstPayment && !firstPayment.classList.contains('active')) {
            togglePaymentDetails(firstPayment);
        }
    });
});

// Smooth scrolling for anchor links
function initSmoothScroll() {
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
}

// Animated stats counter
function initStatsCounter() {
    const statNumbers = document.querySelectorAll('.stat-number');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const statNumber = entry.target;
                const target = parseInt(statNumber.getAttribute('data-count'));
                const isDecimal = target.toString().includes('.');
                
                animateCounter(statNumber, target, isDecimal ? 1000 : 2000);
                observer.unobserve(statNumber);
            }
        });
    }, { threshold: 0.5 });
    
    statNumbers.forEach(stat => observer.observe(stat));
}

function animateCounter(element, target, duration) {
    const start = 0;
    const increment = target / (duration / 16); // 60fps
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            element.textContent = target.toFixed(1);
            clearInterval(timer);
        } else {
            element.textContent = Math.floor(current).toLocaleString();
        }
    }, 16);
}

// Payment details toggle functionality
function initPaymentToggles() {
    const paymentHeaders = document.querySelectorAll('.payment-header');
    
    paymentHeaders.forEach(header => {
        header.addEventListener('click', function() {
            togglePaymentDetails(this);
        });
        
        // Add close button functionality
        const closeBtn = header.nextElementSibling.querySelector('.close-details');
        if (closeBtn) {
            closeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                togglePaymentDetails(header);
            });
        }
    });
}

function togglePaymentDetails(header) {
    const details = header.nextElementSibling;
    const icon = header.querySelector('.toggle-details');
    
    if (details.classList.contains('active')) {
        details.classList.remove('active');
        header.classList.remove('active');
        icon.style.transform = 'rotate(0deg)';
    } else {
        // Close all other open payments
        document.querySelectorAll('.payment-details.active').forEach(activeDetail => {
            activeDetail.classList.remove('active');
            activeDetail.previousElementSibling.classList.remove('active');
            activeDetail.previousElementSibling.querySelector('.toggle-details').style.transform = 'rotate(0deg)';
        });
        
        details.classList.add('active');
        header.classList.add('active');
        icon.style.transform = 'rotate(180deg)';
        
        // Special handling for QRIS
        if (header.getAttribute('data-method') === 'qris') {
            initQRISFlow();
        }
    }
}

// Copy buttons functionality
function initCopyButtons() {
    document.querySelectorAll('.copy-btn').forEach(button => {
        button.addEventListener('click', function() {
            const textToCopy = this.getAttribute('data-text') || 
                              this.parentElement.querySelector('span').textContent;
            
            copyToClipboard(textToCopy);
            showToast('Teks berhasil disalin ke clipboard!');
        });
    });
}

function copyToClipboard(text) {
    const tempInput = document.createElement('input');
    tempInput.value = text;
    document.body.appendChild(tempInput);
    tempInput.select();
    document.execCommand('copy');
    document.body.removeChild(tempInput);
}

// QRIS functionality
function initQRISFunctionality() {
    // QRIS specific initialization
    const qrisHeader = document.querySelector('.payment-header[data-method="qris"]');
    if (qrisHeader) {
        qrisHeader.addEventListener('click', function() {
            // Already handled in togglePaymentDetails
        });
    }
    
    // Generate QRIS button
    const generateBtn = document.getElementById('generate-qris');
    if (generateBtn) {
        generateBtn.addEventListener('click', generateQRIS);
    }
    
    // I have paid button
    const paidBtn = document.getElementById('i-have-paid');
    if (paidBtn) {
        paidBtn.addEventListener('click', function() {
            window.open('https://wa.me/62882020034316', '_blank');
        });
    }
    
    // Download QRIS button
    const downloadBtn = document.getElementById('download-qris');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', downloadQRIS);
    }
    
    // Copy transaction ID button
    const copyTrxBtn = document.getElementById('copy-trx');
    if (copyTrxBtn) {
        copyTrxBtn.addEventListener('click', function() {
            const trxId = document.getElementById('trx-id').textContent;
            copyToClipboard(trxId);
            showToast('ID Transaksi berhasil disalin!');
        });
    }
}

let qrisExpiryTimer = null;
let currentTrxId = null;

function initQRISFlow() {
    const qrisInput = document.getElementById('qris-input');
    const qrisLoading = document.getElementById('qris-loading');
    const qrisResult = document.getElementById('qris-result');
    
    // Show loading for 3 seconds
    qrisLoading.style.display = 'block';
    qrisInput.style.display = 'none';
    qrisResult.style.display = 'none';
    
    setTimeout(() => {
        qrisLoading.style.display = 'none';
        qrisInput.style.display = 'block';
        
        // Clear any existing expiry timer
        if (qrisExpiryTimer) {
            clearInterval(qrisExpiryTimer);
            qrisExpiryTimer = null;
        }
    }, 3000);
}

async function generateQRIS() {
    const amountInput = document.getElementById('qris-amount');
    const amount = parseInt(amountInput.value);
    
    if (!amount || amount < 10000) {
        showToast('Masukkan nominal minimal Rp 10,000');
        amountInput.focus();
        return;
    }
    
    const generateBtn = document.getElementById('generate-qris');
    const qrisInput = document.getElementById('qris-input');
    const qrisResult = document.getElementById('qris-result');
    
    // Show loading state
    generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Memproses...';
    generateBtn.disabled = true;
    
    try {
        // Generate random transaction ID
        currentTrxId = 'TRX-' + Math.floor(1000 + Math.random() * 9000);
        document.getElementById('trx-id').textContent = currentTrxId;
        
        // Prepare API request data
        const qrisData = {
            amount: amount.toString(),
            qris_statis: "00020101021126610014COM.GO-JEK.WWW01189360091438478660180210G8478660180303UMI51440014ID.CO.QRIS.WWW0215ID10254635735230303UMI5204581653033605802ID5912Anggazyy Pay6008MINAHASA61059566162070703A0163041DD9"
        };
        
        // Make API call to QRIS generator
        const response = await fetch('https://qrisku.my.id/api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(qrisData)
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
            // Convert base64 to image
            const qrisImage = document.getElementById('qris-image');
            qrisImage.src = 'data:image/png;base64,' + data.qris_base64;
            
            // Show result section
            qrisInput.style.display = 'none';
            qrisResult.style.display = 'block';
            
            // Start expiry timer (5 minutes)
            startExpiryTimer(5 * 60);
            
            showToast('QRIS berhasil digenerate!');
        } else {
            throw new Error(data.message || 'Gagal generate QRIS');
        }
    } catch (error) {
        console.error('Error generating QRIS:', error);
        showToast('Gagal generate QRIS. Silakan coba lagi.');
    } finally {
        // Reset button state
        generateBtn.innerHTML = '<i class="fas fa-qrcode"></i> Generate QRIS';
        generateBtn.disabled = false;
    }
}

function startExpiryTimer(seconds) {
    const timerElement = document.getElementById('expiry-timer');
    const qrisResult = document.getElementById('qris-result');
    const qrisInput = document.getElementById('qris-input');
    
    let remainingSeconds = seconds;
    
    // Clear any existing timer
    if (qrisExpiryTimer) {
        clearInterval(qrisExpiryTimer);
    }
    
    // Update timer immediately
    updateTimerDisplay(timerElement, remainingSeconds);
    
    // Start countdown
    qrisExpiryTimer = setInterval(() => {
        remainingSeconds--;
        updateTimerDisplay(timerElement, remainingSeconds);
        
        if (remainingSeconds <= 0) {
            clearInterval(qrisExpiryTimer);
            qrisExpiryTimer = null;
            
            // Hide QRIS result and show input again
            qrisResult.style.display = 'none';
            qrisInput.style.display = 'block';
            
            // Clear QRIS image
            document.getElementById('qris-image').src = '';
            
            // Clear amount input
            document.getElementById('qris-amount').value = '';
            
            showToast('QRIS telah expired. Silakan generate ulang.');
        }
    }, 1000);
}

function updateTimerDisplay(element, seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    element.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function downloadQRIS() {
    const qrisImage = document.getElementById('qris-image');
    const trxId = document.getElementById('trx-id').textContent;
    
    if (!qrisImage.src) {
        showToast('Tidak ada QRIS untuk diunduh');
        return;
    }
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = qrisImage.src;
    link.download = `QRIS-${trxId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showToast('QRIS berhasil diunduh!');
}

// Navigation functionality
function initNavigation() {
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-links a');
    
    // Highlight active section in navigation
    window.addEventListener('scroll', () => {
        let current = '';
        const scrollPosition = window.scrollY + 100;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

// Dark mode toggle (just for show in this case since theme is dark)
function initDarkModeToggle() {
    const toggleBtn = document.querySelector('.dark-mode-toggle');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            const icon = this.querySelector('i');
            const isDark = icon.classList.contains('fa-moon');
            
            if (isDark) {
                icon.classList.remove('fa-moon');
                icon.classList.add('fa-sun');
                showToast('Mode terang diaktifkan (simulasi)');
            } else {
                icon.classList.remove('fa-sun');
                icon.classList.add('fa-moon');
                showToast('Mode gelap diaktifkan');
            }
            
            // Add a quick animation
            this.style.transform = 'scale(1.2)';
            setTimeout(() => {
                this.style.transform = 'scale(1)';
            }, 300);
        });
    }
}

// Toast notifications
function initToastNotifications() {
    // Function is defined below as showToast
}

function showToast(message) {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    toastMessage.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Add fade-in animation on scroll
const fadeElements = document.querySelectorAll('.fade-in');
const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animationPlayState = 'running';
            fadeObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.1 });

fadeElements.forEach(element => {
    element.style.animationPlayState = 'paused';
    fadeObserver.observe(element);
});

// Add some interactive effects to payment cards
document.querySelectorAll('.payment-card').forEach(card => {
    card.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-10px) scale(1.02)';
    });
    
    card.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
});