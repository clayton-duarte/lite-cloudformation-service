import { APIGatewayProxyHandler } from 'aws-lambda'
import * as unzipper from 'unzipper'
import * as AWS from 'aws-sdk'

const S3 = new AWS.S3()

const unzippedBucketName = process.env.BUCKET_UNZIP_NAME || ''
const zippedBucketName = process.env.BUCKET_ZIP_NAME || ''

export const listObjectsHandler: APIGatewayProxyHandler = async (event) => {
  try {
    const { Contents: UnzipContents }: AWS.S3.ListObjectsV2Output =
      await S3.listObjectsV2({ Bucket: unzippedBucketName }).promise()

    const { Contents: ZipContents }: AWS.S3.ListObjectsV2Output =
      await S3.listObjectsV2({ Bucket: zippedBucketName }).promise()

    if (typeof UnzipContents === 'undefined') {
      throw Error('AWS.S3.ObjectList of UnzipContents is undefined')
    }

    if (typeof ZipContents === 'undefined') {
      throw Error('AWS.S3.ObjectList of ZipContents is undefined')
    }

    return {
      body: JSON.stringify({
        zip: ZipContents.map((obj) => obj.Key),
        unzip: UnzipContents.map((obj) => obj.Key),
      }),
      statusCode: 200,
      headers: {},
    }
  } catch (error) {
    return {
      body: JSON.stringify(error.stack ?? JSON.stringify(error, null, 2)),
      statusCode: 500,
      headers: {},
    }
  }
}

// TODO: make it triggered by S3 put, not by Api
export const unzipObjectHandler: APIGatewayProxyHandler = async (event) => {
  try {
    // const filename = event.queryStringParameters?.filename
    const filename = 'theme.zip'

    if (filename === undefined) {
      throw Error('Missing filename query parameter')
    }

    const fileStream = S3.getObject({ Bucket: zippedBucketName, Key: filename })
      .createReadStream()
      .pipe(unzipper.Parse({ forceStream: true }))
      .on('error', (e: any) => console.log(`Error extracting file: `, e))

    // TODO: Logs
    // TODO: Parallel upload? Promise.all([])?
    for await (const entry of fileStream) {
      const target = `extracted/${filename.slice(0, -4)}/${entry.path}`

      if (entry.type === 'File') {
        await S3.upload({
          ContentLength: entry.vars.uncompressedSize,
          Bucket: unzippedBucketName,
          Key: target,
          Body: entry,
        }).promise()
      }
    }

    // TODO: better return body
    return {
      body: 'OK',
      statusCode: 200,
      headers: {},
    }
  } catch (error) {
    return {
      body: JSON.stringify(error.stack ?? JSON.stringify(error, null, 2)),
      statusCode: 500,
      headers: {},
    }
  }
}
