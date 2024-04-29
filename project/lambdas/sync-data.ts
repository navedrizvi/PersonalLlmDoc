import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb'
import { S3Client, ListObjectsCommand } from '@aws-sdk/client-s3'
import {
  TextractClient,
  AnalyzeDocumentCommand,
} from '@aws-sdk/client-textract'
import { PutCommand } from '@aws-sdk/lib-dynamodb'
import {
  ApiResponsePage,
  TextractDocument,
} from 'amazon-textract-response-parser'

const EHR_TABLE_NAME = process.env.EHR_TABLE_NAME || ''
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || ''

export const handler = async (_: any): Promise<any> => {
  try {
    const s3Client = new S3Client({})
    // TODO use lambda layer instead of tesseract service to save costs:
    // https://medium.com/nerd-for-tech/aws-knowledge-series-ocr-with-aws-lambda-tesseract-b0daeb2fd8fa; https://github.com/bweigel/aws-lambda-tesseract-layer/tree/main
    const textractClient = new TextractClient({})
    const dynamoDbClient = new DynamoDBClient({})

    const listObjectsParams = { Bucket: S3_BUCKET_NAME, Delimiter: '/' }

    const { CommonPrefixes } = await s3Client.send(
      new ListObjectsCommand(listObjectsParams),
    )

    for (const prefix of CommonPrefixes!) {
      const folderName = prefix.Prefix?.split('/')[0]

      // Check if the document has already been processed
      const queryCommand = new QueryCommand({
        TableName: EHR_TABLE_NAME,
        KeyConditionExpression: 'fileName = :fileName',
        ExpressionAttributeValues: {
          ':fileName': { S: folderName! },
        },
      })
      const queryResult = await dynamoDbClient.send(queryCommand)

      if (queryResult.Count && queryResult.Count > 0) {
        console.log(`Document ${folderName} has already been processed.`)
        continue
      }

      const { Contents } = await s3Client.send(
        new ListObjectsCommand({
          Bucket: S3_BUCKET_NAME,
          Prefix: folderName,
        }),
      )

      if (Contents) {
        let aggregatedText = ''

        for (const object of Contents) {
          const objectKey = object.Key

          if (
            objectKey?.toLowerCase().endsWith('.jpg') ||
            objectKey?.toLowerCase().endsWith('.jpeg') ||
            objectKey?.toLowerCase().endsWith('.png') ||
            objectKey?.toLowerCase().endsWith('.tiff')
          ) {
            const textractResponse = await textractClient.send(
              new AnalyzeDocumentCommand({
                Document: {
                  S3Object: {
                    Bucket: S3_BUCKET_NAME,
                    Name: objectKey,
                  },
                },
                FeatureTypes: ['FORMS'],
              }),
            )

            const doc = new TextractDocument(
              textractResponse as unknown as ApiResponsePage,
            )
            for (let i = 1; i <= doc.nPages; i++) {
              const text = doc.pageNumber(i).text
              const cleanedText = text
                // Replace multiple consecutive spaces with a single space
                .replace(/\s+/g, ' ')
                // Remove leading and trailing spaces
                .trim()
                // Remove hyphens
                .replace(/[-—]/g, '')
              aggregatedText += cleanedText + ' '
            }
          }
        }

        // Insert the aggregated text into DynamoDB
        if (aggregatedText.trim() !== '') {
          await dynamoDbClient.send(
            new PutCommand({
              TableName: EHR_TABLE_NAME,
              Item: {
                fileName: folderName,
                insertionTime: Date.now(),
                text: aggregatedText.trim(),
              },
            }),
          )
          console.log(`Inserted document ${folderName} into DynamoDB.`)
        }
      }
    }
  } catch (error) {
    console.error('Error processing documents:', error)
  }
}
