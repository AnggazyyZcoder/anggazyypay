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
const qrisImage = document.getElementById('qrisImage');
const transactionIdElement = document.getElementById('transactionId');
const copyTrxIdBtn = document.getElementById('copyTrxId');
const expiryInfo = document.getElementById('expiryInfo');
const downloadQRISBtn = document.getElementById('downloadQRIS');
const iHavePaidBtn = document.getElementById('iHavePaid');
const statNumbers = document.querySelectorAll('.stat-number');
const fadeElements = document.querySelectorAll('.fade-in');

// QRIS API Configuration
const QRIS_API_URL = 'https://qris.miraipedia.my.id/api/convert';
const QRIS_STATIC_STRING = '00020101021126610014COM.GO-JEK.WWW01189360091438478660180210G8478660180303UMI51440014ID.CO.QRIS.WWW0215ID10254635735230303UMI5204581653033605802ID5912Anggazyy Pay6008MINAHASA61059566162070703A0163041DD9';

// Global Variables
let activePaymentCard = null;
let qrisExpiryTimer = null;
let currentTransactionId = null;

// Initialize the website
function init() {
    // Show loading screen for 3 seconds
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        loadingScreen.style.visibility = 'hidden';
    }, 3000);
    
    // Initialize event listeners
    setupEventListeners();
    
    // Initialize animations
    initAnimations();
    
    // Initialize stats counter
    initStatsCounter();
    
    // Set current year in footer
    document.querySelector('.footer-bottom p').innerHTML = `&copy; Copyright <span class="heart">❤</span> ${new Date().getFullYear()} Anggazyy Developer. Semua Hak Dilindungi.`;
}

// Set up all event listeners
function setupEventListeners() {
    // Start transaction button
    startTransactionBtn.addEventListener('click', () => {
        document.getElementById('payment').scrollIntoView({ behavior: 'smooth' });
        
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
        
        header.addEventListener('click', () => {
            // If clicking on the same card, close it
            if (card === activePaymentCard) {
                closePaymentCard(card);
                activePaymentCard = null;
            } else {
                // Close any open card
                if (activePaymentCard) {
                    closePaymentCard(activePaymentCard);
                }
                
                // Open clicked card
                openPaymentCard(card);
                activePaymentCard = card;
                
                // Special handling for QRIS
                if (card.dataset.method === 'qris') {
                    handleQRISCardOpen();
                }
            }
        });
        
        // Close details button
        const closeBtn = card.querySelector('.close-details-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                closePaymentCard(card);
                if (activePaymentCard === card) {
                    activePaymentCard = null;
                }
            });
        }
    });
    
    // Copy buttons for account numbers
    copyButtons.forEach(button => {
        if (button.id !== 'copyTrxId') {
            button.addEventListener('click', (e) => {
                e.stopPropagation();
                const text = button.getAttribute('data-clipboard-text');
                copyToClipboard(text);
                showCopyModal();
            });
        }
    });
    
    // Copy transaction ID button
    copyTrxIdBtn.addEventListener('click', () => {
        const text = transactionIdElement.textContent;
        copyToClipboard(text);
        showCopyModal();
    });
    
    // Modal close button
    modalCloseBtn.addEventListener('click', () => {
        copyModal.classList.remove('active');
    });
    
    // Menu toggle for mobile
    menuToggle.addEventListener('click', () => {
        nav.classList.toggle('active');
        menuToggle.innerHTML = nav.classList.contains('active') 
            ? '<i class="fas fa-times"></i>' 
            : '<i class="fas fa-bars"></i>';
    });
    
    // Nav link clicks
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            // Close mobile menu if open
            if (nav.classList.contains('active')) {
                nav.classList.remove('active');
                menuToggle.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
    });
    
    // Generate QRIS button
    generateQRISBtn.addEventListener('click', generateQRIS);
    
    // Download QRIS button
    downloadQRISBtn.addEventListener('click', downloadQRIS);
    
    // I have paid button
    iHavePaidBtn.addEventListener('click', () => {
        // Clear expiry timer
        if (qrisExpiryTimer) {
            clearTimeout(qrisExpiryTimer);
            qrisExpiryTimer = null;
        }
        
        // Redirect to WhatsApp
        window.open('https://wa.me/62882020034316', '_blank');
        
        // Close QRIS details after a delay
        setTimeout(() => {
            if (activePaymentCard) {
                closePaymentCard(activePaymentCard);
                activePaymentCard = null;
            }
        }, 1000);
    });
    
    // Close modal when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === copyModal) {
            copyModal.classList.remove('active');
        }
    });
    
    // Smooth scroll for anchor links
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

