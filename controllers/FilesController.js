import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';

class FilesController {
  static async postUpload(req, res) {
    const { name, type, parentId, isPublic, data } = req.body;

    // Vérify setting
    if (!name) {
      return res.status(400).json({ error: 'Missing name' });
    }
    if (!type || !['folder', 'file', 'image'].includes(type)) {
      return res.status(400).json({ error: 'Missing or invalid type' });
    }
    if (type !== 'folder' && !data) {
      return res.status(400).json({ error: 'Missing data' });
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

    return res.status(201).json({ message: 'File uploaded successfully', file: fileInsertData });
  }
}

export default FilesController;
