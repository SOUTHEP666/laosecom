import cloudinary from "../utils/cloudinary.js";
import multer from "multer";
import streamifier from "streamifier";

// 使用 multer 内存存储（不存本地）
const upload = multer({ storage: multer.memoryStorage() });

// 处理上传，返回 Cloudinary URL
export const uploadImage = [
  upload.single("file"), // 前端字段名是 file
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "未上传文件" });
      }

      const streamUpload = (buffer) => {
        return new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: "your-folder-name" }, // 你可改为项目相关文件夹名
            (error, result) => {
              if (result) resolve(result);
              else reject(error);
            }
          );
          streamifier.createReadStream(buffer).pipe(stream);
        });
      };

      const result = await streamUpload(req.file.buffer);
      res.json({ message: "上传成功", url: result.secure_url });
    } catch (err) {
      console.error("上传失败:", err);
      res.status(500).json({ message: "上传失败" });
    }
  },
];
