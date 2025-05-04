document.addEventListener('DOMContentLoaded', () => {
    let cart = [];
    const cartCount = document.querySelector('.cart-count');
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');

    // Initialize cart from localStorage if available
    if (localStorage.getItem('cart')) {
        cart = JSON.parse(localStorage.getItem('cart'));
        updateCartCount();
    }

    // Add to cart functionality
    addToCartButtons.forEach(button => {
        button.addEventListener('click', () => {
            const cakeItem = button.closest('.cake-item');
            const cakeName = cakeItem.querySelector('h3').textContent;
            const cakePrice = button.getAttribute('data-price');
            const cakeImage = cakeItem.querySelector('img').src;

            // Add item to cart
            cart.push({
                name: cakeName,
                price: cakePrice,
                image: cakeImage
            });

            // Update localStorage
            localStorage.setItem('cart', JSON.stringify(cart));

            // Update cart count
            updateCartCount();

            // Show added to cart animation
            button.textContent = 'Added to Cart!';
            button.style.backgroundColor = '#4CAF50';
            
            setTimeout(() => {
                button.textContent = 'Add to Cart';
                button.style.backgroundColor = '#ff6b6b';
            }, 2000);
        });
    });

    // Update cart count
    function updateCartCount() {
        cartCount.textContent = cart.length;
    }

    // Cart icon click event
    const cartIcon = document.querySelector('.cart-icon');
    cartIcon.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'cart.html';
    });
}); 