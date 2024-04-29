// import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
// import { DynamoDB } from '@aws-sdk/client-dynamodb'

import { S3Client, ListObjectsCommand } from '@aws-sdk/client-s3'
import {
  TextractClient,
  AnalyzeDocumentCommand,
} from '@aws-sdk/client-textract'
import {
  ApiResponsePage,
  TextractDocument,
} from 'amazon-textract-response-parser'
// import { Readable } from 'stream'

// const DYNAMO_TABLE_NAME = process.env.DYNAMO_TABLE_NAME || ''
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || ''
// const PRIMARY_KEY = process.env.PRIMARY_KEY || ''

// const db = DynamoDBDocument.from(new DynamoDB())

export const handler = async (_: any): Promise<any> => {
  const s3Client = new S3Client({})
  // TODO use lambda layer instead of tesseract service to save costs:
  // https://medium.com/nerd-for-tech/aws-knowledge-series-ocr-with-aws-lambda-tesseract-b0daeb2fd8fa; https://github.com/bweigel/aws-lambda-tesseract-layer/tree/main
  const textractClient = new TextractClient({})

  const listObjectsParams = { Bucket: S3_BUCKET_NAME }
  const { Contents } = await s3Client.send(
    new ListObjectsCommand(listObjectsParams),
  )

  if (Contents) {
    for (const object of Contents) {
      const objectKey = object.Key

      if (
        !(
          objectKey?.toLowerCase().endsWith('.jpg') ||
          objectKey?.toLowerCase().endsWith('.jpeg') ||
          objectKey?.toLowerCase().endsWith('.png') ||
          objectKey?.toLowerCase().endsWith('.tiff')
        )
      ) {
        console.log('Unsupported file type encountered, skipping: ' + objectKey)
        continue
      }

      console.log('Reading file with name: ' + objectKey)

      // Retrieve the PDF or image file from S3
      try {
        const textractResponse = await textractClient.send(
          new AnalyzeDocumentCommand({
            Document: {
              S3Object: {
                Bucket: S3_BUCKET_NAME,
                Name: objectKey,
              },
            },
            // TODO0 not needed
            FeatureTypes: ['FORMS'],
          }),
        )

        const doc = new TextractDocument(
          textractResponse as unknown as ApiResponsePage,
        )
        const text = doc.pageNumber(1).text
        // Cleanse the text and remove unnecessary characters
        const cleanedText = text
          // Replace multiple consecutive spaces with a single space
          .replace(/\s+/g, ' ')
          // Remove leading and trailing spaces
          .trim()
          // Remove unwanted characters
          .replace(/[-—]/g, '') // Remove hyphens
        console.log('Cleansed text: ' + cleanedText)
      } catch (error) {
        console.error('Error analyzing document:', error)
      }
    }
  }
}
