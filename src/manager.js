import Entity from './entity.js'
import QueryManager from './queryManager.js'
import { isObject, singleOrDefault } from './util.js'

const MAX_ID_GENERATION_TRIES = 100

let _manager

const $entities = {}
const $components = {}
const $toDestroy = []

let $queryManager

let _autoEntityId = 1
let _autoComponentId = 1

function _autoIncrementEntityId() { return _autoEntityId++ }
function _autoIncrementComponentId() { return _autoComponentId++ }

let _generateEntityId = _autoIncrementEntityId
let _generateComponentId = _autoIncrementComponentId


export default class Manager {

	constructor(options) {
		if (_manager) {
			throw new Error(`Manager is a singleton that already exists`)
		}
		_manager = this
		_init.call(this, options)
	}


	createEntity(componentList) {
		let entityId = _generateEntityId()
		let idGenerationTries = 0
		while ($entities.hasOwnProperty(entityId) && idGenerationTries++ < MAX_ID_GENERATION_TRIES) {
			entityId = _generateEntityId()
		}
		if (idGenerationTries > MAX_ID_GENERATION_TRIES) {
			throw new Error(`Entity ID generator function yielded ${MAX_ID_GENERATION_TRIES} IDs that already exist`)
		}
		return _createEntity.call(this, entityId, componentList)
	}


	getEntity(entityId, silentError = false) {
		const entity = $entities[entityId]
		if (!(entity && entity.active)) {
			if (silentError) {
				console.warn(`Entity ${entityId} doesn't exist`)
			} else {
				throw new Error(`Entity ${entityId} doesn't exist`)
			}
		}
		return entity
	}


	removeEntity(entityId) {
		const entity = this.getEntity(entityId, true)
		if (entity) {
			return _removeEntity.call(this, entity)
		} else {
			return false
		}
	}


	assignComponent(entityId, component) {
		const entity = this.getEntity(entityId)
		const createdComponent = _assignComponent.call(this, entity, component)
		$queryManager.componentAdded(entity, createdComponent.$type)
		return createdComponent
	}


	removeComponent(entityId, componentId) {
		const entity = this.getEntity(entityId)
		return _removeComponent.call(this, entity, componentId)
	}


	$registerQuery(query) {
		const firstComponentName = query.components[0]
		if (Object.hasOwnProperty.call($components, firstComponentName)) {
			const entityIds = $components[firstComponentName].map(c => c.entityId)
			entityIds.forEach(id => {
				const entity = this.getEntity(id, true)
				if (query.testEntity(entity)) {
					query.addEntity(entity)
				}
			})
		}
	}


	reset() {
		for (const componentType in $components) {
			if (Object.hasOwnProperty.call($components, componentType)) {
				delete $components[componentType]
			}

		}
		for (const entityId in $entities) {
			if (Object.hasOwnProperty.call($entities, entityId)) {
				delete $entities[entityId]
			}
		}
		$queryManager.clear()
	}


	$clean() {
		for (const target of $toDestroy) {
			$queryManager.removeEntity(target.entity)
			delete target.entity.components
			for (const componentType of target.componentTypes) {
				$components[componentType] = $components[componentType].filter(c => c.entityId !== target.entity.id)
			}
			delete $entities[target.entity.id]
		}
	}
}


function _init(options) {
	Entity.setEntityManager(this)
	$queryManager = new QueryManager(this)

	if (options) {

		if (options['entityIdGenerator']) {
			const entityIdGenerator = options['entityIdGenerator']
			if (typeof entityIdGenerator === 'function') {
				this.$entityIdGenerator = entityIdGenerator
			} else if (isObject(entityIdGenerator)) {
				if (entityIdGenerator['auto']) {
					_autoEntityId = entityIdGenerator['start'] || 1
				}
			} else {
				console.error(`Unexpected value for options.entityIdGenerator:`, entityIdGenerator)
			}
		}

		if (options['componentIdGenerator']) {
			const componentIdGenerator = options['componentIdGenerator']
			if (typeof componentIdGenerator === 'function') {
				this.$componentIdGenerator = componentIdGenerator
			} else if (isObject(componentIdGenerator)) {
				if (componentIdGenerator['auto']) {
					_autoComponentId = componentIdGenerator['start'] || 1
				}
			} else {
				console.error(`Unexpected value for options.componentIdGenerator:`, componentIdGenerator)
			}
		}
	}

	const queriesInterface = {
		registerQuery: $queryManager.registerQuery.bind($queryManager),
		clear: $queryManager.clear.bind($queryManager),
		reset: $queryManager.reset.bind($queryManager)
	}

	Object.defineProperty(queriesInterface, 'all', {
		get: () => $queryManager.getQueries()
	})

	Object.defineProperty(queriesInterface, 'byComponent', {
		get: () => $queryManager.getQueriesByComponent()
	})

	this.queries = queriesInterface
}


