import { Dispatcher } from 'undici'
import { TlsOptions } from 'tls'

// === Client Configuration Types ===

/**
 * Configuration options for HTTP requests using Undici, excluding 'origin' and 'path'
 * which are managed elsewhere in the Solr client. Includes optional TLS settings.
 */
export type HttpRequestOptions = Omit<Dispatcher.RequestOptions, 'origin' | 'path'> & {
  /**
   * TLS configuration for secure connections.
   */
  tls?: TlsOptions
}

/**
 * Defines options for resources used in Solr requests, such as files or remote URLs.
 */
export type SolrResourceConfig = {
  /**
   * Additional parameters to include in the query.
   */
  parameters?: Record<string, any>

  /**
   * Format of the resource. Acceptable values are 'XML', 'CSV', or 'JSON'.
   */
  format?: string

  /**
   * MIME type of the resource, e.g., 'text/plain;charset=utf-8'.
   */
  contentType?: string

  /**
   * Path to the resource, either a local file path (relative to Solr server's CWD) or an HTTP URL.
   */
  path: string
}

/**
 * Optional parameters to configure the Solr client connection and behavior.
 */
export type SolrClientConfig = {
  /**
   * Hostname or IP address of the Solr server. Defaults to 'localhost' if unspecified.
   */
  host?: string

  /**
   * Port number of the Solr server. Accepts string, number, or null. Defaults to 8983.
   */
  port?: string | number | null

  /**
   * Name of the Solr core to target. Optional; no core is used if omitted.
   */
  core?: string

  /**
   * Base path for all Solr requests. Defaults to '/solr'.
   */
  path?: string

  /**
   * Enables HTTPS for secure communication. Defaults to false.
   */
  secure?: boolean

  /**
   * Uses JSONbig for handling large integers instead of native JSON. Defaults to false.
   */
  bigint?: boolean

  /**
   * TLS settings for SSL connections.
   */
  tls?: TlsOptions

  /**
   * Custom HTTP request options applied to all requests. Can be null.
   */
  request?: HttpRequestOptions | null

  /**
   * IP version for network requests. Accepts 4 or 6. Defaults to 4.
   */
  ipVersion?: number

  /**
   * Maximum size (in bytes) for GET requests. Beyond this, POST is used. Accepts boolean or number.
   */
  get_max_request_entity_size?: boolean | number
}

/**
 * Mandatory configuration for the Solr client, requiring all fields except optional ones.
 * Includes an optional authorization field for authenticated requests.
 */
export type CompleteSolrClientConfig = {
  host: string
  port: string | number
  core: string
  path: string
  secure: boolean
  bigint: boolean
  tls?: TlsOptions
  request?: HttpRequestOptions | null
  ipVersion: number
  get_max_request_entity_size: boolean | number
  /**
   * Authorization header or token for authenticated requests, if required.
   */
  authorization?: string
}

// === Query Operation Types ===

/**
 * Configuration for date range queries in Solr.
 */
export type DateRangeConfig = {
  /**
   * Field to apply the date range filter to.
   */
  field: string
  /**
   * Start of the range, as a string, timestamp (number), or Date object.
   */
  start?: string | number | Date
  /**
   * End of the range, as a string, timestamp (number), or Date object.
   */
  end?: string | number | Date
}

/**
 * Configuration for joining collections or indexes in Solr queries.
 */
export type JoinConfig = {
  /**
   * Source field for the join.
   */
  from: string
  /**
   * Target field for the join.
   */
  to: string
  /**
   * Index or collection to join from.
   */
  fromIndex: string
  /**
   * Field to filter during the join.
   */
  field: string
  /**
   * Value to match in the join filter.
   */
  value: string | number | Date | boolean
}

/**
 * Defines filter query options for Solr.
 */
export type Filters = {
  /**
   * Field to apply the filter to.
   */
  field: string
  /**
   * Value to filter by.
   */
  value: string | number | Date | boolean
  /**
   * Optional settings for filter matching behavior.
   */
  matchFilterOptions?: MatchFilterOptions
}

/**
 * Options for grouping query results in Solr.
 */
