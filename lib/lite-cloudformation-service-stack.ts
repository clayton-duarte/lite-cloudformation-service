import { S3EventSource } from '@aws-cdk/aws-lambda-event-sources'
import * as LambdaNodeJs from '@aws-cdk/aws-lambda-nodejs'
import * as ApiGateway from '@aws-cdk/aws-apigateway'
import * as S3 from '@aws-cdk/aws-s3'
import * as CDK from '@aws-cdk/core'

export class LiteCloudformationServiceStack extends CDK.Stack {
  constructor(scope: CDK.Construct, id: string, props?: CDK.StackProps) {
    super(scope, id, props)

    // Themes Bucket
    const themesBucket = new S3.Bucket(this, 'lite-themes', {
      removalPolicy: CDK.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
    })

    // Unzip Lambda
    const unzipObjectHandler = new LambdaNodeJs.NodejsFunction(
      this,
      'unzipObject',
      {
        environment: { BUCKET_NAME: themesBucket.bucketName },
        description: 'Lambda function to un-zip files',
        // TODO: 10s might be too little (300kb == 5~8s) :shrug:
        timeout: CDK.Duration.seconds(10),
        handler: 'unzipObjectHandler',
        entry: 'lambdas/index.ts',
      }
    )

    themesBucket.grantReadWrite(unzipObjectHandler)

    unzipObjectHandler.addEventSource(
      new S3EventSource(themesBucket, {
        events: [S3.EventType.OBJECT_CREATED],
        filters: [{ suffix: '.zip' }],
      })
    )

    // Api
    const api = new ApiGateway.RestApi(this, 'lite-serverless-service', {
      restApiName: 'lite-serverless-service',
      description: 'Lite Serverless RestAPI',
    })

    // Build Website Lambda
    const buildWebsiteHandler = new LambdaNodeJs.NodejsFunction(
      this,
      'buildWebsite',
      {
        environment: { BUCKET_NAME: themesBucket.bucketName },
        handler: 'buildWebsiteHandler',
        entry: 'lambdas/index.ts',
      }
    )

    themesBucket.grantRead(buildWebsiteHandler)

    const buildWebsiteAction = new ApiGateway.LambdaIntegration(
      buildWebsiteHandler
    )
    const listApi = api.root.addResource('list')
    // TODO: change it to a POST! using GET only to make dev easier
    listApi.addMethod('GET', buildWebsiteAction)
  }
}
