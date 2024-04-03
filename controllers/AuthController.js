import sha1 from 'sha1';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class AuthController {
  static async getConnect(req, res) {
    const cred = req.headers.authorization.split(' ')[1];
    const auth = Buffer.from(cred, 'base64').toString('utf-8');
    const [email, password] = auth.split(':');

    const user = await dbClient.users.findOne({ email, password: sha1(password) });
    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    } else {
      const token = uuidv4();
      const key = `auth_${token}`;
      await redisClient.set(key, user._id.toString(), 24 * 3600);
      return res.status(200).send({ token });
    }
  }

  static async getDisconnect(req, res) {
    const xToken = req.headers['x-token'];
    const key = `auth_${xToken}`;
    const userId = await redisClient.get(key);
    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    } else {
      await redisClient.del(key);
      return res.status(204).send();
    }
  }
}

export default AuthController;