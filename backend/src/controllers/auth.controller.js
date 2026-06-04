const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Pantry, PantryMember } = require('../models');

function generateToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'E-mail já cadastrado' });
    }

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash });

    // Todo novo usuário ganha uma despensa própria, da qual é dono.
    const pantry = await Pantry.create({ name: 'Minha despensa' });
    await PantryMember.create({ userId: user.id, pantryId: pantry.id, role: 'owner' });

    const token = generateToken(user.id);
    return res.status(201).json({
      user: { id: user.id, name: user.name, email: user.email },
      pantryId: pantry.id,
      token,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos' });
    }

    const membership = await PantryMember.findOne({ where: { userId: user.id, role: 'owner' } });

    const token = generateToken(user.id);
    return res.json({
      user: { id: user.id, name: user.name, email: user.email },
      pantryId: membership?.pantryId ?? null,
      token,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login };