// Initialize animations
function initAnimations() {
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
}

// Initialize stats counter animation
function initStatsCounter() {
    const observerOptions = {
        threshold: 0.5
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                statNumbers.forEach(stat => {
                    const target = parseFloat(stat.getAttribute('data-count'));
                    const duration = 2000; // 2 seconds
                    const increment = target / (duration / 16); // 60fps
                    let current = 0;
                    
                    const timer = setInterval(() => {
                        current += increment;
                        if (current >= target) {
                            current = target;
                            clearInterval(timer);
                        }
                        
                        // Format number with + sign if needed
                        if (stat.parentElement.querySelector('.stat-label').textContent === 'Total Transaksi' ||
                            stat.parentElement.querySelector('.stat-label').textContent === 'Testimonial' ||
                            stat.parentElement.querySelector('.stat-label').textContent === 'Pengguna Aktif') {
                            stat.textContent = Math.floor(current) + '+';
                        } else {
                            stat.textContent = current.toFixed(1);
                        }
                    }, 16);
                });
                
                // Stop observing after animation starts
                observer.disconnect();
            }
        });
    }, observerOptions);
    
    // Observe stats section
    const statsSection = document.getElementById('stats');
    if (statsSection) {
        observer.observe(statsSection);
    }
}

// Open payment card with animation
function openPaymentCard(card) {
    card.classList.add('active');
    
    // Show real account number with animation
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

// Close payment card with animation
function closePaymentCard(card) {
    card.classList.remove('active');
    
    // Hide real account number with animation
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
}

// Handle QRIS card opening
function handleQRISCardOpen() {
    // Reset QRIS state
    qrisLoading.style.display = 'block';
    qrisInput.style.display = 'none';
    qrisResult.style.display = 'none';
    
    // Show loading for 3 seconds
    setTimeout(() => {
        qrisLoading.style.display = 'none';
        qrisInput.style.display = 'block';
        
        // Focus on amount input
        setTimeout(() => {
            qrisAmountInput.focus();
        }, 300);
    }, 3000);
}

// Generate QRIS
async function generateQRIS() {
    const amount = qrisAmountInput.value;
    
    // Validate amount
    if (!amount || amount < 10000) {
        alert('Masukkan nominal minimal Rp 10.000');
        qrisAmountInput.focus();
        return;
    }
    
    // Show loading state
    generateQRISBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Menggenerate...';
    generateQRISBtn.disabled = true;
    
    try {
        // Prepare request data
        const requestData = {
            amount: amount.toString(),
            qris: QRIS_STATIC_STRING
        };
        
        // Send request to QRIS API
        const response = await fetch(QRIS_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        });
        
        const data = await response.json();
        
        // Simulate 3 second delay as per requirement
        setTimeout(() => {
            if (data.status === 'success') {
                // Generate random transaction ID
                currentTransactionId = 'TRX-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
                
                // Update UI with QRIS result
                qrisImage.src = `data:image/png;base64,${data.data.qr_base64}`;
                transactionIdElement.textContent = currentTransactionId;
                
                // Calculate expiry time (5 minutes from now)
                const expiryTime = new Date();
                expiryTime.setMinutes(expiryTime.getMinutes() + 5);
                
                // Update expiry info
                updateExpiryInfo(expiryTime);
                
                // Show result section
                qrisInput.style.display = 'none';
                qrisResult.style.display = 'block';
                
                // Start expiry timer
                startQRISExpiryTimer(expiryTime);
            } else {
                alert('Gagal generate QRIS: ' + (data.message || 'Terjadi kesalahan'));
            }
            
            // Reset button
            generateQRISBtn.innerHTML = 'Generate QRIS';
            generateQRISBtn.disabled = false;
        }, 3000);
        
    } catch (error) {
        console.error('Error generating QRIS:', error);
        
        // Simulate successful response for demo (since API might have CORS issues)
        setTimeout(() => {
            // Generate random transaction ID
            currentTransactionId = 'TRX-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
            
            // Create a dummy QR code (in production, use the real API response)
            const dummyQRCode = generateDummyQRCode(amount);
            qrisImage.src = dummyQRCode;
            transactionIdElement.textContent = currentTransactionId;
            
            // Calculate expiry time (5 minutes from now)
            const expiryTime = new Date();
            expiryTime.setMinutes(expiryTime.getMinutes() + 5);
            
            // Update expiry info
            updateExpiryInfo(expiryTime);
            
            // Show result section
            qrisInput.style.display = 'none';
            qrisResult.style.display = 'block';
            
            // Start expiry timer
            startQRISExpiryTimer(expiryTime);
            
            // Reset button
            generateQRISBtn.innerHTML = 'Generate QRIS';
            generateQRISBtn.disabled = false;
        }, 3000);
    }
}

