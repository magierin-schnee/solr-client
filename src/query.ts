import {
  Filters,
  MatchFilterOptions,
  HighlightConfig,
  DateRangeConfig,
  JoinConfig,
  GroupingConfig,
  FacetConfig,
  MoreLikeThisConfig,
  TermsConfig,
} from './types'
import { convertDatesToISO, toArray } from './utils'

const COMPLEX_PHRASE_PREFIX = '{!complexphrase inOrder=true}'

/**
 * A class to construct and manage Solr query strings with a fluent API.
 */
export class Query {
  public parameters: string[] = []

  /**
   * Adds a raw parameter to the query.
   * @param param The raw parameter string (must be pre-encoded if necessary).
   * @returns This instance for method chaining.
   */
  addRawParameter(param: string): this {
    this.parameters.push(param)
    return this
  }

  /**
   * Specifies the query parser type.
   * @param parserType The type of parser (e.g., 'lucene', 'dismax').
   * @returns This instance for method chaining.
   */
  setParserType(parserType: string): this {
    this.parameters.push(`defType=${encodeURIComponent(parserType)}`)
    return this
  }

  /**
   * Sets the Solr request handler.
   * @param handlerName The name of the request handler.
   * @returns This instance for method chaining.
   */
  setRequestHandler(handlerName: string): this {
    this.parameters.push(`qt=${encodeURIComponent(handlerName)}`)
    return this
  }

  /**
   * Defines the main query string or object.
   * @param query The query as a string or key-value object.
   * @param options Optional configuration for complex phrases.
   * @returns This instance for method chaining.
   */
  setQuery(query: string | Record<string, any>, options?: MatchFilterOptions): this {
    const queryString =
      typeof query === 'string'
        ? encodeURIComponent(query)
        : new URLSearchParams(query).toString().replace(/=/g, ':').replace(/&/g, ' AND ')
    const prefix = options?.complexPhrase ? COMPLEX_PHRASE_PREFIX : ''
    this.parameters.push(`q=${encodeURIComponent(prefix)}${queryString}`)

    return this
  }

  /**
   * Sets the default operator for query terms.
   * @param operator The operator ('AND' or 'OR').
   * @returns This instance for method chaining.
   */
  setQueryOperator(operator: 'AND' | 'OR'): this {
    this.parameters.push(`q.op=${encodeURIComponent(operator)}`)
    return this
  }

  /**
   * Specifies the default field for queries.
   * @param fieldName The name of the default field.
   * @returns This instance for method chaining.
   */
  setDefaultField(fieldName: string): this {
    this.parameters.push(`df=${encodeURIComponent(fieldName)}`)
    return this
  }

  /**
   * Sets the starting offset for result pagination.
   * @param offset The zero-based starting index.
   * @returns This instance for method chaining.
   */
  setOffset(offset: number): this {
    this.parameters.push(`start=${offset}`)
    return this
  }

  /**
   * Limits the number of results returned.
   * @param limit The maximum number of results.
   * @returns This instance for method chaining.
   */
  setLimit(limit: number): this {
    this.parameters.push(`rows=${limit}`)
    return this
  }

  /**
   * Configures cursor-based pagination.
   * @param cursor The cursor mark (defaults to '*').
   * @returns This instance for method chaining.
   */
  setCursor(cursor = '*'): this {
    this.parameters.push(`cursorMark=${encodeURIComponent(cursor)}`)
    return this
  }

  /**
   * Defines the sort order for results.
   * @param fields An object mapping fields to sort directions.
   * @returns This instance for method chaining.
   */
  setSort(fields: Record<string, 'asc' | 'desc'>): this {
    const sortString = Object.entries(fields)
      .map(([field, direction]) => `${field} ${direction}`)
      .join(',')
    this.parameters.push(`sort=${encodeURIComponent(sortString)}`)

    return this
  }