function _createEntity(entityId, componentList) {
	if (Object.hasOwnProperty.call($entities, entityId)) {
		throw new Error(`Entity ${entityId} already exists`)
	}

	const entity = new Entity(entityId)

	if (componentList) {
		let components = componentList
		if (!Array.isArray(components)) {
			components = [ components ]
		}
		components.forEach(component => _assignComponent(entity, component))
	}

	$entities[entityId] = entity
	$queryManager.addEntity(entity)

	return entity
}


function _removeEntity(entity) {
	const removedComponentTypes = new Set()
	for (const component of entity.components) {
		if (!removedComponentTypes.has(component.$type)) {
			removedComponentTypes.add(component.$type)
		}
	}
	entity.active = false
	$toDestroy.push({
		entity,
		componentTypes: Array.from(removedComponentTypes)
	})
}


function _assignComponent(entity, component) {
	const componentObject = typeof component === 'function' ? component() : component
	componentObject.id = _generateComponentId()

	entity.components.push(componentObject)

	const entityId = entity.id
	if (!Object.hasOwnProperty.call($components, componentObject.$type)) {
		$components[componentObject.$type] = []
	}
	$components[componentObject.$type].push({ entityId, component: componentObject })

	return componentObject
}


function _removeComponent(entity, componentId) {
	const component = singleOrDefault(entity.components, c => c.id === componentId)
	if (component) {
		entity.components = entity.components.filter(c => c.id !== componentId)
		$components[component.$type] = $components[component.$type].filter(c => c.component.id !== componentId)
		$queryManager.componentRemoved(entity, component.$type)
	} else {
		console.warn(`Component ${componentId} wasn't found on entity ${entity.id}`)
	}
}


Object.defineProperty(Manager.prototype, '$entityIdGenerator', {
	get: () => _generateEntityId,
	set: idGeneratorFunction => {
		if (_checkIdGeneratorFunction(idGeneratorFunction, 'Entity')) {
			_generateEntityId = idGeneratorFunction
		}
	}
})

Object.defineProperty(Manager.prototype, '$componentIdGenerator', {
	get: () => _generateComponentId,
	set: idGeneratorFunction => {
		if (_checkIdGeneratorFunction(idGeneratorFunction, 'Component')) {
			_generateComponentId = idGeneratorFunction
		}
	}
})

Object.defineProperty(Manager.prototype, 'entities', {
	get: () => $entities,
	set: () => { throw new Error(`Can't manually overwrite Manager.entities`) }
})

Object.defineProperty(Manager.prototype, 'components', {
	get: () => $components,
	set: () => { throw new Error(`Can't manually overwrite Manager.components`) }
})

Object.defineProperty(Manager.prototype, '$queryManager', {
	get: () => $queryManager,
	set: () => { throw new Error(`Can't manually overwrite Manager.$queryManager`) }
})


function _checkIdGeneratorFunction(idGeneratorFunction, idTarget) {
	if (typeof idGeneratorFunction !== 'function') {
		throw new TypeError(`${idTarget} ID generator function must be a function that returns a string or number`)
	}
	const idTest = idGeneratorFunction()
	if (typeof idTest === typeof void 0 || idTest === null) {
		throw new Error(`${idTarget} ID generator function must return a value`)
	}
	if (!['string', 'number'].includes(typeof idTest)) {
		throw new Error(`${idTarget} ID generator function must return either a string or number`)
	}
	const idTest2 = idGeneratorFunction()
	if (idTest === idTest2) {
		throw new Error(`${idTarget} ID generator function must return unique values on subsequent calls`)
	}
	return true
}