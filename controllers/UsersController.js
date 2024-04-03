import sha1 from 'sha1';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UserController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).send({ error: 'Missing email' });
    }
    if (!password) {
      return res.status(400).send({ error: 'Missing password' });
    }
    const emailExists = await dbClient.users.findOne({ email });
    if (emailExists) {
      return res.status(400).send({ error: 'Already exist' });
    }

    const user = { email, password: sha1(password) };
    const result = await dbClient.db.collection('users').insertOne(user);

    return res.status(201).send({ id: result.insertedId, email });
  }

  static async getMe(req, res) {
    const xToken = req.headers['x-token'];
    const key = `auth_${xToken}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const user = await dbClient.users.findOne({ _id: userId });
    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    return res.status(200).send({ id: user._id, email: user.email });
  }
}

export default UserController;
