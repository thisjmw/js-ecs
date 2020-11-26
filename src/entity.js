function addComponent(component) {
	return this.manager.assignComponent(this.id, component)
}

export default function createEntityProto(manager) {
	return {
		manager,
		addComponent
	}
}