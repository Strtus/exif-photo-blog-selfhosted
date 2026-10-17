/** @jest-environment node */

const mockSend = jest.fn();

jest.mock('@aws-sdk/client-s3', () => {
  class Command {
    constructor(public input: Record<string, unknown>) {}
  }
  return {
    S3Client: jest.fn(() => ({ send: mockSend })),
    CopyObjectCommand: Command,
    DeleteObjectCommand: Command,
    ListObjectsCommand: Command,
    PutObjectCommand: Command,
    GetObjectCommand: Command,
  };
});
jest.mock('@aws-sdk/s3-request-presigner', () => ({ getSignedUrl: jest.fn() }));
jest.mock('@/platforms/storage', () => ({ generateStorageId: () => 'new-storage-id' }));

describe('S3 storage with an object key prefix', () => {
  const originalEnv = { ...process.env };
  let storage: typeof import('@/platforms/storage/aws-s3');

  beforeAll(async () => {
    process.env.NEXT_PUBLIC_AWS_S3_BUCKET = 'gallery-bucket';
    process.env.NEXT_PUBLIC_AWS_S3_REGION = 'ap-shanghai';
    process.env.NEXT_PUBLIC_AWS_S3_PUBLIC_DOMAIN = 'images.example.test';
    process.env.NEXT_PUBLIC_AWS_S3_KEY_PREFIX = 'photoblog';
    storage = await import('@/platforms/storage/aws-s3');
  });
  beforeEach(() => mockSend.mockReset());
  afterAll(() => { process.env = originalEnv; });

  it('lists uploads with exactly one storage directory in the public URL', async () => {
    mockSend.mockResolvedValue({ Contents: [{ Key: 'photoblog/upload-abc.jpeg', Size: 100 }] });
    const files = await storage.awsS3List('upload-');
    expect(files[0].url).toBe('https://images.example.test/photoblog/upload-abc.jpeg');
    expect(mockSend.mock.calls[0][0].input.Prefix).toBe('photoblog/upload-');
  });

  it('returns the actual object URL after writing an image', async () => {
    mockSend.mockResolvedValue({});
    await expect(storage.awsS3Put(Buffer.from('image'), 'photo-abc-sm.jpg'))
      .resolves.toBe('https://images.example.test/photoblog/photo-abc-sm.jpg');
    expect(mockSend.mock.calls[0][0].input.Key).toBe('photoblog/photo-abc-sm.jpg');
  });

  it('keeps copy source, destination and returned URL in the same directory', async () => {
    mockSend.mockResolvedValue({});
    await expect(storage.awsS3Copy('upload-abc.jpeg', 'photo-def.jpeg'))
      .resolves.toBe('https://images.example.test/photoblog/photo-def.jpeg');
    expect(mockSend.mock.calls[0][0].input).toMatchObject({
      Key: 'photoblog/photo-def.jpeg',
      CopySource: 'gallery-bucket/photoblog/upload-abc.jpeg',
    });
  });
});
