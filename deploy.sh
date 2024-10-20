#!/bin/bash

set -e

if ! command -v aws &> /dev/null; then
    echo "Error: AWS CLI is not installed or not in PATH. Please install AWS CLI and try again."
    exit 1
fi

if ! command -v sam &> /dev/null; then
    echo "Error: SAM CLI is not installed or not in PATH. Please install SAM CLI and try again."
    exit 1
fi

AWS_ACCESS_KEY_ID=$(aws configure get aws_access_key_id)
AWS_SECRET_ACCESS_KEY=$(aws configure get aws_secret_access_key)
AWS_REGION=$(aws configure get region)


if [ -z "$AWS_ACCESS_KEY_ID" ] || [ -z "$AWS_SECRET_ACCESS_KEY" ] || [ -z "$AWS_REGION" ]; then
    echo "Error: AWS credentials or region not found. Please run 'aws configure' to set them up."
    exit 1
fi

STACK_NAME="figma-dag-stack"
BUCKET_NAME="figma-dag-bucket"

echo "Creating public S3 bucket for Lambda..."
aws s3 mb s3://$BUCKET_NAME --region $AWS_REGION
aws s3api put-public-access-block \
    --bucket $BUCKET_NAME \
    --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"

aws s3api put-bucket-policy \
    --bucket $BUCKET_NAME \
    --policy '{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::'$BUCKET_NAME'/*"
        }
    ]
}'

# Build the SAM application
echo "Building the SAM application..."
sam build

# Deploy the SAM application
echo "Deploying the SAM application..."
sam deploy \
    --stack-name $STACK_NAME \
    --s3-bucket $BUCKET_NAME \
    --capabilities CAPABILITY_IAM \
    --region $AWS_REGION \
    --no-confirm-changeset \
    --no-fail-on-empty-changeset

echo "Deployment completed successfully!"
