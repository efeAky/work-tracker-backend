const express = require('express');
const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const { username, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);

    // TODO: Store user in database

    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    // TODO: Database check

    res,status(201).json({ message: 'User loged in successfully '});
  }catch (error) {
    console.error(error);
    res.status(500).json( {error: 'Server error'})
  }
});

router.get('/google', (req, res) => {
  // Google OAuth
});

router.get('/google/callback', (req, res) => {
  // Google callback
});

module.exports = router;