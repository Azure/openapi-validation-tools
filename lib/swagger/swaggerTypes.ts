// https://github.com/mohsen1/swagger.d.ts

import { MutableStringMap } from "@azure-tools/openapi-tools-common";
import { SchemaValidateFunction } from "../swaggerValidator/schemaValidator";
import { RegExpWithKeys } from "../transform/pathRegexTransformer";
import {
  xmsDiscriminatorValue,
  xmsEnum,
  xmsExamples,
  xmsLongRunningOperation,
  xmsMutability,
  xmsParameterizedHost,
  xmsPaths,
  xmsSkipUrlEncoding,
  xNullable,
} from "../util/constants";
import { $id } from "./jsonLoader";

export const refSelfSymbol = Symbol.for("oav-schema-refself");

export interface Info {
  title: string;
  version: string;
  description?: string;
  termsOfService?: string;
  contact?: Contact;
  license?: License;
}

export interface Contact {
  name?: string;
  email?: string;
  url?: string;
}

export interface License {
  name: string;
  url?: string;
}

export interface ExternalDocs {
  url: string;
  description?: string;
}

export interface Tag {
  name: string;
  description?: string;
  externalDocs?: ExternalDocs;
}

// Example type interface is intentionally loose
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Example {}

export interface Header extends BaseSchema {
  type: "string";
}

// ----------------------------- Parameter -----------------------------------
interface BaseParameter {
  name: string;
  in: string;
  required?: boolean;
  description?: string;

  [refSelfSymbol]?: string;
}

export interface BodyParameter extends BaseParameter {
  in: "body";
  schema?: Schema;
  type?: SchemaType | "file";
}

export interface QueryParameter extends BaseParameter, BaseSchema {
  in: "query";
  allowEmptyValue?: boolean;
  nullable?: boolean;
}

export interface PathParameter extends BaseParameter, BaseSchema {
  in: "path";
  type: "string";
  required: true | undefined;

  [xmsSkipUrlEncoding]?: boolean;
}

export interface HeaderParameter extends BaseParameter {
  in: "header";
  type: string;
}

export interface FormDataParameter extends BaseParameter, BaseSchema {
  in: "formData";
  type: string;
  collectionFormat?: string;
}

export type Parameter =
  | BodyParameter
  | FormDataParameter
  | QueryParameter
  | PathParameter
  | HeaderParameter;

// ------------------------------- Path --------------------------------------
export const lowerHttpMethods = [
  "get",
  "put",
  "post",
  "delete",
  "options",
  "head",
  "patch",
] as const;
export type LowerHttpMethods = typeof lowerHttpMethods[number];
export type Path = {
  [method in LowerHttpMethods]?: Operation;
} & {
  parameters?: Parameter[];

  _pathTemplate: string;
  _pathRegex: RegExpWithKeys;
  _validateQuery?: SchemaValidateFunction;
  _spec: SwaggerSpec;
};

// ----------------------------- Operation -----------------------------------
export interface Operation {
  responses: { [responseName: string]: Response };
  summary?: string;
  description?: string;
  externalDocs?: ExternalDocs;
  operationId?: string;
  produces?: string[];
  consumes?: string[];
  parameters?: Parameter[];
  schemes?: string[];
  deprecated?: boolean;
  security?: Security[];
  tags?: string[];
  [xmsLongRunningOperation]?: boolean;
  [xmsExamples]?: { [description: string]: SwaggerExample };

  // TODO check why do we need provider
  provider?: string;

  _path: Path;
  _method: LowerHttpMethods;

  _queryTransform?: MutableStringMap<TransformFn>;
  _headerTransform?: MutableStringMap<TransformFn>;
  _bodyTransform?: (body: any) => any;

  _validate?: SchemaValidateFunction;
}

export type TransformFn = (val: string) => string | number | boolean;

// ----------------------------- Response ------------------------------------
export interface Response {
  description: string;
  schema?: Schema;
  headers?: { [headerName: string]: Header };
  examples?: { [exampleName: string]: Example };

  _headerTransform?: MutableStringMap<TransformFn>;

  _validate?: SchemaValidateFunction;
}

// ------------------------------ Schema -------------------------------------

