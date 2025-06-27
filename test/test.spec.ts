import { Client, createClient } from '../src/solr'
import { SolrSearchResponse } from '../src/types'
import { Goddess, GODDESSES } from './mock'

const SOLR_PORTS = [8983, 8984, 8985, 8986, 8987]
const CORE_NAME = 'goddess'

let clients: Client[] = []

beforeAll(async () => {
  clients = await Promise.all(
    SOLR_PORTS.map((port) =>
      createClient({
        host: '127.0.0.1',
        port: port,
        path: '/solr',
        core: CORE_NAME,
      }),
    ),
  )
})

describe.each(SOLR_PORTS)('Client Methods - Solr on port %d', (port) => {
  let client: Client

  beforeEach(() => {
    client = clients[SOLR_PORTS.indexOf(port)]
  })

  describe('Add documents', function () {
    test('addDocuments() - Add single document', async () => {
      const document = GODDESSES[0]

      const response = await client.addDocuments(document, { commit: true })
      expect(response.responseHeader.status).toBe(0)
    })

    test('addDocuments() - Add multiple documents', async () => {
      const documents = [GODDESSES[1], GODDESSES[2], GODDESSES[3], GODDESSES[4]]

      const response = await client.addDocuments(documents, { commit: true })
      expect(response.responseHeader.status).toBe(0)
    })
  })

  describe('Get documents', function () {
    test('getDocumentsById() - Get single document by ID', async () => {
      const searchResponse = await client.getDocumentsById('nao_tomori')
      const response = searchResponse.response as SolrSearchResponse<Goddess>

      expect(response.numFound).toEqual(1)
      expect(response.docs).toHaveLength(1)
      expect(response.docs[0].name).toBe('Nao Tomori')
    })

    test('getDocumentsById() - Get multiple documents by IDs', async () => {
      const searchResponse = await client.getDocumentsById(['megumin', 'miwa_kasumi'])
      const response = searchResponse.response as SolrSearchResponse<Goddess>

      expect(response.numFound).toEqual(2)
      expect(response.docs).toHaveLength(2)
      expect(response.docs[0].name).toBe('Megumin')
      expect(response.docs[1].name).toBe('Miwa Kasumi')
    })

    test('searchAllDocuments() - Get all documents', async () => {
      const response = await client.searchAllDocuments()

      expect(response.response.numFound).toEqual(5)
      expect(response.response.docs).toHaveLength(5)
    })

    test('searchDocuments() - Get documents by query', async () => {
      const query = client.createQuery().setQuery('occupation:Student')
      const searchResponse = await client.searchDocuments(query)
      const response = searchResponse.response as SolrSearchResponse<Goddess>

      expect(response.numFound).toEqual(3)
      expect(response.docs).toHaveLength(3)
    })

    test('searchDocuments() - Get documents by single filter', async () => {
      const query = client.createQuery().setQuery('*:*').addFilter('age:17')
      const searchResponse = await client.searchDocuments(query)
      const response = searchResponse.response as SolrSearchResponse<Goddess>

      expect(response.numFound).toEqual(2)
      expect(response.docs).toHaveLength(2)
    })

    test('searchDocuments() - Get documents by multiple filters', async () => {
      const query = client
        .createQuery()
        .setQuery('*:*')
        .addFilters([
          'age:[* TO 18]',
          'name:("Megumin" OR "Konami Kirie" OR "Miwa Kasumi")',
          'rate:[8.6 TO 9.0]',
        ])
        .setSort({ rate: 'desc' })
        .setLimit(1)

      const searchResponse = await client.searchDocuments(query)
      const response = searchResponse.response as SolrSearchResponse<Goddess>

      expect(response.numFound).toEqual(2)
      expect(response.docs).toHaveLength(1)
      expect(response.docs[0].name).toBe('Konami Kirie')
    })
  })

  describe('Facet documents', function () {
    test('setFacets() - Terms Facet on a text field', async () => {
      const query = client
        .createQuery()
        .setQuery('*:*')
        .setLimit(0)
        .setFacets({
          occupation: {
            type: 'terms',
            field: 'occupation',
            limit: 10,
          },
        })

      const response = await client.searchDocuments(query)

      expect(response.facets?.occupation).toBeDefined()
      const occupationFacet = response.facets?.occupation

      if (occupationFacet && typeof occupationFacet === 'object' && 'buckets' in occupationFacet) {
        const studentBucket = occupationFacet.buckets.find((b) => b.val === 'student')
        expect(studentBucket).toBeDefined()
        expect(studentBucket?.count).toBe(3)
      } else {
        fail('The facet result for "occupation" did not contain "buckets"')
      }
    })

    test('setFacets() - Range Facet on a numeric field', async () => {
      const query = client
        .createQuery()
        .setQuery('*:*')
        .setLimit(0)
        .setFacets({
          age_ranges: {
            type: 'range',
            field: 'age',
            start: 10,
            end: 30,
            gap: 10,
          },
        })

      const response = await client.searchDocuments(query)

      expect(response.facets?.age_ranges).toBeDefined()
      const ageFacet = response.facets?.age_ranges

      if (ageFacet && typeof ageFacet === 'object' && 'buckets' in ageFacet) {
        const teenBucket = ageFacet.buckets.find((b) => b.val === 10)
        expect(teenBucket).toBeDefined()
        expect(teenBucket?.count).toBe(4)

        const adultBucket = ageFacet.buckets.find((b) => b.val === 20)
        expect(adultBucket).toBeDefined()
        expect(adultBucket?.count).toBe(1)
      } else {
        fail('The facet result for "age_ranges" did not contain "buckets"')
      }
    })

    test('setFacets() - Simple Query Facet', async () => {
      const query = client
        .createQuery()
        .setQuery('*:*')
        .setLimit(0)
        .setFacets({
          sorcerers: {
            type: 'query',
            q: 'occupation:Sorcerer',
          },
        })

      const response = await client.searchDocuments(query)

      expect(response.facets?.sorcerers).toBeDefined()
      const sorcerersFacet = response.facets?.sorcerers

      if (sorcerersFacet && typeof sorcerersFacet === 'object' && 'count' in sorcerersFacet) {
        expect(sorcerersFacet.count).toBe(1)
      } else {
        fail('The facet result for "sorcerers" did not contain "count"')
      }
    })

    test('setFacets() - Nested Facet with multiple queries', async () => {
      const query = client
        .createQuery()
        .setQuery('*:*')
        .setLimit(0)
        .setFacets({
          ratings: {
            type: 'query',
            q: '*:*',
            facet: {
              high_rate: {
                type: 'query',
                q: 'rate:[9.0 TO *]',
              },
              good_rate: {
                type: 'query',
                q: '+rate:[8.0 TO *] -rate:[9.0 TO *]',
              },
            },
          },
        })

      const response = await client.searchDocuments(query)

      expect(response.facets?.ratings).toBeDefined()
      const ratingsFacet = response.facets?.ratings

      if (
        ratingsFacet &&
        typeof ratingsFacet === 'object' &&
        'count' in ratingsFacet &&
        'high_rate' in ratingsFacet &&
        'good_rate' in ratingsFacet
      ) {
        expect(ratingsFacet.count).toBe(5)

        const highRate = ratingsFacet.high_rate as { count: number }
        const goodRate = ratingsFacet.good_rate as { count: number }

        expect(highRate.count).toBe(3)
        expect(goodRate.count).toBe(2)
      } else {
        fail('The nested facet "ratings" did not have the expected structure.')
      }
    })
  })

  describe('Update documents', function () {
    test('addDocuments() - Update existing document', async () => {
      const document = GODDESSES[0]
      document.description = 'Top attacker'

      await client.addDocuments(document, { commit: true })

      const searchResponse = await client.getDocumentsById('konami_kirie')
      const response = searchResponse.response as SolrSearchResponse<Goddess>

      expect(response.numFound).toEqual(1)
      expect(response.docs).toHaveLength(1)
      expect(response.docs[0].description).toBe('Top attacker')
    })

    test('addDocuments() - Update existing document with commit function', async () => {
      const document = GODDESSES[1]
      document.description = 'Explosion!'

      await client.addDocuments(document)
      await client.commit()

      const searchResponse = await client.getDocumentsById('megumin')
      const response = searchResponse.response as SolrSearchResponse<Goddess>

      expect(response.numFound).toEqual(1)
      expect(response.docs).toHaveLength(1)
      expect(response.docs[0].description).toBe('Explosion!')
    })
  })

  describe('Delete documents', function () {
    test('deleteById() - Delete document by ID', async () => {
      await client.deleteById('konami_kirie', { commit: true })

      const response = await client.searchAllDocuments()

      expect(response.response.numFound).toEqual(4)
      expect(response.response.docs).toHaveLength(4)
    })

    test('deleteByField() - Delete document by field and value', async () => {
      await client.deleteByField('age', '17', { commit: true })

      const response = await client.searchAllDocuments()

      expect(response.response.numFound).toEqual(3)
      expect(response.response.docs).toHaveLength(3)
    })

    test('deleteByQuery() - Delete documents by query with commit function', async () => {
      await client.deleteByQuery('rate: (9.1 OR 9.2)')
      await client.commit()

      const response = await client.searchAllDocuments()

      expect(response.response.numFound).toEqual(1)
      expect(response.response.docs).toHaveLength(1)
    })

    test('deleteAllDocuments() - Delete all documents', async () => {
      await client.deleteAllDocuments({ commit: true })

      const response = await client.searchAllDocuments()

      expect(response.response.numFound).toEqual(0)
      expect(response.response.docs).toHaveLength(0)
    })
  })
})
