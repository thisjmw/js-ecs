export default class Query {

	constructor(name, components) {
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


	addSystem(systemName) {
		if (!this.systems.includes(systemName)) {
			this.systems.push(systemName)
			return true
		} else {
			return false
		}
	}


	removeSystem(systemName) {
		if (this.systems.includes(systemName)) {
			this.systems = this.systems.filter(name => name !== systemName)
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
