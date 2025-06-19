import { Request, Response, NextFunction } from "express";
import multer from "multer";
import { BadRequestError } from "../errors/bad-request.error.js";
import { ServerError } from "../errors/server.error.js";
import sharp from "sharp";

const storage = multer.memoryStorage();
const upload = multer({ storage });

export const FileHandler = (fields: { name: string; maxCount?: number }[]) => {
  const uploadFields = upload.fields(fields);

  return async (req: Request, res: Response, next: NextFunction) => {
    uploadFields(req, res, async (err) => {
      if (err instanceof multer.MulterError) {
        return next(new BadRequestError("multer_error", err.message));
      } else if (err) {
        return next(new ServerError("file_upload_error", err.message));
      }

      try {
        for (const field of fields) {
          const files = (req.files as any)?.[field.name] as
            | Express.Multer.File[]
            | undefined;
          if (!files) continue;

          for (const file of files) {
            const processedBuffer = await sharp(file.buffer)
              .rotate()
              .resize(1024)
              .jpeg({ quality: 70 })
              .toBuffer();

            file.buffer = processedBuffer;

            file.size = processedBuffer.length;
            file.mimetype = "image/jpeg";
            file.originalname = file.originalname.replace(/\.\w+$/, ".jpg");
          }
        }

        next();
      } catch (processingErr) {
        return next(
          new ServerError(
            "image_processing_error",
            (processingErr as Error).message,
          ),
        );
      }
    });
  };
};
