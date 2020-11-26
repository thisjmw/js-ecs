import createEntityProto from './entity.js'
import { isObject } from './util.js'

const $entities = {}
const $components = {}

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
	if (!entity) {
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


const manager = {
	createEntity,
	assignComponent,
	init
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
		if (_checkIdGeneratorFunction(idGeneratorFunction)) {
			_generateEntityId = idGeneratorFunction
		}
	}
})
Object.defineProperty(manager, '$componentIdGenerator', {
	get() { return _generateComponentId },
	set(idGeneratorFunction) {
		if (_checkIdGeneratorFunction(idGeneratorFunction)) {
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
	if (!['string', 'number'].contains(typeof idTest)) {
		throw new Error(`${idTarget} ID generator function must return either a string or number`)
	}
	return true
}

export default manager