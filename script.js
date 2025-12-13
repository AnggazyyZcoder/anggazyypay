// DOM Elements
const loadingScreen = document.getElementById('loading-screen');
const mainContent = document.querySelector('.main-content');
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const nav = document.querySelector('.nav');
const navLinks = document.querySelectorAll('.nav-link');
const paymentHeaders = document.querySelectorAll('.payment-header');
const closeDetailsBtns = document.querySelectorAll('.close-details-btn');
const copyBtns = document.querySelectorAll('.copy-btn');
const qrisPaymentHeader = document.querySelector('[data-payment="qris"]');
const qrisLoading = document.getElementById('qris-loading');
const qrisContent = document.getElementById('qris-content');
const downloadQrisBtn = document.getElementById('download-qris');
const statValues = document.querySelectorAll('.stat-value');
const backToTopBtn = document.querySelector('.back-to-top');
const notification = document.getElementById('notification');
const fadeInElements = document.querySelectorAll('.fade-in');

// Loading Screen
window.addEventListener('load', () => {
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        loadingScreen.style.visibility = 'hidden';
        
        // Trigger animations after loading screen disappears
        setTimeout(() => {
            fadeInElements.forEach(element => {
                element.classList.add('appear');
            });
        }, 300);
    }, 3000);
});

// Mobile Menu Toggle
mobileMenuBtn.addEventListener('click', () => {
    nav.classList.toggle('active');
    mobileMenuBtn.innerHTML = nav.classList.contains('active') 
        ? '<i class="fas fa-times"></i>' 
        : '<i class="fas fa-bars"></i>';
});

// Close mobile menu when clicking a link
navLinks.forEach(link => {
    link.addEventListener('click', () => {
        nav.classList.remove('active');
        mobileMenuBtn.innerHTML = '<i class="fas fa-bars"></i>';
    });
});

// Smooth Scrolling for Navigation Links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        if(targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if(targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// Payment Details Toggle
paymentHeaders.forEach(header => {
    header.addEventListener('click', () => {
        const paymentCard = header.closest('.payment-card');
        const isActive = paymentCard.classList.contains('active');
        
        // Close all other payment cards
        document.querySelectorAll('.payment-card.active').forEach(card => {
            if(card !== paymentCard) {
                card.classList.remove('active');
            }
        });
        
        // Toggle current payment card
        paymentCard.classList.toggle('active');
        
        // Special handling for QRIS
        if(header.dataset.payment === 'qris' && !isActive) {
            loadQRIS();
        }
    });
});

// Close Details Buttons
closeDetailsBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const paymentCard = btn.closest('.payment-card');
        paymentCard.classList.remove('active');
    });
});

// Copy to Clipboard
copyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const text = btn.getAttribute('data-clipboard-text');
        navigator.clipboard.writeText(text).then(() => {
            showNotification('Nomor rekening berhasil disalin!');
        }).catch(err => {
            console.error('Gagal menyalin teks: ', err);
            showNotification('Gagal menyalin nomor rekening');
        });
    });
});

// QRIS Loading Function
function loadQRIS() {
    qrisLoading.style.display = 'flex';
    qrisContent.style.display = 'none';
    
    setTimeout(() => {
        qrisLoading.style.display = 'none';
        qrisContent.style.display = 'block';
    }, 3000);
}

// Download QRIS Button
downloadQrisBtn.addEventListener('click', () => {
    const qrisUrl = 'https://c.termai.cc/i180/fMam.jpg';
    
    // Create a temporary anchor element
    const link = document.createElement('a');
    link.href = qrisUrl;
    link.download = 'qris-anggazyy-pay.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification('QRIS berhasil diunduh!');
});

// Animated Counter for Statistics
function animateCounters() {
    statValues.forEach(statValue => {
        const target = parseFloat(statValue.getAttribute('data-count'));
        const suffix = statValue.textContent.includes('+') ? '+' : '';
        const increment = target / 100;
        let current = 0;
        
        const updateCounter = () => {
            if(current < target) {
                current += increment;
                if(current > target) current = target;
                
                statValue.textContent = suffix === '+' 
                    ? Math.floor(current) + suffix 
                    : current.toFixed(1);
                
                setTimeout(updateCounter, 20);
            }
        };
        
        updateCounter();
    });
}

// Intersection Observer for Fade-in Animations and Counters
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if(entry.isIntersecting) {
            // Fade in elements
            entry.target.classList.add('appear');
            
            // Animate counters if it's the statistics section
            if(entry.target.id === 'statistics') {
                animateCounters();
            }
        }
    });
}, observerOptions);

// Observe sections for animations
document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
});

// Back to Top Button
window.addEventListener('scroll', () => {
    if(window.scrollY > 500) {
        backToTopBtn.classList.add('active');
    } else {
        backToTopBtn.classList.remove('active');
    }
    
    // Update active nav link based on scroll position
    updateActiveNavLink();
});

backToTopBtn.addEventListener('click', () => {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
});

// Update Active Navigation Link
function updateActiveNavLink() {
    const scrollPosition = window.scrollY + 100;
    
    document.querySelectorAll('section').forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        const sectionId = section.getAttribute('id');
        
        if(scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if(link.getAttribute('href') === `#${sectionId}`) {
                    link.classList.add('active');
                }
            });
        }
    });
}

// Show Notification
function showNotification(message) {
    const notificationText = document.querySelector('.notification-text');
    notificationText.textContent = message;
    notification.classList.add('active');
    
    setTimeout(() => {
        notification.classList.remove('active');
    }, 3000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Initialize tooltips or other plugins if needed
    
    // Add hover effect to payment cards
    const paymentCards = document.querySelectorAll('.payment-card');
    paymentCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px)';
        });
        
        card.addEventListener('mouseleave', () => {
            if(!card.classList.contains('active')) {
                card.style.transform = 'translateY(0)';
            }
        });
    });
    
    // Initialize active nav link
    updateActiveNavLink();
});