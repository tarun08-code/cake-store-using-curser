const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: '*', // Allow all origins during development
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cake_store', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(async () => {
    console.log('Connected to MongoDB');
    // Create default admin first
    await createDefaultAdmin();
    // Then initialize sample data
    await initializeSampleCakes();
})
.catch((err) => {
    console.error('MongoDB connection error:', err);
});

// User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isAdmin: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

// Product Schema
const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    category: {
        type: String,
        required: true
    }
});

const Product = mongoose.model('Product', productSchema);

// Cart Schema
const cartSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, default: 1 },
        price: { type: Number, required: true }
    }],
    total: { type: Number, default: 0 },
    updatedAt: { type: Date, default: Date.now }
});

const Cart = mongoose.model('Cart', cartSchema);

// Contact Message Schema
const contactMessageSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);

// Order Schema
const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: [{
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }
    }],
    total: { type: Number, required: true },
    status: { type: String, default: 'pending' },
    paymentMethod: { type: String, required: true, enum: ['cash', 'card'] },
    createdAt: { type: Date, default: Date.now }
});

const Order = mongoose.model('Order', orderSchema);

// Payment Details Schema
const paymentDetailsSchema = new mongoose.Schema({
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cardNumber: { 
        type: String,
        required: true,
        // Store only last 4 digits for security
        set: (number) => '****-****-****-' + number.slice(-4)
    },
    expiryDate: { type: String, required: true },
    paymentDate: { type: Date, default: Date.now },
    amount: { type: Number, required: true }
});

const PaymentDetails = mongoose.model('PaymentDetails', paymentDetailsSchema);

// Card Information Schema
const cardInfoSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },
    cardNumber: { 
        type: String, 
        required: true,
        set: (number) => '****-****-****-' + number.slice(-4)
    },
    expiryDate: { type: String, required: true },
    lastUsed: { type: Date, default: Date.now }
});

const CardInfo = mongoose.model('CardInfo', cardInfoSchema);

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: 'Access denied' });

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) return res.status(403).json({ message: 'Invalid token' });
        req.user = user;
        next();
    });
};

// Admin Middleware
const isAdmin = (req, res, next) => {
    if (!req.user || !req.user.isAdmin) {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
};

// Create default admin user if not exists
const createDefaultAdmin = async () => {
    try {
        const adminEmail = 'admin@cakestore.com';
        const adminPassword = 'Admin@123';
        
        const existingAdmin = await User.findOne({ email: adminEmail });
        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            const admin = new User({
                name: 'Admin',
                email: adminEmail,
                password: hashedPassword,
                isAdmin: true
            });
            await admin.save();
            console.log('Default admin user created successfully');
        } else {
            console.log('Admin user already exists');
        }
    } catch (error) {
        console.error('Error creating default admin:', error);
    }
};

// Create sample products if not exists
const createSampleProducts = async () => {
    try {
        const products = [
            {
                name: "Chocolate Delight",
                description: "Rich chocolate cake with chocolate ganache",
                price: 350,
                image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587",
                category: "Cake"
            },
            {
                name: "Vanilla Dream",
                description: "Classic vanilla cake with buttercream frosting",
                price: 250,
                image: "https://images.unsplash.com/photo-1621303837174-89787a7d4729",
                category: "Cake"
            },
            {
                name: "Red Velvet",
                description: "Luxurious red velvet with cream cheese frosting",
                price: 400,
                image: "https://images.unsplash.com/photo-1563729784474-d77dbb933a9e",
                category: "Cake"
            },
            {
                name: "Strawberry Bliss",
                description: "Fresh strawberry cake with whipped cream",
                price: 300,
                image: "https://images.unsplash.com/photo-1571115177098-24ec42ed204d",
                category: "Cake"
            }
        ];

        for (const product of products) {
            const existingProduct = await Product.findOne({ name: product.name });
            if (!existingProduct) {
                await Product.create(product);
                console.log(`Created sample product: ${product.name}`);
            }
        }
    } catch (error) {
        console.error('Error creating sample products:', error);
    }
};

