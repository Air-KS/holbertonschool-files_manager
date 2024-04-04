import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const cred = req.headers.authorization.split(' ')[1];
    if (!cred || !cred.includes(':')) {
      return res.status(401).send({error: 'Invalide credentials format'});
    }
    const auth = Buffer.from(cred, 'base64').toString('utf-8');
    const [email, password] = auth.split(':');
    if (!email || !password) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const user = await dbClient.users.findOne({ email, password: sha1(password) });
    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const token = uuidv4();
    const key = `auth_${token}`;
    await redisClient.set(key, user._id.toString(), 24 * 60 * 60);
    return res.status(200).send({ token });
  }

  static async getDisconnect(req, res) {
    const xToken = req.headers['x-token'];
    if (!xToken) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = await redisClient.get(`auth_${xToken}`);
    if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const user = await dbClient.users.findOne({ _id: ObjectId(userId) });
    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      await redisClient.del(`auth_${xToken}`);
      return res.status(204).end();
  }
}

export default AuthController;