export type GroupingConfig = {
  /**
   * Enables grouping of results.
   */
  on?: boolean
  /**
   * Field(s) to group by.
   */
  field?: string | string[]
  /**
   * Query or queries defining the groups.
   */
  query?: Record<string, any> | Record<string, any>[]
  /**
   * Maximum number of groups to return.
   */
  limit?: number
  /**
   * Starting offset for group results.
   */
  offset?: number
  /**
   * Sorting criteria for groups.
   */
  sort?: string
  /**
   * Format of the grouped response.
   */
  format?: string
  /**
   * Includes the main result set with grouped data.
   */
  main?: boolean
  /**
   * Returns the total number of groups.
   */
  ngroups?: boolean
  /**
   * Truncates group results if true.
   */
  truncate?: boolean
  /**
   * Cache percentage for grouping operations.
   */
  cache?: number
}

/**
 * Configuration for faceting in Solr queries.
 */
export type FacetConfig = {
  /**
   * Enables faceting.
   */
  on?: boolean
  /**
   * Query to drive faceting.
   */
  query?: string
  /**
   * Field(s) to facet on.
   */
  field: string | string[]
  /**
   * Filters facet values by prefix.
   */
  prefix?: string
  /**
   * Sorting order for facet results.
   */
  sort?: string
  /**
   * Maximum number of facets to return.
   */
  limit?: number
  /**
   * Offset for facet results.
   */
  offset?: number
  /**
   * Minimum count for a facet to be included.
   */
  mincount?: number
  /**
   * Includes missing facet values if true.
   */
  missing?: boolean
  /**
   * Faceting method to use.
   */
  method?: string
  /**
   * Configuration for pivot faceting.
   */
  pivot: PivotConfig
}

/**
 * Configuration for pivot faceting in Solr.
 */
export type PivotConfig = {
  /**
   * Minimum count for a pivot to be included.
   */
  mincount?: number
  /**
   * Fields to pivot on.
   */
  fields: string[]
}

/**
 * Configuration for "More Like This" (MLT) queries in Solr.
 */
export type MoreLikeThisConfig = {
  /**
   * Enables MLT functionality.
   */
  on?: boolean
  /**
   * Fields to use for similarity.
   */
  fl?: string | string[]
  /**
   * Number of similar documents to return.
   */
  count?: number
  /**
   * Minimum term frequency for similarity.
   */
  mintf?: number
  /**
   * Minimum document frequency for similarity.
   */
  mindf?: number
  /**
   * Minimum word length for terms.
   */
  minwl?: number
  /**
   * Maximum word length for terms.
   */
  maxwl?: number
  /**
   * Maximum query terms to consider.
   */
  maxqt?: number
  /**
   * Maximum number of tokens to parse.
   */
  maxntp?: number
  /**
   * Boosts query terms if true.
   */
  boost?: boolean
  /**
   * Query fields with optional weights.
   */
  qf?: string | Record<string, any>
}

/**
 * Configuration for highlighting search results in Solr.
 */
export type HighlightConfig = {
  /**
   * Enables highlighting.
   */
  on?: boolean
  /**
   * Query for highlighting.
   */
  q?: Record<string, any> | string
  /**
   * Query parser to use.
   */
  qparser?: string
  /**
   * Fields to highlight.
   */
  fl?: Record<string, any> | string
  /**
   * Number of snippets to return.
   */
  snippets?: number
  /**
   * Size of each snippet in characters.
   */
  fragsize?: number
  /**
   * Merges contiguous fragments if true.
   */
  mergeContiguous?: boolean
  /**
   * Maximum characters to analyze.
   */
  maxAnalyzedChars?: number
  /**
   * Max multi-valued fields to examine.
   */
  maxMultiValuedToExamine?: number
  /**
   * Max multi-valued fields to match.
   */
  maxMultiValuedToMatch?: number
  /**
   * Field to use if no match is found.
   */
  alternateField?: string
  /**
   * Maximum length of the alternate field.
   */
  maxAlternateFieldLength?: number
  /**
   * Formatting style for highlights.
   */
  formatter?: string
  /**
   * Prefix for highlighted text.
   */
  simplePre?: string
  /**
   * Suffix for highlighted text.
   */
  simplePost?: string
  /**
   * Fragmenter to use for splitting text.
   */
  fragmenter?: string
  /**
   * Highlights multi-term queries if true.
   */
  highlightMultiTerm?: boolean
  /**
   * Requires field match for highlighting.
   */
  requireFieldMatch?: boolean
  /**
   * Uses phrase highlighter if true.
   */
  usePhraseHighlighter?: boolean
  /**
   * Slop for regex highlighting.
   */
  regexSlop?: number
  /**
   * Regex pattern for highlighting.
   */
  regexPattern?: string
  /**
   * Max characters for regex analysis.
   */
  regexMaxAnalyzedChars?: number
  /**
   * Preserves multi-value order if true.
   */
  preserveMulti?: boolean
  /**
   * Includes payloads in highlights.
   */
  payloads?: boolean
}

