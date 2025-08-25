# Shared Utils Documentation

## S3 Service (`s3.ts`)

The S3 Service provides a unified interface for uploading, downloading, and managing files in AWS S3. It follows the existing architecture patterns with proper error handling and logging.

### Features

- ✅ File upload to S3 with validation
- ✅ File deletion from S3  
- ✅ Pre-signed URL generation
- ✅ System Edition logo upload (specialized method)
- ✅ Image file validation (type and size)
- ✅ Automatic filename generation
- ✅ Comprehensive logging
- ✅ Error handling

### Configuration

Add the following environment variables to your `.env` file:

```env
# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-s3-bucket-name
AWS_S3_BUCKET_PATH=uploads/logos
```

### Usage Examples

#### Basic File Upload

```typescript
import { s3Service } from '../shared/utils/s3.js';
import { MulterFile } from '../shared/types/common.js';

// Upload any file
const uploadFile = async (file: MulterFile) => {
  try {
    const result = await s3Service.uploadFile(file, {
      folder: 'documents',
      filename: 'custom-filename.pdf',
      metadata: {
        userId: 'user123',
        department: 'marketing'
      }
    });
    
    console.log('File uploaded:', result.url);
    return result;
  } catch (error) {
    console.error('Upload failed:', error);
  }
};
```

#### System Edition Logo Upload

```typescript
// Upload logo for system edition (includes validation)
const uploadLogo = async (systemEditionId: string, file: MulterFile) => {
  try {
    const result = await s3Service.uploadSystemEditionLogo(systemEditionId, file);
    console.log('Logo uploaded:', result.url);
    return result;
  } catch (error) {
    console.error('Logo upload failed:', error);
  }
};
```

#### Generate Pre-signed URL

```typescript
// Generate temporary access URL (expires in 1 hour by default)
const getTemporaryUrl = async (s3Key: string) => {
  try {
    const signedUrl = await s3Service.getSignedUrl(s3Key, 3600); // 1 hour
    console.log('Temporary URL:', signedUrl);
    return signedUrl;
  } catch (error) {
    console.error('Failed to generate URL:', error);
  }
};
```

#### Delete File

```typescript
// Delete file from S3
const deleteFile = async (s3Key: string) => {
  try {
    await s3Service.deleteFile(s3Key);
    console.log('File deleted successfully');
  } catch (error) {
    console.error('Deletion failed:', error);
  }
};
```

### File Structure in S3

The service organizes files using the following structure:

```
bucket-name/
└── uploads/
    └── logos/
        └── system-editions/
            └── {systemEditionId}/
                └── logo-{timestamp}.{extension}
```

### Validation Rules

#### Image Files (for logos)
- **Allowed types**: JPEG, PNG, GIF, WebP
- **Maximum size**: 5MB
- **Automatic validation**: Applied to `uploadSystemEditionLogo()`

### Error Handling

The service provides detailed error messages and logging:

- Configuration validation on initialization
- File validation before upload
- S3 operation error handling
- Automatic retry for certain operations (planned)

### Integration with Existing Service

The S3 service is already integrated with `SystemEditionService.uploadSystemEditionLogo()`:

```typescript
// In SystemEditionService
async uploadSystemEditionLogo(id: string, file: MulterFile, updatedBy: string): Promise<string> {
  // Automatically handles:
  // - File validation
  // - S3 upload
  // - Database update
  // - Old logo cleanup
  // - Activity logging
  
  const uploadResult = await s3Service.uploadSystemEditionLogo(id, file);
  return uploadResult.url;
}
```

### Dependencies

- `@aws-sdk/client-s3`: AWS S3 client
- `@aws-sdk/s3-request-presigner`: Pre-signed URL generation

### Security Considerations

1. **IAM Permissions**: Ensure your AWS credentials have appropriate S3 permissions
2. **Bucket Policy**: Configure bucket policy for public read access if needed
3. **File Validation**: Built-in validation for image uploads
4. **Error Handling**: No sensitive data exposed in error messages

### Troubleshooting

1. **Configuration Error**: Check AWS credentials and bucket name
2. **Upload Failures**: Verify IAM permissions and bucket access
3. **File Not Found**: Check S3 key format and bucket path
4. **Large Files**: Check file size limits and timeout settings 