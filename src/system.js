export default class System {

	constructor(name, query, systemFunction) {
		this.name = name
		this.query = query
		this.$function = systemFunction
	}


	execute(deltaTime, time) {
		const entities = this.query.entities
		return this.$function(entities, deltaTime, time)
	}


	setQuery(query) {
		this.query.removeSystem(this)
		query.addSystem(this)
		this.query = query
	}
}