  /**
   * Adds a range filter to the query.
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
    this.parameters.push(`fq=${encodeURIComponent(filters.join(' AND '))}`)

    return this
  }

  /**
   * Adds a join filter for cross-core queries.
   * @param config Configuration for the join filter.
   * @returns This instance for method chaining.
   */
  addJoinFilter(config: JoinConfig): this {
    const { fromIndex, from, to, field, value } = config
    const joinString = `{!join fromIndex=${fromIndex} from=${from} to=${to} v='${field}:${value}'}`
    this.parameters.push(`fq=${encodeURIComponent(joinString)}`)

    return this
  }

  /**
   * Adds a filter for exact matches on a field.
   * @param field The field to filter on.
   * @param value The value(s) to match.
   * @param options Optional configuration for the filter.
   * @returns This instance for method chaining.
   */
  addMatchFilter(
    field: string,
    value: string | string[] | number | number[] | Date | Date[] | boolean,
    options?: MatchFilterOptions,
  ): this {
    const values = Array.isArray(value) ? value : [value]
    const formattedValues = values.map((v) => convertDatesToISO(v).toString())
    const valueString =
      formattedValues.length > 1 ? `(${formattedValues.join(' OR ')})` : formattedValues[0]
    const fieldPrefix = options?.complexPhrase ? COMPLEX_PHRASE_PREFIX + field : field
    this.parameters.push(`fq=${encodeURIComponent(`${fieldPrefix}:${valueString}`)}`)

    return this
  }

  /**
   * Adds one or more filters to the query.
   * @param filters Single or multiple filter configurations.
   * @returns This instance for method chaining.
   */
  addFilters(filters: Filters | Filters[]): this {
    const filterArray = Array.isArray(filters) ? filters : [filters]
    filterArray.forEach(({ field, value, matchFilterOptions }) =>
      this.addMatchFilter(field, value, matchFilterOptions),
    )
    return this
  }

  /**
   * Specifies fields to include in the response.
   * @param fields Single field or array of fields.
   * @returns This instance for method chaining.
   */
  setResponseFields(fields: string | string[]): this {
    const fieldString = Array.isArray(fields) ? fields.join(',') : fields
    this.parameters.push(`fl=${encodeURIComponent(fieldString)}`)
    return this
  }

