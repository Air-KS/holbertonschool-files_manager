import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

class FilesController {
  static async postUpload(req, res) {
    const { name, type, parentId, isPublic, data } = req.body;

    // Verify setting
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing or invalid type' });
    }
    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
    }

    // Vérify users
    const userId = req.user ? req.user._id : null;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Vérify parent
    let modifiedParentId = parentId || 0;
    modifiedParentId = modifiedParentId === '0' ? 0 : ObjectId(modifiedParentId);
    if (modifiedParentId !== 0) {
      const parentFile = await dbClient.files.findOne({ _id: modifiedParentId });
      if (!parentFile) {
        return res.status(400).json({ error: 'Parent not found' });
      }
      if (parentFile.type !== 'folder') {
        return res.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    // Create object/instance fileInserData
    const fileInsertData = {
      userId: req.user._id,
      name: name,
      type: type,
      isPublic: isPublic || false,
      parentId: modifiedParentId,
    };

    if (type === 'folder') {
      const insertedFile = await dbClient.files.insertOne(fileInsertData);
      return res.status(201).json({ message: 'Folder created successfully', file: insertedFile.ops[0] });
    }

    const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
    const filename = uuidv4();
    const filePath = path.join(folderPath, filename);

    fs.mkdirSync(folderPath, { recursive: true });

    fs.writeFileSync(filePath, Buffer.from(data, 'base64'));

    fileInsertData.localPath = filePath;

    const insertedFile = await dbClient.files.insertOne(fileInsertData);

    return res.status(201).json({ message: 'File uploaded successfully', file: insertedFile.ops[0] });
  }
}

export default FilesController;
