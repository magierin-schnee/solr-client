# @magierin-schnee/solr-client

<p align="center">
  <a href="https://www.npmjs.com/package/@magierin-schnee/solr-client"><img src="https://img.shields.io/npm/v/@magierin-schnee/solr-client.svg" alt="NPM Version"></a>
  <a href="https://github.com/magierin-schnee/solr-client/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@magierin-schnee/solr-client.svg" alt="License"></a>
</p>

A powerful and flexible Node.js client for Apache Solr, offering an intuitive API for document management, advanced querying, and collection administration.

---

## ✨ Features

- **Easy Setup**: Connect to Solr with minimal configuration.
- **Full-Featured Document API**: Add, update, and delete documents with simple, chainable methods.
- **Powerful Query Builder**: Construct sophisticated queries with a fluent API.
- **Streaming Support**: Efficiently index large datasets via streams.
- **Collection Management**: Administer SolrCloud collections with ease.
- **Robust Error Handling**: Modern `async/await` and promise-based error handling for reliable operations.

---

## 🚀 Getting Started

### 1. Installation

Install the library using your favorite package manager:

<details>
<summary>npm</summary>

```bash
npm install @magierin-schnee/solr-client
```

</details>

<details>
<summary>Yarn</summary>

```bash
yarn add @magierin-schnee/solr-client
```

</details>

<details>
<summary>pnpm</summary>

```bash
pnpm add @magierin-schnee/solr-client
```

</details>

### 2. Creating a Client

To begin, import `createClient` and instantiate a new client with your Solr instance's configuration.

```typescript
import { createClient } from '@magierin-schnee/solr-client'

// Connect to your Solr instance
const client = createClient({
  host: '127.0.0.1',  // Solr server hostname (defaults to '127.0.0.1')
  port: 8983,         // Solr server port (defaults to 8983)
  core: 'my_core',    // Solr core or collection name
  path: '/solr',      // Path to the Solr API (defaults to '/solr')
  secure: false,      // Use HTTPS (defaults to false)
  bigint: false,      // Use json-bigint for parsing (defaults to false)
})
```

### 3. Authentication

If your Solr instance requires authentication, you can set the credentials on the client.

```typescript
// Set basic authentication credentials
client.setBasicAuth('your_username', 'your_password')

// To remove authentication
client.clearAuth()
```

## Core Functionality

### Adding Documents

Add a single document or an array of documents to your Solr index using addDocuments:

```js
// Add a single document
const document = { id: '1', name: 'Example Document' }
await client.addDocuments(document, { commit: true })

// Add multiple documents
const documents = [
  { id: '2', name: 'Another Document' },
  { id: '3', name: 'Yet Another Document' },
]
await client.addDocuments(documents, { commit: true })
```

The commit: true option ensures changes are immediately visible. You can also use atomicUpdateDocuments as an alias for atomic updates.

### Retrieving Documents

#### By ID

Fetch documents by their IDs with getDocumentsById:

```js
// Single document
const response = await client.getDocumentsById('1')
console.log(response.response.docs)

// Multiple documents
const multiResponse = await client.getDocumentsById(['1', '2', '3'])
console.log(multiResponse.response.docs)
```

#### By Query

Search for documents using searchDocuments with a query:

```js
const query = client.createQuery().setQuery('name:Example')
const response = await client.searchDocuments(query)
console.log(response.response.docs)
```

#### All Documents

Retrieve all documents in the index with searchAllDocuments:

```js
const response = await client.searchAllDocuments()
console.log(response.response.docs)
```

### Updating Documents

Update an existing document by re-adding it with the same ID:

```js
const updatedDoc = { id: '1', name: 'Updated Document' }
await client.addDocuments(updatedDoc, { commit: true })
```

### Deleting Documents

#### By ID

Remove a document by its ID:

```js
await client.deleteById('1', { commit: true })
```

#### By Field

Delete documents matching a field-value pair:

```js
await client.deleteByField('name', 'Example Document', { commit: true })
```

#### By Query

Delete documents matching a query:

```js
await client.deleteByQuery('name:Example', { commit: true })
```

#### All Documents

Clear the entire index:

```js
await client.deleteAllDocuments({ commit: true })
```

### Committing Changes

Manually commit changes to make them visible:

```js
await client.commit()
```

For a soft commit (faster, no disk flush):

```js
await client.softCommit()
```

Prepare a commit without immediate visibility:

```js
await client.prepareCommit()
```

## Querying

Build complex queries using the Query class and its fluent API:

```js
const query = client
  .createQuery()
  .setQuery('*:*') // Main query
  .addFilter('age:25') // Exact match filter
  .setOffset(0) // Starting index
  .setLimit(10) // Max results
  .setSort({ score: 'desc' }) // Sort by score descending

const response = await client.searchDocuments(query)
console.log(response.response.docs)
```

### Key Query Methods

