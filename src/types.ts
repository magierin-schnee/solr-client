import { Dispatcher } from 'undici'
import { TlsOptions } from 'tls'

//================================================================
// SECTION 1: CLIENT AND RESOURCE CONFIGURATION
//================================================================

/**
 * Defines options for HTTP requests made by the client, using Undici's options
 * as a base but omitting properties managed internally by the client.
 */
export type HttpRequestOptions = Omit<Dispatcher.RequestOptions, 'origin' | 'path'> & {
  /** TLS configuration for establishing secure connections. */
  tls?: TlsOptions
}

/**
 * Describes a resource to be used in a Solr request, such as a data file for indexing.
 */
export interface SolrResourceConfig {
  /** The path to the resource, which can be a local file path or an HTTP URL. */
  path: string
  /**
   * The format of the resource content.
   * @default 'xml'
   */
  format?: 'xml' | 'csv' | 'json'
  /**
   * The MIME type of the resource, e.g., 'text/plain;charset=utf-8'.
   */
  contentType?: string
  /**
   * Additional parameters to include in the resource request.
   */
  parameters?: Record<string, any>
}

/**
 * Defines the initial configuration options for creating a Solr client instance.
 * Defaults are applied for any omitted optional properties.
 */
export interface SolrClientConfig {
  /**
   * The hostname or IP address of the Solr server.
   * @default 'localhost'
   */
  host?: string
  /**
   * The port number of the Solr server.
   * @default 8983
   */
  port?: string | number | null
  /**
   * The name of the Solr core or collection to target. If omitted, requests are sent without a core path.
   */
  core?: string
  /**
   * The base path for all Solr API requests.
   * @default '/solr'
   */
  path?: string
  /**
   * If true, communicates with Solr over HTTPS.
   * @default false
   */
  secure?: boolean
  /**
   * If true, uses `json-bigint` to parse responses, preserving large integer precision.
   * @default false
   */
  bigint?: boolean
  /**
   * Global TLS settings for all secure connections.
   */
  tls?: TlsOptions
  /**
   * A custom Undici request options object to be applied to all requests.
   */
  request?: HttpRequestOptions | null
  /**
   * The IP version to use for network requests.
   * @default 4
   */
  ipVersion?: 4 | 6
}

/**
 * Represents the resolved, non-optional configuration state of the client after initialization.
 * This is an internal type used by the client after defaults have been applied.
 */
export interface ResolvedSolrClientConfig {
  host: string
  port: string | number
  core: string
  path: string
  secure: boolean
  bigint: boolean
  ipVersion: 4 | 6
  tls?: TlsOptions
  request?: HttpRequestOptions | null
  /** The full 'Authorization' header value, if authentication is required. */
  authorization?: string
}

//================================================================
// SECTION 2: QUERY PARAMETER CONFIGURATIONS
//================================================================

/**
 * Defines a date range filter for a query.
 */
export interface DateRangeConfig {
  /** The date field to apply the range filter on. */
  field: string
  /** The start of the date range. */
  start?: string | number | Date
  /** The end of the date range. */
  end?: string | number | Date
}

/**
 * Defines a join between collections or cores.
 */
export interface JoinConfig {
  /** The field in the source collection. */
  from: string
  /** The field in the target collection. */
  to: string
  /** The source collection or core to join from. */
  fromIndex: string
  /** An optional filter query to apply to the joined documents. */
  query?: string
}

/**
 * Configures result grouping (field collapsing).
 */
export interface GroupingConfig {
  on?: boolean
  field?: string | string[]
  query?: string | string[]
  limit?: number
  offset?: number
  sort?: string
  format?: 'grouped' | 'simple'
  main?: boolean
  ngroups?: boolean
  truncate?: boolean
  cache?: number
}

/**
 * Configures a "More Like This" (MLT) query component.
 */