// Sample cakes data
const sampleCakes = [
    {
        name: "Chocolate Truffle Cake",
        description: "Rich chocolate layers with truffle cream and dark chocolate ganache",
        price: 299,
        image: "https://www.fnp.com/images/pr/l/v20221205201109/chocolate-truffle-cake-half-kg_1.jpg",
        category: "birthday"
    },
    {
        name: "Vanilla Berry Cake",
        description: "Light vanilla sponge with fresh mixed berries and whipped cream",
        price: 249,
        image: "https://www.fnp.com/images/pr/l/v20221205201212/vanilla-fresh-cream-cake-half-kg_1.jpg",
        category: "birthday"
    },
    {
        name: "Red Velvet Cake",
        description: "Classic red velvet with cream cheese frosting",
        price: 349,
        image: "https://www.fnp.com/images/pr/l/v20221205201156/red-velvet-fresh-cream-cake-half-kg_1.jpg",
        category: "birthday"
    },
    {
        name: "Black Forest Cake",
        description: "Chocolate sponge with cherries and whipped cream",
        price: 399,
        image: "https://www.fnp.com/images/pr/l/v20221205201116/black-forest-cake-half-kg_1.jpg",
        category: "birthday"
    },
    {
        name: "Butterscotch Cake",
        description: "Soft vanilla cake with butterscotch chips and caramel",
        price: 279,
        image: "https://www.fnp.com/images/pr/l/v20221205201120/butterscotch-cake-half-kg_1.jpg",
        category: "birthday"
    }
];

// Initialize sample cakes
async function initializeSampleCakes() {
    try {
        // Check if cakes collection is empty
        const existingCakes = await Product.find();
        if (existingCakes.length === 0) {
            // Insert sample cakes
            await Product.insertMany(sampleCakes);
            console.log('Sample cakes created successfully');
        }
    } catch (error) {
        console.error('Error creating sample cakes:', error);
    }
}

// Auth Routes
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = new User({
            name,
            email,
            password: hashedPassword
        });

        await user.save();
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error creating user' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user._id, email: user.email, isAdmin: user.isAdmin },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Protected Routes
app.get('/api/user/profile', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin Routes
app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
    try {
        const users = await User.find({}, { password: 0 }); // Exclude password from response
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users' });
    }
});

app.delete('/api/admin/users/:userId', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Don't allow deleting the admin user
        const user = await User.findById(userId);
        if (user && user.isAdmin) {
            return res.status(403).json({ message: 'Cannot delete admin user' });
        }

        await User.findByIdAndDelete(userId);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user' });
    }
});

app.put('/api/admin/users/:userId', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { userId } = req.params;
        const { name, email } = req.body;

        // Don't allow modifying the admin user
        const user = await User.findById(userId);
        if (user && user.isAdmin) {
            return res.status(403).json({ message: 'Cannot modify admin user' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { name, email },
            { new: true, select: '-password' }
        );

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Error updating user' });
    }
});

app.get('/api/admin/products', authenticateToken, isAdmin, async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Product Routes (Cakes)
app.post('/api/admin/products', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name, description, price, image, category } = req.body;
        const product = new Product({
            name,
            description,
            price,
            image,
            category
        });
        await product.save();
        res.status(201).json(product);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ message: 'Error creating product' });
    }
});

app.get('/api/admin/products/:productId', authenticateToken, isAdmin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching product' });
    }
});

app.put('/api/admin/products/:productId', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { name, description, price, image, category } = req.body;
        const product = await Product.findByIdAndUpdate(
            req.params.productId,
            { name, description, price, image, category },
            { new: true }
        );
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ message: 'Error updating product' });
    }
});

app.delete('/api/admin/products/:productId', authenticateToken, isAdmin, async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting product' });
    }
});

// Contact Form API
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, phone, message } = req.body;
        console.log('Received contact form data:', { name, email, phone, message });

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                message: 'Name, email, and message are required'
            });
        }

        const contactMessage = new ContactMessage({
            name,
            email,
            phone,
            message
        });

        await contactMessage.save();
        console.log('Contact message saved:', contactMessage._id);

        res.status(201).json({
            success: true,
            message: 'Message sent successfully'
        });
    } catch (error) {
        console.error('Contact form error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send message'
        });
    }
});

