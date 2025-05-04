document.addEventListener('DOMContentLoaded', () => {
    const cartItems = document.querySelector('.cart-items');
    const subtotalAmount = document.querySelector('.subtotal-amount');
    const totalAmount = document.querySelector('.total-amount');
    const cartCount = document.querySelector('.cart-count');
    const deliveryAmount = document.querySelector('.delivery-amount');
    const checkoutBtn = document.querySelector('.checkout-btn');

    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    const deliveryCharge = 50;

    // Check if user is logged in
    function checkAuth() {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        return token && user;
    }

    // Show login popup
    function showLoginPopup() {
        const popup = document.createElement('div');
        popup.className = 'login-popup';
        popup.innerHTML = `
            <div class="popup-content">
                <i class="fas fa-user-lock"></i>
                <h2>Login Required</h2>
                <p>Please login to proceed with your order</p>
                <div class="popup-buttons">
                    <button class="login-btn" onclick="window.location.href='login.html'">Login</button>
                    <button class="cancel-btn">Cancel</button>
                </div>
            </div>
        `;
        document.body.appendChild(popup);

        // Add event listener to cancel button
        popup.querySelector('.cancel-btn').addEventListener('click', () => {
            document.body.removeChild(popup);
        });
    }

    // Update cart count
    function updateCartCount() {
        const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 1), 0);
        cartCount.textContent = totalItems;
    }

    // Calculate total
    function calculateTotal() {
        const subtotal = cart.reduce((sum, item) => sum + (parseInt(item.price) * (item.quantity || 1)), 0);
        const total = subtotal + deliveryCharge;

        subtotalAmount.textContent = `₹${subtotal}`;
        totalAmount.textContent = `₹${total}`;
        deliveryAmount.textContent = `₹${deliveryCharge}`;
    }

    // Remove item from cart
    function removeItem(index) {
        cart.splice(index, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        updateCartCount();
        calculateTotal();
        renderCart();
    }

    // Update quantity
    function updateQuantity(index, change) {
        if (!cart[index].quantity) {
            cart[index].quantity = 1;
        }
        cart[index].quantity += change;
        
        if (cart[index].quantity < 1) {
            removeItem(index);
        } else {
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
            calculateTotal();
            renderCart();
        }
    }

    // Render cart items
    function renderCart() {
        if (cart.length === 0) {
            cartItems.innerHTML = `
                <div class="empty-cart">
                    <i class="fas fa-shopping-cart"></i>
                    <p>Your cart is empty</p>
                    <a href="dashboard.html">Continue Shopping</a>
                </div>
            `;
            checkoutBtn.style.display = 'none';
            return;
        }

        // Show/hide checkout button based on login status
        if (checkAuth()) {
            checkoutBtn.style.display = 'block';
            document.querySelector('.login-message')?.remove();
        } else {
            checkoutBtn.style.display = 'none';
            // Add login message if not already present
            if (!document.querySelector('.login-message')) {
                const loginMessage = document.createElement('div');
                loginMessage.className = 'login-message';
                loginMessage.innerHTML = `
                    <i class="fas fa-user-lock"></i>
                    <p>Please <a href="login.html">login</a> to place your order</p>
                `;
                cartItems.parentNode.insertBefore(loginMessage, cartItems.nextSibling);
            }
        }

        cartItems.innerHTML = cart.map((item, index) => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-details">
                    <h3>${item.name}</h3>
                    <p class="price">₹${item.price}</p>
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="updateQuantity(${index}, -1)">-</button>
                        <span class="quantity">${item.quantity || 1}</span>
                        <button class="quantity-btn" onclick="updateQuantity(${index}, 1)">+</button>
                    </div>
                </div>
                <button class="remove-btn" onclick="removeItem(${index})">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    // Initialize cart
    updateCartCount();
    calculateTotal();
    renderCart();

    // Make functions available globally
    window.updateQuantity = updateQuantity;
    window.removeItem = removeItem;

    // Checkout button click handler
    checkoutBtn.addEventListener('click', () => {
        if (!checkAuth()) {
            showLoginPopup();
            return;
        }

        if (cart.length > 0) {
            // Store cart data in localStorage for payment page
            localStorage.setItem('checkoutData', JSON.stringify({
                items: cart,
                subtotal: parseInt(subtotalAmount.textContent.replace('₹', '')),
                delivery: deliveryCharge,
                total: parseInt(totalAmount.textContent.replace('₹', ''))
            }));
            window.location.href = 'payment.html';
        }
    });
}); 