export interface MoreLikeThisConfig {
  on?: boolean
  /** The fields to use for calculating similarity. */
  fl: string | string[]
  count?: number
  mintf?: number // Minimum Term Frequency
  mindf?: number // Minimum Document Frequency
  minwl?: number // Minimum Word Length
  maxwl?: number // Maximum Word Length
  maxqt?: number // Maximum Query Terms
  maxntp?: number // Maximum Number of Tokens to Parse
  boost?: boolean
  /** Query fields and their optional boost values. */
  qf?: string | Record<string, number>
}

/**
 * Configures search result highlighting.
 */
export interface HighlightConfig {
  on?: boolean
  q?: string | Record<string, any>
  qparser?: string
  fl?: string | string[]
  snippets?: number
  fragsize?: number
  mergeContiguous?: boolean
  maxAnalyzedChars?: number
  maxMultiValuedToExamine?: number
  maxMultiValuedToMatch?: number
  alternateField?: string
  maxAlternateFieldLength?: number
  formatter?: 'simple'
  simplePre?: string
  simplePost?: string
  fragmenter?: 'gap' | 'regex'
  highlightMultiTerm?: boolean
  requireFieldMatch?: boolean
  usePhraseHighlighter?: boolean
  regexSlop?: number
  regexPattern?: string
  regexMaxAnalyzedChars?: number
  preserveMulti?: boolean
  payloads?: boolean
}

/**
 * Configures a Terms Component query.
 */
export interface TermsConfig {
  on?: boolean
  fl: string
  lower?: string
  lowerIncl?: boolean
  mincount?: number
  maxcount?: number
  prefix?: string
  regex?: string
  regexFlag?: string
  limit?: number
  upper?: string
  upperIncl?: boolean
  raw?: boolean
  sort?: 'count' | 'index'
}

//================================================================
// SECTION 3: COLLECTION & CLUSTER MANAGEMENT
//================================================================

/**
 * Defines options for creating a new SolrCloud collection.
 */
export interface CollectionCreateConfig {
  name: string
  routerName?: 'compositeId' | 'implicit'
  numShards?: number
  shards?: string | string[]
  replicationFactor?: number
  maxShardsPerNode?: number
  createNodeSet?: string | string[] | 'EMPTY'
  createNodeSetShuffle?: boolean
  collectionConfigName?: string
  routerField?: string
  autoAddReplicas?: boolean
  async?: string
}

/**
 * Configures the splitting of a single shard.
 */
export interface ShardSplitConfig {
  collection: string
  shard: string
  ranges?: string | string[]
  splitKey?: string
  async?: string
}

/**
 * Identifies a shard for creation or deletion.
 */
export interface ShardConfig {
  collection: string
  shard: string
}

/**
 * Defines a collection alias.
 */
export interface AliasConfig {
  name: string
  collections: string | string[]
}

/**
 * Identifies a replica for deletion.
 */
export interface ReplicaDeleteConfig {
  collection: string
  shard: string
  replica: string
  onlyIfDown?: boolean
}

/**
 * Configures the addition of a new replica.
 */
export interface ReplicaAddConfig {
  collection: string
  shard: string
  route?: string
  node?: string
  async?: string
}

/**
 * Defines a cluster-level property.
 */
export interface ClusterPropertyConfig {
  name: string
  val: string | boolean | number | null
}

/**
 * Configures a data migration between collections.
 */
export interface MigrationConfig {
  collection: string
  targetCollection: string
  splitKey: string
  forwardTimeout?: number
  async?: string
}

/**
 * Assigns a role to a node in the cluster.
 */
export interface ClusterRole {
  role: 'overseer'
  node: string
}

/**
 * Configures adding or updating a property on a replica.
 */
export interface ReplicaPropertyConfig {
  collection: string
  shard: string
  replica: string
  property: string
  propertyValue: string | boolean | number
  shardUnique?: boolean
}

/**
 * Identifies a replica property for deletion.
 */
export interface ReplicaPropertyDeleteConfig {
  collection: string
  shard: string
  replica: string
  property: string
}

