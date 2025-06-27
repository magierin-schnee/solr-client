import {
  AliasConfig,
  ClusterPropertyConfig,
  ClusterRole,
  CollectionCreateConfig,
  LeaderRebalanceConfig,
  MigrationConfig,
  ReplicaAddConfig,
  ReplicaDeleteConfig,
  ReplicaPropertyConfig,
  ReplicaPropertyDeleteConfig,
  ShardBalanceConfig,
  ShardConfig,
  ShardSplitConfig,
} from './types'

/**
 * Represents a Solr collection and provides methods to manage its configuration and operations.
 */
export class Collection {
  private parameters: string[] = []

  private addParameter(key: string, value: any, encode = true): void {
    if (value !== undefined && value !== null) {
      const encodedValue = encode ? encodeURIComponent(String(value)) : String(value)
      this.parameters.push(`${key}=${encodedValue}`)
    }
  }

  /**
   * Adds a raw, pre-encoded parameter to the collection configuration.
   * @param param The parameter to add (must be correctly encoded).
   * @returns This instance for method chaining.
   */
  addRawParameter(param: string): this {
    this.parameters.push(param)
    return this
  }

  /**
   * Creates a new Solr collection.
   * @param config Configuration options for creating the collection.
   * @returns This instance for method chaining.
   */
  create(config: CollectionCreateConfig): this {
    this.addParameter('action', 'CREATE', false)
    this.addParameter('name', config.name)
    this.addParameter('router.name', config.routerName)
    this.addParameter('numShards', config.numShards)
    this.addParameter(
      'shards',
      Array.isArray(config.shards) ? config.shards.join(',') : config.shards,
    )
    this.addParameter('replicationFactor', config.replicationFactor)
    this.addParameter('maxShardsPerNode', config.maxShardsPerNode)
    this.addParameter(
      'createNodeSet',
      Array.isArray(config.createNodeSet) ? config.createNodeSet.join(',') : config.createNodeSet,
    )
    this.addParameter('createNodeSet.shuffle', config.createNodeSetShuffle)
    this.addParameter('collection.configName', config.collectionConfigName)
    this.addParameter('router.field', config.routerField)
    this.addParameter('autoAddReplicas', config.autoAddReplicas)
    this.addParameter('async', config.async)
    return this
  }

  /**
   * Reloads an existing Solr collection.
   * @param name The name of the collection to reload.
   * @returns This instance for method chaining.
   */
  reload(name: string): this {
    this.addParameter('action', 'RELOAD', false)
    this.addParameter('name', name)
    return this
  }

  /**
   * Splits a shard in the collection.
   * @param config Configuration for splitting the shard.
   * @returns This instance for method chaining.
   */
  splitShard(config: ShardSplitConfig): this {
    this.addParameter('action', 'SPLITSHARD', false)
    this.addParameter('collection', config.collection)
    this.addParameter('shard', config.shard)
    this.addParameter(
      'ranges',
      Array.isArray(config.ranges) ? config.ranges.join(',') : config.ranges,
    )
    this.addParameter('split.key', config.splitKey)
    this.addParameter('async', config.async)
    return this
  }

  /**
   * Creates a new shard in the collection (for 'implicit' router only).
   * @param config Configuration for creating the shard.
   * @returns This instance for method chaining.
   */
  createShard(config: ShardConfig): this {
    this.addParameter('action', 'CREATESHARD', false)
    this.addParameter('collection', config.collection)
    this.addParameter('shard', config.shard)
    return this
  }

  /**
   * Deletes a shard from the collection.
   * @param config Configuration for deleting the shard.
   * @returns This instance for method chaining.
   */
  deleteShard(config: ShardConfig): this {
    this.addParameter('action', 'DELETESHARD', false)
    this.addParameter('collection', config.collection)
    this.addParameter('shard', config.shard)
    return this
  }

  /**
   * Creates or modifies an alias for the collection.
   * @param config Configuration for the alias.
   * @returns This instance for method chaining.
   */
  createAlias(config: AliasConfig): this {
    this.addParameter('action', 'CREATEALIAS', false)
    this.addParameter('name', config.name)
    this.addParameter(
      'collections',
      Array.isArray(config.collections) ? config.collections.join(',') : config.collections,
    )
    return this
  }

  /**
   * Deletes an alias for the collection.
   * @param name The name of the alias to delete.
   * @returns This instance for method chaining.
   */
  deleteAlias(name: string): this {
    this.addParameter('action', 'DELETEALIAS', false)
    this.addParameter('name', name)
    return this
  }

  /**
   * Deletes the entire collection.
   * @param name The name of the collection to delete.
   * @returns This instance for method chaining.
   */
  delete(name: string): this {
    this.addParameter('action', 'DELETE', false)
    this.addParameter('name', name)
    return this
  }

  /**
   * Deletes a replica from the collection.
   * @param config Configuration for deleting the replica.
   * @returns This instance for method chaining.
   */
  deleteReplica(config: ReplicaDeleteConfig): this {
    this.addParameter('action', 'DELETEREPLICA', false)
    this.addParameter('collection', config.collection)
    this.addParameter('shard', config.shard)
    this.addParameter('replica', config.replica)
    this.addParameter('onlyIfDown', config.onlyIfDown)
    return this
  }

