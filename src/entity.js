function addComponent(component) {
	return this.manager.assignComponent(this.id, component)
}

function removeComponent(componentId) {
	return this.manager.removeComponent(this.id, componentId)
}

export default function createEntityProto(manager) {
	return {
		manager,
		addComponent,
		removeComponent
	}
}