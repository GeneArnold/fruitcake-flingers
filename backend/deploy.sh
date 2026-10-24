#!/usr/bin/env bash
# Deploys (or updates) the family score service, then checks it answers.
#   AWS_PROFILE=family-games bash backend/deploy.sh
# Needs the AWS CLI, signed in to the account the games live in. Safe to run again after changes.
set -euo pipefail
cd "$(dirname "$0")"

STACK="${STACK:-family-games-scores}"
REGION="${AWS_REGION:-us-east-1}"
FAMILY_CODE="$(sed -n 's/.*familyCode: "\(.*\)".*/\1/p' ../js/config.js)"

node test.mjs

echo "== stack $STACK in $REGION"
aws cloudformation deploy --region "$REGION" --stack-name "$STACK" --template-file template.yaml \
  --capabilities CAPABILITY_IAM --parameter-overrides "FamilyCode=$FAMILY_CODE" --no-fail-on-empty-changeset

FUNCTION="$(aws cloudformation describe-stack-resource --region "$REGION" --stack-name "$STACK" \
  --logical-resource-id Service --query StackResourceDetail.PhysicalResourceId --output text)"
URL="$(aws cloudformation describe-stacks --region "$REGION" --stack-name "$STACK" \
  --query "Stacks[0].Outputs[?OutputKey=='Url'].OutputValue" --output text)"

echo "== code for $FUNCTION"
ZIP="$(mktemp -d)/scores.zip"
zip -q -j "$ZIP" index.mjs handler.mjs dynamo.mjs
aws lambda update-function-code --region "$REGION" --function-name "$FUNCTION" --zip-file "fileb://$ZIP" >/dev/null
aws lambda wait function-updated --region "$REGION" --function-name "$FUNCTION"

echo "== checking $URL"
STATUS="$(curl -s -o /dev/null -w '%{http_code}' "${URL%/}/scores?game=fruitcake&level=house")"
if [ "$STATUS" != "200" ]; then
  echo "The service answered HTTP $STATUS instead of 200." >&2
  echo "If it is 403, the account may also need public lambda:InvokeFunction for function URLs." >&2
  exit 1
fi
echo "Working. Put this in js/config.js as scoresUrl:"
echo "  $URL"
