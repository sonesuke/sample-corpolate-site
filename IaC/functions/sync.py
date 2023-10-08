import json
import os
import zipfile

import boto3

s3 = boto3.resource('s3')


def handler(event, context):

    bucket_name = os.environ.get('BUCKET_NAME')

    print("bucket_name:", bucket_name)
    print("event:", event)
    print("context:", context)

    with open('/tmp/salesforce.json', 'w') as f:
        if event['isBase64Encoded']:
            event['body'] = event['body'].decode('base64')
        f.write(event['body'])

    with zipfile.ZipFile("/tmp/context.zip", "w") as f:
        f.write("/tmp/salesforce.json", "salesforce.json")

    bucket = s3.Bucket(bucket_name)
    bucket.upload_file('/tmp/context.zip', 'context.zip')

    return {
        'statusCode': 200,
        'body': json.dumps('ok')
    }