// Get contact messages (Admin only)
app.get('/api/admin/contact-messages', authenticateToken, isAdmin, async (req, res) => {
    try {
        const messages = await ContactMessage.find().sort({ createdAt: -1 });
        res.json(messages);
    } catch (error) {
        console.error('Error fetching contact messages:', error);
        res.status(500).json({ message: 'Failed to fetch messages' });
    }
});

// Mark contact message as read (Admin only)
app.put('/api/admin/contact-messages/:id/read', authenticateToken, isAdmin, async (req, res) => {
    try {
        const message = await ContactMessage.findByIdAndUpdate(
            req.params.id,
            { status: 'read' },
            { new: true }
        );

        if (!message) {
            return res.status(404).json({ message: 'Message not found' });
        }

        res.json(message);
    } catch (error) {
        console.error('Error marking message as read:', error);
        res.status(500).json({ message: 'Failed to mark message as read' });
    }
});

// Cart Routes
app.get('/api/cart', authenticateToken, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user.userId })
            .populate('items.productId');
        res.json(cart || { items: [], total: 0 });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/cart', authenticateToken, async (req, res) => {
    try {
        const { productId, quantity, price } = req.body;
        let cart = await Cart.findOne({ userId: req.user.userId });

        if (!cart) {
            cart = new Cart({ userId: req.user.userId });
        }

        const existingItem = cart.items.find(item => item.productId.toString() === productId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({ productId, quantity, price });
        }

        cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        await cart.save();

        res.json(cart);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.delete('/api/cart/:productId', authenticateToken, async (req, res) => {
    try {
        const cart = await Cart.findOne({ userId: req.user.userId });
        if (cart) {
            cart.items = cart.items.filter(item => item.productId.toString() !== req.params.productId);
            cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            await cart.save();
        }
        res.json(cart || { items: [], total: 0 });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/api/cart/:productId', authenticateToken, async (req, res) => {
    try {
        const { quantity, price } = req.body;
        const cart = await Cart.findOne({ userId: req.user.userId });
        
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const itemIndex = cart.items.findIndex(item => 
            item.productId.toString() === req.params.productId
        );

        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        // Update quantity
        cart.items[itemIndex].quantity = quantity;
        
        // Recalculate total
        cart.total = cart.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        await cart.save();
        res.json(cart);
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ message: 'Error updating cart' });
    }
});

// Order Routes
app.post('/api/orders', authenticateToken, async (req, res) => {
    try {
        const { items, total, paymentMethod } = req.body;
        const order = new Order({
            userId: req.user.userId,
            items,
            total,
            paymentMethod,
            status: 'confirmed'
        });

        await order.save();

        // Clear the user's cart after successful order
        await Cart.findOneAndDelete({ userId: req.user.userId });

        res.status(201).json({
            success: true,
            message: 'Order placed successfully',
            orderId: order._id
        });
    } catch (error) {
        console.error('Order creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create order'
        });
    }
});

app.get('/api/orders', authenticateToken, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user.userId })
            .populate('items.productId')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch orders' });
    }
});

// Product Routes
app.get('/api/cakes', async (req, res) => {
    try {
        const cakes = await Product.find();
        if (!cakes || cakes.length === 0) {
            console.log('No cakes found in database');
            return res.status(404).json({ message: 'No cakes found' });
        }
        console.log(`Found ${cakes.length} cakes`);
        res.json(cakes);
    } catch (error) {
        console.error('Error fetching cakes:', error);
        res.status(500).json({ 
            message: 'Error fetching cakes',
            error: error.message 
        });
    }
});

// Product Routes
app.get('/api/cakes/:cakeId', async (req, res) => {
    try {
        const cake = await Product.findById(req.params.cakeId);
        if (!cake) {
            return res.status(404).json({ message: 'Cake not found' });
        }
        res.json(cake);
    } catch (error) {
        console.error('Error fetching cake details:', error);
        res.status(500).json({ 
            message: 'Error fetching cake details',
            error: error.message 
        });
    }
});

// Delete a cake (Admin only)
app.delete('/api/cakes/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const cakeId = req.params.id;
        
        // Check if the cake exists
        const cake = await Product.findById(cakeId);
        if (!cake) {
            return res.status(404).json({ message: 'Cake not found' });
        }

        // Delete the cake
        await Product.findByIdAndDelete(cakeId);
        
        res.json({ message: 'Cake deleted successfully' });
    } catch (error) {
        console.error('Error deleting cake:', error);
        res.status(500).json({ message: 'Error deleting cake' });
    }
});

