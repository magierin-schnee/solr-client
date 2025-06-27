import {
  HighlightConfig,
  DateRangeConfig,
  JoinConfig,
  GroupingConfig,
  JsonFacetConfig,
  MoreLikeThisConfig,
  TermsConfig,
} from './types'
import { convertDatesToISO, toArray } from './utils'

/**
 * A class to construct and manage Solr queries using the JSON Request API with a fluent interface.
 */
export class Query {
  private body: Record<string, any> = {
    query: '*:*',
  }

  private setParam(key: string, value: any): this {
    if (!this.body.params) {
      this.body.params = {}
    }
    this.body.params[key] = value
    return this
  }

  /**
   * Specifies the query parser type.
   * @param parserType The type of parser (e.g., 'lucene', 'dismax').
   * @returns This instance for method chaining.
   */
  setParserType(parserType: string): this {
    this.setParam('defType', parserType)
    return this
  }

  /**
   * Sets the Solr request handler.
   * @param handlerName The name of the request handler.
   * @returns This instance for method chaining.
   */
  setRequestHandler(handlerName: string): this {
    this.setParam('qt', handlerName)
    return this
  }

  /**
   * Defines the main query string or object.
   * @param query The query string (e.g., 'name:Example').
   * @returns This instance for method chaining.
   */
  setQuery(query: string): this {
    this.body.query = query
    return this
  }

  /**
   * Sets the default operator for query terms.
   * @param operator The operator ('AND' or 'OR').
   * @returns This instance for method chaining.
   */
  setQueryOperator(operator: 'AND' | 'OR'): this {
    this.setParam('q.op', operator)
    return this
  }

  /**
   * Specifies the default field for queries.
   * @param fieldName The name of the default field.
   * @returns This instance for method chaining.
   */
  setDefaultField(fieldName: string): this {
    this.setParam('df', fieldName)
    return this
  }

  /**
   * Sets the starting offset for result pagination.
   * @param offset The zero-based starting index.
   * @returns This instance for method chaining.
   */
  setOffset(offset: number): this {
    this.body.offset = offset
    return this
  }

  /**
   * Limits the number of results returned.
   * @param limit The maximum number of results.
   * @returns This instance for method chaining.
   */
  setLimit(limit: number): this {
    this.body.limit = limit
    return this
  }

  /**
   * Configures cursor-based pagination.
   * @param cursor The cursor mark (defaults to '*').
   * @returns This instance for method chaining.
   */
  setCursor(cursor = '*'): this {
    this.setParam('cursorMark', cursor)
    return this
  }

  /**
   * Defines the sort order for results.
   * @example .setSort({ score: 'desc', price: 'asc' })
   * @param fields An object mapping fields to sort directions.
   * @returns This instance for method chaining.
   */
  setSort(fields: Record<string, 'asc' | 'desc'>): this {
    const sortString = Object.entries(fields)
      .map(([field, direction]) => `${field} ${direction}`)
      .join(',')
    this.body.sort = sortString

    return this
  }

  /**
   * Adds a range filter to the query.
   * If an array is provided, multiple range filters will be joined with 'AND'.
   * @param dateRange Single or multiple range filter options.
   * @returns This instance for method chaining.
   */
  addRangeFilter(dateRange: DateRangeConfig | DateRangeConfig[]): this {
    const normalizedOptions = convertDatesToISO(dateRange)
    const filters = Array.isArray(normalizedOptions)
      ? normalizedOptions.map(
          ({ field, start, end }) => `${field}:[${start ?? '*'} TO ${end ?? '*'}]`,
        )
      : [
          `${normalizedOptions.field}:[${normalizedOptions.start ?? '*'} TO ${normalizedOptions.end ?? '*'}]`,
        ]
    this.addFilters(filters)

    return this
  }

  /**
   * Adds a join filter for cross-core queries.
   * @param config Configuration for the join filter.
   * @returns This instance for method chaining.
   */
  addJoinFilter(config: JoinConfig): this {
    const { fromIndex, from, to, query } = config
    this.addFilter(`{!join fromIndex=${fromIndex} from=${from} to=${to} v='${query}'}`)
    return this
  }

