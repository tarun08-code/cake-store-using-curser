require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { MongoClient, ObjectId } = require('mongodb');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('public'));

// MongoDB Connection
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// Database connection function
async function connectDB() {
    try {
        await client.connect();
        console.log("✅ Connected to MongoDB!");

        const db = client.db('ecommerce');

        // Create collections if they don't exist
        const collections = ['products', 'orders', 'contact_submissions', 'users'];
        for (const collection of collections) {
            try {
                await db.createCollection(collection);
                console.log(`✅ Created collection: ${collection}`);
            } catch (error) {
                if (error.code === 48) { // Collection already exists
                    console.log(`ℹ️ Collection already exists: ${collection}`);
                } else {
                    console.error(`❌ Error creating collection ${collection}:`, error);
                }
            }
        }

        return db;
    } catch (error) {
        console.error("❌ MongoDB connection error:", error);
        throw error;
    }
}

// API Routes
// Products
app.post('/api/products', async (req, res) => {
    try {
        const db = await connectDB();
        const collection = db.collection('products');
        const product = req.body;

        // Validate required fields
        if (!product.name || !product.price) {
            return res.status(400).json({ error: 'Name and price are required' });
        }

        const result = await collection.insertOne(product);
        res.status(201).json({
            message: 'Product added successfully',
            productId: result.insertedId
        });
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ error: 'Failed to add product' });
    }
});

app.get('/api/products', async (req, res) => {
    try {
        const db = await connectDB();
        const collection = db.collection('products');
        const products = await collection.find({}).toArray();
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// Orders
app.post('/api/orders', async (req, res) => {
    try {
        const db = await connectDB();
        const collection = db.collection('orders');
        const order = req.body;

        // Validate required fields
        if (!order.products || !order.total || !order.customer) {
            return res.status(400).json({ error: 'Products, total, and customer details are required' });
        }

        const result = await collection.insertOne({
            ...order,
            status: 'pending',
            createdAt: new Date()
        });

        res.status(201).json({
            message: 'Order placed successfully',
            orderId: result.insertedId
        });
    } catch (error) {
        console.error('Error placing order:', error);
        res.status(500).json({ error: 'Failed to place order' });
    }
});

app.get('/api/orders', async (req, res) => {
    try {
        const db = await connectDB();
        const collection = db.collection('orders');
        const orders = await collection.find({}).toArray();
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// Contact Form Submission
app.post('/api/submit-data', async (req, res) => {
    try {
        const db = await connectDB();
        const collection = db.collection('contact_submissions');
        const formData = req.body;

        // Validate required fields
        if (!formData.name || !formData.email || !formData.message) {
            return res.status(400).json({ error: 'Name, email, and message are required' });
        }

        // Add timestamp and status
        const submission = {
            ...formData,
            status: 'new',
            createdAt: new Date()
        };

        const result = await collection.insertOne(submission);
        
        res.status(201).json({
            message: 'Form submitted successfully',
            submissionId: result.insertedId
        });
    } catch (error) {
        console.error('Error submitting form:', error);
        res.status(500).json({ error: 'Failed to submit form' });
    }
});

// Payment handling
app.post('/api/payment', async (req, res) => {
    try {
        const db = await connectDB();
        const { paymentMethod, orderDetails, cardDetails } = req.body;

        // Validate required fields
        if (!orderDetails || !orderDetails.orderId || !orderDetails.total) {
            return res.status(400).json({
                success: false,
                error: 'Invalid order details'
            });
        }

        // Create payment record
        const payment = {
            paymentMethod,
            orderId: orderDetails.orderId,
            total: orderDetails.total,
            items: orderDetails.items || [],
            customer: orderDetails.customer || {},
            status: 'completed',
            createdAt: new Date()
        };

        // If card payment, store card details (in real app, use proper encryption)
        if (paymentMethod === 'card' && cardDetails) {
            payment.cardDetails = {
                last4: cardDetails.number.slice(-4),
                expiry: cardDetails.expiry,
                type: cardDetails.type,
                name: cardDetails.name
            };
        }

        // Store payment in database
        const paymentsCollection = db.collection('payments');
        const paymentResult = await paymentsCollection.insertOne(payment);

        // Update order status
        const ordersCollection = db.collection('orders');
        await ordersCollection.updateOne(
            { _id: new ObjectId(orderDetails.orderId) },
            { 
                $set: { 
                    status: 'paid',
                    paymentId: paymentResult.insertedId,
                    updatedAt: new Date()
                }
            }
        );

        res.status(200).json({
            success: true,
            message: 'Payment processed successfully',
            paymentId: paymentResult.insertedId
        });

    } catch (error) {
        console.error('Payment error:', error);
        res.status(500).json({
            success: false,
            error: 'Payment processing failed'
        });
    }
});

// Cart Management
app.get('/api/cart', async (req, res) => {
    try {
        const db = await connectDB();
        const userId = req.query.userId;

        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }

        const user = await db.collection('users').findOne(
            { _id: new ObjectId(userId) },
            { projection: { cart: 1 } }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ cart: user.cart || [] });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).json({ error: 'Failed to fetch cart' });
    }
});

app.post('/api/cart', async (req, res) => {
    try {
        const db = await connectDB();
        const { userId, productId, quantity } = req.body;

        if (!userId || !productId) {
            return res.status(400).json({ error: 'User ID and Product ID are required' });
        }

        const product = await db.collection('products').findOne({ _id: new ObjectId(productId) });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        const cartItem = {
            productId: product._id,
            name: product.name,
            price: product.price,
            quantity: quantity || 1,
            image: product.image
        };

        // Check if item already exists in cart
        const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
        const existingItemIndex = user.cart.findIndex(item => 
            item.productId.toString() === productId
        );

        if (existingItemIndex >= 0) {
            // Update quantity if item exists
            await db.collection('users').updateOne(
                { 
                    _id: new ObjectId(userId),
                    'cart.productId': new ObjectId(productId)
                },
                { 
                    $inc: { 'cart.$.quantity': quantity || 1 }
                }
            );
        } else {
            // Add new item if it doesn't exist
            await db.collection('users').updateOne(
                { _id: new ObjectId(userId) },
                { $push: { cart: cartItem } }
            );
        }

        res.status(201).json({ message: 'Cart updated successfully' });
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ error: 'Failed to update cart' });
    }
});

app.delete('/api/cart', async (req, res) => {
    try {
        const db = await connectDB();
        const { userId, productId } = req.body;

        if (!userId || !productId) {
            return res.status(400).json({ error: 'User ID and Product ID are required' });
        }

        const result = await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { 
                $pull: { 
                    cart: { productId: new ObjectId(productId) } 
                } 
            }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: 'Item not found in cart' });
        }

        res.json({ message: 'Item removed from cart successfully' });
    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).json({ error: 'Failed to remove item from cart' });
    }
});

