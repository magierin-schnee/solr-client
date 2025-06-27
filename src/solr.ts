import JSONbig from 'json-bigint'
import JSONStream from 'JSONStream'
import { Buffer } from 'buffer'
import { Writable } from 'stream'
import { Client as UndiciClient } from 'undici'
import { Collection } from './collection'
import {
  ResolvedSolrClientConfig,
  HttpRequestOptions,
  SolrClientConfig,
  SolrError,
  SolrResourceConfig,
  SolrApiResponse,
  SolrErrorBody,
} from './types'
import { convertDatesToISO, escapeLuceneChars } from './utils'
import { Query } from './query'

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
  private readonly config: ResolvedSolrClientConfig

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
      ipVersion: config.ipVersion == 6 ? 6 : 4,
      request: config.request || null,
    }

    this.handlers = {
      UPDATE: 'update',
      SELECT: 'select',
      COLLECTIONS: 'admin/collections',
      PING: 'admin/ping',
      GET: 'get',
      SPELL: 'spell',
      TERMS: 'terms',
    }

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
  private async executeRequest<T = SolrApiResponse>(
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

    const jsonResponse = getJSONHandler(this.config.bigint).parse(responseText)

    if (response.statusCode >= 400 || jsonResponse.error) {
      if (jsonResponse.error) {
        throw new SolrError(response.statusCode, jsonResponse.error)
      } else {
        const fallbackErrorBody: SolrErrorBody = {
          code: response.statusCode,
          msg: `HTTP error ${response.statusCode}. No error details provided in response body.`,
          metadata: [],
        }
        throw new SolrError(response.statusCode, fallbackErrorBody)
      }
    }

    return jsonResponse
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
  ): Promise<SolrApiResponse> {
    const formattedDocs = convertDatesToISO(documents)
    const docsArray = Array.isArray(formattedDocs) ? formattedDocs : [formattedDocs]

    return this.updateDocuments<SolrApiResponse>(docsArray, params)
  }

  /** Alias for addDocuments, emphasizing atomic update capability. */
  atomicUpdateDocuments = this.addDocuments

  /**
   * Retrieves documents by ID(s) using Solr's Real-Time Get feature.
   * @param ids Single ID or array of IDs.
   * @param query Optional query parameters.
   * @returns Promise resolving to the search response.
   */
  async getDocumentsById(
    ids: string | string[],
    params: Record<string, any> = {},
  ): Promise<SolrApiResponse> {
    const idList = Array.isArray(ids) ? ids : [ids]
    const queryParams = {
      ...params,
      ids: idList.join(','),
      wt: 'json',
    }

    return this.executeQuery(this.handlers.GET, queryParams)
  }

  /**
   * Adds a remote resource to Solr.
   * @param options Configuration for the remote resource.
   * @returns Promise resolving to the response data.
   */
  async addRemoteResource(options: SolrResourceConfig): Promise<SolrApiResponse> {
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
    response: Promise<SolrApiResponse>
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
  async commit(options?: Record<string, any>): Promise<SolrApiResponse> {
    return this.updateDocuments({ commit: options || {} })
  }

  /**
   * Prepares a commit without making changes visible.
   * @returns Promise resolving to the response data.
   */
  async prepareCommit(): Promise<SolrApiResponse> {
    return this.updateDocuments({}, { prepareCommit: true })
  }

  /**
   * Performs a soft commit of all changes.
   * @returns Promise resolving to the response data.
   */
  async softCommit(): Promise<SolrApiResponse> {
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
  ): Promise<SolrApiResponse> {
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
  ): Promise<SolrApiResponse> {
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
  async deleteById(id: string | number, options?: Record<string, any>): Promise<SolrApiResponse> {
    return this.updateDocuments({ delete: { id } }, options)
  }

  /**
   * Deletes documents matching a query.
   * @param query The query string.
   * @param options Optional parameters.
   * @returns Promise resolving to the response data.
   */
  async deleteByQuery(query: string, options?: Record<string, any>): Promise<SolrApiResponse> {
    return this.updateDocuments({ delete: { query } }, options)
  }

  /**
   * Deletes all documents in the index.
   * @param options Optional parameters.
   * @returns Promise resolving to the response data.
   */
  async deleteAllDocuments(options?: Record<string, any>): Promise<SolrApiResponse> {
    return this.deleteByQuery('*:*', options)
  }

  /**
   * Optimizes the Solr index.
   * @param options Optimization parameters.
   * @returns Promise resolving to the response data.
   */
  async optimizeIndex(options: Record<string, any> = {}): Promise<SolrApiResponse> {
    return this.updateDocuments({ optimize: options })
  }

  /**
   * Rolls back uncommitted changes.
   * @returns Promise resolving to the response data.
   */
  async rollbackChanges(): Promise<SolrApiResponse> {
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
  async searchDocuments(query: Query | Record<string, any> | string): Promise<SolrApiResponse> {
    return this.executeQuery(this.handlers.SELECT, query)
  }

  /**
   * Executes an admin collection task.
   * @param collection The collection configuration or query.
   * @returns Promise resolving to the common response.
   */
  async manageCollection(
    collection: Collection | Record<string, any> | string,
  ): Promise<SolrApiResponse> {
    return this.executeQuery(this.handlers.COLLECTIONS, collection)
  }

  /**
   * Searches for all documents in the index.
   * @returns Promise resolving to the response data.
   */
  async searchAllDocuments(): Promise<SolrApiResponse> {
    return this.searchDocuments('q=*:*')
  }

  /**
   * Performs a spellcheck query.
   * @param query The spellcheck query.
   * @returns Promise resolving to the response data.
   */
  async spellCheck(params: Record<string, any>): Promise<SolrApiResponse> {
    return this.executeQuery(this.handlers.SPELL, params)
  }

  /**
   * Searches for terms in the index.
   * @param query The terms query.
   * @returns Promise resolving to the response data.
   */
  async searchTerms(params: Record<string, any> | string): Promise<SolrApiResponse> {
    return this.executeQuery(this.handlers.TERMS, params)
  }

  /**
   * Executes a query against a Solr handler, supporting both JSON Request API and parameter-based requests.
   * @param handler The handler to query.
   * @param query The query to execute.
   * @returns Promise resolving to the response.
   */
  private async executeQuery<T>(
    handler: string,
    query: Query | Collection | Record<string, any> | string,
  ): Promise<T> {
    const path = this.buildHandlerPath(handler)

    if (query instanceof Query) {
      const jsonBody = getJSONHandler(this.config.bigint).stringify(query.toObject())
      return this.executeRequest<T>(
        `${path}?wt=json`,
        'POST',
        jsonBody,
        'application/json',
        'application/json; charset=utf-8',
      )
    }

    // For traditional parameter-based requests (Collection, Record<string, any>, string),
    let queryString: string
    if (query instanceof Collection) {
      queryString = query.toQueryString()
    } else if (typeof query === 'object') {
      queryString = new URLSearchParams(query).toString()
    } else {
      queryString = query
    }

    return this.executeRequest<T>(
      path,
      'POST',
      queryString ? `${queryString}&wt=json` : 'wt=json',
      'application/x-www-form-urlencoded; charset=utf-8',
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
  async pingServer(): Promise<SolrApiResponse> {
    return this.executeQuery(this.handlers.PING, '')
  }

  /**
   * Creates a schema field (intended for testing purposes).
   * @param fieldName The name of the field.
   * @param fieldType The type of the field.
   * @returns Promise resolving to the response data or an empty object on error.
   */
  async createSchemaField(fieldName: string, fieldType: string): Promise<SolrApiResponse> {
    return this.executeRequest(
      this.buildHandlerPath('schema'),
      'POST',
      getJSONHandler(this.config.bigint).stringify({
        'add-field': { name: fieldName, type: fieldType, multiValued: false, stored: true },
      }),
      'application/json',
      'application/json; charset=utf-8',
    )
  }
}
