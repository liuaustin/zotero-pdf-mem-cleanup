#!/bin/bash
set -e

XPI_NAME="zotero-pdf-mem-cleanup.xpi"

rm -f "$XPI_NAME"
zip -j "$XPI_NAME" manifest.json bootstrap.js
echo "Built $XPI_NAME"
