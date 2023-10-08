import time

import boto3
from botocore.exceptions import ClientError
import jwt
import requests


def get_secret():
    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name="ap-northeast-1"
    )

    try:
        get_secret_value_response = client.get_secret_value(
            SecretId="sample-corporate-site"
        )
    except ClientError as e:
        raise e

    return get_secret_value_response['SecretString']


def handler(event, context):

    consumer_key = "3MVG9G9pzCUSkzZt2ymvNcanueDuzQK1MrJ.YSDPkrXb_iKqSzAwz0qcwqPF7JRB.D7DW0pUlhoXti30Wlxcz"
    cert = get_secret()
    
    claim = {
        "iss": consumer_key,
        "aud": "https://login.salesforce.com",
        "sub": "iamsonesuke+developer@gmail.com",
        "exp": int(time.time()) + 60 * 3
    }

    token = jwt.encode(claim, cert, algorithm='RS256')

    res = requests.post(
        "https://login.salesforce.com/services/oauth2/token",
        data={
            "grant_type": "urn:ietf:params:oauth:grant-type:jwt-bearer",
            "assertion": token,
        }
    )

    body = event['body']
    if event['isBase64Encoded']:
        body = event['body'].decode('base64')

    res = requests.post(
        "https://AP15.salesforce.com/services/apexrest/campaign-register",
        headers={
            "Authorization": "Bearer " + res.json()['access_token'],
            "Content-Type": "application/json"
        },
        data=body.encode('utf-8')
    )

    salesforce_response = res.json()
    print(salesforce_response)

    return {
        'statusCode': res.status_code,
        "headers": {"Content-Type": "application/json"},
        'body': str(salesforce_response["message"])
    }
