export default class Entity {

	constructor(entityId) {
		if (!this.manager) {
			throw new Error(`Must define entity manager with Entity.setEntityManager first`)
		}
		this.id = entityId || this.manager.$entityIdGenerator()
		this.active = true
		this.components = []
	}


	addComponent(component) {
		return this.manager.assignComponent(this.id, component)
	}
}


Entity.setEntityManager = function setEntityManager(manager) {
	Entity.prototype.manager = manager
}