/**
 * Configures balancing of a property across shards.
 */
export interface ShardBalanceConfig {
  collection: string
  property: string
  onlyActiveNodes?: boolean
  shardUnique?: boolean
}

/**
 * Configures the rebalancing of shard leaders.
 */
export interface LeaderRebalanceConfig {
  collection: string
  maxAtOnce?: number
  maxWaitSeconds?: number
}

//================================================================
// SECTION 4: JSON FACET API (REQUEST)
//================================================================

/**
 * Defines the execution domain for a facet, allowing for advanced filtering.
 */
export type JsonFacetDomain = {
  /** Excludes filters with the specified tag(s) from the facet computation. Essential for multi-select faceting. */
  excludeTags?: string | string[]
  /** Applies a filter to the domain. Can be a simple query string or a more complex join/graph query. */
  filter?: string | string[]
  graph?: string | Record<string, string>
  blockParent?: string
  blockChildren?: string
}

/** The top-level facet configuration object. */
export type JsonFacetConfig = Record<string, AnyFacetDefinition | StatFunction>

/** Base properties for all facet definitions. */
export interface JsonFacetBase {
  domain?: JsonFacetDomain
  facet?: JsonFacetConfig
}

/** 'terms' facet configuration. */
export interface JsonTermsFacet extends JsonFacetBase {
  type: 'terms'
  field: string
  limit?: number
  offset?: number
  mincount?: number
  missing?: boolean
  numBuckets?: boolean
  allBuckets?: boolean
  sort?: string | Record<string, 'asc' | 'desc'>
  prefix?: string
  method?: 'dv' | 'stream' | 'uif'
}

/** 'range' facet configuration for bucketing documents over a numeric or date field. */
export interface JsonRangeFacet extends JsonFacetBase {
  type: 'range'
  field: string
  start: string | number | Date
  end: string | number | Date
  gap: string | number
  hardend?: boolean
  other?: 'before' | 'after' | 'between' | 'all' | 'none'
  include?: 'lower' | 'upper' | 'edge' | 'outer' | 'all'
  /**
   * List of arbitrary ranges. When specified, calculates facets on these given ranges
   * rather than start, gap, and end.
   * Specifying start, end, or gap along with ranges is disallowed.
   */
  ranges?: (JsonArbitraryRange | JsonArbitraryRangeString)[]
}

/** Defines a single arbitrary range for a range facet using 'from' and 'to' bounds. */
export interface JsonArbitraryRange {
  /** The lower bound of the range. Defaults to '*' if not specified. */
  from?: string | number | Date
  /** The upper bound of the range. Defaults to '*' if not specified. */
  to?: string | number | Date
  /** If true, includes the lower bound 'from'. Defaults to true. */
  inclusive_from?: boolean
  /** If true, includes the upper bound 'to'. Defaults to false. */
  inclusive_to?: boolean
}

/** Defines a single arbitrary range for a range facet using a string representation. */
export interface JsonArbitraryRangeString {
  /** The range specified as a string (e.g., "[40,100)").
   * Semantically similar to `facet.interval`.
   */
  range: string
}

/** 'query' facet configuration with single query. */
export interface JsonQueryFacet extends JsonFacetBase {
  type: 'query'
  q: string
}

/** 'query' facet configuration with multiple named buckets. */
export interface JsonMultiQueryFacet extends JsonFacetBase {
  type: 'query'
  queries: Record<string, string>
}

/** A union of possible facet definitions. */
export type AnyFacetDefinition =
  | JsonTermsFacet
  | JsonRangeFacet
  | JsonQueryFacet
  | JsonMultiQueryFacet

/** Represents a statistical function, e.g., "avg(price)". */
export type StatFunction = string | Record<string, string | { field: string }>

//================================================================
// SECTION 5: API RESPONSE & ERROR HANDLING
//================================================================

/** The result of a simple statistical aggregation function, which is typically a number. */
export type SolrStatResult = number

