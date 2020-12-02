import Query from './query.js'

let $entityManager


export default class QueryManager {

	constructor(entityManager) {
		this.queries = {}
		this.queriesByComponent = {}
		$entityManager = entityManager
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
		delete this.queries[name]
		return true
	}


	getMatchedQueries(entity) {
		const components = entity.components.map(c => c.$type)
		const matchedQueries = []
		components.forEach(component => {
			const potentialQueries = this.queriesByComponent[component]
			potentialQueries.forEach(query => {
				if (query.entities.includes(entity.id)) {
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
		entity.components.forEach(component => this.componentAdded(entity, component.$type))
	}


	removeEntity(entity) {
		entity.components.forEach(component => this.componentRemoved(entity, component.$type))
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
		this.queriesByComponent = {}
	}
}