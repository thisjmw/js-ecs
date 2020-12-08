import Entity from './entity.js'
import queries from './queryManager.js'
import SystemManager from './systemManager.js'
import { isObject, getPrintableObject } from './util.js'

const MAX_ID_GENERATION_TRIES = 100

let _world

const $entities = {}
const $components = {}
const $toDestroy = []

let _autoEntityId = 1
let _autoComponentId = 1

function _autoIncrementEntityId() { return _autoEntityId++ }
function _autoIncrementComponentId() { return _autoComponentId++ }

let _generateEntityId = _autoIncrementEntityId
let _generateComponentId = _autoIncrementComponentId


export default class World {

	constructor(options) {
		if (_world) {
			throw new Error(`World is a singleton that already exists`)
		}
		_world = this
		_init.call(this, options)
		this.queries = queries
		this.queries.$init(this)
		this.systems = new SystemManager(this, this.queries)
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
		this.queries.$componentAdded(entity, createdComponent.$type)
		return createdComponent
	}


	removeComponent(entityId, componentType) {
		const entity = this.getEntity(entityId)
		const component = entity.getComponent(componentType)
		return _removeComponent.call(this, entity, component)
	}


	$queryAdded(query) {
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
		this.queries.$clear()
	}


	$clean() {
		for (const target of $toDestroy) {
			this.queries.$removeEntity(target.entity)
			delete target.entity.components
			for (const componentType of target.componentTypes) {
				$components[componentType] = $components[componentType].filter(c => c.entityId !== target.entity.id)
			}
			delete $entities[target.entity.id]
		}
	}
}


function _init(options) {
	Entity.setWorld(this)

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
	this.queries.$addEntity(entity)

	return entity
}


function _removeEntity(entity) {
	const removedComponentTypes = new Set()
	for (const componentName in entity.components) {
		if (Object.hasOwnProperty.call(entity.components, componentName)) {
			if (!removedComponentTypes.has(componentName)) {
				removedComponentTypes.add(componentName)
			}
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

	if (!entity.getComponent(component)) {
		entity.components[componentObject.$type] = componentObject
	} else {
		// TODO: Better solution?
		throw new Error(`Entity ${entity.id} already has component "${componentObject.$type}`)
	}

	const entityId = entity.id
	if (!Object.hasOwnProperty.call($components, componentObject.$type)) {
		$components[componentObject.$type] = []
	}
	$components[componentObject.$type].push({ entityId, component: componentObject })

	return componentObject
}


function _removeComponent(entity, component) {
	if (component) {
		delete entity.components[component.$type]
		$components[component.$type] = $components[component.$type].filter(c => c.component !== component)
		this.queries.$componentRemoved(entity, component.$type)
	} else {
		const printableComponent = getPrintableObject(component, '$type')
		console.warn(`Component "${printableComponent}" wasn't found on entity ${entity.id}`)
	}
}


Object.defineProperty(World.prototype, '$entityIdGenerator', {
	get: () => _generateEntityId,
	set: idGeneratorFunction => {
		if (_checkIdGeneratorFunction(idGeneratorFunction, 'Entity')) {
			_generateEntityId = idGeneratorFunction
		}
	}
})

Object.defineProperty(World.prototype, '$componentIdGenerator', {
	get: () => _generateComponentId,
	set: idGeneratorFunction => {
		if (_checkIdGeneratorFunction(idGeneratorFunction, 'Component')) {
			_generateComponentId = idGeneratorFunction
		}
	}
})

Object.defineProperty(World.prototype, 'entities', {
	get: () => $entities,
	set: () => { throw new Error(`Can't manually overwrite world.entities`) }
})

Object.defineProperty(World.prototype, 'components', {
	get: () => $components,
	set: () => { throw new Error(`Can't manually overwrite world.components`) }
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