import * as Core from '@aws-cdk/core'
import * as ApiGateway from '@aws-cdk/aws-apigateway'
import * as Lambda from '@aws-cdk/aws-lambda'
import * as S3 from '@aws-cdk/aws-s3'

export class WidgetService extends Core.Construct {
  constructor(scope: Core.Construct, id: string, bucket: S3.Bucket) {
    super(scope, id)

    const handler = new Lambda.Function(this, 'WidgetHandler', {
      runtime: Lambda.Runtime.NODEJS_10_X, // So we can use async in widget.js
      code: Lambda.Code.fromAsset('lambdas'),
      handler: 'test.main',
      environment: {
        BUCKET: bucket.bucketName,
      },
    })

    bucket.grantReadWrite(handler) // was: handler.role);

    const api = new ApiGateway.RestApi(this, 'lite-api', {
      description: 'Lite services',
      restApiName: 'test',
    })

    const getWidgetsIntegration = new ApiGateway.LambdaIntegration(handler, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    })

    api.root.addMethod('GET', getWidgetsIntegration) // GET /
  }
}
