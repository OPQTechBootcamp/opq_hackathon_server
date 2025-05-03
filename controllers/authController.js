import bcrypt from 'bcryptjs';
import generateToken from '../utils/generateToken.js';
import { findUserByEmail, createUser } from '../models/userModel.js';

export const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ status: 'error', message: 'Email and password are required' });
        }

        const user = await findUserByEmail(email);
        if (!user) {
            return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ status: 'error', message: 'Invalid credentials' });
        }

        const token = generateToken(user);
        return res.status(200).json({
            status: 'success',
            message: 'Login successful',
            token,
            user: { id: user.id, name: user.name, role: user.role }
        });
    } catch (err) {
        console.error('Error during login:', err);
        return res.status(500).json({ status: 'error', message: 'Server error', error: err.message });
    }
};

export const registerUser = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ status: 'error', message: 'Name, email, and password are required' });
        }

        const existing = await findUserByEmail(email);
        if (existing) {
            return res.status(409).json({ status: 'error', message: 'Email already in use' });
        }

        const password_hash = await bcrypt.hash(password, 10);
        const newUser = await createUser({ name, email, password: password_hash, role });
        return res.status(201).json({
            status: 'success',
            message: 'User registered successfully',
            user: { id: newUser.insertId, name, email, role }
        });
    } catch (err) {
        console.error('Error during registration:', err);
        return res.status(500).json({ status: 'error', message: 'Server error', error: err.message });
    }
};

export const getProfile = async (req, res) => {
    try {
        const { id, name, role } = req.user;
        return res.status(200).json({
            status: 'success',
            user: { id, name, role }
        });
    } catch (err) {
        console.error('Error fetching profile:', err);
        return res.status(500).json({ status: 'error', message: 'Server error', error: err.message });
    }
};