  /**
   * Adds a filter query (`fq`).
   * @param filter A filter query string (e.g., 'field:value').
   * @returns This instance for method chaining.
   */
  addFilter(filter: string): this {
    if (!this.body.filter) this.body.filter = []
    this.body.filter.push(filter)
    return this
  }

  /**
   * Adds multiple filter queries (`fq`).
   * @param filters An array of filter query strings.
   * @returns This instance for method chaining.
   */
  addFilters(filters: string[]): this {
    if (!this.body.filter) this.body.filter = []
    this.body.filter.push(...filters)
    return this
  }

  /**
   * Specifies fields to include in the response.
   * @param fields Single field or array of fields.
   * @returns This instance for method chaining.
   */
  setResponseFields(fields: string | string[]): this {
    const fieldString = Array.isArray(fields) ? fields.join(',') : fields
    this.body.fields = fieldString
    return this
  }

  /**
   * Sets a timeout for the query execution.
   * @param milliseconds The timeout duration in milliseconds.
   * @returns This instance for method chaining.
   */
  setTimeout(milliseconds: number): this {
    this.setParam('timeAllowed', milliseconds)
    return this
  }

  /**
   * Groups results by a single field.
   * @param fieldName The field to group by.
   * @returns This instance for method chaining.
   */
  groupBy(fieldName: string): this {
    this.setGrouping({ field: fieldName })
    return this
  }

  /**
   * Configures result grouping (field collapsing).
   * @example
   * .setGrouping({
   *   field: 'category_id',
   *   limit: 3,
   *   sort: 'price asc'
   * })
   * @param config Grouping configuration.
   * @returns This instance for method chaining.
   */
  setGrouping(config: GroupingConfig): this {
    this.setParam('group', config.on === false ? 'false' : 'true')

    if (config.field) {
      this.setParam('group.field', toArray(config.field))
    }

    if (config.query) {
      this.setParam('group.query', toArray(config.query))
    }

    if (config.limit !== undefined) {
      this.setParam('group.limit', config.limit)
    }

    if (config.offset !== undefined) {
      this.setParam('group.offset', config.offset)
    }

    if (config.sort) {
      this.setParam('group.sort', config.sort)
    }

    if (config.format) {
      this.setParam('group.format', config.format)
    }

    if (config.main !== undefined) {
      this.setParam('group.main', config.main)
    }

    if (config.ngroups !== undefined) {
      this.setParam('group.ngroups', config.ngroups)
    }

    if (config.truncate !== undefined) {
      this.setParam('group.truncate', config.truncate)
    }

    if (config.cache !== undefined) {
      this.setParam('group.cache.percent', config.cache)
    }

    return this
  }

  /**
   * Configures JSON faceting options.
   * @param config Faceting configuration using the JSON Facet API structure.
   * @returns This instance for method chaining.
   */
  setFacets(config: JsonFacetConfig): this {
    this.body.facet = convertDatesToISO(config)
    return this
  }

  /**
   * Configures MoreLikeThis functionality.
   * @param config MoreLikeThis configuration.
   * @returns This instance for method chaining.
   */
  setMoreLikeThis(config: MoreLikeThisConfig): this {
    this.setParam('mlt', config.on === false ? 'false' : 'true')

    if (config.fl) {
      const fields = Array.isArray(config.fl) ? config.fl.join(',') : config.fl
      this.setParam('mlt.fl', fields)
    }

    if (config.count !== undefined) {
      this.setParam('mlt.count', config.count)
    }

    if (config.mintf !== undefined) {
      this.setParam('mlt.mintf', config.mintf)
    }

    if (config.mindf !== undefined) {
      this.setParam('mlt.mindf', config.mindf)
    }

    if (config.minwl !== undefined) {
      this.setParam('mlt.minwl', config.minwl)
    }

    if (config.maxwl !== undefined) {
      this.setParam('mlt.maxwl', config.maxwl)
    }

    if (config.maxqt !== undefined) {
      this.setParam('mlt.maxqt', config.maxqt)
    }

    if (config.maxntp !== undefined) {
      this.setParam('mlt.maxntp', config.maxntp)
    }

    if (config.boost !== undefined) {
      this.setParam('mlt.boost', config.boost)
    }

    if (config.qf) {
      const qfString =
        typeof config.qf === 'string'
          ? config.qf
          : Object.entries(config.qf)
              .map(([field, boost]) => `${field}^${boost}`)
              .join(' ')
      this.setParam('mlt.qf', qfString)
    }

    return this
  }

