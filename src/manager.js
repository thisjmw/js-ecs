import createEntityProto from './entity.js'
import { isObject } from './util.js'

const $entities = {}
const $components = {}
const _toDestroy = []

let _autoEntityId = 1
let _autoComponentId = 1

function _autoIncrementEntityId() { return _autoEntityId++ }
function _autoIncrementComponentId() { return _autoComponentId++ }

let _generateEntityId = _autoIncrementEntityId
let _generateComponentId = _autoIncrementComponentId

let entityProto


function init(options) {
	if (options) {

		if (options['entityIdGenerator']) {
			const entityIdGenerator = options['entityIdGenerator']
			if (typeof entityIdGenerator === 'function') {
				manager.$entityIdGenerator = entityIdGenerator
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
				manager.$componentIdGenerator = componentIdGenerator
			} else if (isObject(componentIdGenerator)) {
				if (componentIdGenerator['auto']) {
					_autoComponentId = componentIdGenerator['start'] || 1
				}
			} else {
				console.error(`Unexpected value for options.componentIdGenerator:`, componentIdGenerator)
			}
		}
	}
	entityProto = entityProto || createEntityProto(this)
}


function createEntity(componentList = []) {
	let entityId = _generateEntityId()
	while (Object.hasOwnProperty.call($entities, entityId)) {
		entityId = _generateEntityId()
	}

	return _createEntity(entityId, componentList)
}


function _createEntity(entityId, componentList) {
	if (Object.hasOwnProperty.call($entities, entityId)) {
		throw new Error(`Entity ${entityId} already exists`)
	}

	if (!entityProto) {
		console.warn(`Manager was not initialized`)
		init()
	}

	const entity = Object.create(entityProto)
	entity.id = entityId
	entity.active = true
	entity.components = []

	if (componentList) {
		for (const component of componentList) {
			const componentObject = typeof component === 'function' ? component() : component
			_assignComponent(entity, componentObject)
		}
	}

	$entities[entityId] = entity

	return entity
}


function assignComponent(entityId, component) {
	const entity = $entities[entityId]
	if (!(entity && entity.active)) {
		throw new Error(`Entity ${entityId} doesn't exist`) // TODO: Better error handling
	}
	return _assignComponent(entity, component)
}


function _assignComponent(entity, component) {
	const componentObject = typeof component === 'function' ? component() : component
	componentObject.id = _generateComponentId()

	entity.components.push(componentObject)

	const entityId = entity.id
	if (!Object.hasOwnProperty.call($components, componentObject.type)) {
		$components[componentObject.type] = []
	}
	$components[componentObject.type].push({ entityId, component: componentObject })

	return entity
}


function removeEntity(entityId) {
	const entity = $entities[entityId]
	if (!entity) {
		console.warn(`Entity ${entityId} doesn't exist`)
	} else {
		return _removeEntity(entity)
	}
}


function _removeEntity(entity) {
	const removedComponentTypes = new Set()
	for (const component of entity.components) {
		if (!removedComponentTypes.has(component.type)) {
			removedComponentTypes.add(component.type)
		}
	}
	entity.active = false
	_toDestroy.push({
		entity,
		componentTypes: Array.from(removedComponentTypes)
	})
}


function clear() {
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
}


function $clean() {
	for (const target of _toDestroy) {
		delete target.entity.components
		for (const componentType of target.componentTypes) {
			$components[componentType] = $components[componentType].filter(c => c.entityId !== target.entity.id)
		}
		delete $entities[target.entity.id]
	}
}


const manager = {
	init,
	createEntity,
	removeEntity,
	assignComponent,
	clear,
	$clean
}

Object.defineProperty(manager, 'entities', {
	get() { return $entities },
	set() { console.error(`Can't manually assign manager.entities`) } // TODO: Better warning
})
Object.defineProperty(manager, 'components', {
	get() { return $components },
	set() { console.error(`Can't manually assign manager.components`) } // TODO: Better warning
})

Object.defineProperty(manager, '$entityIdGenerator', {
	get() { return _generateEntityId },
	set(idGeneratorFunction) {
		if (_checkIdGeneratorFunction(idGeneratorFunction, 'Entity')) {
			_generateEntityId = idGeneratorFunction
		}
	}
})
Object.defineProperty(manager, '$componentIdGenerator', {
	get() { return _generateComponentId },
	set(idGeneratorFunction) {
		if (_checkIdGeneratorFunction(idGeneratorFunction, 'Component')) {
			_generateComponentId = idGeneratorFunction
		}
	}
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

export default manager