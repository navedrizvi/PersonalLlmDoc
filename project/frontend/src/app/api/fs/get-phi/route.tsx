import fs from "fs";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const dynamoDBClient = new DynamoDBClient({
  region: process.env.MY_AWS_REGION!,
  credentials: {
    accessKeyId: process.env.MY_AWS_ACCESSKEY_ID!,
    secretAccessKey: process.env.MY_AWS_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: NextRequest) {
  const j = await request.json();
  const TableName = j.tableName;
  const ProjectionExpression = j.projectionExpression;
  const ExpressionAttributeNames = j.expressionAttributeNames;

  let scanCmd: ScanCommand;
  if (ExpressionAttributeNames) {
    scanCmd = new ScanCommand({
      TableName,
      ProjectionExpression,
      ExpressionAttributeNames,
    });
  } else {
    scanCmd = new ScanCommand({
      TableName,
      ProjectionExpression,
    });
  }
  const data = await dynamoDBClient.send(scanCmd);

  return new NextResponse(JSON.stringify(data.Items!), {
    status: 200,
  });
}