  /**
   * Enables the DisMax query parser.
   * @returns This instance for method chaining.
   */
  useDisMax(): this {
    return this.setParserType('dismax')
  }

  /**
   * Enables the Extended DisMax query parser.
   * @returns This instance for method chaining.
   */
  useExtendedDisMax(): this {
    return this.setParserType('edismax')
  }

  /**
   * Includes debug information in the response.
   * @returns This instance for method chaining.
   */
  enableDebug(): this {
    this.setParam('debugQuery', 'true')
    return this
  }

  /**
   * Sets boosted query fields.
   * @param fields Field boosts as an object.
   * @returns This instance for method chaining.
   */
  setQueryFields(fields: Record<string, string | number>): this {
    const fieldString = Object.entries(fields)
      .map(([field, boost]) => `${field}^${boost}`)
      .join(' ')
    this.setParam('qf', fieldString)
    return this
  }

  /**
   * Sets the minimum match requirement.
   * @param minimumMatch Minimum number or percentage of terms to match.
   * @returns This instance for method chaining.
   */
  setMinimumMatch(minimumMatch: string | number): this {
    this.setParam('mm', minimumMatch)
    return this
  }

  /**
   * Sets phrase fields with boosts.
   * @param fields Phrase fields and their boosts.
   * @returns This instance for method chaining.
   */
  setPhraseFields(fields: Record<string, string | number>): this {
    const phraseString = Object.entries(fields)
      .map(([field, boost]) => `${field}^${boost}`)
      .join(' ')
    this.setParam('pf', phraseString)
    return this
  }

  /**
   * Configures phrase slop.
   * @param slop The phrase slop value.
   * @returns This instance for method chaining.
   */
  setPhraseSlop(slop: number): this {
    this.setParam('ps', slop)
    return this
  }

  /**
   * Configures query slop.
   * @param slop The query slop value.
   * @returns This instance for method chaining.
   */
  setQuerySlop(slop: number): this {
    this.setParam('qs', slop)
    return this
  }

  /**
   * Sets the tiebreaker value for DisMax queries.
   * @param tiebreaker The tiebreaker value (0.0 to 1.0).
   * @returns This instance for method chaining.
   */
  setTiebreaker(tiebreaker: number): this {
    this.setParam('tie', tiebreaker)
    return this
  }

  /**
   * Adds a boost query.
   * @param boostQuery Boost query configuration.
   * @returns This instance for method chaining.
   */
  setBoostQuery(boostQuery: Record<string, string | number>): this {
    const boostString = Object.entries(boostQuery)
      .map(([field, boost]) => `${field}^${boost}`)
      .join(' ')
    this.setParam('bq', boostString)
    return this
  }

  /**
   * Adds boost functions.
   * @param functions Boost function string.
   * @returns This instance for method chaining.
   */
  setBoostFunctions(functions: string): this {
    this.setParam('bf', functions)
    return this
  }

  /**
   * Applies a boost to the query.
   * @param boost Boost function string.
   * @returns This instance for method chaining.
   */
  setBoost(boost: string): this {
    this.setParam('boost', boost)
    return this
  }

