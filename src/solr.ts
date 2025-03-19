import JSONbig from 'json-bigint'
import JSONStream from 'JSONStream'
import { Buffer } from 'buffer'
import { Writable } from 'stream'
import { Client as UndiciClient } from 'undici'
import { Collection } from './collection'
import {
  CompleteSolrClientConfig,
  DocumentAddResponse,
  HttpRequestOptions,
  SolrClientConfig,
  SolrCommonResponse,
  SolrJsonResponse,
  SolrResourceConfig,
} from './types'
import { convertDatesToISO, escapeLuceneChars } from './utils'
import { Query } from './query'

/**
 * Represents the result of a Solr search query.
 * @template T The type of documents returned.
 */
export interface SearchResult<T> {
  /** Array of documents matching the query */
  docs: T[]
  /** Total number of documents found */
  numFound: number
  /** Indicates if numFound is exact or an estimate */
  numFoundExact: boolean
  /** Starting index of the returned documents */
  start: number
}

/**
 * Response structure for a Solr search operation.
 * @template T The type of documents returned.
 */
export interface SearchResponse<T> {
  /** Optional debug information */
  debug?: Record<string, any>
  /** Cursor mark for pagination, if used */
  nextCursorMark?: string
  /** Search results */
  response: SearchResult<T>
  /** Metadata about the response */
  responseHeader: {
    /** Query execution time in milliseconds */
    QTime: number
    /** Query parameters, if any */
    params?: Record<string, any>
    /** Status code (0 for success) */
    status: number
  }
}

/**
 * Selects a JSON handler based on whether big integers need to be supported.
 * @param useBigInt Whether to handle big integers.
 * @returns A JSON parser/stringifier (native JSON or json-bigint).
 */
function getJSONHandler(useBigInt: boolean): typeof JSON | typeof JSONbig {
  return useBigInt ? JSONbig : JSON
}

/**
 * Creates a new Solr client instance.
 * @param options Configuration options for the Solr client.
 * @returns A new Client instance.
 */
export function createClient(options: SolrClientConfig = {}): Client {
  return new Client(options)
}

/**
 * A client for interacting with a Solr server.
 */
export class Client {
  /** Configuration options for the client */
  private readonly config: CompleteSolrClientConfig

  /** Mapping of handler names to their default paths */
  private readonly handlers: Record<string, string>

  /** HTTP client instance for making requests */
  private readonly httpClient: UndiciClient

  /**
   * Initializes a new Solr client.
   * @param config Configuration options for connecting to Solr.
   */
  constructor(config: SolrClientConfig = {}) {
    this.config = {
      host: config.host || '127.0.0.1',
      port: config.port ?? '8983',
      core: config.core || '',
      path: config.path || '/solr',
      secure: config.secure || false,
      bigint: config.bigint || false,
      get_max_request_entity_size: config.get_max_request_entity_size || false,
      ipVersion: config.ipVersion == 6 ? 6 : 4,
      request: config.request || null,
    }

    // Define handler paths based on Solr version
    this.handlers = {
      UPDATE: 'update',
      SELECT: 'select',
      COLLECTIONS: 'admin/collections',
      PING: 'admin/ping',
      GET: 'get',
      SPELL: 'spell',
      TERMS: 'terms',
    }

    // Construct base URL using secure flag
    const protocol = this.config.secure ? 'https' : 'http'
    const baseUrl = `${protocol}://${this.config.host}:${this.config.port}`
    this.httpClient = new UndiciClient(baseUrl, { connect: config.tls })
  }

  /**
   * Builds the full path for a given handler.
   * @param handler The handler name (e.g., 'select', 'update').
   * @returns The complete path including path and core (if applicable).
   */
  private buildHandlerPath(handler: string): string {
    const parts =
      handler === this.handlers.COLLECTIONS
        ? [this.config.path, handler]
        : [this.config.path, this.config.core, handler]
    return parts.filter(Boolean).join('/')
  }

