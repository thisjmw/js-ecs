import Query from './query.js'


const $queries = {}
const $queriesByComponent = {}

let _entityManager


function $init(entityManager) {
	_entityManager = entityManager
	$registerQuery('$GLOBAL', [])
}


function $registerQuery(name, components) {
	if (!(components && Array.isArray(components))) {
		throw new TypeError(`Queries must have an array of component types`)
	}

	if (Object.hasOwnProperty.call($queries, name)) {
		throw new Error(`Query "${name}" already exists`)
	}

	const query = new Query(name, components)

	for (const component of components) {
		const componentName = (typeof component === 'function') ? component.name : component.$type
		if (!componentName) {
			throw new Error(`Invalid component type: ${componentName}`)
		}
		if (!Object.hasOwnProperty.call($queriesByComponent, componentName)) {
			$queriesByComponent[componentName] = []
		}
		$queriesByComponent[componentName].push(query)
	}

	$queries[name] = query
	_entityManager.$queryAdded(query)

	return query
}


function $removeQuery(name) {
	const query = $queries[name]
	if (!query) {
		console.warn(`Query "${name}" doesn't exist`)
		return false
	}
	const components = query.components
	for (const component of components) {
		$queriesByComponent[component] = $queriesByComponent.filter(q => q.name !== name)
	}
	query.systems.forEach(system => system.setQuery(this.queries['$GLOBAL']))
	delete $queries[name]
	return true
}


function $componentAdded(entity, componentName) {
	if (Object.hasOwnProperty.call($queriesByComponent, componentName)) {
		$queriesByComponent[componentName].forEach(query => {
			if (query.testEntity(entity)) {
				query.addEntity(entity)
			}
		})
	}
}


function $componentRemoved(entity, componentName) {
	if (Object.hasOwnProperty.call($queriesByComponent, componentName)) {
		$queriesByComponent[componentName].forEach(query => {
			query.removeEntity(entity)
		})
	}
}


function $addEntity(entity) {
	Object.keys(entity.components).forEach(componentName => $componentAdded(entity, componentName))
	$queries['$GLOBAL'].addEntity(entity)
}


function $removeEntity(entity) {
	Object.keys(entity.components).forEach(componentName => $componentRemoved(entity, componentName))
	$queries['$GLOBAL'].removeEntity(entity)
}


function $clear() {
	for (const queryKey in $queries) {
		if (Object.hasOwnProperty.call($queries, queryKey)) {
			$queries[queryKey].entities = []
		}
	}
}


function $reset() {
	for (const queryKey in $queries) {
		if (Object.hasOwnProperty.call($queries, queryKey)) {
			delete $queries[queryKey]
		}
	}
	for (const componentKey in $queriesByComponent) {
		if (Object.hasOwnProperty.call($queriesByComponent, componentKey)) {
			delete $queriesByComponent[componentKey]
		}
	}
	$registerQuery('$GLOBAL', [])
}


const queries = $queries

Object.defineProperty(queries, '$init', { value: $init })
Object.defineProperty(queries, '$registerQuery', { value: $registerQuery })
Object.defineProperty(queries, '$removeQuery', { value: $removeQuery })
Object.defineProperty(queries, '$componentAdded', { value: $componentAdded })
Object.defineProperty(queries, '$componentRemoved', { value: $componentRemoved })
Object.defineProperty(queries, '$addEntity', { value: $addEntity })
Object.defineProperty(queries, '$removeEntity', { value: $removeEntity })
Object.defineProperty(queries, '$clear', { value: $clear })
Object.defineProperty(queries, '$reset', { value: $reset })

Object.defineProperty(queries, '$byComponent', {
	get: () => $queriesByComponent
})

export default queries