/**
 * Configuration for term queries in Solr.
 */
export type TermsConfig = {
  /**
   * Enables term queries.
   */
  on?: boolean
  /**
   * Field to query terms from.
   */
  fl: string
  /**
   * Lower bound for terms.
   */
  lower?: string
  /**
   * Includes lower bound if true.
   */
  lowerIncl?: boolean
  /**
   * Minimum count for terms.
   */
  mincount?: number
  /**
   * Maximum count for terms.
   */
  maxcount?: number
  /**
   * Prefix filter for terms.
   */
  prefix?: string
  /**
   * Regex pattern for term matching.
   */
  regex?: string
  /**
   * Flags for regex matching.
   */
  regexFlag?: string
  /**
   * Maximum number of terms to return.
   */
  limit?: number
  /**
   * Upper bound for terms.
   */
  upper?: string
  /**
   * Includes upper bound if true.
   */
  upperIncl?: boolean
  /**
   * Returns raw term data if true.
   */
  raw?: boolean
  /**
   * Sort order for terms.
   */
  sort?: string
}

// === Collection Management Types ===

/**
 * Options for creating a new Solr collection.
 */
export type CollectionCreateConfig = {
  /**
   * Name of the collection to create.
   */
  name: string
  /**
   * Name of the router to use.
   */
  routerName?: string
  /**
   * Number of shards for the collection.
   */
  numShards?: number
  /**
   * Specific shards to create.
   */
  shards?: string | string[]
  /**
   * Replication factor for shards.
   */
  replicationFactor?: number
  /**
   * Maximum shards per node.
   */
  maxShardsPerNode?: number
  /**
   * Nodes to create the collection on.
   */
  createNodeSet?: string | string[]
  /**
   * Shuffles node set if true.
   */
  createNodeSetShuffle?: boolean
  /**
   * Configuration name for the collection.
   */
  collectionConfigName?: string
  /**
   * Field to use for routing.
   */
  routerField?: string
  /**
   * Automatically adds replicas if true.
   */
  autoAddReplicas?: boolean
  /**
   * Asynchronous request ID, if any.
   */
  async?: string
}

/**
 * Configuration for splitting a shard in a Solr collection.
 */
export type ShardSplitConfig = {
  /**
   * Collection containing the shard.
   */
  collection: string
  /**
   * Shard to split.
   */
  shard: string
  /**
   * Ranges to split the shard into.
   */
  ranges?: string | string[]
  /**
   * Key to split the shard by.
   */
  splitKey?: string
  /**
   * Asynchronous request ID, if any.
   */
  async?: string
}

/**
 * Configuration for creating/deleting a shard in a Solr collection.
 */
export type ShardConfig = {
  /**
   * Collection the shard belongs to.
   */
  collection: string
  /**
   * Name of the shard.
   */
  shard: string
}

/**
 * Configuration for creating an alias in Solr.
 */
export type AliasConfig = {
  /**
   * Name of the alias.
   */
  name: string
  /**
   * Collection(s) the alias points to.
   */
  collections: string | string[]
}

/**
 * Configuration for deleting a replica in Solr.
 */
export type ReplicaDeleteConfig = {
  /**
   * Collection containing the replica.
   */
  collection: string
  /**
   * Shard containing the replica.
   */
  shard: string
  /**
   * Name of the replica to delete.
   */
  replica: string
  /**
   * Deletes only if the replica is down.
   */
  onlyIfDown: boolean
}

