document.addEventListener('DOMContentLoaded', () => {
    // Add smooth scrolling for navigation links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href && href !== '#') {
                e.preventDefault();
                const targetElement = document.querySelector(href);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Add animation to shop now button
    const shopNowBtn = document.querySelector('.shop-now-btn');
    shopNowBtn.addEventListener('click', () => {
        // Add a temporary class for the click animation
        shopNowBtn.classList.add('clicked');
        setTimeout(() => {
            shopNowBtn.classList.remove('clicked');
        }, 300);
    });

    // Add hover effect to cake animation
    const cakeAnimation = document.querySelector('.cake-animation');
    cakeAnimation.addEventListener('mouseenter', () => {
        cakeAnimation.style.transform = 'scale(1.1)';
    });

    cakeAnimation.addEventListener('mouseleave', () => {
        cakeAnimation.style.transform = 'scale(1)';
    });

    // Add scroll reveal animation
    const revealElements = document.querySelectorAll('.hero-content, .hero-image');
    
    const revealOnScroll = () => {
        revealElements.forEach(element => {
            const elementTop = element.getBoundingClientRect().top;
            const elementVisible = 150;
            
            if (elementTop < window.innerHeight - elementVisible) {
                element.classList.add('revealed');
            }
        });
    };

    // Initial check
    revealOnScroll();
    
    // Check on scroll
    window.addEventListener('scroll', revealOnScroll);

    // Check authentication status and update UI
    updateAuthUI();
});

// Check authentication status and update UI
function updateAuthUI() {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    const authButtons = document.getElementById('authButtons');
    const userProfile = document.getElementById('userProfile');
    const profileName = document.querySelector('.profile-name');
    const shopNowBtn = document.querySelector('.shop-now-btn');

    if (token && user) {
        // User is logged in
        authButtons.style.display = 'none';
        userProfile.style.display = 'block';
        profileName.textContent = user.name;
        
        // Show shop now button
        if (shopNowBtn) {
            shopNowBtn.style.display = 'block';
        }
    } else {
        // User is not logged in
        authButtons.style.display = 'flex';
        userProfile.style.display = 'none';
        
        // Hide shop now button
        if (shopNowBtn) {
            shopNowBtn.style.display = 'none';
        }
    }
}

// Handle logout
document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    updateAuthUI();
    window.location.href = 'index.html';
});

// Show success popup
function showSuccessPopup(message = 'Order placed successfully!') {
    const popup = document.createElement('div');
    popup.className = 'success-popup';
    popup.innerHTML = `
        <div class="popup-content">
            <i class="fas fa-check-circle"></i>
            <h2>Success!</h2>
            <p>${message}</p>
            <button class="continue-btn">Continue</button>
        </div>
    `;
    document.body.appendChild(popup);

    // Add event listener to continue button
    popup.querySelector('.continue-btn').addEventListener('click', () => {
        document.body.removeChild(popup);
        window.location.href = 'orders.html';
    });
} 