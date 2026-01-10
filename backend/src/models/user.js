const db = require('../db');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

const User = {
  async findByEmail(email) {
    return db('users').where({ email: email.toLowerCase() }).first();
  },

  async findById(id) {
    return db('users').where({ id }).first();
  },

  async create({ email, password, name, organization_name }) {
    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const [id] = await db('users').insert({
      email: email.toLowerCase(),
      password_hash,
      name,
      organization_name,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

    return this.findById(id);
  },

  async verifyPassword(user, password) {
    return bcrypt.compare(password, user.password_hash);
  },

  toPublic(user) {
    if (!user) return null;
    const { password_hash, ...publicUser } = user;
    return publicUser;
  }
};

module.exports = User;
