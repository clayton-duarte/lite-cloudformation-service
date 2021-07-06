import { S3Handler } from 'aws-lambda'
import * as unzipper from 'unzipper'
import * as AWS from 'aws-sdk'

const S3 = new AWS.S3()

const BUCKET_NAME = process.env.BUCKET_NAME || ''

export const unzipObjectHandler: S3Handler = async (event) => {
  try {
    // We just grab the first record, we do not accept multiple zip files
    const objectKey = event.Records[0].s3.object.key

    // then we extract all files on eam
    const zipFileStream = S3.getObject({ Bucket: BUCKET_NAME, Key: objectKey })
      .createReadStream()
      .pipe(unzipper.Parse({ forceStream: true }))

    const uploadPromises = []

    for await (const entry of zipFileStream) {
      const extractedFilesFolder = 'extracted'
      const zipFileFolder = objectKey.slice(0, -4)
      const filePath = entry.path

      if (entry.type === 'File') {
        // If file, prepare to upload
        uploadPromises.push(
          S3.upload({
            Key: [extractedFilesFolder, zipFileFolder, filePath].join('/'),
            ContentLength: entry.vars.uncompressedSize,
            Bucket: BUCKET_NAME,
            Body: entry,
          }).promise()
        )
      } else {
        // if not, remove from stream
        // https://github.com/ZJONSSON/node-unzipper#parse-zip-file-contents
        entry.autodrain()
      }
    }

    await Promise.all(uploadPromises)
  } catch (error) {
    // TODO: log to cloudwatch?
  }
}