  /**
   * Configures highlighting options.
   * @param config Highlighting configuration.
   * @returns This instance for method chaining.
   */
  setHighlighting(config: HighlightConfig): this {
    this.setParam('hl', config.on === false ? 'false' : 'true')

    if (config.q) {
      const qString =
        typeof config.q === 'string'
          ? config.q
          : Object.entries(config.q)
              .map(([k, v]) => `${k}:${v}`)
              .join(' AND ')
      this.setParam('hl.q', qString)
    }

    if (config.qparser) {
      this.setParam('hl.qparser', config.qparser)
    }

    if (config.fl) {
      const fields = Array.isArray(config.fl) ? config.fl.join(',') : config.fl
      this.setParam('hl.fl', fields)
    }

    if (config.snippets) {
      this.setParam('hl.snippets', config.snippets)
    }

    if (config.fragsize) {
      this.setParam('hl.fragsize', config.fragsize)
    }

    if (config.mergeContiguous !== undefined) {
      this.setParam('hl.mergeContiguous', config.mergeContiguous)
    }

    if (config.requireFieldMatch !== undefined) {
      this.setParam('hl.requireFieldMatch', config.requireFieldMatch)
    }

    if (config.maxAnalyzedChars) {
      this.setParam('hl.maxAnalyzedChars', config.maxAnalyzedChars)
    }

    if (config.maxMultiValuedToExamine) {
      this.setParam('hl.maxMultiValuedToExamine', config.maxMultiValuedToExamine)
    }

    if (config.maxMultiValuedToMatch) {
      this.setParam('hl.maxMultiValuedToMatch', config.maxMultiValuedToMatch)
    }

    if (config.alternateField) {
      this.setParam('hl.alternateField', config.alternateField)
    }

    if (config.maxAlternateFieldLength !== undefined) {
      this.setParam('hl.maxAlternateFieldLength', config.maxAlternateFieldLength)
    }

    if (config.formatter) {
      this.setParam('hl.formatter', config.formatter)
    }

    this.setParam('hl.simple.pre', config.simplePre ?? '<em>')
    this.setParam('hl.simple.post', config.simplePost ?? '</em>')

    if (config.fragmenter) {
      this.setParam('hl.fragmenter', config.fragmenter)
    }

    if (config.highlightMultiTerm !== undefined) {
      this.setParam('hl.highlightMultiTerm', config.highlightMultiTerm)
    }

    if (config.usePhraseHighlighter !== undefined) {
      this.setParam('hl.usePhraseHighlighter', config.usePhraseHighlighter)
    }

    if (config.regexSlop) {
      this.setParam('hl.regex.slop', config.regexSlop)
    }

    if (config.regexPattern) {
      this.setParam('hl.regex.pattern', config.regexPattern)
    }

    if (config.regexMaxAnalyzedChars) {
      this.setParam('hl.regex.maxAnalyzedChars', config.regexMaxAnalyzedChars)
    }

    if (config.preserveMulti !== undefined) {
      this.setParam('hl.preserveMulti', config.preserveMulti)
    }

    if (config.payloads !== undefined) {
      this.setParam('hl.payloads', config.payloads)
    }

    return this
  }

  /**
   * Configures term statistics.
   * @param config Terms configuration.
   * @returns This instance for method chaining.
   */
  setTerms(config: TermsConfig): this {
    this.setParam('terms', config.on === false ? 'false' : 'true')

    if (config.fl) {
      this.setParam('terms.fl', config.fl)
    }

    if (config.lower) {
      this.setParam('terms.lower', config.lower)
    }

    if (config.lowerIncl !== undefined) {
      this.setParam('terms.lower.incl', config.lowerIncl)
    }

    if (config.mincount) {
      this.setParam('terms.mincount', config.mincount)
    }

    if (config.maxcount) {
      this.setParam('terms.maxcount', config.maxcount)
    }

    if (config.prefix) {
      this.setParam('terms.prefix', config.prefix)
    }

    if (config.regex) {
      this.setParam('terms.regex', config.regex)
    }

    if (config.regexFlag) {
      this.setParam('terms.regex.flag', config.regexFlag)
    }

    if (config.limit) {
      this.setParam('terms.limit', config.limit)
    }

    if (config.upper) {
      this.setParam('terms.upper', config.upper)
    }

    if (config.upperIncl !== undefined) {
      this.setParam('terms.upper.incl', config.upperIncl)
    }

    if (config.raw !== undefined) {
      this.setParam('terms.raw', config.raw)
    }

    if (config.sort) {
      this.setParam('terms.sort', config.sort)
    }

    return this
  }

  /**
   * Generates the final query object for the JSON Request API.
   * @returns The complete query object.
   */
  toObject(): Record<string, any> {
    if (this.body.params && Object.keys(this.body.params).length === 0) {
      delete this.body.params
    }
    return this.body
  }
}
