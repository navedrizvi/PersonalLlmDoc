// import { DynamoDBDocument } from '@aws-sdk/lib-dynamodb'
// import { DynamoDB } from '@aws-sdk/client-dynamodb'

// TODO use lambda layer instead of tesseract service to save costs:
// https://github.com/bweigel/aws-lambda-tesseract-layer/tree/main

const TABLE_NAME = process.env.TABLE_NAME || ''
// const PRIMARY_KEY = process.env.PRIMARY_KEY || ''

// const db = DynamoDBDocument.from(new DynamoDB())

export const handler = async (event: any = {}): Promise<any> => {
  console.log(event)
  console.log('hello')
  console.log(TABLE_NAME)
}
