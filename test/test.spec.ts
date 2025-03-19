import { Client, createClient, SearchResult } from '../src/solr'
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
      const response = searchResponse.response as SearchResult<Goddess>

      expect(response.numFound).toEqual(1)
      expect(response.docs).toHaveLength(1)
      expect(response.docs[0].name).toBe('Nao Tomori')
    })

    test('getDocumentsById() - Get multiple documents by IDs', async () => {
      const searchResponse = await client.getDocumentsById(['megumin', 'miwa_kasumi'])
      const response = searchResponse.response as SearchResult<Goddess>

      expect(response.numFound).toEqual(2)
      expect(response.docs).toHaveLength(2)
      expect(response.docs[0].name).toBe('Megumin')
      expect(response.docs[1].name).toBe('Miwa Kasumi')
    })

    test('searchAllDocuments() - Get all documents', async () => {
      const searchResponse = await client.searchAllDocuments()
      const response = (searchResponse as { response: SearchResult<Goddess> }).response

      expect(response.numFound).toEqual(5)
      expect(response.docs).toHaveLength(5)
    })

    test('searchDocuments() - Get documents by query', async () => {
      const query = client.createQuery().setQuery('occupation:Student')
      const searchResponse = await client.searchDocuments(query)
      const response = searchResponse.response as SearchResult<Goddess>

      expect(response.numFound).toEqual(3)
      expect(response.docs).toHaveLength(3)
    })

    test('searchDocuments() - Get documents by single filter', async () => {
      const query = client.createQuery().setQuery('*:*').addFilters({ field: 'age', value: 17 })
      const searchResponse = await client.searchDocuments(query)
      const response = searchResponse.response as SearchResult<Goddess>

      expect(response.numFound).toEqual(2)
      expect(response.docs).toHaveLength(2)
    })

    test('searchDocuments() - Get documents by multiple filters', async () => {
      const query = client
        .createQuery()
        .setQuery('*:*')
        .addFilters([
          { field: 'age', value: '[* TO 18]' },
          { field: 'name', value: '("Megumin" OR "Konami Kirie" OR "Miwa Kasumi")' },
          { field: 'rate', value: '[8.6 TO 9.0]' },
        ])
        .setSort({ rate: 'desc' })
        .setLimit(1)

      const searchResponse = await client.searchDocuments(query)
      const response = searchResponse.response as SearchResult<Goddess>

      expect(response.numFound).toEqual(2)
      expect(response.docs).toHaveLength(1)
      expect(response.docs[0].name).toBe('Konami Kirie')
    })
  })

  describe('Update documents', function () {
    test('addDocuments() - Update existing document', async () => {
      const document = GODDESSES[0]
      document.description = 'Top attacker'

      await client.addDocuments(document, { commit: true })

      const searchResponse = await client.getDocumentsById('konami_kirie')
      const response = searchResponse.response as SearchResult<Goddess>

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
      const response = searchResponse.response as SearchResult<Goddess>

      expect(response.numFound).toEqual(1)
      expect(response.docs).toHaveLength(1)
      expect(response.docs[0].description).toBe('Explosion!')
    })
  })

  describe('Delete documents', function () {
    test('deleteById() - Delete document by ID', async () => {
      await client.deleteById('konami_kirie', { commit: true })

      const searchResponse = await client.searchAllDocuments()
      const response = (searchResponse as { response: SearchResult<Goddess> }).response

      expect(response.numFound).toEqual(4)
      expect(response.docs).toHaveLength(4)
    })

    test('deleteByField() - Delete document by field and value', async () => {
      await client.deleteByField('age', '17', { commit: true })

      const searchResponse = await client.searchAllDocuments()
      const response = (searchResponse as { response: SearchResult<Goddess> }).response

      expect(response.numFound).toEqual(3)
      expect(response.docs).toHaveLength(3)
    })

    test('deleteByQuery() - Delete documents by query with commit function', async () => {
      await client.deleteByQuery('rate: (9.1 OR 9.2)')
      await client.commit()

      const searchResponse = await client.searchAllDocuments()
      const response = (searchResponse as { response: SearchResult<Goddess> }).response

      expect(response.numFound).toEqual(1)
      expect(response.docs).toHaveLength(1)
    })

    test('deleteAllDocuments() - Delete all documents', async () => {
      await client.deleteAllDocuments({ commit: true })

      const searchResponse = await client.searchAllDocuments()
      const response = (searchResponse as { response: SearchResult<Goddess> }).response

      expect(response.numFound).toEqual(0)
      expect(response.docs).toHaveLength(0)
    })
  })
})
