import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { StreamingBlobPayloadInputTypes } from "@smithy/types";
import { ServerError } from "../errors/server.error.js";

const accessKeyId = process.env.AWS_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY || "";
<<<<<<< HEAD
const region = process.env.AWS_REGION || "sa-east-1";
=======
const region = process.env.AWS_REGION || "";
>>>>>>> origin/main
const Bucket = process.env.AWS_S3_BUCKET || "";

class FileApi {
  private client = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
  constructor() {}

  public async list({ path }: { path: string }) {
    const command = new ListObjectsV2Command({
      Bucket,
      Prefix: path,
    });

    try {
      return this.client.send(command);
    } catch (err) {
      throw new ServerError("s3_application_error", "Error getting s3 object");
    }
  }

  public async get({ key }: { key: string }): Promise<any> {
    const command = new GetObjectCommand({
      Bucket,
      Key: key,
    });

    try {
      const response = await this.client.send(command);

      if (response && response.Body) {
        return response.Body.transformToString();
      }
    } catch (err) {
      throw new ServerError("s3_application_error", "Error getting s3 object");
    }
  }

  public async upload({
    key,
    data,
  }: {
    key: string;
    data: StreamingBlobPayloadInputTypes;
  }) {
    const command = new PutObjectCommand({
      ACL: "public-read",
      Bucket,
      Key: key,
      Body: data,
    });

    try {
      return this.client.send(command);
    } catch (err) {
      throw new ServerError("s3_application_error", "Error putting s3 object");
    }
  }

  public async delete({ key }: { key: string }) {
    const command = new DeleteObjectCommand({
      Bucket,
      Key: key,
    });

    try {
      return this.client.send(command);
    } catch (err) {
      throw new ServerError("s3_application_error", "Error deleting s3 object");
    }
  }
}

export const fileApi = new FileApi();
