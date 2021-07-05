import * as LambdaNodeJs from '@aws-cdk/aws-lambda-nodejs'
import * as ApiGateway from '@aws-cdk/aws-apigateway'
import * as S3 from '@aws-cdk/aws-s3'
import * as CDK from '@aws-cdk/core'

export class LiteCloudformationServiceStack extends CDK.Stack {
  constructor(scope: CDK.Construct, id: string, props?: CDK.StackProps) {
    super(scope, id, props)

    // Buckets
    const zippedThemesBucket = new S3.Bucket(this, 'LiteThemesZipped', {
      removalPolicy: CDK.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
    })

    const unzippedThemesBucket = new S3.Bucket(this, 'LiteThemesUnzipped', {
      removalPolicy: CDK.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
    })

    // Api
    const api = new ApiGateway.RestApi(this, 'tb-lite-serverless-service', {
      restApiName: 'tb-lite-serverless-service',
      description: 'Lite Serverless RestAPI',
    })

    // List Lambda
    const listObjectsHandler = new LambdaNodeJs.NodejsFunction(
      this,
      'listObjects',
      {
        entry: 'lambdas/index.ts',
        handler: 'listObjectsHandler',
        environment: {
          BUCKET_UNZIP_NAME: unzippedThemesBucket.bucketName,
          BUCKET_ZIP_NAME: zippedThemesBucket.bucketName,
        },
      }
    )

    unzippedThemesBucket.grantRead(listObjectsHandler)
    zippedThemesBucket.grantRead(listObjectsHandler)

    const getListObjects = new ApiGateway.LambdaIntegration(listObjectsHandler)
    const listApi = api.root.addResource('list')
    listApi.addMethod('GET', getListObjects)

    // Unzip Lambda
    const unzipObjectHandler = new LambdaNodeJs.NodejsFunction(
      this,
      'unzipObject',
      {
        // TODO: 10s might be too much or too little
        timeout: CDK.Duration.seconds(10),
        handler: 'unzipObjectHandler',
        entry: 'lambdas/index.ts',
        environment: {
          BUCKET_UNZIP_NAME: unzippedThemesBucket.bucketName,
          BUCKET_ZIP_NAME: zippedThemesBucket.bucketName,
        },
      }
    )

    unzippedThemesBucket.grantReadWrite(unzipObjectHandler)
    zippedThemesBucket.grantRead(unzipObjectHandler)

    const getUnzipObject = new ApiGateway.LambdaIntegration(unzipObjectHandler)
    const unzipApi = api.root.addResource('unzip')
    unzipApi.addMethod('GET', getUnzipObject)
  }
}
