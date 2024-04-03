import fs from 'fs';
import path from 'path';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';

class FilesController {
  static async postUpload(req, res) {
    // Verify users
    const xToken = req.headers['x-token'];
    if (!xToken) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const userId = await redisClient.get(`auth_${xToken}`);
    if (!userId) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const user = await dbClient.users.findOne({ _id: ObjectId(userId) });
    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    // Verify setting
    const { name, type, parentId, isPublic, data } = req.body;
    if (!name) {
      return res.status(400).send({ error: 'Missing name' });
    }
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).send({ error: 'Missing type' });
    }
    if (type !== 'folder' && !data) {
      return res.status(400).send({ error: 'Missing data' });
    }

    // Verify parent
    let modifiedParentId = parentId || 0;
    modifiedParentId = modifiedParentId === '0' ? 0 : ObjectId(modifiedParentId);
    if (modifiedParentId !== 0) {
      const parentFile = await dbClient.files.findOne({ _id: modifiedParentId });
      if (!parentFile) {
        return res.status(400).send({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return res.status(400).send({ error: 'Parent is not a folder' });
      }
    }

    // Create object/instance fileInsertData
    const fileInsertData = {
      userId: userId,
      name: name,
      type: type,
      isPublic: isPublic || false,
      parentId: modifiedParentId,
    };

    if (type === 'folder') {
      const insertedFile = await dbClient.files.insertOne(fileInsertData);
      return res.status(201).send({ message: 'Folder created successfully', file: insertedFile.ops[0] });
    }

    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    const filename = uuidv4();
    const filePath = path.join(folderPath, filename);

    fs.mkdirSync(folderPath, { recursive: true });

    fs.writeFileSync(filePath, Buffer.from(data, 'base64'));

    fileInsertData.localPath = filePath;

    const insertedFile = await dbClient.files.insertOne(fileInsertData);

    return res.status(201).send({ message: 'File uploaded successfully', file: insertedFile.ops[0] });
  }
}

export default FilesController;
