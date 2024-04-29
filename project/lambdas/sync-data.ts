// import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
// import { DynamoDB } from '@aws-sdk/client-dynamodb'

// TODO use lambda layer instead of tesseract service to save costs:
// https://medium.com/nerd-for-tech/aws-knowledge-series-ocr-with-aws-lambda-tesseract-b0daeb2fd8fa; https://github.com/bweigel/aws-lambda-tesseract-layer/tree/main

import {
  S3Client,
  GetObjectCommand,
  ListObjectsCommand,
} from '@aws-sdk/client-s3'
import {
  TextractClient,
  AnalyzeDocumentCommand,
} from '@aws-sdk/client-textract'
import { Readable } from 'stream'

// const DYNAMO_TABLE_NAME = process.env.DYNAMO_TABLE_NAME || ''
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || ''
// const PRIMARY_KEY = process.env.PRIMARY_KEY || ''

// const db = DynamoDBDocument.from(new DynamoDB())

export const handler = async (event: any = {}): Promise<any> => {
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

      // Retrieve the PDF or image file from S3
      const getObjectParams = { Bucket: S3_BUCKET_NAME, Key: objectKey }
      const { Body } = await s3Client.send(
        new GetObjectCommand(getObjectParams),
      )

      if (!Body) {
        console.error('Empty Body for object:', objectKey)
        continue // Skip to the next object
      }

      // Convert the object's content to base64
      // const content = await blobToBase64(Body)

      // Analyze the document using Amazon Textract
      const analyzeParams = {
        Document: {
          Bytes: Body.transformToByteArray(),
        },
      }

      try {
        const { Blocks } = await textractClient.send(
          new AnalyzeDocumentCommand(analyzeParams),
        )
        console.log('Extracted text:', JSON.stringify(Blocks, null, 2))
      } catch (error) {
        console.error('Error analyzing document:', error)
      }
    }
  }
}

const blobToBase64 = async (blob: Blob): Promise<string> => {
  const reader = new Response(blob).body?.getReader()
  if (!reader) {
    throw new Error('Failed to get reader from Blob.')
  }

  let chunks: Uint8Array[] = []
  let done = false

  while (!done) {
    const { value, done: readerDone } = await reader.read()
    if (value) {
      chunks.push(value)
    }
    done = readerDone
  }

  const buffer = Buffer.concat(chunks)
  return buffer.toString('base64')
}
