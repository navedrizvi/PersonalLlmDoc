// import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
// import { DynamoDB } from '@aws-sdk/client-dynamodb'

// TODO use lambda layer instead of tesseract service to save costs:
// https://medium.com/nerd-for-tech/aws-knowledge-series-ocr-with-aws-lambda-tesseract-b0daeb2fd8fa; https://github.com/bweigel/aws-lambda-tesseract-layer/tree/main

import {
  S3Client,
  // GetObjectCommand,
  ListObjectsCommand,
} from '@aws-sdk/client-s3'
import {
  TextractClient,
  AnalyzeDocumentCommand,
} from '@aws-sdk/client-textract'
// import { Readable } from 'stream'

// const DYNAMO_TABLE_NAME = process.env.DYNAMO_TABLE_NAME || ''
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || ''
// const PRIMARY_KEY = process.env.PRIMARY_KEY || ''

// const db = DynamoDBDocument.from(new DynamoDB())

export const handler = async (_: any): Promise<any> => {
  const s3Client = new S3Client()
  const textractClient = new TextractClient()

  // List all objects in the S3 bucket
  const listObjectsParams = { Bucket: S3_BUCKET_NAME }
  const { Contents } = await s3Client.send(
    new ListObjectsCommand(listObjectsParams),
  )

  // Iterate through the objects in the bucket
  if (Contents) {
    for (const object of Contents) {
      const objectKey = object.Key

      console.log('Reading object with name: ' + objectKey)

      // Retrieve the PDF or image file from S3
      try {
        const { Blocks } = await textractClient.send(
          new AnalyzeDocumentCommand({
            Document: {
              S3Object: {
                Bucket: S3_BUCKET_NAME,
                Name: objectKey,
              },
            },
            FeatureTypes: ['TABLES'],
          }),
        )
        console.log('Extracted text:', JSON.stringify(Blocks, null, 2))
      } catch (error) {
        console.error('Error analyzing document:', error)
      }
    }
  }
}
