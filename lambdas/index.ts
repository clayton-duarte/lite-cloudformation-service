import * as AWS from 'aws-sdk'
import { APIGatewayProxyHandler } from 'aws-lambda'

const S3 = new AWS.S3()

const bucketName = process.env.BUCKET_NAME || ''

export const listObjectsHandler: APIGatewayProxyHandler = async function (
  event
) {
  try {
    if (event.httpMethod === 'GET') {
      if (event.path === '/') {
        const data: AWS.S3.ListObjectsV2Output = await S3.listObjectsV2({
          Bucket: bucketName,
        }).promise()

        const { Contents } = data

        if (typeof Contents === 'undefined') {
          throw Error('AWS.S3.ObjectList is undefined')
        }

        const body = {
          widgets: Contents.map((e) => e.Key),
        }

        return {
          body: JSON.stringify(body),
          statusCode: 200,
          headers: {},
        }
      }
    }

    return {
      body: 'We only accept GET for now',
      statusCode: 400,
      headers: {},
    }
  } catch (error) {
    var body = error.stack ?? JSON.stringify(error, null, 2)

    return {
      body: JSON.stringify(body),
      statusCode: 500,
      headers: {},
    }
  }
}
