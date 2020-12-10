import System from './system'


let _world


export default class SystemManager {

	constructor(world) {
		_world = world
		this.systems = []
	}


	getSystem(name) { return this.systems.find(system => system.name === name) }
	getSystems() { return this.systems }


	registerSystem(name, query, systemFunction) {
		if (typeof name !== 'string') {
			throw new TypeError(`System name must be a string`)
		}
		if (this.getSystem(name)) {
			throw new Error(`System "${name}" already exists`)
		}

		if (!_world.queries[query.name]) {
			throw new Error(`Query ${query.name} doesn't exist`)
		}

		if (typeof systemFunction !== 'function') {
			throw new TypeError(`System function must be a function`)
		}

		const system = new System(name, query, systemFunction)
		query.addSystem(name)

		this.systems.push(system)

		return system
	}


	run(deltaTime, time) {
		this.systems.forEach(system => system.execute(deltaTime, time))
	}
}