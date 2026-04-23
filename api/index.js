import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    const db = client.db('authdb');
    const users = db.collection('users');
    
    const { action, name, email, password } = req.body;
    
    if (action === 'register') {
      const existing = await users.findOne({ email });
      if (existing) {
        return res.json({ success: false, message: 'Email already exists' });
      }
      await users.insertOne({ 
        name, 
        email, 
        password: btoa(password + 'salt'), 
        createdAt: new Date()
      });
      return res.json({ success: true, message: 'Account created!' });
    }
    
    if (action === 'login') {
      const user = await users.findOne({ email });
      if (user && user.password === btoa(password + 'salt')) {
        return res.json({ 
          success: true, 
          user: { name: user.name, email: user.email }
        });
      }
      return res.json({ success: false, message: 'Wrong email/password' });
    }
    
    res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    res.status(500).json({ error: 'Server error: ' + error.message });
  }
}