  /**
   * Sets a timeout for the query execution.
   * @param milliseconds The timeout duration in milliseconds.
   * @returns This instance for method chaining.
   */
  setTimeout(milliseconds: number): this {
    this.parameters.push(`timeAllowed=${milliseconds}`)
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
   * Configures grouping options for the query.
   * @param config Grouping configuration.
   * @returns This instance for method chaining.
   */
  setGrouping(config: GroupingConfig): this {
    this.parameters.push(`group=${config.on === false ? 'false' : 'true'}`)

    if (config.field) {
      toArray(config.field).forEach((field) =>
        this.parameters.push(`group.field=${encodeURIComponent(field)}`),
      )
    }

    if (config.query) {
      if (!Array.isArray(config.query)) {
        config.query = [config.query]
      }

      toArray(config.query).forEach((query) =>
        this.parameters.push(`group.query=${encodeURIComponent(query)}`),
      )
    }

    if (config.limit !== undefined) {
      this.parameters.push(`group.limit=${config.limit}`)
    }

    if (config.offset !== undefined) {
      this.parameters.push(`group.offset=${config.offset}`)
    }

    if (config.sort) {
      this.parameters.push(`group.sort=${encodeURIComponent(config.sort)}`)
    }

    if (config.format) {
      this.parameters.push(`group.format=${encodeURIComponent(config.format)}`)
    }

    if (config.main !== undefined) {
      this.parameters.push(`group.main=${config.main}`)
    }

    if (config.ngroups !== undefined) {
      this.parameters.push(`group.ngroups=${config.ngroups}`)
    }

    if (config.truncate !== undefined) {
      this.parameters.push(`group.truncate=${config.truncate}`)
    }

    if (config.cache !== undefined) {
      this.parameters.push(`group.cache.percent=${config.cache}`)
    }

    return this
  }

  /**
   * Configures faceting options.
   * @param config Faceting configuration.
   * @returns This instance for method chaining.
   */
  setFacets(config: FacetConfig): this {
    this.parameters.push(`facet=${config.on === false ? 'false' : 'true'}`)

    if (config.query) {
      this.parameters.push(`facet.query=${encodeURIComponent(config.query)}`)
    }

    if (config.field) {
      toArray(config.field).forEach((field) =>
        this.parameters.push(`facet.field=${encodeURIComponent(field)}`),
      )
    }

    if (config.prefix) {
      this.parameters.push(`facet.prefix=${encodeURIComponent(config.prefix)}`)
    }

    if (config.sort) {
      this.parameters.push(`facet.sort=${encodeURIComponent(config.sort)}`)
    }

    if (config.limit !== undefined) {
      this.parameters.push(`facet.limit=${config.limit}`)
    }

    if (config.offset !== undefined) {
      this.parameters.push(`facet.offset=${config.offset}`)
    }

    if (config.mincount !== undefined) {
      this.parameters.push(`facet.mincount=${config.mincount}`)
    }

    if (config.missing !== undefined) {
      this.parameters.push(`facet.missing=${config.missing}`)
    }

    if (config.method) {
      this.parameters.push(`facet.method=${encodeURIComponent(config.method)}`)
    }

    if (config.pivot) {
      toArray(config.pivot.fields).forEach((field) =>
        this.parameters.push(`facet.pivot=${encodeURIComponent(field)}`),
      )

      if (config.pivot.mincount !== undefined) {
        this.parameters.push(`facet.pivot.mincount=${config.pivot.mincount}`)
      }
    }

    return this
  }

  /**
   * Configures MoreLikeThis functionality.
   * @param config MoreLikeThis configuration.
   * @returns This instance for method chaining.
   */
  setMoreLikeThis(config: MoreLikeThisConfig): this {
    this.parameters.push(`mlt=${config.on === false ? 'false' : 'true'}`)

    if (config.fl) {
      const fields = Array.isArray(config.fl) ? config.fl.join(',') : config.fl
      this.parameters.push(`mlt.fl=${encodeURIComponent(fields)}`)
    }

    if (config.count !== undefined) {
      this.parameters.push(`mlt.count=${config.count}`)
    }

    if (config.mintf !== undefined) {
      this.parameters.push(`mlt.mintf=${config.mintf}`)
    }

    if (config.mindf !== undefined) {
      this.parameters.push(`mlt.mindf=${config.mindf}`)
    }

    if (config.minwl !== undefined) {
      this.parameters.push(`mlt.minwl=${config.minwl}`)
    }

    if (config.maxwl !== undefined) {
      this.parameters.push(`mlt.maxwl=${config.maxwl}`)
    }

    if (config.maxqt !== undefined) {
      this.parameters.push(`mlt.maxqt=${config.maxqt}`)
    }

    if (config.maxntp !== undefined) {
      this.parameters.push(`mlt.maxntp=${config.maxntp}`)
    }

    if (config.boost !== undefined) {
      this.parameters.push(`mlt.boost=${config.boost}`)
    }

    if (config.qf) {
      const qfString =
        typeof config.qf === 'string'
          ? config.qf
          : new URLSearchParams(config.qf).toString().replace(/=/g, '^').replace(/&/g, ' ')
      this.parameters.push(`mlt.qf=${encodeURIComponent(qfString)}`)
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
    this.parameters.push('debugQuery=true')
    return this
  }

  /**
   * Sets boosted query fields.
   * @param fields Field boosts as an object.
   * @returns This instance for method chaining.
   */
  setQueryFields(fields: Record<string, any>): this {
    const fieldString = new URLSearchParams(fields).toString().replace(/=/g, '^').replace(/&/g, ' ')
    this.parameters.push(`qf=${encodeURIComponent(fieldString)}`)
    return this
  }

  /**
   * Sets the minimum match requirement.
   * @param minimumMatch Minimum number or percentage of terms to match.
   * @returns This instance for method chaining.
   */
  setMinimumMatch(minimumMatch: string | number): this {
    this.parameters.push(`mm=${encodeURIComponent(minimumMatch)}`)
    return this
  }

  /**
   * Sets phrase fields with boosts.
   * @param fields Phrase fields and their boosts.
   * @returns This instance for method chaining.
   */
  setPhraseFields(fields: Record<string, any>): this {
    const phraseString = new URLSearchParams(fields)
      .toString()
      .replace(/=/g, '^')
      .replace(/&/g, ' ')
    this.parameters.push(`pf=${encodeURIComponent(phraseString)}`)
    return this
  }

  /**
   * Configures phrase slop.
   * @param slop The phrase slop value.
   * @returns This instance for method chaining.
   */
  setPhraseSlop(slop: number): this {
    this.parameters.push(`ps=${slop}`)
    return this
  }

  /**
   * Configures query slop.
   * @param slop The query slop value.
   * @returns This instance for method chaining.
   */
  setQuerySlop(slop: number): this {
    this.parameters.push(`qs=${slop}`)
    return this
  }

  /**
   * Sets the tiebreaker value for DisMax queries.
   * @param tiebreaker The tiebreaker value (0.0 to 1.0).
   * @returns This instance for method chaining.
   */
  setTiebreaker(tiebreaker: number): this {
    this.parameters.push(`tie=${tiebreaker}`)
    return this
  }

  /**
   * Adds a boost query.
   * @param boostQuery Boost query configuration.
   * @returns This instance for method chaining.
   */
  setBoostQuery(boostQuery: Record<string, any>): this {
    const boostString = new URLSearchParams(boostQuery)
      .toString()
      .replace(/=/g, '^')
      .replace(/&/g, ' ')
    this.parameters.push(`bq=${encodeURIComponent(boostString)}`)
    return this
  }

  /**
   * Adds boost functions.
   * @param functions Boost function string.
   * @returns This instance for method chaining.
   */
  setBoostFunctions(functions: string): this {
    this.parameters.push(`bf=${encodeURIComponent(functions)}`)
    return this
  }

  /**
   * Applies a boost to the query.
   * @param boost Boost function string.
   * @returns This instance for method chaining.
   */
  setBoost(boost: string): this {
    this.parameters.push(`boost=${encodeURIComponent(boost)}`)
    return this
  }

  /**
   * Configures highlighting options.
   * @param config Highlighting configuration.
   * @returns This instance for method chaining.
   */
  setHighlighting(config: HighlightConfig): this {
    this.parameters.push(`hl=${config.on === false ? 'false' : 'true'}`)

    if (config.q) {
      const qString =
        typeof config.q === 'string'
          ? config.q
          : new URLSearchParams(config.q).toString().replace(/=/g, ':').replace(/&/g, ' AND ')
      this.parameters.push(`hl.q=${encodeURIComponent(qString)}`)
    }

    if (config.qparser) {
      this.parameters.push(`hl.qparser=${encodeURIComponent(config.qparser)}`)
    }

    if (config.fl) {
      const fields =
        typeof config.fl === 'string' ? encodeURIComponent(config.fl) : config.fl.join(',')
      this.parameters.push(`hl.fl=${encodeURIComponent(fields)}`)
    }

    if (config.snippets) {
      this.parameters.push(`hl.snippets=${config.snippets}`)
    }

    if (config.fragsize) {
      this.parameters.push(`hl.fragsize=${config.fragsize}`)
    }

    if (config.mergeContiguous !== undefined) {
      this.parameters.push(`hl.mergeContiguous=${config.mergeContiguous}`)
    }

    if (config.requireFieldMatch !== undefined) {
      this.parameters.push(`hl.requireFieldMatch=${config.requireFieldMatch}`)
    }

    if (config.maxAnalyzedChars) {
      this.parameters.push(`hl.maxAnalyzedChars=${config.maxAnalyzedChars}`)
    }

    if (config.maxMultiValuedToExamine) {
      this.parameters.push(`hl.maxMultiValuedToExamine=${config.maxMultiValuedToExamine}`)
    }

    if (config.maxMultiValuedToMatch) {
      this.parameters.push(`hl.maxMultiValuedToMatch=${config.maxMultiValuedToMatch}`)
    }

    if (config.alternateField) {
      this.parameters.push(`hl.alternateField=${encodeURIComponent(config.alternateField)}`)
    }

    if (config.maxAlternateFieldLength !== undefined) {
      this.parameters.push(`hl.maxAlternateFieldLength=${config.maxAlternateFieldLength}`)
    }

    if (config.formatter) {
      this.parameters.push(`hl.formatter=${encodeURIComponent(config.formatter)}`)
    }

    this.parameters.push(`hl.simple.pre=${encodeURIComponent(config.simplePre ?? '<em>')}`)
    this.parameters.push(`hl.simple.post=${encodeURIComponent(config.simplePost ?? '</em>')}`)

    if (config.fragmenter) {
      this.parameters.push(`hl.fragmenter=${encodeURIComponent(config.fragmenter)}`)
    }

    if (config.highlightMultiTerm !== undefined) {
      this.parameters.push(`hl.highlightMultiTerm=${config.highlightMultiTerm}`)
    }

    if (config.usePhraseHighlighter !== undefined) {
      this.parameters.push(`hl.usePhraseHighlighter=${config.usePhraseHighlighter}`)
    }

    if (config.regexSlop) {
      this.parameters.push(`hl.regex.slop=${config.regexSlop}`)
    }

    if (config.regexPattern) {
      this.parameters.push(`hl.regex.pattern=${encodeURIComponent(config.regexPattern)}`)
    }

    if (config.regexMaxAnalyzedChars) {
      this.parameters.push(`hl.regex.maxAnalyzedChars=${config.regexMaxAnalyzedChars}`)
    }

    if (config.preserveMulti !== undefined) {
      this.parameters.push(`hl.preserveMulti=${config.preserveMulti}`)
    }

    if (config.payloads !== undefined) {
      this.parameters.push(`hl.payloads=${config.payloads}`)
    }

    return this
  }

  /**
   * Configures term statistics.
   * @param config Terms configuration.
   * @returns This instance for method chaining.
   */
  setTerms(config: TermsConfig): this {
    this.parameters.push(`terms=${config.on === false ? 'false' : 'true'}`)

    if (config.fl) {
      this.parameters.push(`terms.fl=${encodeURIComponent(config.fl)}`)
    }

    if (config.lower) {
      this.parameters.push(`terms.lower=${encodeURIComponent(config.lower)}`)
    }

    if (config.lowerIncl !== undefined) {
      this.parameters.push(`terms.lower.incl=${config.lowerIncl}`)
    }

    if (config.mincount) {
      this.parameters.push(`terms.mincount=${config.mincount}`)
    }

    if (config.maxcount) {
      this.parameters.push(`terms.maxcount=${config.maxcount}`)
    }

    if (config.prefix) {
      this.parameters.push(`terms.prefix=${encodeURIComponent(config.prefix)}`)
    }

    if (config.regex) {
      this.parameters.push(`terms.regex=${encodeURIComponent(config.regex)}`)
    }

    if (config.regexFlag) {
      this.parameters.push(`terms.regex.flag=${encodeURIComponent(config.regexFlag)}`)
    }

    if (config.limit) {
      this.parameters.push(`terms.limit=${config.limit}`)
    }

    if (config.upper) {
      this.parameters.push(`terms.upper=${encodeURIComponent(config.upper)}`)
    }

    if (config.upperIncl !== undefined) {
      this.parameters.push(`terms.upper.incl=${config.upperIncl}`)
    }

    if (config.raw !== undefined) {
      this.parameters.push(`terms.raw=${config.raw}`)
    }

    if (config.sort) {
      this.parameters.push(`terms.sort=${encodeURIComponent(config.sort)}`)
    }

    return this
  }

  /**
   * Generates the final query string.
   * @returns The complete URL-encoded query string.
   */
  toString(): string {
    return this.parameters.join('&')
  }
}
