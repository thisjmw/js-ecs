import Query from './query.js'

let $entityManager


export default class QueryManager {

	constructor(entityManager) {
		this.queries = {}
		this.queriesByComponent = {}
		$entityManager = entityManager
		Query.setQueryManager(this)
		this.registerQuery('$GLOBAL', [])
	}


	getQuery(name) { return this.queries[name] }
	getQueries() { return this.queries }
	getQueriesByComponent() { return this.queriesByComponent }


	registerQuery(name, components) {
		if (!(components && Array.isArray(components))) {
			throw new TypeError(`Queries must have an array of component types`)
		}

		if (this.getQuery(name)) {
			throw new Error(`Query "${name}" already exists`)
		}

		const query = new Query(name, components)

		for (const component of components) {
			const componentName = (typeof component === 'function') ? component.name : component.$type
			if (!componentName) {
				throw new Error(`Invalid component type: ${componentName}`)
			}
			if (!Object.hasOwnProperty.call(this.queriesByComponent, componentName)) {
				this.queriesByComponent[componentName] = []
			}
			this.queriesByComponent[componentName].push(query)
		}

		this.queries[name] = query
		$entityManager.$registerQuery(query)

		return query
	}


	removeQuery(name) {
		const query = this.getQuery(name)
		if (!query) {
			console.warn(`Query "${name}" doesn't exist`)
			return false
		}
		const components = query.components
		for (const component of components) {
			this.queriesByComponent[component] = this.queriesByComponent.filter(q => q.name !== name)
		}
		query.systems.forEach(system => system.setQuery(this.queries['$GLOBAL']))
		delete this.queries[name]
		return true
	}


	getMatchedQueries(entity) {
		const matchedQueries = [ this.queries['$GLOBAL'] ]
		Object.keys(entity.components).forEach(componentName => {
			const potentialQueries = this.queriesByComponent[componentName]
			potentialQueries.forEach(query => {
				if (query.entities.includes(entity)) {
					matchedQueries.push(query)
				}
			})
		})
		return matchedQueries
	}


	componentAdded(entity, componentName) {
		if (Object.hasOwnProperty.call(this.queriesByComponent, componentName)) {
			this.queriesByComponent[componentName].forEach(query => {
				if (query.testEntity(entity)) {
					query.addEntity(entity)
				}
			})
		}
	}


	componentRemoved(entity, componentName) {
		if (Object.hasOwnProperty.call(this.queriesByComponent, componentName)) {
			this.queriesByComponent[componentName].forEach(query => {
				query.removeEntity(entity)
			})
		}
	}


	addEntity(entity) {
		Object.keys(entity.components).forEach(componentName => this.componentAdded(entity, componentName))
		this.queries['$GLOBAL'].addEntity(entity)
	}


	removeEntity(entity) {
		Object.keys(entity.components).forEach(componentName => this.componentRemoved(entity, componentName))
		this.queries['$GLOBAL'].removeEntity(entity)
	}


	clear() {
		for (const queryKey in this.queries) {
			if (Object.hasOwnProperty.call(this.queries, queryKey)) {
				this.queries[queryKey].entities = []
			}
		}
	}


	reset() {
		this.queries = {}
		this.registerQuery('$GLOBAL', [])
		this.queriesByComponent = {}
	}
}