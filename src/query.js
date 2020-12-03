export default class Query {

	constructor(name, components) {
		if (!this.queryManager) {
			throw new Error(`Must define query manager with Query.setQueryManager first`)
		}
		this.name = name
		this.components = _sanitizeComponents(components)
		this.entities = []
		this.systems = []
	}


	testEntity(entity) {
		const entityComponents = Object.keys(entity.components)
		return this.components.reduce((result, component) => {
			return result && entityComponents.includes(component)
		}, true)
	}


	addEntity(entity) {
		if (!this.entities.includes(entity)) {
			this.entities.push(entity)
			return true
		} else {
			return false
		}
	}


	removeEntity(entity) {
		if (this.entities.includes(entity)) {
			this.entities = this.entities.filter(e => e !== entity)
			return true
		} else {
			return false
		}
	}


	addSystem(system) {
		if (!this.systems.includes(system)) {
			this.systems.push(system)
			return true
		} else {
			return false
		}
	}


	removeSystem(system) {
		if (this.systems.includes(system)) {
			this.systems = this.systems.filter(s => s !== system)
			return true
		} else {
			return false
		}
	}
}


function _sanitizeComponents(componentList) {
	const components = Array.isArray(componentList) ? componentList : [ componentList ]
	const sanitizedComponents = []
	components.forEach(component => {
		const componentName = (typeof component === 'function') ? component.name : component.$type
		if (!componentName) {
			throw new TypeError(`Unexpected component type: ${component}`)
		}
		if (!sanitizedComponents.includes(componentName)) {
			sanitizedComponents.push(componentName)
		}
	})
	return sanitizedComponents
}


Query.setQueryManager = function setQueryManager(queryManager) {
	Query.prototype.queryManager = queryManager
}