| Method                    | Description                               | Example                                                                |
| ------------------------- | ----------------------------------------- | ---------------------------------------------------------------------- |
| setQuery(query)           | Sets the main query string or object.     | .setQuery('name:Example')                                              |
| addFilter(filter)         | Adds a filter query (`fq`).               | .addFilter('category:books')                                           |
| addFilters(filters)       | Adds multiple filter queries.             | .addFilters(['inStock:true', 'price:[* TO 100]'])                      |
| setOffset(offset)         | Sets the starting offset for pagination.  | .setOffset(10)                                                         |
| setLimit(limit)           | Limits the number of results.             | .setLimit(20)                                                          |
| setSort(fields)           | Defines sort order.                       | .setSort({ score: 'desc' })                                            |
| setResponseFields(fields) | Specifies fields to return.               | .setResponseFields(['id', 'name'])                                     |
| setFacets(config)         | Configures faceting using JSON Facet API. | .setFacets({ categories: { type: 'terms', field: 'cat', limit: 10 } }) |
| setHighlighting(config)   | Configures highlighting.                  | .setHighlighting({ on: true, fl: 'content' })                          |

For more advanced options (e.g., grouping, spellchecking), refer to the source code.

## Advanced Facets

The client supports Solr's powerful JSON Facet API, allowing you to build complex faceting logic. Use the `setFacets` method to define your facet structure.

### Terms Facet

A terms facet computes counts for each unique term in a field. This is useful for creating category or tag clouds.

**Example:** Get the document count for each category.

```js
const query = client
  .createQuery()
  .setQuery('*:*')
  .setLimit(0) // We only want the results of the facets
  .setFacets({
    category: {
      type: 'terms',
      field: 'category',
      limit: 10,
      mincount: 1,
    },
  })

const response = await client.searchDocuments(query)
console.log(response.facets)
```

**Expected Response:**

```json
{
  "count": 150,
  "category": {
    "buckets": [
      { "val": "electronics", "count": 75 },
      { "val": "books", "count": 50 },
      { "val": "clothes", "count": 25 }
    ]
  }
}
```

### Range Facet

A range facet groups documents into buckets based on a numeric or date field.

**Example:** Group documents by price ranges.

```js
const query = client
  .createQuery()
  .setQuery('*:*')
  .setLimit(0)
  .setFacets({
    price: {
      type: 'range',
      field: 'price',
      start: 0,
      end: 1000,
      gap: 100,
    },
  })

const response = await client.searchDocuments(query)
console.log(response.facets)
```

**Expected Response:**

```json
{
  "count": 150,
  "price": {
    "buckets": [
      { "val": 0, "count": 20 },
      { "val": 100, "count": 35 },
      { "val": 200, "count": 15 }
    ]
  }
}
```

### Query Facet

A query facet returns a count for any arbitrary query. You can have multiple query facets.

**Example:** Count documents that are in stock.

```js
const query = client
  .createQuery()
  .setQuery('*:*')
  .setLimit(0)
  .setFacets({
    inStock: {
      type: 'query',
      q: 'inStock:true',
    },
  })

const response = await client.searchDocuments(query)
console.log(response.facets)
```

**Expected Response:**

```json
{
  "count": 150,
  "inStock": {
    "count": 120
  }
}
```

### Nested facets

You can nest facets to create more complex aggregations. For example, you can calculate statistics for sub-facets.

**Example:** Create facets by publication date ranges using query facets.

```js
const query = client
  .createQuery()
  .setQuery('*:*')
  .setLimit(0)
  .setFacets({
    publicationDate: {
      type: 'query',
      q: '*:*',
      facet: {
        today: {
          type: 'query',
          q: 'publicationDate:[NOW/DAY TO NOW]',
        },
        last7Days: {
          type: 'query',
          q: 'publicationDate:[NOW-7DAY/DAY TO NOW]',
        },
        last30Days: {
          type: 'query',
          q: 'publicationDate:[NOW-30DAY/DAY TO NOW]',
        },
      },
    },
  })

const response = await client.searchDocuments(query)
console.log(response.facets)
```

**Expected Response:**

```json
{
  "count": 150,
  "publicationDate": {
    "count": 150,
    "today": { "count": 5 },
    "last7Days": { "count": 25 },
    "last30Days": { "count": 80 }
  }
}
```

## Streaming Documents

Add documents efficiently using a stream:

```js
const { stream, response } = client.createDocumentStream({ commit: true })

stream.write({ id: '1', name: 'Streamed Document' })
stream.end()

const result = await response
console.log(result)
```

## Managing Collections

Create and manage Solr collections:

```js
const collection = client.createCollection()
const response = await client.manageCollection(collection)
console.log(response)
```

## Additional Utilities

### Optimizing the Index

Optimize your Solr index for better performance:

```js
await client.optimizeIndex({ waitSearcher: true })
```

### Rolling Back Changes

Discard uncommitted changes:

```js
await client.rollbackChanges()
```

### Pinging the Server

Check the Solr server status:

```js
const pingResponse = await client.pingServer()
console.log(pingResponse)
```

### Escaping Special Characters

Escape Lucene special characters in queries:

```js
const { escapeLuceneChars } = require('@magierin-schnee/solr-client')
const safeQuery = escapeLuceneChars('query with +special chars')
console.log(safeQuery) // "query with \+special chars"
```

## Error Handling

All methods return promises that resolve with response data or reject with errors. Use try-catch blocks for robust error handling:

```js
import { SolrError } from '@magierin-schnee/solr-client'

try {
  await client.addDocuments(document)
} catch (error) {
  if (error instanceof SolrError) {
    console.error('Http Status Code:', error.httpStatusCode)
    console.error('Message:', error.message)
    console.error('Metadata:', error.metadata)
  }
}
```

## Contributing

We welcome contributions! If you find a bug or have a feature request, please:

1. Open an issue on the GitHub repository (https://github.com/magierin-schnee/solr-client/issues).
2. Submit a pull request with your changes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