  /**
   * Adds a replica to the collection.
   * Note: For the ADDREPLICA action, 'collection' and 'shard' are typically mandatory in Solr.
   * Ensure these are provided in the config object.
   *
   * @param config Configuration for adding the replica.
   * @returns This instance for method chaining.
   */
  addReplica(config: ReplicaAddConfig): this {
    this.addParameter('action', 'ADDREPLICA', false)
    this.addParameter('collection', config.collection)
    this.addParameter('shard', config.shard)
    this.addParameter('_route_', config.route)
    this.addParameter('node', config.node)
    this.addParameter('async', config.async)
    return this
  }

  /**
   * Sets or unsets a cluster property.
   * @param config Configuration for the cluster property.
   * @returns This instance for method chaining.
   */
  setClusterProperty(config: ClusterPropertyConfig): this {
    this.addParameter('action', 'CLUSTERPROP', false)
    this.addParameter('name', config.name)
    this.addParameter('val', config.val)
    return this
  }

  /**
   * Migrates documents to another collection.
   * @param config Configuration for document migration.
   * @returns This instance for method chaining.
   */
  migrateDocuments(config: MigrationConfig): this {
    this.addParameter('action', 'MIGRATE', false)
    this.addParameter('collection', config.collection)
    this.addParameter('target.collection', config.targetCollection)
    this.addParameter('split.key', config.splitKey)
    this.addParameter('forward.timeout', config.forwardTimeout)
    this.addParameter('async', config.async)
    return this
  }

  /**
   * Assigns a role to a node.
   * @param config Configuration for adding the role.
   * @returns This instance for method chaining.
   */
  addRole(config: ClusterRole): this {
    this.addParameter('action', 'ADDROLE', false)
    this.addParameter('role', config.role)
    this.addParameter('node', config.node)
    return this
  }

  /**
   * Removes a role from a node.
   * @param config Configuration for removing the role.
   * @returns This instance for method chaining.
   */
  removeRole(config: ClusterRole): this {
    this.addParameter('action', 'REMOVEROLE', false)
    this.addParameter('role', config.role)
    this.addParameter('node', config.node)
    return this
  }

  /**
   * Retrieves the Overseer status and statistics.
   * @returns This instance for method chaining.
   */
  getOverseerStatus(): this {
    this.addParameter('action', 'OVERSEERSTATUS', false)
    return this
  }

  /**
   * Retrieves the cluster status.
   * @returns This instance for method chaining.
   */
  getClusterStatus(): this {
    this.addParameter('action', 'CLUSTERSTATUS', false)
    return this
  }

  /**
   * Requests the status of an asynchronous operation.
   * @param requestId The ID of the request to check.
   * @returns This instance for method chaining.
   */
  requestStatus(requestId: string): this {
    this.addParameter('action', 'REQUESTSTATUS', false)
    this.addParameter('requestid', requestId)
    return this
  }

  /**
   * Lists all collections in the cluster.
   * @returns This instance for method chaining.
   */
  listCollections(): this {
    this.addParameter('action', 'LIST', false)
    return this
  }

  /**
   * Adds a property to a replica.
   * @param config Configuration for adding the replica property.
   * @returns This instance for method chaining.
   */
  addReplicaProperty(config: ReplicaPropertyConfig): this {
    this.addParameter('action', 'ADDREPLICAPROP', false)
    this.addParameter('collection', config.collection)
    this.addParameter('shard', config.shard)
    this.addParameter('replica', config.replica)
    this.addParameter('property', config.property)
    this.addParameter('property.value', config.propertyValue)
    this.addParameter('shardUnique', config.shardUnique)
    return this
  }

  /**
   * Deletes a property from a replica.
   * @param config Configuration for deleting the replica property.
   * @returns This instance for method chaining.
   */
  deleteReplicaProperty(config: ReplicaPropertyDeleteConfig): this {
    this.addParameter('action', 'DELETEREPLICAPROP', false)
    this.addParameter('collection', config.collection)
    this.addParameter('shard', config.shard)
    this.addParameter('replica', config.replica)
    this.addParameter('property', config.property)
    return this
  }

  /**
   * Balances a property across shards.
   * @param config Configuration for balancing the property.
   * @returns This instance for method chaining.
   */
  balanceProperty(config: ShardBalanceConfig): this {
    this.addParameter('action', 'BALANCESHARDUNIQUE', false)
    this.addParameter('collection', config.collection)
    this.addParameter('property', config.property)
    this.addParameter('onlyActiveNodes', config.onlyActiveNodes)
    this.addParameter('shardUnique', config.shardUnique)
    return this
  }

  /**
   * Rebalances the leaders in the collection.
   * @param config Configuration for rebalancing leaders.
   * @returns This instance for method chaining.
   */
  rebalanceLeaders(config: LeaderRebalanceConfig): this {
    this.addParameter('action', 'REBALANCELEADERS', false)
    this.addParameter('collection', config.collection)
    this.addParameter('maxAtOnce', config.maxAtOnce)
    this.addParameter('maxWaitSeconds', config.maxWaitSeconds)
    return this
  }

  /**
   * Builds the query string from the accumulated parameters.
   * @returns The complete query string.
   */
  toQueryString(): string {
    return this.parameters.join('&')
  }
}