// Get payment details (Admin only)
app.get('/api/admin/payments', authenticateToken, isAdmin, async (req, res) => {
    try {
        const payments = await PaymentDetails.find()
            .populate('userId', 'name email')
            .populate('orderId')
            .sort({ paymentDate: -1 });

        if (!payments) {
            return res.status(404).json({ 
                success: false,
                message: 'No payment records found' 
            });
        }

        res.json(payments);
    } catch (error) {
        console.error('Error fetching payment details:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch payment details',
            error: error.message 
        });
    }
});

// Get all orders with payment details (Admin only)
app.get('/api/admin/orders', authenticateToken, isAdmin, async (req, res) => {
    try {
        const orders = await Order.find()
            .populate('userId', 'name email')
            .populate('items.productId')
            .sort({ createdAt: -1 });

        if (!orders) {
            return res.status(404).json({ 
                success: false,
                message: 'No orders found' 
            });
        }

        // Get payment details for each order
        const ordersWithPayments = await Promise.all(orders.map(async (order) => {
            try {
                const payment = await PaymentDetails.findOne({ orderId: order._id });
                return {
                    ...order.toObject(),
                    payment: payment || null
                };
            } catch (err) {
                console.error(`Error fetching payment for order ${order._id}:`, err);
                return {
                    ...order.toObject(),
                    payment: null
                };
            }
        }));

        res.json(ordersWithPayments);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch orders',
            error: error.message 
        });
    }
});

// Update order status (Admin only)
app.put('/api/admin/orders/:orderId', authenticateToken, isAdmin, async (req, res) => {
    try {
        const { orderId } = req.params;
        const { status } = req.body;

        // Validate orderId
        if (!mongoose.Types.ObjectId.isValid(orderId)) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid order ID format' 
            });
        }

        // Validate status
        const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
        if (!validStatuses.includes(status.toLowerCase())) {
            return res.status(400).json({ 
                success: false,
                message: 'Invalid status value. Must be one of: ' + validStatuses.join(', ') 
            });
        }

        const order = await Order.findByIdAndUpdate(
            orderId,
            { status: status.toLowerCase() },
            { new: true }
        ).populate('userId', 'name email');

        if (!order) {
            return res.status(404).json({ 
                success: false,
                message: 'Order not found' 
            });
        }

        // Get payment details for the order
        const payment = await PaymentDetails.findOne({ orderId: order._id });
        
        const orderWithPayment = {
            ...order.toObject(),
            payment: payment || null
        };

        res.json({
            success: true,
            message: 'Order status updated successfully',
            data: orderWithPayment
        });
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to update order',
            error: error.message 
        });
    }
});

// Get card information (Admin only)
app.get('/api/admin/card-info', authenticateToken, isAdmin, async (req, res) => {
    try {
        const cardInfo = await CardInfo.find()
            .populate('userId', 'name email')
            .sort({ lastUsed: -1 });

        if (!cardInfo) {
            return res.status(404).json({
                success: false,
                message: 'No card information found'
            });
        }

        res.json(cardInfo);
    } catch (error) {
        console.error('Error fetching card information:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch card information',
            error: error.message
        });
    }
});

// Store card information during payment
app.post('/api/card-info', authenticateToken, async (req, res) => {
    try {
        const { cardNumber, expiryDate } = req.body;
        const user = await User.findById(req.user.userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check if card info already exists for this user
        let cardInfo = await CardInfo.findOne({ userId: user._id });

        if (cardInfo) {
            // Update existing card info
            cardInfo.cardNumber = cardNumber;
            cardInfo.expiryDate = expiryDate;
            cardInfo.lastUsed = new Date();
            await cardInfo.save();
        } else {
            // Create new card info
            cardInfo = new CardInfo({
                userId: user._id,
                userName: user.name,
                userEmail: user.email,
                cardNumber,
                expiryDate
            });
            await cardInfo.save();
        }

        res.json({
            success: true,
            message: 'Card information saved successfully'
        });
    } catch (error) {
        console.error('Error saving card information:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to save card information',
            error: error.message
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        message: 'Internal server error',
        error: err.message
    });
});

// Handle all routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
}); 