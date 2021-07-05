import * as CDK from '@aws-cdk/core'
import * as S3 from '@aws-cdk/aws-s3'

export class LiteCloudformationServiceStack extends CDK.Stack {
  constructor(scope: CDK.Construct, id: string, props?: CDK.StackProps) {
    super(scope, id, props)

    //
    new S3.Bucket(this, 'LiteThemesZipped', {
      removalPolicy: CDK.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
    })

    new S3.Bucket(this, 'LiteThemesUnzipped', {
      removalPolicy: CDK.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      versioned: true,
    })
  }
}
