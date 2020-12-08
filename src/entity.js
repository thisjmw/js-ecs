import components from './components.js'


export default class Entity {

	constructor(entityId) {
		if (!this.world) {
			throw new Error(`Must define world with Entity.setWorld(world) first`)
		}
		this.id = entityId || this.world.$entityIdGenerator()
		this.active = true
		this.components = {}
	}


	addComponent(component) {
		return this.world.assignComponent(this.id, component)
	}


	getComponent(component) {
		const name = typeof component === 'string' ? component : components.$name(component)
		return this.components[name]
	}
}


Entity.setWorld = function setWorld(world) {
	Entity.prototype.world = world
}