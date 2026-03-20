#!/usr/bin/env sh
set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)"

PRODUCTS_IMAGE="product-service:1.0"
USERS_IMAGE="user-service:1.0"

echo "Building $PRODUCTS_IMAGE"
docker build -t "$PRODUCTS_IMAGE" "$ROOT_DIR/product-service"

echo "Building $USERS_IMAGE"
docker build -t "$USERS_IMAGE" "$ROOT_DIR/user-service"

echo "Done"
echo "Images were rebuilt locally with fixed tag 1.0"
echo "- $PRODUCTS_IMAGE"
echo "- $USERS_IMAGE"
