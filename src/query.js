export default class Query {

	constructor(name, components) {
		this.name = name
		this.components = _sanitizeComponents(components)
		this.entities = []
	}


	testEntity(entity) {
		const entityComponents = entity.components.map(c => c.$type)
		return this.components.reduce((result, component) => {
			return result && entityComponents.includes(component)
		}, true)
	}


	addEntity(entity) {
		if (!this.entities.includes(entity.id)) {
			this.entities.push(entity.id)
			return true
		} else {
			return false
		}
	}


	removeEntity(entity) {
		if (this.entities.includes(entity.id)) {
			this.entities = this.entities.filter(id => id !== entity.id)
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