// User Profile
app.get('/api/user/:userId', async (req, res) => {
    try {
        const db = await connectDB();
        const userId = req.params.userId;

        const user = await db.collection('users').findOne(
            { _id: new ObjectId(userId) },
            { projection: { password: 0 } } // Exclude password from response
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

app.put('/api/user/:userId/profile-image', async (req, res) => {
    try {
        const db = await connectDB();
        const userId = req.params.userId;
        const { profileImage } = req.body;

        if (!profileImage) {
            return res.status(400).json({ error: 'Profile image is required' });
        }

        const result = await db.collection('users').updateOne(
            { _id: new ObjectId(userId) },
            { $set: { profileImage } }
        );

        if (result.modifiedCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'Profile image updated successfully' });
    } catch (error) {
        console.error('Error updating profile image:', error);
        res.status(500).json({ error: 'Failed to update profile image' });
    }
});

// Search Products
app.get('/api/products/search', async (req, res) => {
    try {
        const db = await connectDB();
        const { query, category } = req.query;
        
        let searchQuery = {};
        
        if (query) {
            searchQuery.$or = [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ];
        }
        
        if (category) {
            searchQuery.category = category;
        }

        const products = await db.collection('products')
            .find(searchQuery)
            .toArray();

        res.json(products);
    } catch (error) {
        console.error('Error searching products:', error);
        res.status(500).json({ error: 'Failed to search products' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    process.exit(1);
}); 