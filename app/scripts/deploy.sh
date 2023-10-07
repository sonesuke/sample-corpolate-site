set -eu

if [-e source.zip]; then
    rm source.zip
fi

zip source -r . -x "node_modules/*" "dist/*" ".vscode/*"
aws s3 cp source.zip s3://source-bucket-sample-corporate-site/source.zip
rm source.zip