/**
 * Configuration for adding a replica to a Solr collection.
 */
export type ReplicaAddConfig = {
  /**
   * Collection to add the replica to.
   */
  collection?: string
  /**
   * Shard to add the replica to.
   */
  shard?: string
  /**
   * Routing key for the replica.
   */
  route?: string
  /**
   * Node to place the replica on.
   */
  node?: string
  /**
   * Asynchronous request ID, if any.
   */
  async?: string
}

/**
 * Configuration for setting cluster properties in Solr.
 */
export type ClusterPropertyConfig = {
  /**
   * Name of the property to set.
   */
  name?: string
  /**
   * Value of the property.
   */
  val?: string | boolean | number
}

/**
 * Configuration for migrating data between Solr collections.
 */
export type MigrationConfig = {
  /**
   * Source collection for migration.
   */
  collection: string
  /**
   * Target collection for migration.
   */
  targetCollection: string
  /**
   * Key to split data by during migration.
   */
  splitKey: string
  /**
   * Timeout for forwarding requests, in seconds.
   */
  forwardTimeout?: number
  /**
   * Asynchronous request ID, if any.
   */
  async?: string
}

/**
 * Defines a role assignment in a Solr cluster.
 */
export type ClusterRole = {
  /**
   * Role to assign (e.g., overseer).
   */
  role: string
  /**
   * Node to assign the role to.
   */
  node: string
}

/**
 * Configuration for adding a property to a replica in Solr.
 */
export type ReplicaPropertyAddConfig = {
  /**
   * Collection containing the replica.
   */
  collection: string
  /**
   * Shard containing the replica.
   */
  shard: string
  /**
   * Name of the replica.
   */
  replica: string
  /**
   * Property name to add.
   */
  property: string
  /**
   * Value of the property.
   */
  propertyValue: string | boolean | number
  /**
   * Ensures property uniqueness across shards.
   */
  shardUnique?: boolean
}

/**
 * Configuration for deleting a property from a replica in Solr.
 */
export type ReplicaPropertyDeleteConfig = {
  /**
   * Collection containing the replica.
   */
  collection: string
  /**
   * Shard containing the replica.
   */
  shard: string
  /**
   * Name of the replica.
   */
  replica: string
  /**
   * Property name to delete.
   */
  property: string
}

/**
 * Configuration for balancing shard properties in Solr.
 */
export type ShardBalanceConfig = {
  /**
   * Collection to balance.
   */
  collection: string
  /**
   * Property to balance across shards.
   */
  property: string
  /**
   * Balances only active nodes if true.
   */
  onlyActiveNodes?: boolean
  /**
   * Ensures property uniqueness if true.
   */
  shardUnique?: boolean
}

/**
 * Configuration for rebalancing leaders in a Solr collection.
 */
export type LeaderRebalanceConfig = {
  /**
   * Collection to rebalance leaders for.
   */
  collection: string
  /**
   * Maximum number of leaders to rebalance at once.
   */
  maxAtOnce?: number
  /**
   * Maximum wait time for rebalancing, in seconds.
   */
  maxWaitSeconds?: number
}

// === Response Types ===

/**
 * Response structure for adding documents to Solr.
 */
export type DocumentAddResponse = {
  /**
   * List of documents or IDs added to Solr.
   */
  adds: any[]
  /**
   * Metadata about the response.
   */
  responseHeader: {
    /**
     * Operation status code (0 for success).
     */
    status: number
    /**
     * Query execution time in milliseconds.
     */
    QTime: number
  }
}

/**
 * Generic JSON response data from Solr queries.
 */
export type SolrJsonResponse = Record<string, any> | any[]

/**
 * Standard response format for Solr operations.
 */
export type SolrCommonResponse = {
  /**
   * Metadata about the operation, including status and timing.
   */
  responseHeader: Record<string, any>
}

// === Miscellaneous Types ===

/**
 * Options for customizing filter matching behavior in Solr.
 */
export type MatchFilterOptions = {
  /**
   * Enables complex phrase matching for filters.
   */
  complexPhrase?: boolean
}
