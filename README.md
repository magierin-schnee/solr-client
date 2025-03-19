# Solr Client

Solr Client is a powerful and flexible Node.js library designed to interact seamlessly with Apache Solr. It offers a simple, intuitive API for performing essential Solr operations such as adding, updating, deleting, and searching documents, as well as managing collections and executing advanced queries. Whether you're indexing data, retrieving documents, or building complex search functionality, this library has you covered.

## Features

- Easy Setup: Quickly connect to your Solr instance with minimal configuration.
- Document Management: Add, update, and delete documents with straightforward methods.
- Powerful Querying: Build sophisticated queries using a fluent API.
- Streaming Support: Efficiently add documents via streams.
- Collection Management: Administer Solr collections with ease.
- Error Handling: Robust promise-based error handling for reliable operations.

## Installation

Install the Solr Client library via npm:

```
npm install @magierin-schnee/solr-client
```

Or, if you prefer Yarn:

```
yarn add @magierin-schnee/solr-client
```

## Getting Started

### Creating a Client

To begin, create a new Solr client instance by importing the createClient function and providing configuration options:

```js
const { createClient } = require('@magierin-schnee/solr-client')

const client = createClient({
  host: '127.0.0.1', // Solr server hostname
  port: '8983', // Solr server port
  core: 'my_core', // Solr core name
  path: '/solr', // Path to Solr instance
  secure: false, // Use HTTPS (true/false)
  bigint: false, // Handle big integers (true/false)
})
```

### Authentication

Set basic authentication credentials if your Solr instance requires it:

```js
client.setBasicAuth('username', 'password')
```

Clear authentication credentials when no longer needed:

```js
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
console.log(response.response.docs) // [{ id: '1', name: 'Example Document' }]

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
  .addMatchFilter('age', 25) // Exact match filter
  .setOffset(0) // Starting index
  .setLimit(10) // Max results
  .setSort({ score: 'desc' }) // Sort by score descending

const response = await client.searchDocuments(query)
console.log(response.response.docs)
```

### Key Query Methods

| Method                       | Description                              | Example                                       |
| ---------------------------- | ---------------------------------------- | --------------------------------------------- |
| setQuery(query)              | Sets the main query string or object.    | .setQuery('name:Example')                     |
| addMatchFilter(field, value) | Adds an exact match filter.              | .addMatchFilter('age', 25)                    |
| addFilters(filters)          | Adds one or more filters.                | .addFilters({ field: 'cat', value: 'book' })  |
| setOffset(offset)            | Sets the starting offset for pagination. | .setOffset(10)                                |
| setLimit(limit)              | Limits the number of results.            | .setLimit(20)                                 |
| setSort(fields)              | Defines sort order.                      | .setSort({ score: 'desc' })                   |
| setResponseFields(fields)    | Specifies fields to return.              | .setResponseFields(['id', 'name'])            |
| setFacets(config)            | Configures faceting.                     | .setFacets({ on: true, field: 'cat' })        |
| setHighlighting(config)      | Configures highlighting.                 | .setHighlighting({ on: true, fl: 'content' }) |

For more advanced options (e.g., grouping, spellchecking), refer to the source code.

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
try {
  const response = await client.addDocuments(document)
  console.log('Success:', response)
} catch (error) {
  console.error('Error:', error.message)
}
```

## Contributing

We welcome contributions! If you find a bug or have a feature request, please:

1. Open an issue on the GitHub repository (https://github.com/magierin-schnee/solr-client/issues).
2. Submit a pull request with your changes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.
