// Lambda entry point: the handler wired to DynamoDB. TABLE and FAMILY_CODE come from template.yaml.
import { dynamoStore } from "./dynamo.mjs";
import { makeHandler } from "./handler.mjs";

export const handler = makeHandler(dynamoStore(process.env.TABLE), process.env.FAMILY_CODE);
