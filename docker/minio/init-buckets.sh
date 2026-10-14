#!/bin/sh
set -e

MINIO_HOST="${MINIO_HOST:-minio}"
MINIO_PORT="${MINIO_PORT:-9000}"
ACCESS_KEY="${AWS_ACCESS_KEY_ID:-minioadmin}"
SECRET_KEY="${AWS_SECRET_ACCESS_KEY:-minioadmin}"
PUBLIC_BUCKET="${AWS_DEFAULT_S3_BUCKET:-${AWS_BUCKET:-nest-uploads}}"
PRIVATE_BUCKET="${AWS_PRIVATE_BUCKET:-nest-uploads-private}"

echo "Connecting to MinIO at http://${MINIO_HOST}:${MINIO_PORT}..."
until mc alias set myminio "http://${MINIO_HOST}:${MINIO_PORT}" "${ACCESS_KEY}" "${SECRET_KEY}" > /dev/null 2>&1; do
  sleep 1
done

echo "MinIO connected. Initializing buckets..."

# Create public bucket if it does not exist
if ! mc ls "myminio/${PUBLIC_BUCKET}" > /dev/null 2>&1; then
  echo "Creating public bucket: ${PUBLIC_BUCKET}"
  mc mb "myminio/${PUBLIC_BUCKET}"
else
  echo "Public bucket already exists: ${PUBLIC_BUCKET}"
fi

# Set public download access on public bucket
echo "Applying public download policy to: ${PUBLIC_BUCKET}"
mc anonymous set download "myminio/${PUBLIC_BUCKET}"

# Create private bucket if it does not exist
if ! mc ls "myminio/${PRIVATE_BUCKET}" > /dev/null 2>&1; then
  echo "Creating private bucket: ${PRIVATE_BUCKET}"
  mc mb "myminio/${PRIVATE_BUCKET}"
else
  echo "Private bucket already exists: ${PRIVATE_BUCKET}"
fi

echo "MinIO initialization completed successfully."
exit 0
