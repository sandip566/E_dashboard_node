const express = require('express');
const cors = require("cors");
require('./db/config');
const User = require("./db/User");
const Product = require('./db/product');
const Jwt = require('jsonwebtoken');
const jwtKey = process.env.JWT_KEY || 'e-comm';

const app = express();

app.use(express.json());
app.use(cors());

// User Registration
app.post("/register", async (req, resp) => {
    try {
        let user = new User(req.body);
        let result = await user.save();
        result = result.toObject();
        delete result.password;
        Jwt.sign({ result }, jwtKey, { expiresIn: "2h" }, (err, token) => {
            if (err) {
                return resp.status(500).send({ result: "Something went wrong, please try again later" });
            }
            resp.send({ result, auth: token });
        });
    } catch (error) {
        resp.status(500).send({ error: 'Registration failed' });
    }
});

// User Login
app.post("/login", async (req, resp) => {
    try {
        if (req.body.password && req.body.email) {
            let user = await User.findOne(req.body).select("-password");
            if (user) {
                Jwt.sign({ user }, jwtKey, { expiresIn: "2h" }, (err, token) => {
                    if (err) {
                        return resp.status(500).send({ result: "Something went wrong, please try again later" });
                    }
                    resp.send({ user, auth: token });
                });
            } else {
                resp.status(404).send({ result: 'No user found' });
            }
        } else {
            resp.status(400).send({ result: 'Invalid email or password' });
        }
    } catch (error) {
        resp.status(500).send({ error: 'Login failed' });
    }
});

// Add Product
app.post("/add-product", async (req, resp) => {
    try {
        let product = new Product(req.body);
        let result = await product.save();
        resp.status(201).send(result);
    } catch (error) {
        resp.status(500).send({ error: 'Product addition failed' });
    }
});

// Get All Products
app.get("/products", async (req, resp) => {
    try {
        let products = await Product.find();
        if (products.length > 0) {
            resp.send(products);
        } else {
            resp.status(404).send({ result: "No products found" });
        }
    } catch (error) {
        resp.status(500).send({ error: 'Failed to fetch products' });
    }
});

// Delete Product
app.delete("/product/:id", async (req, resp) => {
    try {
        const result = await Product.deleteOne({ _id: req.params.id });
        if (result.deletedCount > 0) {
            resp.send({ result: "Product deleted successfully" });
        } else {
            resp.status(404).send({ result: "Product not found" });
        }
    } catch (error) {
        resp.status(500).send({ error: 'Product deletion failed' });
    }
});

// Get Product by ID
app.get("/product/:id", async (req, resp) => {
    try {
        let result = await Product.findOne({ _id: req.params.id });
        if (result) {
            resp.send(result);
        } else {
            resp.status(404).send({ result: "No record found" });
        }
    } catch (error) {
        resp.status(500).send({ error: 'Failed to fetch product' });
    }
});

// Update Product
app.put("/product/:id", async (req, resp) => {
    try {
        let result = await Product.updateOne(
            { _id: req.params.id },
            { $set: req.body }
        );
        if (result.nModified > 0) {
            resp.send({ result: "Product updated successfully" });
        } else {
            resp.status(404).send({ result: "Product not found or no changes made" });
        }
    } catch (error) {
        resp.status(500).send({ error: 'Product update failed' });
    }
});

// Search Products
app.get("/search/:key", async (req, resp) => {
    try {
        let result = await Product.find({
            "$or": [
                { name: { $regex: req.params.key, $options: 'i' } },
                { company: { $regex: req.params.key, $options: 'i' } },
                { category: { $regex: req.params.key, $options: 'i' } }
            ]
        });
        if (result.length > 0) {
            resp.send(result);
        } else {
            resp.status(404).send({ result: "No matching products found" });
        }
    } catch (error) {
        resp.status(500).send({ error: 'Search failed' });
    }
});

app.listen(5000, () => {
    console.log('Server is running on port 5000');
});
