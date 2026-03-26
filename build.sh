#!/bin/bash
set -e

XPI_NAME="zotero-pdf-mem-cleanup.xpi"

rm -f "$XPI_NAME"
zip -r "$XPI_NAME" manifest.json bootstrap.js icons/
echo "Built $XPI_NAME"
