import {
  AliasConfig,
  ClusterPropertyConfig,
  ClusterRole,
  CollectionCreateConfig,
  LeaderRebalanceConfig,
  MigrationConfig,
  ReplicaAddConfig,
  ReplicaDeleteConfig,
  ReplicaPropertyAddConfig,
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
    this.parameters.push('action=CREATE')

    if (config.name) {
      this.parameters.push(`name=${encodeURIComponent(config.name)}`)
    }

    if (config.routerName) {
      this.parameters.push(`router.name=${encodeURIComponent(config.routerName)}`)
    }

    if (config.numShards !== undefined) {
      this.parameters.push(`numShards=${config.numShards}`)
    }

    if (config.shards) {
      const shards = Array.isArray(config.shards) ? config.shards.join(',') : config.shards
      this.parameters.push(`shards=${encodeURIComponent(shards)}`)
    }

    if (config.replicationFactor !== undefined) {
      this.parameters.push(`replicationFactor=${config.replicationFactor}`)
    }

    if (config.maxShardsPerNode !== undefined) {
      this.parameters.push(`maxShardsPerNode=${config.maxShardsPerNode}`)
    }

    if (config.createNodeSet) {
      const nodeSet = Array.isArray(config.createNodeSet)
        ? config.createNodeSet.join(',')
        : config.createNodeSet
      this.parameters.push(`createNodeSet=${encodeURIComponent(nodeSet)}`)
    }

    if (config.createNodeSetShuffle !== undefined) {
      this.parameters.push(`createNodeSet.shuffle=${config.createNodeSetShuffle}`)
    }

    if (config.collectionConfigName) {
      this.parameters.push(
        `collection.configName=${encodeURIComponent(config.collectionConfigName)}`,
      )
    }

    if (config.routerField) {
      this.parameters.push(`router.field=${encodeURIComponent(config.routerField)}`)
    }

    if (config.autoAddReplicas !== undefined) {
      this.parameters.push(`autoAddReplicas=${config.autoAddReplicas}`)
    }

    if (config.async) {
      this.parameters.push(`async=${encodeURIComponent(config.async)}`)
    }

    return this
  }

  /**
   * Reloads an existing Solr collection.
   * @param name The name of the collection to reload.
   * @returns This instance for method chaining.
   */
  reload(name: string): this {
    this.parameters.push('action=RELOAD')
    if (name) this.parameters.push(`name=${encodeURIComponent(name)}`)
    return this
  }

  /**
   * Splits a shard in the collection.
   * @param config Configuration for splitting the shard.
   * @returns This instance for method chaining.
   */
  splitShard(config: ShardSplitConfig): this {
    this.parameters.push('action=SPLITSHARD')

    if (config.collection) {
      this.parameters.push(`collection=${encodeURIComponent(config.collection)}`)
    }

    if (config.shard) {
      this.parameters.push(`shard=${encodeURIComponent(config.shard)}`)
    }

    if (config.ranges) {
      const ranges = Array.isArray(config.ranges) ? config.ranges.join(',') : config.ranges
      this.parameters.push(`ranges=${encodeURIComponent(ranges)}`)
    }

    if (config.splitKey) {
      this.parameters.push(`split.key=${encodeURIComponent(config.splitKey)}`)
    }

    if (config.async) {
      this.parameters.push(`async=${encodeURIComponent(config.async)}`)
    }

    return this
  }

  /**
   * Creates a new shard in the collection (for 'implicit' router only).
   * @param config Configuration for creating the shard.
   * @returns This instance for method chaining.
   */
  createShard(config: ShardConfig): this {
    this.parameters.push('action=CREATESHARD')

    if (config.collection) {
      this.parameters.push(`collection=${encodeURIComponent(config.collection)}`)
    }

    if (config.shard) {
      this.parameters.push(`shard=${encodeURIComponent(config.shard)}`)
    }

    return this
  }

  /**
   * Deletes a shard from the collection.
   * @param config Configuration for deleting the shard.
   * @returns This instance for method chaining.
   */
  deleteShard(config: ShardConfig): this {
    this.parameters.push('action=DELETESHARD')

    if (config.collection) {
      this.parameters.push(`collection=${encodeURIComponent(config.collection)}`)
    }

    if (config.shard) {
      this.parameters.push(`shard=${encodeURIComponent(config.shard)}`)
    }

    return this
  }

  /**
   * Creates or modifies an alias for the collection.
   * @param config Configuration for the alias.
   * @returns This instance for method chaining.
   */
  createAlias(config: AliasConfig): this {
    this.parameters.push('action=CREATEALIAS')

    if (config.name) {
      this.parameters.push(`name=${encodeURIComponent(config.name)}`)
    }

    if (config.collections) {
      const collections = Array.isArray(config.collections)
        ? config.collections.join(',')
        : config.collections
      this.parameters.push(`collections=${encodeURIComponent(collections)}`)
    }

    return this
  }

  /**
   * Deletes an alias for the collection.
   * @param name The name of the alias to delete.
   * @returns This instance for method chaining.
   */
  deleteAlias(name: string): this {
    this.parameters.push('action=DELETEALIAS')
    if (name) this.parameters.push(`name=${encodeURIComponent(name)}`)
    return this
  }

  /**
   * Deletes the entire collection.
   * @param name The name of the collection to delete.
   * @returns This instance for method chaining.
   */
  delete(name: string): this {
    this.parameters.push('action=DELETE')
    if (name) this.parameters.push(`name=${encodeURIComponent(name)}`)
    return this
  }

  /**
   * Deletes a replica from the collection.
   * @param options Configuration for deleting the replica.
   * @returns This instance for method chaining.
   */
  deleteReplica(config: ReplicaDeleteConfig): this {
    this.parameters.push('action=DELETEREPLICA')

    if (config.collection) {
      this.parameters.push(`collection=${encodeURIComponent(config.collection)}`)
    }

    if (config.shard) {
      this.parameters.push(`shard=${encodeURIComponent(config.shard)}`)
    }

    if (config.replica) {
      this.parameters.push(`replica=${encodeURIComponent(config.replica)}`)
    }

    if (config.onlyIfDown !== undefined) {
      this.parameters.push(`onlyIfDown=${config.onlyIfDown}`)
    }

    return this
  }

  /**
   * Adds a replica to the collection.
   * @param config Configuration for adding the replica.
   * @returns This instance for method chaining.
   */
  addReplica(config: ReplicaAddConfig): this {
    this.parameters.push('action=ADDREPLICA')

    if (config.collection) {
      this.parameters.push(`collection=${encodeURIComponent(config.collection)}`)
    }

    if (config.shard) {
      this.parameters.push(`shard=${encodeURIComponent(config.shard)}`)
    }

    if (config.route) {
      this.parameters.push(`_route_=${encodeURIComponent(config.route)}`)
    }

    if (config.node) {
      this.parameters.push(`node=${encodeURIComponent(config.node)}`)
    }

    if (config.async) {
      this.parameters.push(`async=${encodeURIComponent(config.async)}`)
    }

    return this
  }

  /**
   * Sets or unsets a cluster property.
   * @param config Configuration for the cluster property.
   * @returns This instance for method chaining.
   */
  setClusterProperty(config: ClusterPropertyConfig): this {
    this.parameters.push('action=CLUSTERPROP')

    if (config.name) {
      this.parameters.push(`name=${encodeURIComponent(config.name)}`)
    }

    if (config.val !== undefined) {
      this.parameters.push(`val=${encodeURIComponent(config.val)}`)
    }

    return this
  }

  /**
   * Migrates documents to another collection.
   * @param config Configuration for document migration.
   * @returns This instance for method chaining.
   */
  migrateDocuments(config: MigrationConfig): this {
    this.parameters.push('action=MIGRATE')

    if (config.collection) {
      this.parameters.push(`collection=${encodeURIComponent(config.collection)}`)
    }

    if (config.targetCollection) {
      this.parameters.push(`target.collection=${encodeURIComponent(config.targetCollection)}`)
    }

    if (config.splitKey) {
      this.parameters.push(`split.key=${encodeURIComponent(config.splitKey)}`)
    }

    if (config.forwardTimeout !== undefined) {
      this.parameters.push(`forward.timeout=${config.forwardTimeout}`)
    }

    if (config.async) {
      this.parameters.push(`async=${encodeURIComponent(config.async)}`)
    }

    return this
  }

  /**
   * Assigns a role to a node.
   * @param options Configuration for adding the role.
   * @returns This instance for method chaining.
   */
  addRole(config: ClusterRole): this {
    this.parameters.push('action=ADDROLE')

    if (config.role) this.parameters.push(`role=${encodeURIComponent(config.role)}`)
    if (config.node) this.parameters.push(`node=${encodeURIComponent(config.node)}`)

    return this
  }

  /**
   * Removes a role from a node.
   * @param options Configuration for removing the role.
   * @returns This instance for method chaining.
   */
  removeRole(config: ClusterRole): this {
    this.parameters.push('action=REMOVEROLE')

    if (config.role) this.parameters.push(`role=${encodeURIComponent(config.role)}`)
    if (config.node) this.parameters.push(`node=${encodeURIComponent(config.node)}`)

    return this
  }

  /**
   * Retrieves the Overseer status and statistics.
   * @returns This instance for method chaining.
   */
  getOverseerStatus(): this {
    this.parameters.push('action=OVERSEERSTATUS')
    return this
  }

  /**
   * Retrieves the cluster status.
   * @returns This instance for method chaining.
   */
  getClusterStatus(): this {
    this.parameters.push('action=CLUSTERSTATUS')
    return this
  }

  /**
   * Requests the status of an asynchronous operation.
   * @param requestId The ID of the request to check.
   * @returns This instance for method chaining.
   */
  requestStatus(requestId: string): this {
    this.parameters.push('action=REQUESTSTATUS')
    if (requestId) this.parameters.push(`requestid=${encodeURIComponent(requestId)}`)
    return this
  }

  /**
   * Lists all collections in the cluster.
   * @returns This instance for method chaining.
   */
  listCollections(): this {
    this.parameters.push('action=LIST')
    return this
  }

  /**
   * Adds a property to a replica.
   * @param config Configuration for adding the replica property.
   * @returns This instance for method chaining.
   */
  addReplicaProperty(config: ReplicaPropertyAddConfig): this {
    this.parameters.push('action=ADDREPLICAPROP')

    if (config.collection) {
      this.parameters.push(`collection=${encodeURIComponent(config.collection)}`)
    }

    if (config.shard) {
      this.parameters.push(`shard=${encodeURIComponent(config.shard)}`)
    }

    if (config.replica) {
      this.parameters.push(`replica=${encodeURIComponent(config.replica)}`)
    }

    if (config.property) {
      this.parameters.push(`property=${encodeURIComponent(config.property)}`)
    }

    if (config.propertyValue !== undefined) {
      this.parameters.push(`property.value=${encodeURIComponent(config.propertyValue)}`)
    }

    if (config.shardUnique !== undefined) {
      this.parameters.push(`shardUnique=${config.shardUnique}`)
    }

    return this
  }

  /**
   * Deletes a property from a replica.
   * @param config Configuration for deleting the replica property.
   * @returns This instance for method chaining.
   */
  deleteReplicaProperty(config: ReplicaPropertyDeleteConfig): this {
    this.parameters.push('action=DELETEREPLICAPROP')

    if (config.collection) {
      this.parameters.push(`collection=${encodeURIComponent(config.collection)}`)
    }

    if (config.shard) {
      this.parameters.push(`shard=${encodeURIComponent(config.shard)}`)
    }

    if (config.replica) {
      this.parameters.push(`replica=${encodeURIComponent(config.replica)}`)
    }

    if (config.property) {
      this.parameters.push(`property=${encodeURIComponent(config.property)}`)
    }

    return this
  }

  /**
   * Balances a property across shards.
   * @param config Configuration for balancing the property.
   * @returns This instance for method chaining.
   */
  balanceProperty(config: ShardBalanceConfig): this {
    this.parameters.push('action=BALANCESHARDUNIQUE')

    if (config.collection) {
      this.parameters.push(`collection=${encodeURIComponent(config.collection)}`)
    }

    if (config.property) {
      this.parameters.push(`property=${encodeURIComponent(config.property)}`)
    }

    if (config.onlyActiveNodes !== undefined) {
      this.parameters.push(`onlyActiveNodes=${config.onlyActiveNodes}`)
    }

    if (config.shardUnique !== undefined) {
      this.parameters.push(`shardUnique=${config.shardUnique}`)
    }

    return this
  }

  /**
   * Rebalances the leaders in the collection.
   * @param config Configuration for rebalancing leaders.
   * @returns This instance for method chaining.
   */
  rebalanceLeaders(config: LeaderRebalanceConfig): this {
    this.parameters.push('action=REBALANCELEADERS')

    if (config.collection) {
      this.parameters.push(`collection=${encodeURIComponent(config.collection)}`)
    }

    if (config.maxAtOnce !== undefined) {
      this.parameters.push(`maxAtOnce=${config.maxAtOnce}`)
    }

    if (config.maxWaitSeconds !== undefined) {
      this.parameters.push(`maxWaitSeconds=${config.maxWaitSeconds}`)
    }

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
