import {
  S3Client,
  CopyObjectCommand,
  DeleteObjectCommand,
  ListObjectsCommand,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { StorageListResponse, generateStorageId } from '.';
import { formatBytes } from '@/utility/number';
import { removeUrlProtocol } from '@/utility/url';

const AWS_S3_BUCKET = process.env.NEXT_PUBLIC_AWS_S3_BUCKET ?? '';
const AWS_S3_REGION = process.env.NEXT_PUBLIC_AWS_S3_REGION ?? '';
const AWS_S3_ACCESS_KEY = process.env.AWS_S3_ACCESS_KEY ?? '';
const AWS_S3_SECRET_ACCESS_KEY = process.env.AWS_S3_SECRET_ACCESS_KEY ?? '';
const AWS_S3_ENDPOINT = process.env.AWS_S3_ENDPOINT ?? '';
const AWS_S3_PUBLIC_DOMAIN =
  removeUrlProtocol(process.env.NEXT_PUBLIC_AWS_S3_PUBLIC_DOMAIN) ?? '';
const AWS_S3_KEY_PREFIX = (
  process.env.NEXT_PUBLIC_AWS_S3_KEY_PREFIX ?? process.env.AWS_S3_KEY_PREFIX
)?.replace(/^\/|\/$/g, '') ?? '';
const AWS_S3_PATH = AWS_S3_KEY_PREFIX ? `/${AWS_S3_KEY_PREFIX}` : '';

export const AWS_S3_BASE_URL = AWS_S3_PUBLIC_DOMAIN
  ? `https://${AWS_S3_PUBLIC_DOMAIN}${AWS_S3_PATH}`
  : AWS_S3_BUCKET && AWS_S3_REGION
    ? `https://${AWS_S3_BUCKET}.s3.${AWS_S3_REGION}.amazonaws.com${AWS_S3_PATH}`
    : undefined;

export const awsS3Client = () => new S3Client({
  region: AWS_S3_REGION || 'auto',
  ...(AWS_S3_ENDPOINT ? { endpoint: AWS_S3_ENDPOINT } : {}),
  credentials: {
    accessKeyId: AWS_S3_ACCESS_KEY,
    secretAccessKey: AWS_S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: false,
});

const objectKey = (fileName: string) =>
  AWS_S3_KEY_PREFIX ? `${AWS_S3_KEY_PREFIX}/${fileName}` : fileName;

const urlForKey = (key = '') => {
  // BASE_URL already contains the configured directory, while S3 returns
  // complete object keys. Remove that directory once before joining them.
  const prefix = AWS_S3_KEY_PREFIX ? `${AWS_S3_KEY_PREFIX}/` : '';
  const relativeKey = prefix && key.startsWith(prefix)
    ? key.slice(prefix.length)
    : key;
  return `${AWS_S3_BASE_URL}/${relativeKey}`;
};

export const isUrlFromAwsS3 = (url?: string) =>
  Boolean(AWS_S3_BASE_URL && url?.startsWith(AWS_S3_BASE_URL));

export const awsS3Put = async (
  file: Buffer,
  fileName: string,
): Promise<string> => {
  const Key = objectKey(fileName);
  await awsS3Client().send(new PutObjectCommand({
    Bucket: AWS_S3_BUCKET,
    Key,
    Body: file,
    ACL: 'public-read',
  }));
  return urlForKey(Key);
};

export const awsS3Copy = async (
  fileNameSource: string,
  fileNameDestination: string,
  addRandomSuffix?: boolean,
) => {
  const name = fileNameSource.split('.')[0];
  const extension = fileNameSource.split('.')[1];
  const Key = addRandomSuffix
    ? `${name}-${generateStorageId()}.${extension}`
    : objectKey(fileNameDestination);
  const SourceKey = fileNameSource.includes('/')
    ? fileNameSource.split('/').pop()!
    : fileNameSource;
  await awsS3Client().send(new CopyObjectCommand({
    Bucket: AWS_S3_BUCKET,
    CopySource: `${AWS_S3_BUCKET}/${objectKey(SourceKey)}`,
    Key,
    ACL: 'public-read',
  }));
  return urlForKey(Key);
};

export const awsS3List = async (
  Prefix: string,
): Promise<StorageListResponse> =>
  awsS3Client().send(new ListObjectsCommand({
    Bucket: AWS_S3_BUCKET,
    Prefix: objectKey(Prefix),
  }))
    .then((data) => data.Contents?.map(({ Key, LastModified, Size }) => ({
      url: urlForKey(Key ?? ''),
      fileName: Key?.split('/').pop() ?? '',
      uploadedAt: LastModified,
      size: Size ? formatBytes(Size) : undefined,
    })) ?? []);

export const awsS3Delete = async (fileName: string) => {
  await awsS3Client().send(new DeleteObjectCommand({
    Bucket: AWS_S3_BUCKET,
    Key: objectKey(fileName),
  }));
};

export const awsS3GetSignedUrl = (
  Key: string,
  method: 'GET' | 'PUT',
  expiresIn: number,
) => {
  const client = awsS3Client();
  const objectKeyPath = objectKey(Key);
  const command = method === 'GET'
    ? new GetObjectCommand({ Bucket: AWS_S3_BUCKET, Key: objectKeyPath })
    : new PutObjectCommand({
      Bucket: AWS_S3_BUCKET,
      Key: objectKeyPath,
      ACL: 'public-read',
    });
  return getSignedUrl(client, command, { expiresIn });
};