interface BaseSchema {
  format?: string;
  title?: string;
  description?: string;
  default?: string | boolean | number | any;
  multipleOf?: number;
  maximum?: number;
  exclusiveMaximum?: number | boolean;
  minimum?: number;
  exclusiveMinimum?: number | boolean;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
  maxItems?: number;
  minItems?: number;
  uniqueItems?: boolean;
  maxProperties?: number;
  minProperties?: number;
  enum?: Array<string | boolean | number>;
  [xmsEnum]?: {
    name: string;
    modelAsString?: boolean;
    values?: Array<{ value: any; description?: string; name?: string }>;
  };
  type?: string;
  items?: Schema | Schema[];
  $ref?: string;
}

export type SchemaType = "object" | "array" | "string" | "integer" | "number" | "boolean" | "null";
export interface Schema extends BaseSchema {
  type?: SchemaType;
  allOf?: Schema[];
  anyOf?: Schema[];
  oneOf?: Schema[];
  additionalProperties?: boolean | Schema;
  properties?: { [propertyName: string]: Schema };
  discriminator?: string;
  [xmsDiscriminatorValue]?: string;
  readOnly?: boolean;
  [xmsMutability]?: Array<"create" | "read" | "update">;
  xml?: XML;
  externalDocs?: ExternalDocs;
  example?: { [exampleName: string]: Example };
  required?: string[];
  propertyNames?: Schema;

  // Nullable support
  [xNullable]?: boolean;
  nullable?: boolean;

  // Ajv extension
  discriminatorMap?: { [key: string]: Schema | null }; // Null means base class

  // ref to this schema
  [refSelfSymbol]?: string;

  _skipError?: boolean;
}

export interface XML {
  type?: string;
  namespace?: string;
  prefix?: string;
  attribute?: string;
  wrapped?: boolean;
}

// ----------------------------- Security ------------------------------------
interface BaseSecurity {
  type: string;
  description?: string;
}

export type BasicAuthenticationSecurity = BaseSecurity;

export interface ApiKeySecurity extends BaseSecurity {
  name: string;
  in: string;
}

interface BaseOAuthSecuirty extends BaseSecurity {
  flow: string;
}

export interface OAuth2ImplicitSecurity extends BaseOAuthSecuirty {
  authorizationUrl: string;
}

export interface OAuth2PasswordSecurity extends BaseOAuthSecuirty {
  tokenUrl: string;
  scopes?: OAuthScope[];
}

export interface OAuth2ApplicationSecurity extends BaseOAuthSecuirty {
  tokenUrl: string;
  scopes?: OAuthScope[];
}

export interface OAuth2AccessCodeSecurity extends BaseOAuthSecuirty {
  tokenUrl: string;
  authorizationUrl: string;
  scopes?: OAuthScope[];
}

export interface OAuthScope {
  [scopeName: string]: string;
}

type Security =
  | BasicAuthenticationSecurity
  | OAuth2AccessCodeSecurity
  | OAuth2ApplicationSecurity
  | OAuth2ImplicitSecurity
  | OAuth2PasswordSecurity
  | ApiKeySecurity;

// ---------------------------- MS Extensions --------------------------------
export interface XMsParameterizedHost {
  hostTemplate: string;
  useSchemePrefix?: boolean;
  positionInOperation?: "first" | "last";
  parameters: PathParameter[];
}

// ---------------------------- Example --------------------------------------
export interface SwaggerExample {
  parameters: {
    "api-version": string;
    [parameterName: string]: any;
  };
  responses: { [responseCode: string]: any };

  $ref?: string;
}

// --------------------------------- Spec ------------------------------------
export interface SwaggerSpec {
  [$id]: string;
  swagger: string;
  info: Info;
  externalDocs?: ExternalDocs;
  host?: string;
  basePath?: string;
  schemes?: string[];
  consumes?: string[];
  produces?: string[];
  paths: { [pathTemplate: string]: Path };
  [xmsPaths]?: { [pathTemplate: string]: Path };
  definitions?: { [definitionsName: string]: Schema };
  parameters?: { [parameterName: string]: BodyParameter | QueryParameter };
  responses?: { [responseName: string]: Response };
  security?: Security[];
  securityDefinitions?: { [securityDefinitionName: string]: Security };
  tags?: [Tag];

  [xmsParameterizedHost]?: XMsParameterizedHost;

  _filePath: string;
}