  /**
   * Executes an HTTP request to the Solr server.
   * @param path The request path.
   * @param method HTTP method ('GET' or 'POST').
   * @param body Optional request body.
   * @param bodyContentType Content type of the body, if any.
   * @param acceptContentType Expected response content type.
   * @returns Parsed JSON response.
   */
  private async executeRequest<T = SolrJsonResponse>(
    path: string,
    method: 'GET' | 'POST',
    body: string | null,
    bodyContentType: string | null,
    acceptContentType: string,
  ): Promise<T> {
    const requestOptions: HttpRequestOptions = {
      method,
      headers: {
        accept: acceptContentType,
        ...(this.config.authorization && { authorization: this.config.authorization }),
        ...(bodyContentType && method === 'POST' && { 'content-type': bodyContentType }),
        ...(body && method === 'POST' && { 'content-length': Buffer.byteLength(body).toString() }),
      },
      ...(body && { body }),
      ...this.config.request,
    }

    const response = await this.httpClient.request({ path, ...requestOptions })
    const responseText = await response.body.text()

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error(`HTTP error ${response.statusCode}: ${responseText}`)
    }

    return getJSONHandler(this.config.bigint).parse(responseText)
  }

  /**
   * Sets basic authentication credentials.
   * @param username The username.
   * @param password The password.
   * @returns The client instance for chaining.
   */
  setBasicAuth(username: string, password: string): this {
    this.config.authorization = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`
    return this
  }

  /**
   * Clears authentication credentials.
   * @returns The client instance for chaining.
   */
  clearAuth(): this {
    delete this.config.authorization
    return this
  }

  /**
   * Adds one or more documents to Solr.
   * @param documents Single document or array of documents.
   * @param params Optional query parameters.
   * @returns Promise resolving to the add response.
   */
  async addDocuments(
    documents: Record<string, any> | Record<string, any>[],
    params?: Record<string, any>,
  ): Promise<DocumentAddResponse> {
    const formattedDocs = convertDatesToISO(documents)
    const docsArray = Array.isArray(formattedDocs) ? formattedDocs : [formattedDocs]

    return this.updateDocuments<DocumentAddResponse>(docsArray, params)
  }

  /** Alias for addDocuments, emphasizing atomic update capability. */
  atomicUpdateDocuments = this.addDocuments

  /**
   * Retrieves documents by ID(s) using Solr's Real-Time Get feature.
   * @param ids Single ID or array of IDs.
   * @param query Optional query parameters.
   * @returns Promise resolving to the search response.
   */
  async getDocumentsById<T>(
    ids: string | string[],
    query: Query | Record<string, any> | string = {},
  ): Promise<SearchResponse<T>> {
    const idList = Array.isArray(ids) ? ids : [ids]
    const idsParam = { ids: idList.join(',') }

    let finalQuery: Query | Record<string, any> | string
    if (query instanceof Query) {
      query.addRawParameter(`ids=${encodeURIComponent(idsParam.ids)}`)
      finalQuery = query
    } else if (typeof query === 'object') {
      finalQuery = { ...query, ...idsParam }
    } else {
      const params = new URLSearchParams(query)
      params.append('ids', encodeURIComponent(idsParam.ids))
      finalQuery = params.toString()
    }

    return this.executeQuery(this.handlers.GET, finalQuery)
  }

  /**
   * Adds a remote resource to Solr.
   * @param options Configuration for the remote resource.
   * @returns Promise resolving to the response data.
   */
  async addRemoteResource(options: SolrResourceConfig): Promise<SolrJsonResponse> {
    const params = options.parameters || {}
    params.commit = params.commit ?? false
    params['stream.contentType'] = options.contentType || 'text/plain;charset=utf-8'
    params[options.path.match(/^https?:\/\//) ? 'stream.url' : 'stream.file'] = options.path

    const format = options.format === 'xml' ? '' : options.format || ''
    const handlerPath = `${this.handlers.UPDATE}/${format.toLowerCase()}`
    const queryString = new URLSearchParams(params).toString()

    return this.executeQuery(handlerPath, queryString)
  }

  /**
   * Creates a stream for adding documents to Solr.
   * @param options Optional parameters for the stream request.
   * @returns An object with a writable stream and a promise for the response.
   */
  createDocumentStream(options: Record<string, any> = {}): {
    stream: Writable
    response: Promise<SolrJsonResponse>
  } {
    const searchParams = new URLSearchParams({
      ...options,
      wt: 'json',
    })
    const path = `${this.buildHandlerPath(this.handlers.UPDATE)}?${searchParams.toString()}`
    const jsonStream = JSONStream.stringify()

    const responsePromise = this.httpClient
      .request({
        path,
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(this.config.authorization && { authorization: this.config.authorization }),
        },
        body: jsonStream,
      })
      .then(async (response) => {
        const text = await response.body.text()
        if (response.statusCode >= 200 && response.statusCode < 300) {
          return getJSONHandler(this.config.bigint).parse(text)
        }
        throw new Error(`HTTP error ${response.statusCode}: ${text}`)
      })

    return { stream: jsonStream, response: responsePromise }
  }

  /**
   * Commits pending changes to the Solr index.
   * @param options Optional commit parameters.
   * @returns Promise resolving to the response data.
   */
  async commit(options?: Record<string, any>): Promise<SolrJsonResponse> {
    return this.updateDocuments({ commit: options || {} })
  }

  /**
   * Prepares a commit without making changes visible.
   * @returns Promise resolving to the response data.
   */
  async prepareCommit(): Promise<SolrJsonResponse> {
    return this.updateDocuments({}, { prepareCommit: true })
  }

  /**
   * Performs a soft commit of all changes.
   * @returns Promise resolving to the response data.
   */
  async softCommit(): Promise<SolrJsonResponse> {
    return this.updateDocuments({}, { softCommit: true })
  }

  /**
   * Deletes documents matching a field-value pair.
   * @param field The field to match.
   * @param value The value to match.
   * @param options Optional parameters.
   * @returns Promise resolving to the response data.
   */
  async deleteByField(
    field: string,
    value: string,
    options?: Record<string, any>,
  ): Promise<SolrJsonResponse> {
    return this.updateDocuments(
      { delete: { query: `${field}:${escapeLuceneChars(convertDatesToISO(value))}` } },
      options,
    )
  }

  /**
   * Deletes documents within a range for a given field.
   * @param field The field to query.
   * @param start Start of the range.
   * @param end End of the range.
   * @param options Optional parameters.
   * @returns Promise resolving to the response data.
   */
  async deleteByRange(
    field: string,
    start: string | Date,
    end: string | Date,
    options?: Record<string, any>,
  ): Promise<SolrJsonResponse> {
    const startStr = convertDatesToISO(start)
    const endStr = convertDatesToISO(end)

    return this.deleteByQuery(`${field}:[${startStr} TO ${endStr}]`, options)
  }

  /**
   * Deletes a document by its ID.
   * @param id The document ID.
   * @param options Optional parameters.
   * @returns Promise resolving to the response data.
   */
  async deleteById(id: string | number, options?: Record<string, any>): Promise<SolrJsonResponse> {
    return this.updateDocuments({ delete: { id } }, options)
  }

  /**
   * Deletes documents matching a query.
   * @param query The query string.
   * @param options Optional parameters.
   * @returns Promise resolving to the response data.
   */
  async deleteByQuery(query: string, options?: Record<string, any>): Promise<SolrJsonResponse> {
    return this.updateDocuments({ delete: { query } }, options)
  }

  /**
   * Deletes all documents in the index.
   * @param options Optional parameters.
   * @returns Promise resolving to the response data.
   */
  async deleteAllDocuments(options?: Record<string, any>): Promise<SolrJsonResponse> {
    return this.deleteByQuery('*:*', options)
  }

  /**
   * Optimizes the Solr index.
   * @param options Optimization parameters.
   * @returns Promise resolving to the response data.
   */
  async optimizeIndex(options: Record<string, any> = {}): Promise<SolrJsonResponse> {
    return this.updateDocuments({ optimize: options })
  }

  /**
   * Rolls back uncommitted changes.
   * @returns Promise resolving to the response data.
   */
  async rollbackChanges(): Promise<SolrJsonResponse> {
    return this.updateDocuments({ rollback: {} })
  }

  /**
   * Updates the Solr index with the provided data.
   * @param data The data to send.
   * @param params Optional query parameters.
   * @returns Promise resolving to the response.
   */
  private async updateDocuments<T>(
    data: Record<string, any>,
    params?: Record<string, any>,
  ): Promise<T> {
    const path = this.buildHandlerPath(this.handlers.UPDATE)
    const searchParams = new URLSearchParams({ ...params, wt: 'json' })
    const queryString = searchParams.toString()

    return this.executeRequest<T>(
      `${path}?${queryString}`,
      'POST',
      getJSONHandler(this.config.bigint).stringify(data),
      'application/json',
      'application/json; charset=utf-8',
    )
  }

  /**
   * Searches for documents matching the query.
   * @param query The search query.
   * @returns Promise resolving to the search response.
   */
  async searchDocuments<T>(
    query: Query | Record<string, any> | string,
  ): Promise<SearchResponse<T>> {
    return this.executeQuery<SearchResponse<T>>(this.handlers.SELECT, query)
  }

  /**
   * Executes an admin collection task.
   * @param collection The collection configuration or query.
   * @returns Promise resolving to the common response.
   */
  async manageCollection(
    collection: Collection | Record<string, any> | string,
  ): Promise<SolrCommonResponse> {
    return this.executeQuery(this.handlers.COLLECTIONS, collection)
  }

  /**
   * Searches for all documents in the index.
   * @returns Promise resolving to the response data.
   */
  async searchAllDocuments(): Promise<SolrJsonResponse> {
    return this.searchDocuments('q=*:*')
  }

  /**
   * Performs a spellcheck query.
   * @param query The spellcheck query.
   * @returns Promise resolving to the response data.
   */
  async spellCheck(query: Query): Promise<SolrJsonResponse> {
    return this.executeQuery(this.handlers.SPELL, query)
  }

  /**
   * Searches for terms in the index.
   * @param query The terms query.
   * @returns Promise resolving to the response data.
   */
  async searchTerms(query: Query | Record<string, any> | string): Promise<SolrJsonResponse> {
    return this.executeQuery(this.handlers.TERMS, query)
  }

  /**
   * Executes a query against a Solr handler.
   * @param handler The handler to query.
   * @param query The query to execute.
   * @returns Promise resolving to the response.
   */
  private async executeQuery<T>(
    handler: string,
    query: Query | Collection | Record<string, any> | string,
  ): Promise<T> {
    let queryData: string
    if (query instanceof Query || query instanceof Collection) {
      queryData = query.toString()
    } else if (typeof query === 'object') {
      queryData = new URLSearchParams(query).toString()
    } else {
      queryData = query
    }

    const path = this.buildHandlerPath(handler)
    const queryString = queryData ? `${queryData}&wt=json` : 'wt=json'
    const urlLength = Buffer.byteLength(path) + Buffer.byteLength(queryString) + 100 // Rough estimate
    const method =
      this.config.get_max_request_entity_size === false ||
      (typeof this.config.get_max_request_entity_size === 'number' &&
        urlLength <= this.config.get_max_request_entity_size)
        ? 'GET'
        : 'POST'

    return this.executeRequest<T>(
      method === 'GET' ? `${path}?${queryString}` : path,
      method,
      method === 'POST' ? queryData : null,
      method === 'POST' ? 'application/x-www-form-urlencoded; charset=utf-8' : null,
      'application/json; charset=utf-8',
    )
  }

  /**
   * Creates a new Query instance.
   * @returns A new Query object.
   */
  createQuery(): Query {
    return new Query()
  }

  /**
   * Creates a new Collection instance.
   * @returns A new Collection object.
   */
  createCollection(): Collection {
    return new Collection()
  }

  /**
   * Escapes special characters in a string for Solr queries.
   */
  escapeSpecialCharacters = escapeLuceneChars

  /**
   * Pings the Solr server to check its status.
   * @returns Promise resolving to the ping response.
   */
  async pingServer(): Promise<SolrJsonResponse> {
    return this.executeQuery(this.handlers.PING, '')
  }

  /**
   * Creates a schema field (intended for testing purposes).
   * @param fieldName The name of the field.
   * @param fieldType The type of the field.
   * @returns Promise resolving to the response data or an empty object on error.
   */
  async createSchemaField(fieldName: string, fieldType: string): Promise<SolrJsonResponse> {
    try {
      return await this.executeRequest(
        this.buildHandlerPath('schema'),
        'POST',
        getJSONHandler(this.config.bigint).stringify({
          'add-field': { name: fieldName, type: fieldType, multiValued: false, stored: true },
        }),
        'application/json',
        'application/json; charset=utf-8',
      )
    } catch (error) {
      console.warn(`Failed to create schema field: ${(error as Error).message}`)
      return {}
    }
  }
}
