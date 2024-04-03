import dbClient from '../utils/db';
import sha1 from 'sha1';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) return res.status(400).send({ error: 'Missing email' });
    if (!password) return res.status(400).send({ error: 'Missing password' });
    const emailExists = await dbClient.users.findOne({ email });
    if (emailExists) return res.status(400).send({ error: 'Already exist' });

    const user = { email, password: sha1(password) };
    const result = await dbClient.db.collection('users').insertOne(user);

    return res.status(201).send({ id: result.insertedId, email });
  }
}

export default UsersController;
