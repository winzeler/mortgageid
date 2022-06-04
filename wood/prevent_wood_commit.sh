#!/bin/bash

FILES_PATTERN='^wood/'
if git diff --cached --name-only | grep -qE $FILES_PATTERN; then
  echo "Error: Commit would modify files in 'wood' folder.";
  echo "";
  echo "Please check the documents section about 'Cascading Filesystem':";
  echo "https://nodewood.com/docs/architecture/cascading-filesystem/";
  echo "";
  echo "Upgrading your Nodewood installation?  Re-commit with the --no-verify flag to skip this check.";
  echo "";
  exit 1;
else
  exit 0;
fi