/**
 * A block of facet and stat results. This is the core recursive structure.
 * It's a map from user-defined names (e.g., "avg_price", "categories") to their results.
 */
export type SolrFacetResultBlock = {
  [facetOrStatName: string]: AnySolrFacetResult | SolrStatResult | undefined
}

/** Represents a single bucket within a `terms` or `range` facet response. */
export type SolrTermsBucket = {
  /** The value of the bucket (e.g., "electronics", 2024). */
  val: string | number
  /** The number of documents in this bucket. */
  count: number
} & SolrFacetResultBlock

/** The response structure for a `terms` or `range` facet, which returns an array of buckets. */
export type SolrTermsFacetResult = {
  buckets: SolrTermsBucket[]
  /** The total number of unique terms, only present if `numBuckets:true` was in the request. */
  numBuckets?: number
}

/**
 * The response for a single named `query` facet or a nested structure of named buckets.
 * This is used for your `price` and `modelYear` facets.
 */
export type SolrQueryFacetResult = {
  /** The total count of documents for this entire facet block. */
  count: number
} & SolrFacetResultBlock

/** A discriminated union of all possible result structures for a single facet. */
export type AnySolrFacetResult = SolrTermsFacetResult | SolrQueryFacetResult

/** The top-level response object for the entire `facets` key returned by Solr. */
export type SolrFacetsResponse = {
  /** The total number of documents matching the main query and filters. */
  count: number
} & SolrFacetResultBlock

/** A generic representation of a single document returned by Solr. */
export type SolrDocument = Record<string, unknown>

/** Models the 'responseHeader' object from a Solr response. */
export interface SolrResponseHeader {
  status: number
  QTime: number
  params: Record<string, string | number | boolean>
}

/** Models the 'response' object containing the main search results. */
export interface SolrSearchResponse<T extends SolrDocument> {
  numFound: number
  start: number
  numFoundExact: boolean
  docs: T[]
}

/** Models the structure of the error object returned by Solr in the response body. */
export interface SolrErrorBody {
  metadata: string[]
  msg: string
  code: number
}

/**
 * The complete, top-level type for a standard Solr API response.
 * @template T - The specific type for the documents in the response.
 */
export interface SolrApiResponse<T extends SolrDocument = SolrDocument> {
  responseHeader: SolrResponseHeader
  response: SolrSearchResponse<T>
  /** Results from the JSON Facet API. Only present if `json.facet` was in the request. */
  facets?: SolrFacetsResponse
  /** Error details, only present if the query failed. */
  error?: SolrErrorBody
  /** Results from the legacy facet parameters. Only present if `facet=true` was in the request. */
  facet_counts?: Record<string, any>
  /** A list of document IDs that were added or updated, for update commands. */
  adds?: (string | number)[]
}

/**
 * A custom error class for handling errors from Solr.
 * It provides direct access to both the HTTP status and the specific error
 * details returned in the Solr response body.
 */
export class SolrError extends Error {
  /** The HTTP status code of the failed response (e.g., 400, 404, 500). */
  public readonly httpStatusCode: number

  /** The specific error code returned by Solr in the response body (e.g., 400). */
  public readonly solrCode: number

  /** The detailed error metadata from the Solr response body, if available. */
  public readonly metadata?: string[]

  /**
   * Constructs a SolrError instance.
   * @param httpStatusCode The HTTP status code from the response.
   * @param errorBody The 'error' object from the Solr JSON response.
   */
  constructor(httpStatusCode: number, errorBody: SolrErrorBody) {
    const message = `Solr request failed with HTTP status ${httpStatusCode} and Solr code ${errorBody.code}: ${errorBody.msg}`
    super(message)

    this.name = 'SolrError'
    this.httpStatusCode = httpStatusCode
    this.solrCode = errorBody.code
    this.metadata = errorBody.metadata

    Object.setPrototypeOf(this, SolrError.prototype)
  }
}