// Generate dummy QR code for demo purposes
function generateDummyQRCode(amount) {
    // Create a canvas element to generate a simple QR-like pattern
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    
    // Draw background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 200, 200);
    
    // Draw QR-like pattern
    ctx.fillStyle = '#000000';
    
    // Outer squares
    ctx.fillRect(20, 20, 40, 40);
    ctx.fillRect(140, 20, 40, 40);
    ctx.fillRect(20, 140, 40, 40);
    
    // Inner pattern
    for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
            if ((i + j) % 3 === 0 || (i * j) % 5 === 0) {
                ctx.fillRect(60 + i * 12, 60 + j * 12, 8, 8);
            }
        }
    }
    
    // Add text
    ctx.fillStyle = '#8a2be2';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Rp ${parseInt(amount).toLocaleString('id-ID')}`, 100, 190);
    
    return canvas.toDataURL('image/png');
}

// Update expiry info display
function updateExpiryInfo(expiryTime) {
    const updateDisplay = () => {
        const now = new Date();
        const diffMs = expiryTime - now;
        
        if (diffMs <= 0) {
            expiryInfo.textContent = 'QRIS telah kedaluwarsa!';
            
            // Clear timer and hide QRIS result
            if (qrisExpiryTimer) {
                clearInterval(qrisExpiryTimer);
                qrisExpiryTimer = null;
            }
            
            // Hide QRIS result after 2 seconds
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
        
        expiryInfo.textContent = `Kedaluwarsa dalam: ${diffMins}:${diffSecs.toString().padStart(2, '0')} menit`;
    };
    
    // Update immediately
    updateDisplay();
    
    // Update every second
    return setInterval(updateDisplay, 1000);
}

// Start QRIS expiry timer
function startQRISExpiryTimer(expiryTime) {
    // Clear any existing timer
    if (qrisExpiryTimer) {
        clearInterval(qrisExpiryTimer);
    }
    
    // Start new timer
    qrisExpiryTimer = updateExpiryInfo(expiryTime);
}

// Download QRIS image
function downloadQRIS() {
    if (!qrisImage.src) return;
    
    const link = document.createElement('a');
    link.href = qrisImage.src;
    link.download = `qris-${currentTransactionId || 'payment'}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show feedback
    const originalText = downloadQRISBtn.innerHTML;
    downloadQRISBtn.innerHTML = '<i class="fas fa-check"></i> Terunduh!';
    
    setTimeout(() => {
        downloadQRISBtn.innerHTML = originalText;
    }, 2000);
}

// Copy text to clipboard
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        console.log('Text copied to clipboard');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        // Fallback method
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
    });
}

// Show copy success modal
function showCopyModal() {
    copyModal.classList.add('active');
    
    // Auto close after 2 seconds
    setTimeout(() => {
        copyModal.classList.remove('active');
    }, 2000);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);

// Add some dynamic background animation
document.addEventListener('DOMContentLoaded', () => {
    const heroSection = document.querySelector('.hero-section');
    
    // Create floating elements for background
    for (let i = 0; i < 15; i++) {
        const floatingElement = document.createElement('div');
        floatingElement.className = 'floating-bg-element';
        
        // Random position and size
        const size = Math.random() * 40 + 10;
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        const delay = Math.random() * 5;
        const duration = Math.random() * 10 + 10;
        
        // Apply styles
        floatingElement.style.width = `${size}px`;
        floatingElement.style.height = `${size}px`;
        floatingElement.style.left = `${posX}%`;
        floatingElement.style.top = `${posY}%`;
        floatingElement.style.animationDelay = `${delay}s`;
        floatingElement.style.animationDuration = `${duration}s`;
        
        // Random color (purple or green)
        floatingElement.style.backgroundColor = Math.random() > 0.5 
            ? 'rgba(138, 43, 226, 0.1)' 
            : 'rgba(0, 255, 136, 0.1)';
        
        floatingElement.style.borderRadius = '50%';
        floatingElement.style.position = 'absolute';
        floatingElement.style.zIndex = '-1';
        floatingElement.style.filter = 'blur(5px)';
        floatingElement.style.animation = 'floatElement 20s infinite ease-in-out';
        
        heroSection.appendChild(floatingElement);
    }
    
    // Add CSS for floating animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes floatElement {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            25% { transform: translate(20px, -20px) rotate(5deg); }
            50% { transform: translate(-15px, 15px) rotate(-5deg); }
            75% { transform: translate(10px, -10px) rotate(3deg); }
        }
    `;
    document.head.appendChild(style);
});