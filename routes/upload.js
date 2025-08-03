// routes/upload.js
import express from 'express';
import multer from 'multer';
import cloudinary from '../utils/cloudinary.js';
import fs from 'fs';

const router = express.Router();

// 使用 diskStorage 暂存文件
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'tmp/'); // 本地暂存目录（记得创建 uploads 文件夹）
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 最大 5MB/张
}).array('images', 10); // 接收字段名为 images 的多图，最多10张

// 上传路由
router.post('/', (req, res) => {
  upload(req, res, async function (err) {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: '上传错误', error: err.message });
    } else if (err) {
      return res.status(500).json({ message: '服务器错误', error: err.message });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: '没有上传任何图片' });
    }

    try {
      const uploadResults = [];

      for (const file of req.files) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'multi_upload_example',
        });

        // 删除本地临时文件
        fs.unlinkSync(file.path);

        uploadResults.push({
          url: result.secure_url,
          public_id: result.public_id
        });
      }

      res.json({ message: '上传成功', images: uploadResults });

    } catch (uploadError) {
      res.status(500).json({ message: '上传 Cloudinary 出错', error: uploadError.message });
    }
  });
});

export default router;
