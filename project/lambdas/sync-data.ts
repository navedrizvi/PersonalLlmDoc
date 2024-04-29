import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb'
import {
  S3Client,
  ListObjectsCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import {
  TextractClient,
  AnalyzeDocumentCommand,
} from '@aws-sdk/client-textract'
import { PutCommand } from '@aws-sdk/lib-dynamodb'
import {
  ApiResponsePage,
  TextractDocument,
} from 'amazon-textract-response-parser'
import csvParser = require('csv-parser')
import { Readable } from 'stream'

const EHR_TABLE_NAME = process.env.EHR_TABLE_NAME || ''
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME || ''

interface WearableRecord {
  startDate: string
  endDate: string
  value: string
}

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
          } else if (objectKey?.includes('ActiveEnergyBurned_Cal')) {
            const records = await downloadWearableDataFromS3(
              s3Client,
              'ActiveEnergyBurned_Cal',
            )
            insertWearableRecordsIntoDynamoDB(
              records,
              dynamoDbClient,
              'ActiveEnergyBurned_Cal',
            )
          } else if (objectKey?.includes('Distance_Mile')) {
            const records = await downloadWearableDataFromS3(
              s3Client,
              'Distance_Mile',
            )
            insertWearableRecordsIntoDynamoDB(
              records,
              dynamoDbClient,
              'Distance_Mile',
            )
          } else if (objectKey?.includes('HeartRate_CounterPerMin')) {
            const records = await downloadWearableDataFromS3(
              s3Client,
              'HeartRate_CountPerMin',
            )
            insertWearableRecordsIntoDynamoDB(
              records,
              dynamoDbClient,
              'HeartRate_CountPerMin',
            )
          } else if (objectKey?.includes('Steps_Count')) {
            const records = await downloadWearableDataFromS3(
              s3Client,
              'Steps_Count',
            )
            insertWearableRecordsIntoDynamoDB(
              records,
              dynamoDbClient,
              'Steps_Count',
            )
          } else if (objectKey?.includes('BodyTemprature_Farenheit')) {
            const records = await downloadWearableDataFromS3(
              s3Client,
              'BodyTemprature_Farenheit',
            )
            insertWearableRecordsIntoDynamoDB(
              records,
              dynamoDbClient,
              'BodyTemprature_Farenheit',
            )
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

const downloadWearableDataFromS3 = async (
  s3Client: S3Client,
  objectKey: string,
): Promise<WearableRecord[]> => {
  try {
    const getObjectParams = {
      Bucket: S3_BUCKET_NAME,
      Key: objectKey,
    }

    const { Body } = await s3Client.send(new GetObjectCommand(getObjectParams))
    if (!Body || !(Body instanceof Readable)) {
      throw new Error('Invalid response body from S3 getObject')
    }

    return new Promise((resolve, reject) => {
      const records: WearableRecord[] = []
      const parser = Body.pipe(csvParser())

      parser.on('data', (data: any) => {
        const record: WearableRecord = {
          startDate: data.startDate,
          endDate: data.endDate,
          value: data.value,
        }
        records.push(record)
      })

      parser.on('end', () => resolve(records))
      parser.on('error', reject)
    })
  } catch (error) {
    console.error('Error downloading CSV from S3:', error)
    throw error
  }
}

const insertWearableRecordsIntoDynamoDB = async (
  records: WearableRecord[],
  dynamoDbClient: DynamoDBClient,
  tableName: string,
): Promise<void> => {
  try {
    for (const record of records) {
      const [startDateDate, startTime] = record.startDate.split(' ')
      const [endDateDate, endTime] = record.endDate.split(' ')

      const item = {
        startDate: startDateDate,
        endDate: endTime,
        value: record.value,
      }

      await dynamoDbClient.send(
        new PutCommand({
          TableName: tableName,
          Item: item,
        }),
      )
    }
  } catch (error) {
    console.error('Error inserting records into DynamoDB:', error)
  }
}
