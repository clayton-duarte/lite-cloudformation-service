import { S3EventSource } from '@aws-cdk/aws-lambda-event-sources'
import * as LambdaNodeJs from '@aws-cdk/aws-lambda-nodejs'
import * as S3 from '@aws-cdk/aws-s3'
import * as CDK from '@aws-cdk/core'

export class LiteCloudformationServiceStack extends CDK.Stack {
  constructor(scope: CDK.Construct, id: string, props?: CDK.StackProps) {
    super(scope, id, props)

    // Theme Bucket
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
        description: 'Lambda function to un-zip files',
        // TODO: 10s might be too little (300kb == 5~8s) :shrug:
        timeout: CDK.Duration.seconds(10),
        handler: 'unzipObjectHandler',
        entry: 'lambdas/index.ts',
        environment: {
          BUCKET_NAME: themesBucket.bucketName,
        },
      }
    )

    themesBucket.grantReadWrite(unzipObjectHandler)

    unzipObjectHandler.addEventSource(
      new S3EventSource(themesBucket, {
        events: [S3.EventType.OBJECT_CREATED],
        filters: [{ suffix: '.zip' }],
      })
    )
  }
}
