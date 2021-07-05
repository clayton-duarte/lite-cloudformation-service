import * as CDK from '@aws-cdk/core'
import * as S3 from '@aws-cdk/aws-s3'
import * as ApiGateway from '@aws-cdk/aws-apigateway'
import * as LambdaNodeJs from '@aws-cdk/aws-lambda-nodejs'

export class LiteCloudformationServiceStack extends CDK.Stack {
  constructor(scope: CDK.Construct, id: string, props?: CDK.StackProps) {
    super(scope, id, props)

    // Buckets
    const zippedThemesBucket = new S3.Bucket(this, 'LiteThemesZipped', {
      removalPolicy: CDK.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
    })

    new S3.Bucket(this, 'LiteThemesUnzipped', {
      removalPolicy: CDK.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
    })

    // Lambdas
    const listObjectsHandler = new LambdaNodeJs.NodejsFunction(
      this,
      'listFiles',
      {
        handler: 'listObjectsHandler',
        entry: 'lambdas/index.ts',
        environment: {
          BUCKET_NAME: zippedThemesBucket.bucketName,
        },
      }
    )

    zippedThemesBucket.grantReadWrite(listObjectsHandler)

    // Api
    const api = new ApiGateway.RestApi(this, 'tb-lite-serverless-service', {
      restApiName: 'tb-lite-serverless-service',
      description: 'Lite Serverless RestAPI',
    })

    const getWidgetsIntegration = new ApiGateway.LambdaIntegration(
      listObjectsHandler,
      {
        requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
      }
    )

    api.root.addMethod('GET', getWidgetsIntegration) // GET
  }
}
